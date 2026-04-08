import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useFinancial } from '../../contexts/FinancialContext';
import { formatCurrency, CURRENCIES } from '../../services/financialEngine';

const CustomTooltip = ({ active, payload, label, currency }) => {
  if (!active || !payload || !payload.length) return null;

  const currencySymbol = CURRENCIES[currency]?.symbol || 'R$';

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
          <span className="font-mono font-medium">
            {formatCurrency(entry.value, currency)}
          </span>
        </div>
      ))}
    </div>
  );
};

export const PatrimonyChart = () => {
  const { projection, currency, isDark } = useFinancial();

  if (projection.length === 0) {
    return (
      <Card className="card-grid-border h-full" data-testid="patrimony-chart">
        <CardHeader>
          <CardTitle className="text-lg">Evolução do Patrimônio</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <div className="text-center">
            <img 
              alt="Empty state"
              className="w-32 h-32 mx-auto mb-4 opacity-60"
            />
            <p className="text-muted-foreground text-sm">
              Configure sua renda e despesas para ver a projeção
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = projection.map(month => ({
    name: month.monthLabel,
    patrimonio: month.patrimony,
    cdi: month.breakdown.cdi,
    selic: month.breakdown.selic,
    cdb: month.breakdown.cdb,
    fii: month.breakdown.fii,
  }));

  const currencySymbol = CURRENCIES[currency]?.symbol || 'R$';
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const textColor = isDark ? '#A1A1AA' : '#6B7280';

  return (
    <Card className="card-grid-border h-full" data-testid="patrimony-chart">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Evolução do Patrimônio</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPatrimonio" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34D399" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#34D399" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis 
              dataKey="name" 
              tick={{ fill: textColor, fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: gridColor }}
            />
            <YAxis 
              tick={{ fill: textColor, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${currencySymbol}${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip currency={currency} />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
            />
            <Area
              type="monotone"
              dataKey="patrimonio"
              name="Patrimônio Total"
              stroke="#34D399"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorPatrimonio)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default PatrimonyChart;
