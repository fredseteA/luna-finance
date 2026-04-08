import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { useFinancial } from '../../contexts/FinancialContext';
import { formatCurrency, CURRENCIES } from '../../services/financialEngine';
import { cn } from '../../lib/utils';

export const MonthlyTable = () => {
  const { projection, currency } = useFinancial();

  if (projection.length === 0) {
    return (
      <Card className="card-grid-border" data-testid="monthly-table">
        <CardHeader>
          <CardTitle className="text-lg">Detalhamento Mensal</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <p className="text-muted-foreground text-sm">
            Configure seus dados para ver o detalhamento
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-grid-border" data-testid="monthly-table">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Detalhamento Mensal</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] w-full">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead className="w-[100px]">Mês</TableHead>
                <TableHead className="text-right">Receita</TableHead>
                <TableHead className="text-right">Custos Fixos</TableHead>
                <TableHead className="text-right">Variáveis</TableHead>
                <TableHead className="text-right">Sobra</TableHead>
                <TableHead className="text-right">Rendimentos</TableHead>
                <TableHead className="text-right">Patrimônio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projection.map((month, index) => (
                <TableRow 
                  key={month.month} 
                  className="hover:bg-muted/50 transition-colors"
                >
                  <TableCell className="font-medium">
                    <Badge variant="outline" className="font-mono text-xs">
                      {month.monthLabel}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-emerald-400">
                    {formatCurrency(month.income, currency)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-rose-400">
                    -{formatCurrency(month.fixedCosts, currency)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-rose-400">
                    -{formatCurrency(month.variableExpenses, currency)}
                  </TableCell>
                  <TableCell className={cn(
                    "text-right font-mono text-sm",
                    month.surplus >= 0 ? "text-emerald-400" : "text-rose-400"
                  )}>
                    {month.surplus >= 0 ? '+' : ''}{formatCurrency(month.surplus, currency)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-blue-400">
                    +{formatCurrency(month.investmentReturns, currency)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-medium">
                    {formatCurrency(month.patrimony, currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default MonthlyTable;
