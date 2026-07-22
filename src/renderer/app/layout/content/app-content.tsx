import type { ReactNode } from 'react';

type AppContentProps = {
  children: ReactNode;
};

export const AppContent = ({ children }: AppContentProps) => {
  return <section className="h-full min-h-0">{children}</section>;
};
