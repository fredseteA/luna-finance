import React from 'react';

/**
 * InvestimentosSkeleton — placeholder animado que espelha o layout real.
 *
 * Substitui o spinner genérico enquanto o Firebase carrega.
 * Imita: grid de KPIs 2x2, gráfico de pizza, card de formulário com sliders.
 */
const Pulse = ({ className }) => (
  <div className={`animate-pulse rounded-lg bg-white/10 ${className}`} />
);

export const InvestimentosSkeleton = () => (
  <div className="space-y-4 pb-4">
    {/* Header */}
    <div className="pt-2 space-y-2">
      <Pulse className="h-7 w-48" />
      <Pulse className="h-4 w-32" />
    </div>

    {/* KPIs — grid 2x2 */}
    <div className="grid grid-cols-2 gap-2">
      {[...Array(4)].map((_, i) => (
        <Pulse key={i} className="h-20 rounded-xl" />
      ))}
    </div>

    {/* Gráfico de pizza */}
    <Pulse className="h-52 rounded-xl" />

    {/* Card InvestmentForm */}
    <div className="rounded-xl border border-border/40 p-4 space-y-4">
      <Pulse className="h-5 w-36" />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="flex justify-between">
            <Pulse className="h-4 w-20" />
            <Pulse className="h-4 w-10" />
          </div>
          <Pulse className="h-4 w-full rounded-full" />
        </div>
      ))}
    </div>

    {/* Card SurplusAllocation */}
    <Pulse className="h-48 rounded-xl" />
  </div>
);

export default InvestimentosSkeleton;