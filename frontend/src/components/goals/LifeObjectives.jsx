import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, Car, Plane, Umbrella, GraduationCap, Heart, 
  Plus, Trash2, Calendar, Target, CheckCircle2, Clock 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { ScrollArea } from '../ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { useFinancial } from '../../contexts/FinancialContext';
import { formatCurrency } from '../../services/financialEngine';
import { cn } from '../../lib/utils';

const OBJECTIVE_TYPES = [
  { value: 'house', label: 'Casa Própria', icon: Home, color: 'bg-blue-500' },
  { value: 'car', label: 'Carro', icon: Car, color: 'bg-purple-500' },
  { value: 'travel', label: 'Viagem', icon: Plane, color: 'bg-amber-500' },
  { value: 'retirement', label: 'Aposentadoria', icon: Umbrella, color: 'bg-emerald-500' },
  { value: 'education', label: 'Educação', icon: GraduationCap, color: 'bg-rose-500' },
  { value: 'other', label: 'Outro', icon: Heart, color: 'bg-cyan-500' },
];

const ObjectiveCard = ({ objective, onDelete, currency, projection }) => {
  const typeConfig = OBJECTIVE_TYPES.find(t => t.value === objective.type) || OBJECTIVE_TYPES[5];
  const Icon = typeConfig.icon;
  
  // Calculate progress and time to reach
  const currentPatrimony = projection?.[0]?.patrimony || 0;
  const progress = Math.min(100, (currentPatrimony / objective.targetAmount) * 100);
  
  // Calculate months to reach
  const lastMonth = projection?.[projection.length - 1];
  let monthsToReach = null;
  if (projection && projection.length > 0) {
    for (let i = 0; i < projection.length; i++) {
      if (projection[i].patrimony >= objective.targetAmount) {
        monthsToReach = i + 1;
        break;
      }
    }
  }
  
  const isReachableInPeriod = monthsToReach !== null;
  const deadlineDate = objective.deadline ? new Date(objective.deadline) : null;
  const willMeetDeadline = deadlineDate && monthsToReach 
    ? new Date().setMonth(new Date().getMonth() + monthsToReach) <= deadlineDate.getTime()
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="p-4 rounded-lg bg-muted/50 border border-border/40 hover:border-border/80 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', typeConfig.color)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h4 className="font-medium text-sm">{objective.name}</h4>
            <p className="text-xs text-muted-foreground">{typeConfig.label}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(objective.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Target and Progress */}
      <div className="space-y-2 mb-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Meta</span>
          <span className="font-mono font-medium">{formatCurrency(objective.targetAmount, currency)}</span>
        </div>
        <Progress value={progress} className="h-1.5" />
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">{progress.toFixed(0)}% alcançado</span>
          <span className="text-muted-foreground">
            Faltam {formatCurrency(Math.max(0, objective.targetAmount - currentPatrimony), currency)}
          </span>
        </div>
      </div>

      {/* Time Estimate */}
      <div className="flex items-center gap-2 flex-wrap">
        {isReachableInPeriod ? (
          <Badge variant="secondary" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {monthsToReach} meses
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            Fora do período
          </Badge>
        )}
        
        {deadlineDate && (
          <Badge 
            variant={willMeetDeadline ? 'default' : 'destructive'} 
            className="text-xs"
          >
            {willMeetDeadline ? (
              <CheckCircle2 className="h-3 w-3 mr-1" />
            ) : (
              <Clock className="h-3 w-3 mr-1" />
            )}
            até {deadlineDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
          </Badge>
        )}
      </div>
    </motion.div>
  );
};

export const LifeObjectives = () => {
  const { lifeObjectives, addLifeObjective, removeLifeObjective, currency, projection } = useFinancial();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newObjective, setNewObjective] = useState({
    name: '',
    type: 'other',
    targetAmount: '',
    deadline: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newObjective.name || !newObjective.targetAmount) return;

    addLifeObjective({
      name: newObjective.name,
      type: newObjective.type,
      targetAmount: parseFloat(newObjective.targetAmount),
      deadline: newObjective.deadline || null,
    });

    setNewObjective({ name: '', type: 'other', targetAmount: '', deadline: '' });
    setIsDialogOpen(false);
  };

  const currencySymbol = currency === 'BRL' ? 'R$' : currency === 'USD' ? '$' : '€';

  return (
    <Card className="card-grid-border" data-testid="life-objectives">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Objetivos de Vida
            </CardTitle>
            <CardDescription className="mt-1">
              Planeje suas grandes conquistas
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5" data-testid="add-objective-button">
                <Plus className="h-3.5 w-3.5" />
                Novo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Objetivo</DialogTitle>
                <DialogDescription>
                  Defina uma meta de vida para acompanhar seu progresso
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="obj-name">Nome do Objetivo</Label>
                  <Input
                    id="obj-name"
                    value={newObjective.name}
                    onChange={(e) => setNewObjective(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Apartamento próprio"
                    data-testid="objective-name-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={newObjective.type}
                    onValueChange={(value) => setNewObjective(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger data-testid="objective-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OBJECTIVE_TYPES.map(type => {
                        const Icon = type.icon;
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <span className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {type.label}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="obj-amount">Valor Necessário</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      {currencySymbol}
                    </span>
                    <Input
                      id="obj-amount"
                      type="number"
                      value={newObjective.targetAmount}
                      onChange={(e) => setNewObjective(prev => ({ ...prev, targetAmount: e.target.value }))}
                      className="pl-10 font-mono"
                      placeholder="0,00"
                      data-testid="objective-amount-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="obj-deadline">Prazo (opcional)</Label>
                  <Input
                    id="obj-deadline"
                    type="month"
                    value={newObjective.deadline}
                    onChange={(e) => setNewObjective(prev => ({ ...prev, deadline: e.target.value }))}
                    data-testid="objective-deadline-input"
                  />
                </div>

                <DialogFooter>
                  <Button type="submit" data-testid="save-objective-button">
                    Salvar Objetivo
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {lifeObjectives.length === 0 ? (
          <div className="text-center py-8">
            <Target className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Nenhum objetivo cadastrado</p>
            <p className="text-xs mt-1">Clique em "Novo" para adicionar</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-3 pr-3">
              <AnimatePresence mode="popLayout">
                {lifeObjectives.map(objective => (
                  <ObjectiveCard
                    key={objective.id}
                    objective={objective}
                    onDelete={removeLifeObjective}
                    currency={currency}
                    projection={projection}
                  />
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default LifeObjectives;
