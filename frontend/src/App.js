import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FinancialProvider } from "./contexts/FinancialContext";
import { MobileLayout } from "./components/layout/MobileLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { PlanejamentoPage } from "./pages/PlanejamentoPage";
import { InvestimentosPage } from "./pages/InvestimentosPage";
import { MetasPage } from "./pages/MetasPage";
import { SimulacoesPage } from "./pages/SimulacoesPage";
import { AnalisesPage } from "./pages/AnalisesPage";
import { CenariosPage } from "./pages/CenariosPage";
import { ConfiguracoesPage } from "./pages/ConfiguracoesPage";
import { Toaster } from "./components/ui/sonner";

function App() {
  return (
    <FinancialProvider>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route element={<MobileLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/planejamento" element={<PlanejamentoPage />} />
              <Route path="/investimentos" element={<InvestimentosPage />} />
              <Route path="/metas" element={<MetasPage />} />
              <Route path="/simulacoes" element={<SimulacoesPage />} />
              <Route path="/analises" element={<AnalisesPage />} />
              <Route path="/cenarios" element={<CenariosPage />} />
              <Route path="/configuracoes" element={<ConfiguracoesPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </div>
    </FinancialProvider>
  );
}

export default App;
