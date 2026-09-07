import { request as httpRequest } from 'node:http';
import { mkdirSync, chmodSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { DatabaseSync } from 'node:sqlite';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const sendJson = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
};

const readRequestBody = (req) => new Promise((resolve, reject) => {
  let body = '';
  req.setEncoding('utf8');
  req.on('data', chunk => {
    body += chunk;
    if (body.length > 1_000_000) reject(new Error('Request body is too large'));
  });
  req.on('end', () => resolve(body));
  req.on('error', reject);
});

const dockerSocketPath = () => {
  const host = process.env.DOCKER_HOST;
  return host?.startsWith('unix://') ? host.slice('unix://'.length) : '/var/run/docker.sock';
};

const dockerSocketRequest = (path) => new Promise((resolve, reject) => {
  const apiRequest = httpRequest({ socketPath: dockerSocketPath(), path, method: 'GET' }, response => {
    let body = '';
    response.setEncoding('utf8');
    response.on('data', chunk => { body += chunk; });
    response.on('end', () => {
      if ((response.statusCode ?? 500) >= 400) return reject(new Error(`Docker API returned ${response.statusCode}`));
      try { resolve(JSON.parse(body)); } catch { reject(new Error('Docker API returned invalid JSON')); }
    });
  });
  apiRequest.setTimeout(3_000, () => apiRequest.destroy(new Error('Docker did not respond in time')));
  apiRequest.on('error', reject);
  apiRequest.end();
});

const normalizeContainers = (containers) => containers.map(container => ({
  id: container.Id?.slice(0, 12) || container.ID || '',
  name: (container.Names?.[0] || container.Names || 'unnamed').replace(/^\//, ''),
  image: container.Image || '',
  state: (container.State || '').toLowerCase(),
  status: container.Status || '',
}));

const summarizeDocker = (containers, version, source) => ({
  available: true,
  source,
  version: version || null,
  containers,
  total: containers.length,
  running: containers.filter(container => container.state === 'running').length,
  stopped: containers.filter(container => container.state !== 'running').length,
  refreshedAt: new Date().toISOString(),
});

const readDockerSocket = async () => {
  const [containers, version] = await Promise.all([
    dockerSocketRequest('/containers/json?all=true'),
    dockerSocketRequest('/version'),
  ]);
  return summarizeDocker(normalizeContainers(containers), version.Version, 'socket');
};

const readDockerCommand = async (command, args, source) => {
  const { stdout } = await execFileAsync(command, args, { timeout: 4_000, maxBuffer: 512 * 1024 });
  const containers = stdout.trim() ? stdout.trim().split('\n').map(line => JSON.parse(line)) : [];
  return summarizeDocker(normalizeContainers(containers), null, source);
};

const dockerStatus = async () => {
  try {
    return await readDockerSocket();
  } catch {
    try {
      return await readDockerCommand('docker', ['ps', '--all', '--format', '{{json .}}'], 'docker-cli');
    } catch {
      try {
        return await readDockerCommand('sudo', ['-n', 'docker', 'ps', '--all', '--format', '{{json .}}'], 'passwordless-sudo');
      } catch (sudoError) {
        const detail = String(sudoError?.stderr || sudoError?.message || '');
        const requiresPassword = /password|terminal is required/i.test(detail);
        return {
          available: false,
          code: requiresPassword ? 'sudo-password-required' : 'docker-unavailable',
          message: requiresPassword ? 'Docker requires an interactive sudo password.' : 'Dashy could not reach Docker.',
          setup: requiresPassword
            ? 'Add this user to the docker group, use rootless Docker, or grant a passwordless sudo rule limited to docker.'
            : 'Start Docker, expose its socket to this user, or set DOCKER_HOST for a reachable Docker daemon.',
        };
      }
    }
  }
};

/** Shared API for both the self-hosted server and Vite development server. */
export function createDashyApiHandler({ dataDirectory = process.env.DASHY_DATA_DIR || join(homedir(), '.dashy') } = {}) {
  mkdirSync(dataDirectory, { recursive: true, mode: 0o700 });
  const databasePath = join(dataDirectory, 'dashy.sqlite');
  const database = new DatabaseSync(databasePath);
  chmodSync(databasePath, 0o600);
  database.exec(`
    CREATE TABLE IF NOT EXISTS dashboard_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  const readState = database.prepare('SELECT data FROM dashboard_state WHERE id = 1');
  const writeState = database.prepare(`
    INSERT INTO dashboard_state (id, data, updated_at) VALUES (1, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = CURRENT_TIMESTAMP
  `);

  return async (req, res) => {
    const url = req.url?.split('?')[0];
    if (url === '/api/dashboard-state') {
      if (req.method === 'GET') {
        const row = readState.get();
        sendJson(res, 200, { state: row ? JSON.parse(row.data) : null });
        return true;
      }
      if (req.method === 'PUT') {
        try {
          const payload = JSON.parse(await readRequestBody(req));
          if (!payload || typeof payload.state !== 'object' || Array.isArray(payload.state)) {
            sendJson(res, 400, { error: 'Expected a dashboard state object.' });
          } else {
            writeState.run(JSON.stringify(payload.state));
            sendJson(res, 200, { ok: true });
          }
        } catch (error) {
          sendJson(res, 400, { error: error instanceof Error ? error.message : 'Invalid request body.' });
        }
        return true;
      }
      if (req.method === 'DELETE') {
        database.exec('DELETE FROM dashboard_state WHERE id = 1');
        sendJson(res, 200, { ok: true });
        return true;
      }
      res.setHeader('Allow', 'GET, PUT, DELETE');
      sendJson(res, 405, { error: 'Method not allowed.' });
      return true;
    }

    if (url === '/api/docker-status') {
      if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        sendJson(res, 405, { error: 'Method not allowed.' });
      } else {
        const status = await dockerStatus();
        sendJson(res, status.available ? 200 : 503, status);
      }
      return true;
    }

    return false;
  };
}
