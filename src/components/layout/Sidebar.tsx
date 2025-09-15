import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user';
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Upload,
  Code,
  ClipboardCheck,
  FileText,
  TrendingUp,
  Bell,
  Settings,
  Users,
  Shield,
  LogOut,
} from 'lucide-react';

interface MenuItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const menuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
    roles: ['PROVIDER', 'EMPLOYEE', 'AUDITOR', 'ADMIN'],
  },
  {
    title: 'Upload Documents',
    url: '/upload',
    icon: Upload,
    roles: ['PROVIDER'],
  },
  {
    title: 'Documents',
    url: '/documents',
    icon: FileText,
    roles: ['EMPLOYEE', 'AUDITOR'],
  },
  {
    title: 'Coding Workspace',
    url: '/coding',
    icon: Code,
    roles: ['EMPLOYEE', 'AUDITOR'],
  },
  {
    title: 'Audit Queue',
    url: '/audit',
    icon: ClipboardCheck,
    roles: ['AUDITOR'],
  },
  {
    title: 'Claims',
    url: '/claims',
    icon: FileText,
    roles: ['PROVIDER', 'EMPLOYEE', 'AUDITOR', 'ADMIN'],
  },
  {
    title: 'Productivity',
    url: '/productivity',
    icon: TrendingUp,
    roles: ['EMPLOYEE', 'AUDITOR', 'ADMIN'],
  },
  {
    title: 'Notifications',
    url: '/notifications',
    icon: Bell,
    roles: ['PROVIDER', 'EMPLOYEE', 'AUDITOR', 'ADMIN'],
  },
  {
    title: 'User Management',
    url: '/users',
    icon: Users,
    roles: ['ADMIN'],
  },
  {
    title: 'Settings',
    url: '/settings',
    icon: Settings,
    roles: ['PROVIDER', 'EMPLOYEE', 'AUDITOR', 'ADMIN'],
  },
];

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { state } = useSidebar();
  const location = useLocation();
  
  const collapsed = state === "collapsed";

  if (!user) return null;

  const userMenuItems = menuItems.filter(item => 
    item.roles.includes(user.role)
  );

  const isActive = (url: string) => location.pathname === url;

  return (
    <ShadcnSidebar className={cn("border-r border-border", collapsed ? "w-14" : "w-64")}>
      <SidebarContent>
        {/* Header */}
        <div className={cn("p-4 border-b border-border", collapsed && "p-2")}>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-primary rounded-lg">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div>
                <h2 className="font-semibold text-sm">Cyptrix RCM</h2>
                <p className="text-xs text-muted-foreground">powered by Encrylox</p>
              </div>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className={cn("p-4 border-b border-border", collapsed && "p-2")}>
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-primary">
                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user.role.toLowerCase()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {userMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={cn(
                        "flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-colors",
                        isActive(item.url)
                          ? "bg-primary text-primary-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Logout */}
        <div className="mt-auto p-4 border-t border-border">
          <button
            onClick={logout}
            className={cn(
              "flex items-center space-x-2 w-full px-3 py-2 rounded-md text-sm transition-colors text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              collapsed && "justify-center"
            )}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </SidebarContent>
    </ShadcnSidebar>
  );
};