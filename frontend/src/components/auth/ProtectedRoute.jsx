import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const ProtectedRoute = ({ children }) => {
  const { user, isPremium, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-pulse">Carregando...</div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!isPremium) return <Navigate to="/paywall" replace />;
  return children;
};