export const IPC_CHANNELS = {
  getAppVersion: 'app:get-version',
  ping: 'system:ping',
} as const;

export type TiguiBridge = {
  getAppVersion: () => Promise<string>;
  ping: (message: string) => Promise<string>;
};
