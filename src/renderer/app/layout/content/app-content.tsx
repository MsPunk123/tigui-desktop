import type { ReactNode } from 'react';

type AppContentProps = {
  children: ReactNode;
};

export const AppContent = ({ children }: AppContentProps) => {
  return <section>{children}</section>;
};
