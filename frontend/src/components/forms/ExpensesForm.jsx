import React, { useState } from 'react';
import { Plus, Trash2, CalendarOff, Receipt, ShoppingBag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
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
import { ScrollArea } from '../ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useFinancial } from '../../contexts/FinancialContext';
import { formatCurrency, CURRENCIES } from '../../services/financialEngine';

const EXPENSE_CATEGORIES = [
  { value: 'moradia', label: 'Moradia', icon: '🏠' },
  { value: 'transporte', label: 'Transporte', icon: '🚗' },
  { value: 'alimentacao', label: 'Alimentação', icon: '🍽️' },
  { value: 'saude', label: 'Saúde', icon: '💊' },
  { value: 'educacao', label: 'Educação', icon: '📚' },
  { value: 'lazer', label: 'Lazer', icon: '🎮' },
  { value: 'assinatura', label: 'Assinaturas', icon: '📱' },
  { value: 'outros', label: 'Outros', icon: '📦' },
];

const ExpenseItem = ({ expense, onUpdate, onRemove, currency, isFixed }) => {
  const currencySymbol = CURRENCIES[currency]?.symbol || 'R$';
  const category = EXPENSE_CATEGORIES.find(c => c.value === expense.category);

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group">
      <div className="flex items-center gap-3">
        <span className="text-lg">{category?.icon || '📦'}</span>
        <div>
          <p className="font-medium text-sm">{expense.name}</p>
          <p className="text-xs text-muted-foreground">
            {category?.label || 'Outros'}
            {isFixed && expense.endDate && (
              <span className="ml-2 text-warning">
                até {new Date(expense.endDate).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
              </span>
            )}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm text-rose-400">
          -{formatCurrency(expense.amount, currency)}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onRemove(expense.id)}
          data-testid={`remove-expense-${expense.id}`}
        >
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
        </Button>
      </div>
    </div>
  );
};

const AddExpenseDialog = ({ type, onAdd, currency }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('outros');
  const [endDate, setEndDate] = useState('');
  const [limit, setLimit] = useState('');

  const currencySymbol = CURRENCIES[currency]?.symbol || 'R$';
  const isFixed = type === 'fixed';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !amount) return;

    const expense = {
      name,
      amount: parseFloat(amount),
      category,
      ...(isFixed && endDate && { endDate }),
      ...(!isFixed && limit && { limit: parseFloat(limit) }),
    };

    onAdd(expense);
    setName('');
    setAmount('');
    setCategory('outros');
    setEndDate('');
    setLimit('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-1.5"
          data-testid={`add-${type}-expense-button`}
        >
          <Plus className="h-3.5 w-3.5" />
          Adicionar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isFixed ? 'Novo Custo Fixo' : 'Novo Gasto Variável'}
          </DialogTitle>
          <DialogDescription>
            {isFixed 
              ? 'Custos fixos são despesas recorrentes mensais.' 
              : 'Gastos variáveis são despesas que podem mudar mês a mês.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="expense-name">Nome</Label>
            <Input
              id="expense-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Aluguel, Netflix..."
              data-testid="expense-name-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense-amount">Valor Mensal</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                {currencySymbol}
              </span>
              <Input
                id="expense-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10 font-mono"
                placeholder="0,00"
                data-testid="expense-amount-input"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger data-testid="expense-category-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <span className="flex items-center gap-2">
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isFixed && (
            <div className="space-y-2">
              <Label htmlFor="expense-end-date" className="flex items-center gap-1.5">
                <CalendarOff className="h-3.5 w-3.5" />
                Data de Término (opcional)
              </Label>
              <Input
                id="expense-end-date"
                type="month"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                data-testid="expense-end-date-input"
              />
              <p className="text-xs text-muted-foreground">
                Deixe em branco para custos sem prazo definido
              </p>
            </div>
          )}

          {!isFixed && (
            <div className="space-y-2">
              <Label htmlFor="expense-limit">Limite Mensal (opcional)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  {currencySymbol}
                </span>
                <Input
                  id="expense-limit"
                  type="number"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  className="pl-10 font-mono"
                  placeholder="0,00"
                  data-testid="expense-limit-input"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="submit" data-testid="save-expense-button">
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const ExpensesForm = () => {
  const {
    financialData,
    currency,
    addFixedCost,
    updateFixedCost,
    removeFixedCost,
    addVariableExpense,
    updateVariableExpense,
    removeVariableExpense,
  } = useFinancial();

  const totalFixed = financialData.fixedCosts?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
  const totalVariable = financialData.variableExpenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;

  return (
    <Card className="card-grid-border" data-testid="expenses-form">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Receipt className="h-5 w-5 text-rose-400" />
          Despesas
        </CardTitle>
        <CardDescription>
          Gerencie seus custos fixos e gastos variáveis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="fixed" className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-4">
            <TabsTrigger value="fixed" className="gap-1.5" data-testid="fixed-costs-tab">
              <Receipt className="h-3.5 w-3.5" />
              Fixos
              <Badge variant="secondary" className="ml-1 font-mono text-xs">
                {formatCurrency(totalFixed, currency)}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="variable" className="gap-1.5" data-testid="variable-expenses-tab">
              <ShoppingBag className="h-3.5 w-3.5" />
              Variáveis
              <Badge variant="secondary" className="ml-1 font-mono text-xs">
                {formatCurrency(totalVariable, currency)}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fixed" className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {financialData.fixedCosts?.length || 0} custo(s) fixo(s)
              </p>
              <AddExpenseDialog 
                type="fixed" 
                onAdd={addFixedCost} 
                currency={currency} 
              />
            </div>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2 pr-3">
                {financialData.fixedCosts?.length > 0 ? (
                  financialData.fixedCosts.map(cost => (
                    <ExpenseItem
                      key={cost.id}
                      expense={cost}
                      onUpdate={updateFixedCost}
                      onRemove={removeFixedCost}
                      currency={currency}
                      isFixed
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Nenhum custo fixo adicionado
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="variable" className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {financialData.variableExpenses?.length || 0} gasto(s) variável(is)
              </p>
              <AddExpenseDialog 
                type="variable" 
                onAdd={addVariableExpense} 
                currency={currency} 
              />
            </div>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2 pr-3">
                {financialData.variableExpenses?.length > 0 ? (
                  financialData.variableExpenses.map(expense => (
                    <ExpenseItem
                      key={expense.id}
                      expense={expense}
                      onUpdate={updateVariableExpense}
                      onRemove={removeVariableExpense}
                      currency={currency}
                      isFixed={false}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Nenhum gasto variável adicionado
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ExpensesForm;
