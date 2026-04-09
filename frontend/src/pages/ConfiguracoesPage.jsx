import React from 'react';
import { motion } from 'framer-motion';
import { Settings, Percent, DollarSign, Palette, RotateCcw } from 'lucide-react';
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
    resetAll 
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
