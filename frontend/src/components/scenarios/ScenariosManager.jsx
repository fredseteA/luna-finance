import React, { useState } from 'react';
import { Save, FolderOpen, Trash2, Calendar, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';
import { useFinancial } from '../../contexts/FinancialContext';
import { formatCurrency } from '../../services/financialEngine';

export const ScenariosManager = () => {
  const { 
    scenarios, 
    saveScenario, 
    loadScenario, 
    deleteScenario,
    currency 
  } = useFinancial();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [scenarioName, setScenarioName] = useState('');

  const handleSave = () => {
    if (scenarioName.trim()) {
      saveScenario(scenarioName.trim());
      setScenarioName('');
      setIsDialogOpen(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Card className="card-grid-border" data-testid="scenarios-manager">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-primary" />
              Cenários Salvos
            </CardTitle>
            <CardDescription className="mt-1">
              Salve e compare diferentes cenários financeiros
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5" data-testid="save-scenario-button">
                <Plus className="h-3.5 w-3.5" />
                Salvar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Salvar Cenário</DialogTitle>
                <DialogDescription>
                  Dê um nome para este cenário para poder comparar com outros no futuro.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="scenario-name">Nome do Cenário</Label>
                  <Input
                    id="scenario-name"
                    value={scenarioName}
                    onChange={(e) => setScenarioName(e.target.value)}
                    placeholder="Ex: Cenário Conservador"
                    data-testid="scenario-name-input"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSave} data-testid="confirm-save-scenario">
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {scenarios.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FolderOpen className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Nenhum cenário salvo</p>
            <p className="text-xs mt-1">Clique em "Salvar" para criar um</p>
          </div>
        ) : (
          <ScrollArea className="h-[200px]">
            <div className="space-y-2 pr-3">
              {scenarios.map((scenario) => (
                <div
                  key={scenario.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{scenario.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px]">
                        <Calendar className="h-2.5 w-2.5 mr-1" />
                        {formatDate(scenario.createdAt)}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">
                        {formatCurrency(scenario.config.initialPatrimony || 0, currency)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => loadScenario(scenario.id)}
                      className="h-8"
                      data-testid={`load-scenario-${scenario.id}`}
                    >
                      Carregar
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          data-testid={`delete-scenario-${scenario.id}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir cenário?</AlertDialogTitle>
                          <AlertDialogDescription>
                            O cenário "{scenario.name}" será excluído permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteScenario(scenario.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default ScenariosManager;
