import type { IncomingMessage, ServerResponse } from 'node:http';

export function createDashyApiHandler(options?: { dataDirectory?: string }): (
  request: IncomingMessage,
  response: ServerResponse,
) => Promise<boolean>;
