import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from './contexts/AuthContext';
import { FinancialProvider } from "./contexts/FinancialContext";
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { MobileLayout } from "./components/layout/MobileLayout";
import { LoginPage } from './pages/LoginPage';
import { HomePage } from "./pages/HomePage";
import { PlanejamentoPage } from "./pages/PlanejamentoPage";
import { PaymentSourcesPage } from './pages/PaymentSourcesPage';
import { InvestimentosPage } from "./pages/InvestimentosPage";
import { MetasPage } from "./pages/MetasPage";
import { SimulacoesPage } from "./pages/SimulacoesPage";
import { AnalisesPage } from "./pages/AnalisesPage";
import { CenariosPage } from "./pages/CenariosPage";
import { ConfiguracoesPage } from "./pages/ConfiguracoesPage";
import { Toaster } from "./components/ui/sonner";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <FinancialProvider>
                  <div className="App">
                    <Routes>
                      <Route element={<MobileLayout />}>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/planejamento/fontes" element={<PaymentSourcesPage />} />
                        <Route path="/planejamento" element={<PlanejamentoPage />} />
                        <Route path="/investimentos" element={<InvestimentosPage />} />
                        <Route path="/metas" element={<MetasPage />} />
                        <Route path="/simulacoes" element={<SimulacoesPage />} />
                        <Route path="/analises" element={<AnalisesPage />} />
                        <Route path="/cenarios" element={<CenariosPage />} />
                        <Route path="/configuracoes" element={<ConfiguracoesPage />} />
                      </Route>
                    </Routes>
                    <Toaster position="top-right" richColors />
                  </div>
                </FinancialProvider>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;