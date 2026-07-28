// src/components/layout/AppShell.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { ToastContainer } from '../ui/Toast';
import { ErrorBoundary } from '../common/ErrorBoundary';

interface AppShellProps {
  showTopBar?: boolean;
  showBottomNav?: boolean;
  showSearch?: boolean;
  title?: string;
}

export const AppShell: React.FC<AppShellProps> = ({
  showTopBar = true,
  showBottomNav = true,
  showSearch = true,
  title,
}) => {
  return (
    <div className="app-shell">
      {showTopBar && <TopBar title={title} showSearch={showSearch} />}
      <main className="content-area">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      {showBottomNav && <BottomNav />}
      <ToastContainer />
    </div>
  );
};
