/**
 * Discriminated union types for TigerBeetle worker IPC messages.
 * Used by both the worker child process (via JSDoc) and the bridge.
 */

// ── Request types ──────────────────────────────────────────────────

export type CreateClientRequest = {
  type: 'create';
  id: number;
  clientId: string;
  clusterId: string;
  addresses: string[];
};

export type VerifyClientRequest = {
  type: 'verify';
  id: number;
  clientId: string;
};

export type DestroyClientRequest = {
  type: 'destroy';
  id: number;
  clientId: string;
};

export type DestroyAllRequest = {
  type: 'destroyAll';
  id: number;
};

export type PingRequest = {
  type: 'ping';
  id: number;
};

export type WorkerRequest =
  | CreateClientRequest
  | VerifyClientRequest
  | DestroyClientRequest
  | DestroyAllRequest
  | PingRequest;

/** Distributive Omit that works on discriminated unions. */
export type WorkerRequestBody = {
  [K in WorkerRequest['type']]: Omit<Extract<WorkerRequest, { type: K }>, 'id'>;
}[WorkerRequest['type']];

// ── Response types ─────────────────────────────────────────────────

export type WorkerSuccessResponse = {
  id: number;
  ok: true;
};

export type WorkerErrorResponse = {
  id: number;
  ok: false;
  error: string;
};

export type WorkerResponse = WorkerSuccessResponse | WorkerErrorResponse;

// ── Worker interface ───────────────────────────────────────────────

export interface ITigerBeetleWorker {
  createClient(clientId: string, clusterId: string, addresses: string[]): Promise<void>;
  verifyClient(clientId: string): Promise<void>;
  destroyClient(clientId: string): Promise<void>;
  destroyAll(): Promise<void>;
  dispose(): void;
}
