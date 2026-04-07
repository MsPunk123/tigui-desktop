import { type ChildProcess, spawn } from 'node:child_process';
import path from 'node:path';
import readline from 'node:readline';

import type { ITigerBeetleWorker, WorkerRequestBody, WorkerResponse } from './protocol';

type PendingRequest = {
  resolve: (response: WorkerResponse) => void;
  reject: (error: Error) => void;
};

export class TigerBeetleWorker implements ITigerBeetleWorker {
  private child: ChildProcess | null = null;
  private nextId = 1;
  private pending = new Map<number, PendingRequest>();
  private readonly workerScriptPath: string;

  constructor(workerScriptPath?: string) {
    this.workerScriptPath =
      workerScriptPath ??
      path.join(
        path.resolve(__dirname, '..', '..'),
        'src',
        'main',
        'services',
        'connections',
        'worker',
        'worker.cjs',
      );
  }

  private ensureChild(): ChildProcess {
    if (this.child && !this.child.killed) {
      return this.child;
    }

    this.child = spawn('node', [this.workerScriptPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: path.dirname(this.workerScriptPath),
      windowsHide: true,
    });

    const rl = readline.createInterface({ input: this.child.stdout as NodeJS.ReadableStream });
    rl.on('line', (line: string) => {
      try {
        const response: WorkerResponse = JSON.parse(line);
        const pending = this.pending.get(response.id);
        if (pending) {
          this.pending.delete(response.id);
          pending.resolve(response);
        }
      } catch {
        // ignore parse errors
      }
    });

    this.child.stderr?.on('data', (data: Buffer) => {
      console.log(data.toString().trim());
    });

    this.child.on('exit', () => {
      for (const pending of this.pending.values()) {
        pending.reject(new Error('TigerBeetle worker process exited unexpectedly.'));
      }
      this.pending.clear();
      this.child = null;
    });

    return this.child;
  }

  private send(message: WorkerRequestBody): Promise<WorkerResponse> {
    return new Promise((resolve, reject) => {
      const id = this.nextId++;
      this.pending.set(id, { resolve, reject });
      const child = this.ensureChild();
      child.stdin?.write(JSON.stringify({ ...message, id }) + '\n');
    });
  }

  async createClient(clientId: string, clusterId: string, addresses: string[]): Promise<void> {
    const response = await this.send({ type: 'create', clientId, clusterId, addresses });
    if (!response.ok) {
      throw new Error(response.error);
    }
  }

  async verifyClient(clientId: string): Promise<void> {
    const response = await this.send({ type: 'verify', clientId });
    if (!response.ok) {
      throw new Error(response.error);
    }
  }

  async destroyClient(clientId: string): Promise<void> {
    const response = await this.send({ type: 'destroy', clientId });
    if (!response.ok) {
      throw new Error(response.error);
    }
  }

  async destroyAll(): Promise<void> {
    if (!this.child || this.child.killed) return;
    const response = await this.send({ type: 'destroyAll' });
    if (!response.ok) {
      throw new Error(response.error);
    }
  }

  dispose(): void {
    if (this.child && !this.child.killed) {
      this.child.kill();
      this.child = null;
    }
    for (const pending of this.pending.values()) {
      pending.reject(new Error('Worker disposed.'));
    }
    this.pending.clear();
  }
}
