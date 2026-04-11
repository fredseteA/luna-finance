import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";


export default function ProtectedRoute({ children }) {
  const { user, isPremium, loading } = useAuth();

  // Aguarda o Firebase resolver o estado de auth antes de redirecionar
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!isPremium) return <Navigate to="/paywall" replace />;

  return children;
}