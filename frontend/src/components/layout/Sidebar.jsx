import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  Target,
  Sparkles,
  BarChart3,
  FolderOpen,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

const navItems = [
  {
    path: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Visão geral',
  },
  {
    path: '/planejamento',
    label: 'Planejamento',
    icon: Wallet,
    description: 'Renda e despesas',
  },
  {
    path: '/investimentos',
    label: 'Investimentos',
    icon: TrendingUp,
    description: 'Alocação e taxas',
  },
  {
    path: '/metas',
    label: 'Metas',
    icon: Target,
    description: 'Objetivos de vida',
  },
  {
    path: '/simulacoes',
    label: 'Simulações',
    icon: Sparkles,
    description: 'Cenários avançados',
  },
  {
    path: '/analises',
    label: 'Análises',
    icon: BarChart3,
    description: 'Score financeiro',
  },
  {
    path: '/cenarios',
    label: 'Cenários',
    icon: FolderOpen,
    description: 'Salvar e comparar',
  },
  {
    path: '/configuracoes',
    label: 'Configurações',
    icon: Settings,
    description: 'Preferências',
  },
];

export const Sidebar = ({ collapsed, setCollapsed }) => {
  const location = useLocation();

  return (
    <aside
      className={cn(
        'fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] border-r border-border/40 bg-background/95 backdrop-blur-xl transition-all duration-300',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Toggle Button */}
        <div className="flex justify-end p-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-2 pb-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 shrink-0 transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                  )}
                />
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-col"
                  >
                    <span>{item.label}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {item.description}
                    </span>
                  </motion.div>
                )}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 h-8 w-1 rounded-r-full bg-primary"
                  />
                )}
              </NavLink>
            );
          })}        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="border-t border-border/40 p-4">
            <p className="text-[10px] text-muted-foreground text-center">
              Planejador Financeiro v2.0
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
