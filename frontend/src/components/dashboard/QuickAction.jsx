import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

/**
 * QuickAction — atalho de navegação no estado vazio do Dashboard.
 *
 * Extraído do DashboardPage para facilitar testes unitários,
 * reutilização em outros contextos (ex: onboarding) e extensão futura
 * (badge de notificação, estado ativo/concluído, etc).
 */
export const QuickAction = ({ to, icon: Icon, title, description, color, badge }) => (
  <Link to={to}>
    <motion.div
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-3 p-4 rounded-xl border border-border/40 bg-card active:bg-muted/50 transition-all"
    >
      <div className={`relative h-12 w-12 rounded-xl ${color} flex items-center justify-center shrink-0`}>
        <Icon className="h-6 w-6 text-white" />
        {badge && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
            {badge}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
    </motion.div>
  </Link>
);

export default QuickAction;