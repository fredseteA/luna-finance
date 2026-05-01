import React, { useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, X, AlertTriangle, AlertCircle, Info,
  Shield, TrendingDown, PieChart, XCircle, CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { useFinancial } from '../../contexts/FinancialContext';
import { generateAlerts } from '../../services/simulationEngine';
import { cn } from '../../lib/utils';

// ─── Constantes ───────────────────────────────────────────────────────────────

// Alertas críticos NUNCA são dispensados permanentemente — reaparecem sempre
// que a condição for verdadeira. Warnings/info ficam dispensados por N dias.
const DISMISSAL_TTL_DAYS = {
  critical: 0,   // nunca dispensado permanentemente
  warning:  7,   // volta em 7 dias
  info:     14,  // volta em 14 dias
};

const ALERT_ICONS = {
  'alert-triangle': AlertTriangle,
  'alert-circle':   AlertCircle,
  'shield-alert':   Shield,
  'shield':         Shield,
  'trending-down':  TrendingDown,
  'pie-chart':      PieChart,
  'x-circle':       XCircle,
};

const ALERT_STYLES = {
  critical: {
    bg:     'bg-rose-500/10',
    border: 'border-rose-500/30',
    icon:   'text-rose-400',
    badge:  'bg-rose-500/20 text-rose-400',
    label:  'Crítico',
  },
  warning: {
    bg:     'bg-amber-500/10',
    border: 'border-amber-500/30',
    icon:   'text-amber-400',
    badge:  'bg-amber-500/20 text-amber-400',
    label:  'Atenção',
  },
  info: {
    bg:     'bg-blue-500/10',
    border: 'border-blue-500/30',
    icon:   'text-blue-400',
    badge:  'bg-blue-500/20 text-blue-400',
    label:  'Info',
  },
};

// ─── Helpers de dismissal com TTL ────────────────────────────────────────────

/**
 * dismissedAlerts no contexto agora deve ser um array de objetos:
 * { id: string, dismissedAt: ISO string, type: 'critical'|'warning'|'info' }
 *
 * Para manter compatibilidade com o formato antigo (array de strings),
 * fazemos a migração silenciosa abaixo.
 */
const normalizeDismissed = (raw) => {
  if (!Array.isArray(raw)) return [];
  return raw.map(entry => {
    if (typeof entry === 'string') {
      // formato antigo — tratamos como warning dispensado há muito tempo (já expirado)
      return { id: entry, dismissedAt: new Date(0).toISOString(), type: 'warning' };
    }
    return entry;
  });
};

const isStillDismissed = (entry) => {
  const ttl = DISMISSAL_TTL_DAYS[entry.type] ?? 7;
  if (ttl === 0) return false; // críticos nunca ficam dispensados
  const dismissedAt = new Date(entry.dismissedAt);
  const expiresAt   = new Date(dismissedAt.getTime() + ttl * 86_400_000);
  return new Date() < expiresAt;
};

// ─── AlertItem ────────────────────────────────────────────────────────────────

const AlertItem = ({ alert, onDismiss }) => {
  const styles = ALERT_STYLES[alert.type] || ALERT_STYLES.info;
  const Icon   = ALERT_ICONS[alert.icon] || Info;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.22 }}
      className={cn('p-3.5 rounded-xl border transition-colors', styles.bg, styles.border)}
    >
      <div className="flex items-start gap-3">
        <div className={cn('flex-shrink-0 mt-0.5', styles.icon)}>
          <Icon className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className="font-semibold text-sm leading-tight">{alert.title}</h4>
            <Badge className={cn('text-[9px] px-1.5 py-0 rounded-full', styles.badge)}>
              {styles.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{alert.message}</p>
          {alert.action && (
            <p className="text-[11px] text-primary mt-1.5 font-medium">→ {alert.action}</p>
          )}
        </div>

        {/* Críticos não têm botão de dispensar — só warnings/info */}
        {alert.type !== 'critical' && (
          <button
            onClick={() => onDismiss(alert.id, alert.type)}
            className="h-6 w-6 rounded-lg flex items-center justify-center bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-all shrink-0 mt-0.5"
            title="Dispensar"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

// ─── SmartAlerts ─────────────────────────────────────────────────────────────

export const SmartAlerts = () => {
  const {
    financialData,
    settings,
    projection,
    dismissedAlerts: rawDismissed = [],
    dismissAlert,
    clearDismissedAlerts,
  } = useFinancial();

  // Normaliza para o formato { id, dismissedAt, type }
  const dismissed = useMemo(() => normalizeDismissed(rawDismissed), [rawDismissed]);

  // IDs que ainda estão dentro do TTL (realmente ocultos)
  const activelySuppressedIds = useMemo(
    () => new Set(dismissed.filter(isStillDismissed).map(d => d.id)),
    [dismissed]
  );

  const config = useMemo(() => ({
    ...financialData,
    rates: settings.rates,
  }), [financialData, settings.rates]);

  // generateAlerts recebe os IDs suprimidos (não todos os dispensados)
  const alerts = useMemo(
    () => generateAlerts(config, projection, [...activelySuppressedIds]),
    [config, projection, activelySuppressedIds]
  );

  // Contagem de dispensados que ainda estão no TTL
  const suppressedCount = activelySuppressedIds.size;

  const handleDismiss = useCallback((id, type) => {
    // Chama o contexto com o objeto enriquecido
    // Se dismissAlert aceitar objeto, ótimo. Se só aceitar string,
    // precisará ser atualizado no contexto também.
    dismissAlert({ id, type, dismissedAt: new Date().toISOString() });
  }, [dismissAlert]);

  const criticalCount = alerts.filter(a => a.type === 'critical').length;
  const warningCount  = alerts.filter(a => a.type === 'warning').length;

  if (financialData.monthlyIncome <= 0) return null;

  const isEmpty = alerts.length === 0;

  return (
    <Card>
      <AnimatePresence mode="wait" initial={false}>
        {isEmpty ? (
          /* ── Estado vazio: card bem fino ─────────────────────────────────── */
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between gap-3">
                {/* Lado esquerdo */}
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-emerald-400">Tudo em ordem!</span>
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      Nenhum alerta no momento
                    </span>
                  </div>
                </div>

                {/* Lado direito — só aparece se há dispensados */}
                {suppressedCount > 0 && (
                  <button
                    onClick={clearDismissedAlerts}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    title="Restaurar alertas dispensados"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>{suppressedCount} oculto{suppressedCount > 1 ? 's' : ''}</span>
                  </button>
                )}
              </div>
            </CardContent>
          </motion.div>
        ) : (
          /* ── Estado com alertas: card completo ──────────────────────────── */
          <motion.div
            key="filled"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="pt-4 pb-4 px-4 space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-amber-400" />
                  <span className="text-sm font-bold">Alertas Inteligentes</span>
                  <Badge variant="secondary" className="font-mono text-xs px-1.5 py-0">
                    {alerts.length}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5">
                  {criticalCount > 0 && (
                    <Badge className="bg-rose-500/20 text-rose-400 text-[10px] px-1.5 py-0">
                      {criticalCount} crítico{criticalCount > 1 ? 's' : ''}
                    </Badge>
                  )}
                  {warningCount > 0 && (
                    <Badge className="bg-amber-500/20 text-amber-400 text-[10px] px-1.5 py-0">
                      {warningCount} atenção
                    </Badge>
                  )}
                </div>
              </div>

              {/* Lista */}
              <ScrollArea className={alerts.length > 3 ? 'h-[260px]' : undefined}>
                <AnimatePresence mode="popLayout">
                  <div className="space-y-2.5 pr-1">
                    {alerts.map(alert => (
                      <AlertItem
                        key={alert.id}
                        alert={alert}
                        onDismiss={handleDismiss}
                      />
                    ))}
                  </div>
                </AnimatePresence>
              </ScrollArea>

              {/* Rodapé — alertas suprimidos */}
              {suppressedCount > 0 && (
                <button
                  onClick={clearDismissedAlerts}
                  className="w-full flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors pt-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  Mostrar {suppressedCount} alerta{suppressedCount > 1 ? 's' : ''} dispensado{suppressedCount > 1 ? 's' : ''}
                </button>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default SmartAlerts;