import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, Target } from 'lucide-react';
import { QuickAction } from './QuickAction';

/**
 * DashboardEmpty — exibido quando o usuário ainda não configurou dados.
 *
 * Substitui o comportamento anterior onde SummaryCards renderizava com
 * zeros e as QuickActions apareciam logo abaixo — causando confusão.
 * Agora o estado vazio é intencional, com contexto claro e call-to-action.
 */
export const DashboardEmpty = () => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="space-y-6"
  >
    {/* Ilustração + contexto */}
    <div className="flex flex-col items-center text-center pt-4 pb-2 space-y-3">
      <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
        <TrendingUp className="h-8 w-8 text-emerald-500" />
      </div>
      <div>
        <h2 className="text-base font-semibold">Configure seu planejamento</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
          Informe sua renda e despesas para começar a ver projeções e gráficos do seu patrimônio.
        </p>
      </div>
    </div>

    {/* Quick Actions */}
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-0.5">
        Por onde começar
      </p>
      <QuickAction
        to="/planejamento"
        icon={Wallet}
        title="Configurar Renda"
        description="Defina sua renda e despesas mensais"
        color="bg-emerald-500"
      />
      <QuickAction
        to="/investimentos"
        icon={TrendingUp}
        title="Carteira de Investimentos"
        description="Configure sua alocação entre CDI, Selic, CDB e FII"
        color="bg-blue-500"
      />
      <QuickAction
        to="/metas"
        icon={Target}
        title="Definir Metas"
        description="Trace seus objetivos financeiros com prazo e valor-alvo"
        color="bg-amber-500"
      />
    </div>
  </motion.div>
);

export default DashboardEmpty;