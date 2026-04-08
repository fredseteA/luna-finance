import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatCurrency, formatPercentage } from '../../services/financialEngine';
import { useFinancial } from '../../contexts/FinancialContext';

export const MetricCard = ({
  title,
  value,
  change,
  changeLabel,
  type = 'currency', // 'currency' | 'percentage' | 'number'
  trend = 'neutral', // 'positive' | 'negative' | 'neutral'
  icon: Icon,
  className,
  testId,
  compact = false, // Mobile compact mode
}) => {
  const { currency } = useFinancial();

  const formatValue = (val) => {
    if (type === 'currency') return formatCurrency(val, currency);
    if (type === 'percentage') return formatPercentage(val);
    return val.toLocaleString('pt-BR');
  };

  // Formato compacto para valores grandes em mobile
  const formatCompactValue = (val) => {
    if (type === 'percentage') return formatPercentage(val);
    if (type === 'currency') {
      const absVal = Math.abs(val);
      if (absVal >= 1000000) {
        return formatCurrency(val / 1000000, currency).replace(/,\d{2}$/, '') + 'M';
      }
      if (absVal >= 10000) {
        return formatCurrency(val / 1000, currency).replace(/,\d{2}$/, '') + 'K';
      }
      return formatCurrency(val, currency);
    }
    return val.toLocaleString('pt-BR');
  };

  const getTrendIcon = () => {
    if (trend === 'positive') return <TrendingUp className="h-3 w-3" />;
    if (trend === 'negative') return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getTrendColor = () => {
    if (trend === 'positive') return 'text-emerald-400';
    if (trend === 'negative') return 'text-rose-400';
    return 'text-muted-foreground';
  };

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'card-grid-border p-3 overflow-hidden',
          className
        )}
        data-testid={testId}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">
              {title}
            </p>
            <motion.p
              className="text-lg font-mono font-semibold tracking-tight truncate"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key={value}
            >
              {formatCompactValue(value)}
            </motion.p>
            {change !== undefined && (
              <div className={cn('flex items-center gap-1 text-[10px]', getTrendColor())}>
                {getTrendIcon()}
                <span className="font-mono truncate">{formatCompactValue(change)}</span>
                {changeLabel && <span className="text-muted-foreground hidden sm:inline">• {changeLabel}</span>}
              </div>
            )}
          </div>
          {Icon && (
            <div className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
              trend === 'positive' && 'bg-emerald-500/10 text-emerald-400',
              trend === 'negative' && 'bg-rose-500/10 text-rose-400',
              trend === 'neutral' && 'bg-muted text-muted-foreground'
            )}>
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'card-grid-border p-5',
        className
      )}
      data-testid={testId}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="label-overline">{title}</p>
          <motion.p
            className="text-2xl sm:text-3xl font-mono font-medium tracking-tight"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            key={value}
          >
            {formatValue(value)}
          </motion.p>
          {change !== undefined && (
            <div className={cn('flex items-center gap-1 text-xs', getTrendColor())}>
              {getTrendIcon()}
              <span className="font-mono">{formatValue(change)}</span>
              {changeLabel && <span className="text-muted-foreground">• {changeLabel}</span>}
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg',
            trend === 'positive' && 'bg-emerald-500/10 text-emerald-400',
            trend === 'negative' && 'bg-rose-500/10 text-rose-400',
            trend === 'neutral' && 'bg-muted text-muted-foreground'
          )}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MetricCard;
