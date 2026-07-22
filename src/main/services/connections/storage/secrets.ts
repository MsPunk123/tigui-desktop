import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { safeStorage } from 'electron';

import type { SecretsFile } from '../connection-models';

export class ConnectionSecretsStore {
  private readonly secretsFilePath: string;

  constructor(private readonly appDataPath: string) {
    this.secretsFilePath = path.join(this.appDataPath, 'connections.secrets.json');
  }

  async save(connectionId: string, secrets: Record<string, string>): Promise<void> {
    const file = await this.readSecrets();

    const encryptedEntries = Object.fromEntries(
      Object.entries(secrets)
        .filter(([, value]) => value.trim().length > 0)
        .map(([key, value]) => [key.trim(), this.encryptValue(value.trim())]),
    );

    file[connectionId] = encryptedEntries;
    await this.writeSecrets(file);
  }

  async delete(connectionId: string): Promise<void> {
    const file = await this.readSecrets();
    delete file[connectionId];
    await this.writeSecrets(file);
  }

  private async readSecrets(): Promise<SecretsFile> {
    await this.ensureDirectory();

    try {
      const content = await readFile(this.secretsFilePath, 'utf8');
      return JSON.parse(content) as SecretsFile;
    } catch {
      return {};
    }
  }

  private async writeSecrets(secrets: SecretsFile): Promise<void> {
    await this.ensureDirectory();
    await writeFile(this.secretsFilePath, JSON.stringify(secrets, null, 2), 'utf8');
  }

  private async ensureDirectory(): Promise<void> {
    await mkdir(this.appDataPath, { recursive: true });
  }

  private encryptValue(value: string): string {
    if (safeStorage.isEncryptionAvailable()) {
      return `enc:${safeStorage.encryptString(value).toString('base64')}`;
    }
    return `plain:${value}`;
  }
}
