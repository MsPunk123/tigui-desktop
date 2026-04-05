import type { ReactNode } from 'react';

type AppTopbarProps = {
  children: ReactNode;
};

export const AppTopbar = ({ children }: AppTopbarProps) => {
  return <div className="flex h-full items-center px-4">{children}</div>;
};
