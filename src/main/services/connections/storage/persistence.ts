import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { type ConnectionStateFile, DEFAULT_STATE } from '../connection-models';

export class ConnectionPersistence {
  private readonly stateFilePath: string;

  constructor(private readonly appDataPath: string) {
    this.stateFilePath = path.join(this.appDataPath, 'connections.profiles.json');
  }

  async readState(): Promise<ConnectionStateFile> {
    await this.ensureDirectory();

    try {
      const content = await readFile(this.stateFilePath, 'utf8');
      const parsed = JSON.parse(content) as ConnectionStateFile;
      return {
        profiles: Array.isArray(parsed.profiles) ? parsed.profiles : [],
        accountsViewPreferencesByConnectionId:
          parsed.accountsViewPreferencesByConnectionId &&
          typeof parsed.accountsViewPreferencesByConnectionId === 'object'
            ? parsed.accountsViewPreferencesByConnectionId
            : {},
      };
    } catch {
      return { ...DEFAULT_STATE };
    }
  }

  async writeState(state: ConnectionStateFile): Promise<void> {
    await this.ensureDirectory();
    await writeFile(this.stateFilePath, JSON.stringify(state, null, 2), 'utf8');
  }

  private async ensureDirectory(): Promise<void> {
    await mkdir(this.appDataPath, { recursive: true });
  }
}
