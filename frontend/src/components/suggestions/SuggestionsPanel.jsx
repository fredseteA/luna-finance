import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lightbulb, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  ChevronRight 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { useFinancial } from '../../contexts/FinancialContext';
import { cn } from '../../lib/utils';

const getIcon = (type) => {
  switch (type) {
    case 'success': return CheckCircle2;
    case 'warning': return AlertTriangle;
    case 'info': return Info;
    default: return Lightbulb;
  }
};

const getColors = (type) => {
  switch (type) {
    case 'success': return {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      icon: 'text-emerald-400',
      badge: 'bg-emerald-500/20 text-emerald-400',
    };
    case 'warning': return {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      icon: 'text-amber-400',
      badge: 'bg-amber-500/20 text-amber-400',
    };
    case 'info': return {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      icon: 'text-blue-400',
      badge: 'bg-blue-500/20 text-blue-400',
    };
    default: return {
      bg: 'bg-muted',
      border: 'border-border',
      icon: 'text-muted-foreground',
      badge: 'bg-muted text-muted-foreground',
    };
  }
};

const getPriorityLabel = (priority) => {
  switch (priority) {
    case 'high': return 'Alta';
    case 'medium': return 'Média';
    case 'low': return 'Baixa';
    default: return priority;
  }
};

const SuggestionItem = ({ suggestion, index }) => {
  const Icon = getIcon(suggestion.type);
  const colors = getColors(suggestion.type);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        'p-4 rounded-lg border transition-colors',
        colors.bg,
        colors.border,
        'hover:border-opacity-50'
      )}
    >
      <div className="flex gap-3">
        <div className={cn('flex-shrink-0 mt-0.5', colors.icon)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm truncate">{suggestion.title}</h4>
            <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', colors.badge)}>
              {getPriorityLabel(suggestion.priority)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {suggestion.message}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export const SuggestionsPanel = () => {
  const { suggestions = [] } = useFinancial();
  
  // Garantir que suggestions é um array
  const safesuggestions = Array.isArray(suggestions) ? suggestions : [];

  return (
    <Card className="card-glass" data-testid="suggestions-panel">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-400" />
          Sugestões Inteligentes
          {safesuggestions.length > 0 && (
            <Badge variant="secondary" className="ml-auto font-mono">
              {safesuggestions.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {safesuggestions.length === 0 ? (
          <div className="text-center py-8">
            <TrendingUp className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              Adicione dados financeiros para receber sugestões personalizadas
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[280px] pr-3">
            <AnimatePresence>
              <div className="space-y-3">
                {safesuggestions.map((suggestion, index) => (
                  <SuggestionItem 
                    key={`${suggestion.title}-${index}`} 
                    suggestion={suggestion} 
                    index={index}
                  />
                ))}
              </div>
            </AnimatePresence>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default SuggestionsPanel;
