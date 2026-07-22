/**
 * Child process worker for TigerBeetle client operations.
 * Runs in a separate Node.js process to avoid native module incompatibility with Electron.
 *
 * Protocol: Receives JSON messages via stdin, sends JSON responses via stdout.
 * See protocol.ts for message type definitions.
 *
 * @typedef {'create' | 'verify' | 'queryAccounts' | 'getAccountBalances' | 'destroy' | 'destroyAll' | 'ping'} WorkerRequestType
 */

const { createClient } = require('tigerbeetle-node');

/** @type {Map<string, { lookupAccounts: (ids: bigint[]) => Promise<unknown>, queryAccounts: (filter: unknown) => Promise<unknown[]>, getAccountBalances: (filter: unknown) => Promise<unknown[]>, destroy: () => void }>} */
const clients = new Map();

/**
 * @param {{
 * id: bigint,
 * debits_pending: bigint,
 * debits_posted: bigint,
 * credits_pending: bigint,
 * credits_posted: bigint,
 * user_data_128: bigint,
 * user_data_64: bigint,
 * user_data_32: number,
 * ledger: number,
 * code: number,
 * flags: number,
 * timestamp: bigint,
 * }} account
 */
function toWireAccount(account) {
  return {
    id: account.id.toString(),
    debits_pending: account.debits_pending.toString(),
    debits_posted: account.debits_posted.toString(),
    credits_pending: account.credits_pending.toString(),
    credits_posted: account.credits_posted.toString(),
    user_data_128: account.user_data_128.toString(),
    user_data_64: account.user_data_64.toString(),
    user_data_32: account.user_data_32,
    ledger: account.ledger,
    code: account.code,
    flags: account.flags,
    timestamp: account.timestamp.toString(),
  };
}

/**
 * @param {{
 * debits_pending: bigint,
 * debits_posted: bigint,
 * credits_pending: bigint,
 * credits_posted: bigint,
 * timestamp: bigint,
 * }} balance
 */
function toWireAccountBalance(balance) {
  return {
    debits_pending: balance.debits_pending.toString(),
    debits_posted: balance.debits_posted.toString(),
    credits_pending: balance.credits_pending.toString(),
    credits_posted: balance.credits_posted.toString(),
    timestamp: balance.timestamp.toString(),
  };
}

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

    case 'queryAccounts': {
      const client = clients.get(msg.clientId);
      if (!client) {
        send({ id: msg.id, ok: false, error: 'Client not found.' });
        return;
      }

      client
        .queryAccounts({
          user_data_128: BigInt(msg.filter.user_data_128),
          user_data_64: BigInt(msg.filter.user_data_64),
          user_data_32: msg.filter.user_data_32,
          ledger: msg.filter.ledger,
          code: msg.filter.code,
          timestamp_min: BigInt(msg.filter.timestamp_min),
          timestamp_max: BigInt(msg.filter.timestamp_max),
          limit: msg.filter.limit,
          flags: msg.filter.flags,
        })
        .then((accounts) => send({ id: msg.id, ok: true, result: accounts.map(toWireAccount) }))
        .catch((error) =>
          send({ id: msg.id, ok: false, error: error.message || 'queryAccounts failed.' }),
        );
      break;
    }

    case 'getAccountBalances': {
      const client = clients.get(msg.clientId);
      if (!client) {
        send({ id: msg.id, ok: false, error: 'Client not found.' });
        return;
      }

      client
        .getAccountBalances({
          account_id: BigInt(msg.filter.account_id),
          user_data_128: BigInt(msg.filter.user_data_128),
          user_data_64: BigInt(msg.filter.user_data_64),
          user_data_32: msg.filter.user_data_32,
          code: msg.filter.code,
          timestamp_min: BigInt(msg.filter.timestamp_min),
          timestamp_max: BigInt(msg.filter.timestamp_max),
          limit: msg.filter.limit,
          flags: msg.filter.flags,
        })
        .then((balances) =>
          send({ id: msg.id, ok: true, result: balances.map(toWireAccountBalance) }),
        )
        .catch((error) =>
          send({ id: msg.id, ok: false, error: error.message || 'getAccountBalances failed.' }),
        );
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
