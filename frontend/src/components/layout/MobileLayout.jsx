import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  ChevronRight
} from 'lucide-react';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { SmartAlerts } from '../alerts/SmartAlerts';
import { Logo, LogoIcon } from '../brand/Logo';
import { useFinancial } from '../../contexts/FinancialContext';
import { cn } from '../../lib/utils';

const mainNavItems = [
  { path: '/', label: 'Home', icon: LayoutDashboard },
  { path: '/planejamento', label: 'Planejar', icon: Wallet },
  { path: '/investimentos', label: 'Investir', icon: TrendingUp },
  { path: '/simulacoes', label: 'Simular', icon: Sparkles },
  { path: '/analises', label: 'Análise', icon: BarChart3 },
];

const moreNavItems = [
  { path: '/metas', label: 'Metas', icon: Target, description: 'Objetivos de vida' },
  { path: '/cenarios', label: 'Cenários', icon: FolderOpen, description: 'Salvar e comparar' },
  { path: '/configuracoes', label: 'Configurações', icon: Settings, description: 'Preferências' },
];

export const MobileLayout = () => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggleTheme, currency } = useFinancial();

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto relative">
      {/* Mobile Container Shadow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="max-w-md mx-auto h-full shadow-2xl shadow-black/20" />
      </div>

      {/* Background texture */}
      <div className="bg-texture" />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-xl safe-area-top">
        <div className="flex h-14 items-center justify-between px-4">
          {/* Logo - Horizontal no header */}
          <Logo variant="horizontal" size="md" />

          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground px-2 py-1 rounded bg-muted font-medium">
              {currency}
            </span>
            
            {/* More Menu */}
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-0">
                <div className="flex flex-col h-full">
                  {/* Menu Header com Logo */}
                  <div className="p-4 border-b border-border/40 bg-muted/30">
                    <div className="flex items-center gap-3">
                      <LogoIcon size="lg" />
                      <div>
                        <h2 className="font-semibold text-sm">Luna Finance</h2>
                        <p className="text-[10px] text-muted-foreground">Seu planejador financeiro</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Menu Items */}
                  <div className="flex-1 p-2">
                    {moreNavItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;
                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          onClick={() => setMenuOpen(false)}
                          className={cn(
                            'flex items-center gap-3 p-3 rounded-lg mb-1 transition-colors',
                            isActive
                              ? 'bg-luna-primary/10 text-luna-primary'
                              : 'hover:bg-muted'
                          )}
                        >
                          <div className={cn(
                            'p-2 rounded-lg',
                            isActive ? 'bg-luna-primary/20' : 'bg-muted'
                          )}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.label}</p>
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </NavLink>
                      );
                    })}
                  </div>
                  
                  {/* Menu Footer */}
                  <div className="p-4 border-t border-border/40 space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={toggleTheme}
                    >
                      {theme === 'dark' ? '☀️ Modo Claro' : '🌙 Modo Escuro'}
                    </Button>
                    <p className="text-[10px] text-center text-muted-foreground">
                      Luna Finance v2.0 • Dados salvos localmente
                    </p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Smart Alerts */}
      <div className="px-4 pt-3">
        <SmartAlerts />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 px-4 pt-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border/40 safe-area-bottom">
        <div className="max-w-md mx-auto">
          <div className="flex items-stretch h-16">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className="flex-1 relative"
                >
                  {/* Indicador ativo - barra centralizada no topo */}
                  {isActive && (
                    <div className="absolute top-0 inset-x-0 flex justify-center">
                      <div className="w-10 h-1 bg-luna-primary rounded-full" />
                    </div>
                  )}
                  
                  <div className={cn(
                    'h-full flex flex-col items-center justify-center gap-1 transition-colors',
                    isActive ? 'text-luna-primary' : 'text-muted-foreground'
                  )}>
                    <div className={cn(
                      'p-2 rounded-xl transition-all',
                      isActive && 'bg-luna-primary/10'
                    )}>
                      <Icon className={cn(
                        "h-5 w-5",
                        isActive && "scale-110"
                      )} />
                    </div>
                    <span className={cn(
                      "text-[10px] font-medium",
                      isActive && "font-semibold"
                    )}>
                      {item.label}
                    </span>
                  </div>
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default MobileLayout;
