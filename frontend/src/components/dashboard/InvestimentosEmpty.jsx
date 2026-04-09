import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ChevronRight } from 'lucide-react';

/**
 * InvestimentosEmpty — exibido quando patrimônio e alocação não foram configurados.
 *
 * Substitui o estado anterior onde o gráfico renderizava vazio e os
 * formulários apareciam sem contexto. Orienta o usuário com passos claros.
 */
const Step = ({ number, title, description }) => (
  <div className="flex gap-3 items-start">
    <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
      {number}
    </div>
    <div>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
    </div>
  </div>
);

export const InvestimentosEmpty = () => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="space-y-6 pt-2"
  >
    {/* Ícone + contexto */}
    <div className="flex flex-col items-center text-center space-y-3 py-2">
      <div className="h-16 w-16 rounded-2xl bg-blue-500/10 flex items-center justify-center">
        <TrendingUp className="h-8 w-8 text-blue-500" />
      </div>
      <div>
        <h2 className="text-base font-semibold">Configure sua carteira</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
          Defina sua alocação entre CDI, Selic, CDB e FII para começar a ver projeções de rendimento.
        </p>
      </div>
    </div>

    {/* Passos */}
    <div className="rounded-xl border border-border/40 bg-card p-4 space-y-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Como começar
      </p>
      <Step
        number="1"
        title="Defina sua renda e despesas"
        description="Acesse Planejamento para calcular quanto sobra por mês para investir."
      />
      <Step
        number="2"
        title="Configure a alocação da carteira"
        description="Distribua a sobra entre CDI, Tesouro Selic, CDB e FII usando os sliders abaixo."
      />
      <Step
        number="3"
        title="Ajuste as taxas de mercado"
        description="Atualize o CDI e os yields para refletir o cenário atual — as projeções se atualizam automaticamente."
      />
    </div>
  </motion.div>
);

export default InvestimentosEmpty;