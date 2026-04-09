import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { cn } from '../../lib/utils';

export const AppLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Background texture */}
      <div className="bg-texture" />
      
      <Header />
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      
      <main
        className={cn(
          'min-h-[calc(100vh-4rem)] pt-6 pb-12 transition-all duration-300',
          sidebarCollapsed ? 'ml-16' : 'ml-56'
        )}
      >
        <div className="container mx-auto px-6">
          {/* Page Content */}
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
