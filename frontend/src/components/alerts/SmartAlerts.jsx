import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, X, AlertTriangle, AlertCircle, Info, 
  Shield, TrendingDown, PieChart, XCircle, CheckCircle2 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { useFinancial } from '../../contexts/FinancialContext';
import { generateAlerts } from '../../services/simulationEngine';
import { cn } from '../../lib/utils';

const ALERT_ICONS = {
  'alert-triangle': AlertTriangle,
  'alert-circle': AlertCircle,
  'shield-alert': Shield,
  'shield': Shield,
  'trending-down': TrendingDown,
  'pie-chart': PieChart,
  'x-circle': XCircle,
};

const ALERT_STYLES = {
  critical: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    icon: 'text-rose-400',
    badge: 'bg-rose-500/20 text-rose-400',
  },
  warning: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    icon: 'text-amber-400',
    badge: 'bg-amber-500/20 text-amber-400',
  },
  info: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    icon: 'text-blue-400',
    badge: 'bg-blue-500/20 text-blue-400',
  },
};

const AlertItem = ({ alert, onDismiss }) => {
  const styles = ALERT_STYLES[alert.type] || ALERT_STYLES.info;
  const Icon = ALERT_ICONS[alert.icon] || Info;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn(
        'p-4 rounded-lg border transition-colors',
        styles.bg,
        styles.border
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('flex-shrink-0 mt-0.5', styles.icon)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm">{alert.title}</h4>
            <Badge className={cn('text-[10px] px-1.5 py-0', styles.badge)}>
              {alert.type === 'critical' ? 'Crítico' : alert.type === 'warning' ? 'Atenção' : 'Info'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {alert.message}
          </p>
          {alert.action && (
            <p className="text-xs text-primary mt-2 font-medium">
              → {alert.action}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 flex-shrink-0"
          onClick={() => onDismiss(alert.id)}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </motion.div>
  );
};

export const SmartAlerts = () => {
  const { financialData, settings, projection, dismissedAlerts, dismissAlert, clearDismissedAlerts } = useFinancial();
  const [showDismissed, setShowDismissed] = useState(false);

  const config = useMemo(() => ({
    ...financialData,
    rates: settings.rates,
  }), [financialData, settings.rates]);

  const alerts = useMemo(() => {
    return generateAlerts(config, projection, dismissedAlerts);
  }, [config, projection, dismissedAlerts]);

  const criticalCount = alerts.filter(a => a.type === 'critical').length;
  const warningCount = alerts.filter(a => a.type === 'warning').length;

  if (financialData.monthlyIncome <= 0) {
    return null;
  }

  return (
    <Card className="card-grid-border" data-testid="smart-alerts">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-400" />
            Alertas Inteligentes
            {alerts.length > 0 && (
              <Badge variant="secondary" className="font-mono">
                {alerts.length}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {criticalCount > 0 && (
              <Badge className="bg-rose-500/20 text-rose-400 text-xs">
                {criticalCount} crítico{criticalCount > 1 ? 's' : ''}
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge className="bg-amber-500/20 text-amber-400 text-xs">
                {warningCount} atenção
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-emerald-400" />
            <p className="text-sm font-medium text-emerald-400">Tudo em ordem!</p>
            <p className="text-xs text-muted-foreground mt-1">
              Nenhum alerta no momento
            </p>
            {dismissedAlerts.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 text-xs"
                onClick={clearDismissedAlerts}
              >
                Mostrar alertas dispensados ({dismissedAlerts.length})
              </Button>
            )}
          </div>
        ) : (
          <ScrollArea className="h-[280px]">
            <AnimatePresence mode="popLayout">
              <div className="space-y-3 pr-3">
                {alerts.map(alert => (
                  <AlertItem
                    key={alert.id}
                    alert={alert}
                    onDismiss={dismissAlert}
                  />
                ))}
              </div>
            </AnimatePresence>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default SmartAlerts;
