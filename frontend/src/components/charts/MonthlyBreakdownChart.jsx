import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useFinancial } from '../../contexts/FinancialContext';
import { formatCurrency, CURRENCIES } from '../../services/financialEngine';

const CustomTooltip = ({ active, payload, label, currency }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="backdrop-blur-xl bg-card/90 border border-border/60 rounded-lg p-3 shadow-lg">
      <p className="text-sm font-medium mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className={`font-mono font-medium ${
            entry.dataKey === 'despesas' ? 'text-rose-400' : ''
          }`}>
            {entry.dataKey === 'despesas' ? '-' : ''}
            {formatCurrency(Math.abs(entry.value), currency)}
          </span>
        </div>
      ))}
    </div>
  );
};

export const MonthlyBreakdownChart = () => {
  const { projection, currency, isDark } = useFinancial();

  if (projection.length === 0) {
    return (
      <Card className="card-grid-border h-full" data-testid="monthly-breakdown-chart">
        <CardHeader>
          <CardTitle className="text-lg">Fluxo Mensal</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[280px]">
          <p className="text-muted-foreground text-sm">
            Adicione dados para visualizar o fluxo
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = projection.map(month => ({
    name: month.monthLabel,
    receita: month.income,
    despesas: -(month.fixedCosts + month.variableExpenses),
    sobra: month.surplus,
  }));

  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const textColor = isDark ? '#A1A1AA' : '#6B7280';
  const currencySymbol = CURRENCIES[currency]?.symbol || 'R$';

  return (
    <Card className="card-grid-border h-full" data-testid="monthly-breakdown-chart">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Fluxo Mensal</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis 
              dataKey="name" 
              tick={{ fill: textColor, fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: gridColor }}
            />
            <YAxis 
              tick={{ fill: textColor, fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${currencySymbol}${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip currency={currency} />} />
            <Legend 
              wrapperStyle={{ paddingTop: '10px' }}
              formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
            />
            <ReferenceLine y={0} stroke={gridColor} />
            <Bar dataKey="receita" name="Receita" fill="#34D399" radius={[4, 4, 0, 0]} />
            <Bar dataKey="despesas" name="Despesas" fill="#F43F5E" radius={[4, 4, 0, 0]} />
            <Bar dataKey="sobra" name="Sobra" fill="#60A5FA" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default MonthlyBreakdownChart;
