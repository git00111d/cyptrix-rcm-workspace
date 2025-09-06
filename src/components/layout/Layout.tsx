import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Sidebar } from './Sidebar';

export const Layout: React.FC = () => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-14 border-b border-border bg-background flex items-center px-4">
            <SidebarTrigger />
            <div className="flex-1 text-center">
              <h1 className="text-lg font-semibold text-foreground">
                Cyptrix RCM Workspace
              </h1>
              <p className="text-xs text-muted-foreground">
                powered by <span className="text-teal font-medium">Encrylox</span>
              </p>
            </div>
          </header>
          
          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};