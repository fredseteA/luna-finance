import React from 'react';
import { motion } from 'framer-motion';
import { Settings, Percent, DollarSign, Palette, RotateCcw, Banknote, TrendingDown } from 'lucide-react';
import { RealisticSettings } from '../components/settings/RealisticSettings';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';
import { useFinancial } from '../contexts/FinancialContext';
import { CURRENCIES } from '../services/financialEngine';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const ConfiguracoesPage = () => {
  const { 
    mounted, 
    settings, 
    currency, 
    setCurrency, 
    theme, 
    toggleTheme,
    resetAll,
    financialData,           
    updateFinancialData,     
    formatCurrency, 
  } = useFinancial();

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4 pb-4"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="pt-2">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Configurações
        </h1>
        <p className="text-sm text-muted-foreground">Preferências do app</p>
      </motion.div>

      {/* Quick Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-2">
        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-1.5 text-primary mb-0.5">
            <DollarSign className="h-3.5 w-3.5" />
            <span className="text-[10px] font-medium uppercase">Moeda</span>
          </div>
          <p className="text-lg font-mono font-bold">{currency}</p>
        </div>
        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-center gap-1.5 text-blue-400 mb-0.5">
            <Percent className="h-3.5 w-3.5" />
            <span className="text-[10px] font-medium uppercase">CDI</span>
          </div>
          <p className="text-lg font-mono font-bold">{settings.rates.cdi}%</p>
        </div>
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-1.5 text-emerald-400 mb-0.5">
            <Percent className="h-3.5 w-3.5" />
            <span className="text-[10px] font-medium uppercase">Inflação</span>
          </div>
          <p className="text-lg font-mono font-bold">{settings.inflation || 0}%</p>
        </div>
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-1.5 text-amber-400 mb-0.5">
            <Palette className="h-3.5 w-3.5" />
            <span className="text-[10px] font-medium uppercase">Tema</span>
          </div>
          <p className="text-lg font-mono font-bold capitalize">{theme}</p>
        </div>
      </motion.div>

      {/* General Settings */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Geral</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Currency */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Moeda</p>
                <p className="text-xs text-muted-foreground">Exibição de valores</p>
              </div>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CURRENCIES).map(([code, config]) => (
                    <SelectItem key={code} value={code}>
                      {config.symbol} {code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Theme */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Tema</p>
                <p className="text-xs text-muted-foreground">Aparência</p>
              </div>
              <Button variant="outline" size="sm" onClick={toggleTheme}>
                {theme === 'dark' ? '☀️ Claro' : '🌙 Escuro'}
              </Button>
            </div>

            <Separator />

            {/* Reset */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm text-rose-400">Resetar</p>
                <p className="text-xs text-muted-foreground">Apagar todos os dados</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <RotateCcw className="h-3.5 w-3.5 mr-1" />
                    Resetar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-[90vw] rounded-xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Resetar dados?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação apagará todas as configurações e dados. Não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={resetAll}
                      className="bg-destructive text-destructive-foreground"
                    >
                      Resetar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Income Settings */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Banknote className="h-4 w-4 text-emerald-400" />
              Renda e Patrimônio
            </CardTitle>
            <CardDescription className="text-xs">
              Base para o planejamento e projeções
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Renda mensal */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Renda Mensal Líquida
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono text-muted-foreground">
                  R$
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={financialData.monthlyIncome > 0 ? financialData.monthlyIncome : ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value.replace(',', '.').replace(/[^\d.]/g, ''));
                    updateFinancialData({ monthlyIncome: isNaN(val) ? 0 : val });
                  }}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-muted border border-border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                Valor líquido que você recebe por mês (já descontado impostos)
              </p>
            </div>

            <Separator />

            {/* Patrimônio inicial */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Patrimônio Atual
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono text-muted-foreground">
                  R$
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={financialData.initialPatrimony > 0 ? financialData.initialPatrimony : ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value.replace(',', '.').replace(/[^\d.]/g, ''));
                    updateFinancialData({ initialPatrimony: isNaN(val) ? 0 : val });
                  }}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-muted border border-border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                Total que você já tem investido ou guardado hoje
              </p>
            </div>

            <Separator />

            {/* Duração da projeção */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Horizonte de Projeção
              </label>
              <div className="relative">
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="12"
                  min={1}
                  max={600}
                  value={financialData.durationMonths || ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    updateFinancialData({ durationMonths: isNaN(val) ? 12 : Math.max(1, val) });
                  }}
                  className="w-full pr-16 pl-3 py-2.5 rounded-xl bg-muted border border-border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  meses
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Por quantos meses projetar a evolução do patrimônio
              </p>
            </div>

            {/* Preview rápido */}
            {financialData.monthlyIncome > 0 && (
              <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                <p className="text-[10px] font-semibold text-emerald-400 mb-1.5">Resumo configurado</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Renda mensal</span>
                    <span className="font-mono font-semibold text-emerald-400">
                      {formatCurrency(financialData.monthlyIncome)}
                    </span>
                  </div>
                  {financialData.initialPatrimony > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Patrimônio atual</span>
                      <span className="font-mono font-semibold">
                        {formatCurrency(financialData.initialPatrimony)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Projeção</span>
                    <span className="font-mono font-semibold">
                      {financialData.durationMonths || 12} meses
                    </span>
                  </div>
                </div>
              </div>
            )}

          </CardContent>
        </Card>
      </motion.div>

      {/* Market Rates */}
      <motion.div variants={itemVariants}>
        <RealisticSettings />
      </motion.div>

      {/* About */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-br from-primary/10 to-blue-500/10 border-primary/20">
          <CardContent className="pt-4">
            <div className="text-center space-y-1">
              <p className="font-semibold">Planejador Financeiro</p>
              <p className="text-xs text-muted-foreground">v2.0 • Dados salvos localmente</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default ConfiguracoesPage;
