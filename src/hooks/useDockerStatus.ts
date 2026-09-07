import { useQuery } from '@tanstack/react-query';

export interface DockerContainer {
  id: string;
  name: string;
  image: string;
  state: string;
  status: string;
}

export interface DockerStatusData {
  available: true;
  source: 'socket' | 'docker-cli' | 'passwordless-sudo';
  version: string | null;
  containers: DockerContainer[];
  total: number;
  running: number;
  stopped: number;
  refreshedAt: string;
}

export interface DockerStatusError {
  available: false;
  code: 'sudo-password-required' | 'docker-unavailable';
  message: string;
  setup: string;
}

async function fetchDockerStatus(): Promise<DockerStatusData> {
  const response = await fetch('/api/docker-status');
  const payload = await response.json() as DockerStatusData | DockerStatusError;
  if (!response.ok || !payload.available) throw payload;
  return payload;
}

export function useDockerStatus() {
  return useQuery<DockerStatusData, DockerStatusError>({
    queryKey: ['docker-status'],
    queryFn: fetchDockerStatus,
    refetchInterval: 30_000,
    retry: false,
  });
}
