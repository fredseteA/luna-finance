import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useFinancial } from '../../contexts/FinancialContext';
import { formatCurrency, formatPercentage, CURRENCIES } from '../../services/financialEngine';

const COLORS = {
  cdi: '#3B82F6',
  selic: '#34D399',
  cdb: '#A855F7',
  fii: '#FBBF24',
};

const LABELS = {
  cdi: 'CDI',
  selic: 'Tesouro Selic',
  cdb: 'CDB',
  fii: 'FII',
};

const CustomTooltip = ({ active, payload, currency }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="backdrop-blur-xl bg-card/90 border border-border/60 rounded-lg p-3 shadow-lg">
      <div className="flex items-center gap-2 mb-1">
        <div 
          className="w-3 h-3 rounded-full" 
          style={{ backgroundColor: data.color }}
        />
        <span className="font-medium text-sm">{data.name}</span>
      </div>
      <p className="text-sm">
        <span className="text-muted-foreground">Valor: </span>
        <span className="font-mono">{formatCurrency(data.value, currency)}</span>
      </p>
      <p className="text-sm">
        <span className="text-muted-foreground">Alocação: </span>
        <span className="font-mono">{formatPercentage(data.percentage)}</span>
      </p>
    </div>
  );
};

const renderCustomLegend = ({ payload }) => {
  return (
    <div className="flex flex-wrap justify-center gap-3 mt-4">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-1.5">
          <div 
            className="w-2.5 h-2.5 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-muted-foreground">{entry.value}</span>
          <span className="text-xs font-mono">
            ({formatPercentage(entry.payload.percentage, 0)})
          </span>
        </div>
      ))}
    </div>
  );
};

export const PortfolioChart = () => {
  const { projection, currency, financialData } = useFinancial();

  const lastMonth = projection[projection.length - 1];
  const allocation = financialData.allocation || { cdi: 25, selic: 25, cdb: 25, fii: 25 };

  // Use projected breakdown if available, otherwise use allocation percentages
  const chartData = lastMonth 
    ? Object.entries(lastMonth.breakdown)
        .filter(([_, value]) => value > 0)
        .map(([key, value]) => ({
          name: LABELS[key],
          value,
          percentage: (value / lastMonth.patrimony) * 100,
          color: COLORS[key],
        }))
    : Object.entries(allocation)
        .filter(([_, value]) => value > 0)
        .map(([key, value]) => ({
          name: LABELS[key],
          value,
          percentage: value,
          color: COLORS[key],
        }));

  if (chartData.length === 0) {
    return (
      <Card className="card-grid-border h-full" data-testid="portfolio-chart">
        <CardHeader>
          <CardTitle className="text-lg">Composição da Carteira</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[280px]">
          <p className="text-muted-foreground text-sm">
            Configure sua alocação para visualizar
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-grid-border h-full" data-testid="portfolio-chart">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Composição da Carteira</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="45%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip currency={currency} />} />
            <Legend content={renderCustomLegend} />
          </PieChart>
        </ResponsiveContainer>
        
        {lastMonth && (
          <div className="text-center mt-2 pt-3 border-t border-border/40">
            <p className="text-xs text-muted-foreground">Patrimônio Projetado</p>
            <p className="text-xl font-mono font-medium text-primary">
              {formatCurrency(lastMonth.patrimony, currency)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PortfolioChart;
