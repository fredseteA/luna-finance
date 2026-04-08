import React from 'react';
import { Percent, Calculator, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { useFinancial } from '../../contexts/FinancialContext';

export const RealisticSettings = () => {
  const { settings, updateSettings } = useFinancial();

  const inflation = settings.inflation || 4.5;
  const taxes = settings.taxes || { enabled: true, fiiExempt: true };

  return (
    <Card className="card-grid-border" data-testid="realistic-settings">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          Simulação Realista
        </CardTitle>
        <CardDescription>
          Configure inflação e impostos para projeções mais precisas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Inflation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Label className="text-sm font-medium">Inflação Anual</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">
                      A inflação reduz o poder de compra do seu dinheiro ao longo do tempo. 
                      Use para calcular o patrimônio real (ajustado pela inflação).
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Badge variant="secondary" className="font-mono text-xs">
              IPCA médio: ~4.5%
            </Badge>
          </div>
          <div className="relative">
            <Input
              type="number"
              value={inflation}
              onChange={(e) => updateSettings({ inflation: parseFloat(e.target.value) || 0 })}
              className="pr-8 font-mono text-sm"
              step="0.5"
              data-testid="inflation-input"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              % a.a.
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            O patrimônio real será calculado descontando a inflação
          </p>
        </div>

        {/* Taxes */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="taxes" className="border-none">
            <AccordionTrigger className="hover:no-underline py-2">
              <div className="flex items-center gap-2 text-sm">
                <Percent className="h-4 w-4" />
                Impostos sobre Investimentos
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 space-y-4">
              {/* Enable taxes */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Calcular Impostos</Label>
                  <p className="text-xs text-muted-foreground">
                    Aplica IR sobre rendimentos de CDI, Selic e CDB
                  </p>
                </div>
                <Switch
                  checked={taxes.enabled}
                  onCheckedChange={(checked) => updateSettings({ 
                    taxes: { ...taxes, enabled: checked } 
                  })}
                  data-testid="taxes-enabled-switch"
                />
              </div>

              {taxes.enabled && (
                <>
                  {/* Tax table info */}
                  <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                    <p className="text-xs font-medium">Tabela Regressiva do IR:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Até 180 dias:</span>
                        <span className="font-mono">22,5%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">181 a 360 dias:</span>
                        <span className="font-mono">20,0%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">361 a 720 dias:</span>
                        <span className="font-mono">17,5%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Acima 720 dias:</span>
                        <span className="font-mono">15,0%</span>
                      </div>
                    </div>
                  </div>

                  {/* FII exemption */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Isenção de FII</Label>
                      <p className="text-xs text-muted-foreground">
                        Dividendos de FII são isentos para pessoa física
                      </p>
                    </div>
                    <Switch
                      checked={taxes.fiiExempt}
                      onCheckedChange={(checked) => updateSettings({ 
                        taxes: { ...taxes, fiiExempt: checked } 
                      })}
                      data-testid="fii-exempt-switch"
                    />
                  </div>
                </>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default RealisticSettings;
