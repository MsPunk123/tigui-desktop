import net from 'node:net';

import { CONNECTION_TIMEOUT_MS } from './connection-models';
import { normalizeAddress } from './connection-validation';

export class ConnectionTester {
  async testAddress(address: string): Promise<{ reachable: boolean; message: string }> {
    const normalizedAddress = normalizeAddress(address);
    if (!normalizedAddress) {
      return { reachable: false, message: 'Invalid URL format.' };
    }

    const parsedUrl = new URL(normalizedAddress);
    const host = parsedUrl.hostname === 'localhost' ? '127.0.0.1' : parsedUrl.hostname;
    const port = Number(parsedUrl.port);

    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(CONNECTION_TIMEOUT_MS);

      socket.once('connect', () => {
        socket.destroy();
        resolve({ reachable: true, message: 'Reachable' });
      });

      socket.once('timeout', () => {
        socket.destroy();
        resolve({ reachable: false, message: 'Timed out' });
      });

      socket.once('error', (error) => {
        socket.destroy();
        resolve({
          reachable: false,
          message: this.toConnectionErrorMessage(error, host, port),
        });
      });

      socket.connect(port, host);
    });
  }

  private toConnectionErrorMessage(error: Error, host: string, port: number): string {
    const code = (error as NodeJS.ErrnoException).code;
    const normalizedCode = typeof code === 'string' ? code.toUpperCase() : '';
    const baseMessage = error.message || '';

    if (normalizedCode === 'ECONNREFUSED') {
      return `No service is listening at ${host}:${port}. Start TigerBeetle and verify the port.`;
    }

    if (
      normalizedCode === 'ENOTFOUND' ||
      normalizedCode === 'EAI_AGAIN' ||
      /ENOTFOUND/i.test(baseMessage) ||
      /getaddrinfo/i.test(baseMessage)
    ) {
      return `Host not found (${host}). Check the URL hostname and DNS settings.`;
    }

    if (normalizedCode === 'EHOSTUNREACH' || normalizedCode === 'ENETUNREACH') {
      return 'Host or network is unreachable.';
    }

    if (normalizedCode.length > 0) {
      return `Connection failed (${normalizedCode}).`;
    }

    return 'Connection failed due to an unexpected network error.';
  }
}
