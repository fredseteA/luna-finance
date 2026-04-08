import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { GitCompare, Eye, EyeOff, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';
import { useFinancial } from '../../contexts/FinancialContext';
import { formatCurrency, CURRENCIES, projectPatrimonyEvolution } from '../../services/financialEngine';

const SCENARIO_COLORS = [
  '#34D399', // emerald
  '#60A5FA', // blue
  '#F472B6', // pink
  '#FBBF24', // amber
  '#A78BFA', // purple
  '#F87171', // red
];

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
          <span className="text-muted-foreground truncate max-w-[120px]">{entry.name}:</span>
          <span className="font-mono font-medium">
            {formatCurrency(entry.value, currency)}
          </span>
        </div>
      ))}
    </div>
  );
};

export const ScenarioComparison = () => {
  const { scenarios, currency, settings, financialData, isDark } = useFinancial();
  const [selectedScenarios, setSelectedScenarios] = useState([]);
  const [includeCurrentConfig, setIncludeCurrentConfig] = useState(true);

  const toggleScenario = (scenarioId) => {
    setSelectedScenarios(prev => 
      prev.includes(scenarioId) 
        ? prev.filter(id => id !== scenarioId)
        : [...prev, scenarioId]
    );
  };

  // Generate projections for comparison
  const generateComparisons = () => {
    const comparisons = [];
    
    // Add current configuration if selected
    if (includeCurrentConfig && financialData.monthlyIncome > 0) {
      const currentProjection = projectPatrimonyEvolution({
        startDate: financialData.startDate,
        durationMonths: financialData.durationMonths,
        initialPatrimony: financialData.initialPatrimony,
        monthlyIncome: financialData.monthlyIncome,
        fixedCosts: financialData.fixedCosts,
        variableExpenses: financialData.variableExpenses,
        allocation: financialData.allocation,
        rates: settings.rates,
        reinvestFii: financialData.reinvestFii,
        surplusAllocation: financialData.surplusAllocation,
      });
      comparisons.push({
        id: 'current',
        name: 'Configuração Atual',
        projection: currentProjection,
        color: SCENARIO_COLORS[0],
      });
    }

    // Add selected saved scenarios
    selectedScenarios.forEach((scenarioId, index) => {
      const scenario = scenarios.find(s => s.id === scenarioId);
      if (scenario) {
        const projection = projectPatrimonyEvolution({
          ...scenario.config,
          rates: scenario.config.rates || settings.rates,
        });
        comparisons.push({
          id: scenario.id,
          name: scenario.name,
          projection,
          color: SCENARIO_COLORS[(index + 1) % SCENARIO_COLORS.length],
        });
      }
    });

    return comparisons;
  };

  const comparisons = generateComparisons();

  // Merge data for chart
  const chartData = comparisons.length > 0 
    ? comparisons[0].projection.map((month, idx) => {
        const dataPoint = { name: month.monthLabel };
        comparisons.forEach(comp => {
          dataPoint[comp.name] = comp.projection[idx]?.patrimony || 0;
        });
        return dataPoint;
      })
    : [];

  // Calculate summary stats
  const summaryStats = comparisons.map(comp => {
    const lastMonth = comp.projection[comp.projection.length - 1];
    const firstMonth = comp.projection[0];
    return {
      name: comp.name,
      color: comp.color,
      finalPatrimony: lastMonth?.patrimony || 0,
      totalGrowth: lastMonth ? lastMonth.patrimony - (comp.projection[0]?.patrimony - comp.projection[0]?.surplus) : 0,
      avgMonthlyReturn: comp.projection.reduce((sum, m) => sum + m.investmentReturns, 0) / comp.projection.length,
    };
  });

  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const textColor = isDark ? '#A1A1AA' : '#6B7280';
  const currencySymbol = CURRENCIES[currency]?.symbol || 'R$';

  return (
    <Card className="card-grid-border" data-testid="scenario-comparison">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <GitCompare className="h-5 w-5 text-primary" />
          Comparação de Cenários
        </CardTitle>
        <CardDescription>
          Compare diferentes cenários lado a lado
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Scenario Selection */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="current-config"
              checked={includeCurrentConfig}
              onCheckedChange={setIncludeCurrentConfig}
              data-testid="include-current-checkbox"
            />
            <label htmlFor="current-config" className="text-sm font-medium cursor-pointer">
              Incluir configuração atual
            </label>
          </div>
          
          {scenarios.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Cenários salvos:</p>
              <ScrollArea className="h-[100px]">
                <div className="space-y-2 pr-3">
                  {scenarios.map((scenario, idx) => (
                    <div key={scenario.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`scenario-${scenario.id}`}
                        checked={selectedScenarios.includes(scenario.id)}
                        onCheckedChange={() => toggleScenario(scenario.id)}
                      />
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: SCENARIO_COLORS[(idx + 1) % SCENARIO_COLORS.length] }}
                      />
                      <label 
                        htmlFor={`scenario-${scenario.id}`} 
                        className="text-sm cursor-pointer truncate"
                      >
                        {scenario.name}
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Chart */}
        {comparisons.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                  formatter={(value) => <span className="text-xs">{value}</span>}
                />
                {comparisons.map((comp) => (
                  <Line
                    key={comp.id}
                    type="monotone"
                    dataKey={comp.name}
                    stroke={comp.color}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {summaryStats.map((stat) => (
                <div 
                  key={stat.name}
                  className="p-3 rounded-lg bg-muted/50 border-l-4"
                  style={{ borderLeftColor: stat.color }}
                >
                  <p className="text-xs text-muted-foreground truncate">{stat.name}</p>
                  <p className="text-lg font-mono font-medium">
                    {formatCurrency(stat.finalPatrimony, currency)}
                  </p>
                  <p className="text-xs text-emerald-400">
                    +{formatCurrency(stat.totalGrowth, currency)} total
                  </p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <GitCompare className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Selecione cenários para comparar</p>
            <p className="text-xs mt-1">Inclua a configuração atual ou selecione cenários salvos</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ScenarioComparison;
