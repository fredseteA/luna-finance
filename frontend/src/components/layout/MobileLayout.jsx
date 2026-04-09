import React, { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
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
  ChevronRight,
  LogOut,
  KeyRound,
  Trash2,
  User,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';
import { Logo } from '../brand/Logo';
import { useFinancial } from '../../contexts/FinancialContext';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import {
  updatePassword,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { auth } from '../../lib/firebase';

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
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggleTheme, currency, resetAll } = useFinancial();
  const { user, logout } = useAuth();

  // Trocar senha
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Excluir conta
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // Verifica se o login foi por email/senha ou Google
  const isEmailProvider = user?.providerData?.some(p => p.providerId === 'password');

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/login');
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess(false);
    if (newPassword.length < 6) {
      setPasswordError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
    } catch (e) {
      if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
        setPasswordError('Senha atual incorreta.');
      } else {
        setPasswordError('Erro ao trocar senha. Tente novamente.');
      }
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError('');
    try {
      // Reautentica email/senha
      if (isEmailProvider) {
        const credential = EmailAuthProvider.credential(user.email, deletePassword);
        await reauthenticateWithCredential(auth.currentUser, credential);
      } else {
        // Reautentica Google
        const { GoogleAuthProvider, reauthenticateWithPopup } = await import('firebase/auth');
        const provider = new GoogleAuthProvider();
        await reauthenticateWithPopup(auth.currentUser, provider);
      }

      await resetAll();           // limpa Firestore
      await deleteUser(auth.currentUser); // deleta a conta
      navigate('/login');
    } catch (e) {
      if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
        setDeleteError('Senha incorreta.');
      } else if (e.code === 'auth/popup-closed-by-user') {
        setDeleteError('Cancelado. Tente novamente.');
      } else if (e.code === 'auth/requires-recent-login') {
        setDeleteError('Sessão expirada. Faça logout e login novamente antes de excluir.');
      } else {
        setDeleteError('Erro ao excluir conta. Tente novamente.');
      }
    }
  };

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
          <Logo variant="horizontal" size="md" />
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground px-2 py-1 rounded bg-muted font-medium">
              {currency}
            </span>

            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-0">
                <div className="flex flex-col h-full">

                  {/* Perfil do usuário */}
                  <div className="p-4 border-b border-border/40 bg-muted/30">
                    <div className="flex items-center gap-3">
                      {user?.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt="avatar"
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {user?.displayName || 'Usuário'}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="flex-1 p-2 overflow-y-auto">
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

                    {/* Divider segurança */}
                    <div className="my-2 px-3">
                      <p className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">
                        Segurança
                      </p>
                    </div>

                    {/* Trocar senha — só para email/senha */}
                    {isEmailProvider && (
                      <button
                        onClick={() => { setShowChangePassword(true); setMenuOpen(false); }}
                        className="flex items-center gap-3 p-3 rounded-lg mb-1 w-full hover:bg-muted transition-colors"
                      >
                        <div className="p-2 rounded-lg bg-muted">
                          <KeyRound className="h-4 w-4" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-sm">Trocar senha</p>
                          <p className="text-xs text-muted-foreground">Alterar sua senha</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </button>
                    )}

                    {/* Excluir conta */}
                    <button
                      onClick={() => { setShowDeleteAccount(true); setMenuOpen(false); }}
                      className="flex items-center gap-3 p-3 rounded-lg mb-1 w-full hover:bg-destructive/10 transition-colors text-destructive"
                    >
                      <div className="p-2 rounded-lg bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-sm">Excluir conta</p>
                        <p className="text-xs text-muted-foreground text-muted-foreground">
                          Remove todos os dados
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 opacity-50" />
                    </button>
                  </div>

                  {/* Footer */}
                  <div className="p-4 border-t border-border/40 space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={toggleTheme}
                    >
                      {theme === 'dark' ? '☀️ Modo Claro' : '🌙 Modo Escuro'}
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-muted-foreground hover:text-destructive"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sair da conta
                    </Button>
                    <p className="text-[10px] text-center text-muted-foreground">
                      Luna Finance v2.0
                    </p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

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
                <NavLink key={item.path} to={item.path} className="flex-1 relative">
                  {isActive && (
                    <div className="absolute top-0 inset-x-0 flex justify-center">
                      <div className="w-10 h-1 bg-luna-primary rounded-full" />
                    </div>
                  )}
                  <div className={cn(
                    'h-full flex flex-col items-center justify-center gap-1 transition-colors',
                    isActive ? 'text-luna-primary' : 'text-muted-foreground'
                  )}>
                    <div className={cn('p-2 rounded-xl transition-all', isActive && 'bg-luna-primary/10')}>
                      <Icon className={cn('h-5 w-5', isActive && 'scale-110')} />
                    </div>
                    <span className={cn('text-[10px] font-medium', isActive && 'font-semibold')}>
                      {item.label}
                    </span>
                  </div>
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Modal: Trocar Senha */}
      <AlertDialog open={showChangePassword} onOpenChange={setShowChangePassword}>
        <AlertDialogContent className="max-w-[90vw] rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Trocar senha</AlertDialogTitle>
            <AlertDialogDescription>
              Digite sua senha atual e a nova senha.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <input
              type="password"
              placeholder="Senha atual"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="w-full p-3 rounded-lg border border-border bg-card text-sm"
            />
            <input
              type="password"
              placeholder="Nova senha (mín. 6 caracteres)"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full p-3 rounded-lg border border-border bg-card text-sm"
            />
            {passwordError && <p className="text-destructive text-xs">{passwordError}</p>}
            {passwordSuccess && <p className="text-emerald-400 text-xs">Senha alterada com sucesso!</p>}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setPasswordError(''); setPasswordSuccess(false); }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleChangePassword}>
              Salvar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal: Excluir Conta */}
      <AlertDialog open={showDeleteAccount} onOpenChange={setShowDeleteAccount}>
        <AlertDialogContent className="max-w-[90vw] rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Excluir conta?</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os seus dados serão apagados permanentemente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {isEmailProvider && (
            <div className="py-2">
              <input
                type="password"
                placeholder="Confirme sua senha para continuar"
                value={deletePassword}
                onChange={e => setDeletePassword(e.target.value)}
                className="w-full p-3 rounded-lg border border-border bg-card text-sm"
              />
              {deleteError && <p className="text-destructive text-xs mt-1">{deleteError}</p>}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setDeleteError(''); setDeletePassword(''); }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-destructive text-destructive-foreground"
            >
              Excluir conta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MobileLayout;