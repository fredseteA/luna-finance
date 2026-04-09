import React from 'react';

/**
 * DashboardSkeleton — placeholder animado que espelha o layout real do Dashboard.
 *
 * Usado enquanto mounted=false (Firebase ainda carregando).
 * Elimina o flash de tela vazia e o layout shift que ocorriam com o
 * spinner de texto anterior. Cada bloco imita a forma exata do componente
 * real para que a transição seja imperceptível.
 */
const Pulse = ({ className }) => (
  <div className={`animate-pulse rounded-lg bg-muted/60 ${className}`} />
);

export const DashboardSkeleton = () => (
  <div className="space-y-4 pb-4">
    {/* Saudação */}
    <div className="pt-2 space-y-2">
      <Pulse className="h-7 w-40" />
      <Pulse className="h-4 w-56" />
    </div>

    {/* SummaryCards — grid 2x2 */}
    <div className="grid grid-cols-2 gap-3">
      {[...Array(4)].map((_, i) => (
        <Pulse key={i} className="h-24 rounded-xl" />
      ))}
    </div>

    {/* Tabs de gráficos */}
    <div className="space-y-3">
      <Pulse className="h-12 w-full rounded-xl" />
      <Pulse className="h-52 w-full rounded-xl" />
    </div>

    {/* Card Resumo */}
    <div className="rounded-xl border border-border/40 p-4 space-y-3">
      <Pulse className="h-5 w-24" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex justify-between items-center py-2 border-b border-border/20 last:border-0">
          <Pulse className="h-4 w-32" />
          <Pulse className="h-4 w-20" />
        </div>
      ))}
    </div>
  </div>
);

export default DashboardSkeleton;