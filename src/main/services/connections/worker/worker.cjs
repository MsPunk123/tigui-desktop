/**
 * Child process worker for TigerBeetle client operations.
 * Runs in a separate Node.js process to avoid native module incompatibility with Electron.
 *
 * Protocol: Receives JSON messages via stdin, sends JSON responses via stdout.
 * See protocol.ts for message type definitions.
 *
 * @typedef {'create' | 'verify' | 'destroy' | 'destroyAll' | 'ping'} WorkerRequestType
 */

const { createClient } = require('tigerbeetle-node');

/** @type {Map<string, { lookupAccounts: (ids: bigint[]) => Promise<unknown>, destroy: () => void }>} */
const clients = new Map();

/** @param {{ id: number, ok: boolean, error?: string }} response */
function send(response) {
  process.stdout.write(JSON.stringify(response) + '\n');
}

/** @param {{ type: WorkerRequestType, id: number, [key: string]: unknown }} msg */
function handleMessage(msg) {
  switch (msg.type) {
    case 'create': {
      try {
        const client = createClient({
          cluster_id: BigInt(msg.clusterId),
          replica_addresses: msg.addresses,
        });
        clients.set(msg.clientId, client);
        send({ id: msg.id, ok: true });
      } catch (error) {
        send({ id: msg.id, ok: false, error: error.message || 'Failed to create client.' });
      }
      break;
    }

    case 'verify': {
      const client = clients.get(msg.clientId);
      if (!client) {
        send({ id: msg.id, ok: false, error: 'Client not found.' });
        return;
      }
      client
        .lookupAccounts([1n])
        .then(() => send({ id: msg.id, ok: true }))
        .catch((error) => send({ id: msg.id, ok: false, error: error.message || 'Verification failed.' }));
      break;
    }

    case 'destroy': {
      const client = clients.get(msg.clientId);
      if (client) {
        try { client.destroy(); } catch { /* ignore */ }
        clients.delete(msg.clientId);
      }
      send({ id: msg.id, ok: true });
      break;
    }

    case 'destroyAll': {
      const entries = [...clients.entries()];
      clients.clear();
      for (const [, client] of entries) {
        try { client.destroy(); } catch { /* ignore */ }
      }
      send({ id: msg.id, ok: true });
      break;
    }

    case 'ping': {
      send({ id: msg.id, ok: true });
      break;
    }

    default:
      send({ id: msg.id, ok: false, error: `Unknown message type: ${msg.type}` });
  }
}

let buffer = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buffer += chunk;
  let newlineIndex;
  while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
    const line = buffer.slice(0, newlineIndex);
    buffer = buffer.slice(newlineIndex + 1);
    if (line.trim()) {
      try {
        handleMessage(JSON.parse(line));
      } catch (error) {
        process.stderr.write(`[tb-worker] Failed to parse message: ${error.message}\n`);
      }
    }
  }
});

process.stdin.on('end', () => {
  for (const client of clients.values()) {
    try { client.destroy(); } catch { /* ignore */ }
  }
  process.exit(0);
});

process.stderr.write('[tb-worker] Ready.\n');
