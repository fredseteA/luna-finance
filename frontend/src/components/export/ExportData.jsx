import React, { useState, useMemo } from 'react';
import {
  Download, FileText, FileSpreadsheet, Loader2,
  SlidersHorizontal, ChevronDown, ChevronUp,
  CheckSquare, Square, Calendar, Tag, CreditCard, LayoutList,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../ui/select';
import { useFinancial } from '../../contexts/FinancialContext';
import { formatCurrency, formatPercentage, CURRENCIES } from '../../services/financialEngine';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (dateStr) => {
  if (!dateStr) return '-';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

const CATEGORY_LABELS = {
  alimentacao: 'Alimentação',
  transporte:  'Transporte',
  saude:       'Saúde',
  lazer:       'Lazer',
  compras:     'Compras',
  educacao:    'Educação',
  contas:      'Contas',
  outros:      'Outros',
};

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS);

const today      = () => new Date().toISOString().slice(0, 10);
const monthStart = () => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10); };
const nMonthsAgo = (n) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  d.setDate(1);
  return d.toISOString().slice(0, 10);
};

const PERIOD_PRESETS = [
  { label: 'Mês atual',      value: 'current_month' },
  { label: 'Últimos 3 meses', value: '3m' },
  { label: 'Últimos 6 meses', value: '6m' },
  { label: 'Último ano',     value: '12m' },
  { label: 'Tudo',           value: 'all' },
  { label: 'Personalizado',  value: 'custom' },
];

const resolvePeriod = (preset, customFrom, customTo) => {
  switch (preset) {
    case 'current_month': return { from: monthStart(), to: today() };
    case '3m':            return { from: nMonthsAgo(3), to: today() };
    case '6m':            return { from: nMonthsAgo(6), to: today() };
    case '12m':           return { from: nMonthsAgo(12), to: today() };
    case 'custom':        return { from: customFrom, to: customTo };
    default:              return { from: null, to: null }; // all
  }
};

// ─── Sub-componentes de filtro ────────────────────────────────────────────────

const SectionToggle = ({ icon: Icon, label, checked, onChange }) => (
  <button
    onClick={() => onChange(!checked)}
    className={cn(
      'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all',
      checked
        ? 'bg-primary/10 border-primary/40 text-primary'
        : 'bg-muted/40 border-border/40 text-muted-foreground hover:text-foreground'
    )}
  >
    <Icon className="h-3.5 w-3.5" />
    {label}
  </button>
);

const CheckItem = ({ label, checked, onChange, color }) => (
  <button
    onClick={() => onChange(!checked)}
    className="flex items-center gap-2 text-xs text-left transition-colors hover:text-foreground text-muted-foreground"
  >
    {checked
      ? <CheckSquare className="h-3.5 w-3.5 text-primary shrink-0" />
      : <Square       className="h-3.5 w-3.5 shrink-0" />
    }
    {color && <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />}
    <span className={checked ? 'text-foreground' : ''}>{label}</span>
  </button>
);

// ─── ExportData ───────────────────────────────────────────────────────────────

export const ExportData = () => {
  const {
    projection, financialData, settings, currency, summary,
    scoreBreakdown, transactions, currentMonthTransactions,
    paymentSources, spentBySourceThisMonth,
  } = useFinancial();

  const [exportFormat, setExportFormat] = useState('csv');
  const [isExporting,  setIsExporting]  = useState(false);
  const [filtersOpen,  setFiltersOpen]  = useState(false);

  // ── Filtros de período ──────────────────────────────────────────────────────
  const [periodPreset, setPeriodPreset] = useState('all');
  const [customFrom,   setCustomFrom]   = useState(monthStart());
  const [customTo,     setCustomTo]     = useState(today());

  // ── Seções a incluir ────────────────────────────────────────────────────────
  const [sections, setSections] = useState({
    projection:   true,
    transactions: true,
    sources:      true,
    summary:      true,
  });

  // ── Categorias selecionadas ─────────────────────────────────────────────────
  const [selectedCategories, setSelectedCategories] = useState(new Set(ALL_CATEGORIES));

  // ── Fontes selecionadas ─────────────────────────────────────────────────────
  const [selectedSources, setSelectedSources] = useState(
    () => new Set(paymentSources.map(s => s.id).concat(['__none__']))
  );

  // ── Computed: transações filtradas ─────────────────────────────────────────
  const { from, to } = resolvePeriod(periodPreset, customFrom, customTo);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (from && t.date < from) return false;
      if (to   && t.date > to)   return false;
      const cat = t.category || 'outros';
      if (!selectedCategories.has(cat)) return false;
      const sid = t.sourceId || '__none__';
      if (!selectedSources.has(sid)) return false;
      return true;
    });
  }, [transactions, from, to, selectedCategories, selectedSources]);

  const currencySymbol = CURRENCIES[currency]?.symbol || 'R$';

  // ── Helpers de toggle ──────────────────────────────────────────────────────

  const toggleSection = (key) =>
    setSections(prev => ({ ...prev, [key]: !prev[key] }));

  const toggleCategory = (id, val) =>
    setSelectedCategories(prev => {
      const next = new Set(prev);
      val ? next.add(id) : next.delete(id);
      return next;
    });

  const toggleSource = (id, val) =>
    setSelectedSources(prev => {
      const next = new Set(prev);
      val ? next.add(id) : next.delete(id);
      return next;
    });

  const selectAllCategories = () => setSelectedCategories(new Set(ALL_CATEGORIES));
  const clearAllCategories  = () => setSelectedCategories(new Set());
  const selectAllSources    = () => setSelectedSources(new Set(paymentSources.map(s => s.id).concat(['__none__'])));
  const clearAllSources     = () => setSelectedSources(new Set());
  const selectAll           = () => setSections({ projection: true, transactions: true, sources: true, summary: true });

  // ── CSV ────────────────────────────────────────────────────────────────────

  const generateCSV = () => {
    const csvSections = [];

    if (sections.projection && projection.length > 0) {
      const headers = [
        'Mês', 'Data',
        `Receita (${currencySymbol})`, `Custos Fixos (${currencySymbol})`,
        `Gastos Variáveis (${currencySymbol})`, `Sobra (${currencySymbol})`,
        `Rendimentos Líquidos (${currencySymbol})`, `Patrimônio Nominal (${currencySymbol})`,
        `Patrimônio Real (${currencySymbol})`,
      ];
      const rows = projection.map(m => [
        m.month, m.monthLabel,
        m.income.toFixed(2), m.fixedCosts.toFixed(2),
        m.variableExpenses.toFixed(2), m.surplus.toFixed(2),
        m.investmentReturns.toFixed(2), m.patrimony.toFixed(2),
        (m.patrimonyReal || m.patrimony).toFixed(2),
      ]);
      csvSections.push('PROJEÇÃO MENSAL', headers.join(','), ...rows.map(r => r.join(',')));
    }

    if (sections.sources && paymentSources.length > 0) {
      const headers = [
        'Nome', 'Tipo', 'Titular', 'Nome do titular',
        'Inclui análises', `Limite/mês (${currencySymbol})`, `Gasto atual (${currencySymbol})`,
      ];
      const rows = paymentSources.map(s => [
        `"${s.name}"`, s.type,
        s.owner === 'self' ? 'Própria' : 'Terceiro',
        s.owner === 'third_party' ? `"${s.ownerName || ''}"` : '-',
        s.includeInProjection ? 'Sim' : 'Não',
        s.monthlyLimit ? s.monthlyLimit.toFixed(2) : '-',
        (spentBySourceThisMonth.get(s.id) || 0).toFixed(2),
      ]);
      csvSections.push('', 'FONTES DE PAGAMENTO', headers.join(','), ...rows.map(r => r.join(',')));
    }

    if (sections.transactions && filteredTransactions.length > 0) {
      // Adiciona metadado de filtro no topo
      const filterInfo = [
        `# Filtros aplicados:`,
        `# Período: ${from ? `${fmtDate(from)} a ${fmtDate(to)}` : 'Todos'}`,
        `# Categorias: ${selectedCategories.size === ALL_CATEGORIES.length ? 'Todas' : [...selectedCategories].map(c => CATEGORY_LABELS[c] || c).join(', ')}`,
        `# Fontes: ${selectedSources.size === paymentSources.length + 1 ? 'Todas' : [...selectedSources].map(id => id === '__none__' ? 'Sem fonte' : (paymentSources.find(s => s.id === id)?.name || id)).join(', ')}`,
      ];

      const headers = [
        'Data', 'Descrição', 'Categoria',
        `Valor (${currencySymbol})`, 'Fonte', 'Titular', 'Inclui análises',
      ];
      const sorted = [...filteredTransactions].sort((a, b) =>
        (b.date || '').localeCompare(a.date || '')
      );
      const rows = sorted.map(t => {
        const source = paymentSources.find(s => s.id === t.sourceId);
        return [
          fmtDate(t.date),
          `"${t.description || ''}"`,
          CATEGORY_LABELS[t.category] || t.category || '-',
          (t.amount || 0).toFixed(2),
          source ? `"${source.name}"` : 'Sem fonte',
          source?.owner === 'third_party' ? `"${source.ownerName || ''}"` : '-',
          source ? (source.includeInProjection ? 'Sim' : 'Não') : 'Sim',
        ];
      });

      const total = filteredTransactions.reduce((s, t) => s + (t.amount || 0), 0);
      csvSections.push(
        '', 'LANÇAMENTOS',
        ...filterInfo,
        `# Total filtrado: ${total.toFixed(2)} (${filteredTransactions.length} lançamentos)`,
        headers.join(','),
        ...rows.map(r => r.join(',')),
      );
    }

    if (sections.summary && filteredTransactions.length > 0 && paymentSources.length > 0) {
      const headers = [`Fonte (${currencySymbol})`, 'Total gasto', 'Qtd. lançamentos'];
      const resumoRows = paymentSources.map(s => {
        const txs   = filteredTransactions.filter(t => t.sourceId === s.id);
        const total = txs.reduce((sum, t) => sum + (t.amount || 0), 0);
        return [`"${s.name}"`, total.toFixed(2), txs.length];
      });
      const noSource = filteredTransactions.filter(t => !t.sourceId);
      if (noSource.length > 0) {
        resumoRows.push(['Sem fonte', noSource.reduce((s, t) => s + (t.amount || 0), 0).toFixed(2), noSource.length]);
      }
      csvSections.push('', 'RESUMO POR FONTE', headers.join(','), ...resumoRows.map(r => r.join(',')));
    }

    return csvSections.join('\n');
  };

  // ── PDF ────────────────────────────────────────────────────────────────────

  const generatePDF = async () => {
    const { jsPDF }              = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc        = new jsPDF();
    const pageWidth  = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Capa
    doc.setFillColor(9, 10, 11);
    doc.rect(0, 0, pageWidth, 100, 'F');
    doc.setFontSize(26); doc.setTextColor(52, 211, 153);
    doc.text('Planejador Financeiro', pageWidth / 2, 42, { align: 'center' });
    doc.setFontSize(13); doc.setTextColor(200, 200, 200);
    doc.text('Relatório de Projeção Financeira', pageWidth / 2, 55, { align: 'center' });
    doc.setFontSize(9); doc.setTextColor(150, 150, 150);
    doc.text(
      `Gerado em ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`,
      pageWidth / 2, 70, { align: 'center' }
    );
    if (from) {
      doc.text(
        `Período: ${fmtDate(from)} a ${fmtDate(to)}`,
        pageWidth / 2, 80, { align: 'center' }
      );
    }

    // Resumo executivo
    doc.setFillColor(18, 20, 23);
    doc.roundedRect(20, 112, pageWidth - 40, 80, 5, 5, 'F');
    doc.setFontSize(11); doc.setTextColor(52, 211, 153);
    doc.text('RESUMO EXECUTIVO', 30, 128);
    const items = [
      ['Patrimônio Atual:',     formatCurrency(summary.currentPatrimony, currency)],
      ['Patrimônio Projetado:', formatCurrency(summary.projectedPatrimony, currency)],
      ['Crescimento Total:',    `${formatCurrency(summary.totalGrowth, currency)} (${formatPercentage(summary.totalGrowthPercentage)})`],
      ['Sobra Mensal:',         formatCurrency(summary.monthlySurplus, currency)],
      ['Taxa de Poupança:',     formatPercentage(summary.savingsRate)],
      ['Score Financeiro:',     `${scoreBreakdown?.totalScore || 0}/100 (${scoreBreakdown?.grade || 'N/A'})`],
    ];
    items.forEach(([label, value], i) => {
      const y = 142 + i * 8;
      doc.setFontSize(9); doc.setTextColor(150, 150, 150); doc.text(label, 30, y);
      doc.setTextColor(255, 255, 255); doc.text(value, 100, y);
    });

    // Projeção mensal
    if (sections.projection && projection.length > 0) {
      doc.addPage();
      doc.setFontSize(15); doc.setTextColor(52, 211, 153);
      doc.text('Projeção Mensal Detalhada', 14, 22);
      autoTable(doc, {
        head: [['Mês', 'Receita', 'Despesas', 'Sobra', 'Rendimentos', 'Patrimônio', 'Real*']],
        body: projection.map(m => [
          m.monthLabel,
          formatCurrency(m.income, currency),
          formatCurrency(m.fixedCosts + m.variableExpenses, currency),
          formatCurrency(m.surplus, currency),
          formatCurrency(m.investmentReturns, currency),
          formatCurrency(m.patrimony, currency),
          formatCurrency(m.patrimonyReal || m.patrimony, currency),
        ]),
        startY: 30,
        theme: 'striped',
        headStyles: { fillColor: [52, 211, 153], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2.5, halign: 'right' },
        columnStyles: { 0: { halign: 'left', cellWidth: 25 } },
      });
      doc.setFontSize(7.5); doc.setTextColor(100);
      doc.text('* Patrimônio Real = Valor ajustado pela inflação', 14, doc.lastAutoTable.finalY + 8);
    }

    // Fontes de pagamento
    if (sections.sources && paymentSources.length > 0) {
      doc.addPage();
      doc.setFontSize(15); doc.setTextColor(52, 211, 153);
      doc.text('Fontes de Pagamento', 14, 22);
      autoTable(doc, {
        head: [['Nome', 'Tipo', 'Titular', 'Análises', 'Limite/mês', 'Gasto atual']],
        body: paymentSources.map(s => [
          s.name, s.type,
          s.owner === 'self' ? 'Própria' : `Terceiro (${s.ownerName || ''})`,
          s.includeInProjection ? 'Incluída' : 'Excluída',
          s.monthlyLimit ? formatCurrency(s.monthlyLimit, currency) : '-',
          formatCurrency(spentBySourceThisMonth.get(s.id) || 0, currency),
        ]),
        startY: 30,
        theme: 'striped',
        headStyles: { fillColor: [96, 165, 250], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 3 },
      });
    }

    // Lançamentos filtrados
    if (sections.transactions && filteredTransactions.length > 0) {
      doc.addPage();
      doc.setFontSize(15); doc.setTextColor(52, 211, 153);
      doc.text('Lançamentos', 14, 22);

      const totalGeral = filteredTransactions.reduce((s, t) => s + (t.amount || 0), 0);
      doc.setFontSize(8.5); doc.setTextColor(80);
      doc.text(
        `${filteredTransactions.length} lançamentos  |  Total: ${formatCurrency(totalGeral, currency)}` +
        (from ? `  |  Período: ${fmtDate(from)} a ${fmtDate(to)}` : ''),
        14, 32
      );

      const sorted = [...filteredTransactions].sort((a, b) =>
        (b.date || '').localeCompare(a.date || '')
      );
      autoTable(doc, {
        head: [['Data', 'Descrição', 'Categoria', 'Fonte', 'Inclui', `Valor (${currencySymbol})`]],
        body: sorted.map(t => {
          const source = paymentSources.find(s => s.id === t.sourceId);
          return [
            fmtDate(t.date),
            t.description || '-',
            CATEGORY_LABELS[t.category] || t.category || '-',
            source?.name || 'Sem fonte',
            source ? (source.includeInProjection ? 'Sim' : 'Não') : 'Sim',
            (t.amount || 0).toFixed(2),
          ];
        }),
        startY: 40,
        theme: 'striped',
        headStyles: { fillColor: [52, 211, 153], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 7.5, cellPadding: 2.5 },
        columnStyles: { 5: { halign: 'right', cellWidth: 24 } },
      });
    }

    // Resumo por fonte
    if (sections.summary && filteredTransactions.length > 0 && paymentSources.length > 0) {
      const resumoBody = paymentSources
        .filter(s => filteredTransactions.some(t => t.sourceId === s.id))
        .map(s => {
          const txs   = filteredTransactions.filter(t => t.sourceId === s.id);
          const total = txs.reduce((sum, t) => sum + (t.amount || 0), 0);
          return [s.name, s.includeInProjection ? 'Incluída' : 'Excluída', txs.length, formatCurrency(total, currency)];
        });
      const noSource = filteredTransactions.filter(t => !t.sourceId);
      if (noSource.length > 0) {
        resumoBody.push(['Sem fonte', 'Sim', noSource.length, formatCurrency(noSource.reduce((s, t) => s + (t.amount || 0), 0), currency)]);
      }
      if (resumoBody.length > 0) {
        const y = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 14 : 200;
        const addNewPage = y > pageHeight - 80;
        if (addNewPage) doc.addPage();
        const startY = addNewPage ? 22 : y;
        doc.setFontSize(12); doc.setTextColor(52, 211, 153);
        doc.text('Resumo por Fonte', 14, startY);
        autoTable(doc, {
          head: [['Fonte', 'Análises', 'Qtd.', 'Total']],
          body: resumoBody,
          startY: startY + 8,
          theme: 'striped',
          headStyles: { fillColor: [96, 165, 250], textColor: 255, fontStyle: 'bold' },
          styles: { fontSize: 8, cellPadding: 3 },
          columnStyles: { 3: { halign: 'right' } },
        });
      }
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7.5); doc.setTextColor(150);
      doc.text(
        `Página ${i} de ${pageCount} • Luna Finance`,
        pageWidth / 2, pageHeight - 8, { align: 'center' }
      );
    }

    return doc;
  };

  // ── Handler principal ──────────────────────────────────────────────────────

  const handleExport = async () => {
    const hasProjection   = sections.projection && projection.length > 0;
    const hasTransactions = sections.transactions && filteredTransactions.length > 0;
    const hasSources      = sections.sources && paymentSources.length > 0;

    if (!hasProjection && !hasTransactions && !hasSources) {
      toast.error('Nenhum dado para exportar', {
        description: 'Ajuste os filtros ou configure seus dados financeiros.',
      });
      return;
    }

    setIsExporting(true);
    try {
      if (exportFormat === 'csv') {
        const csv = generateCSV();
        if (csv) {
          const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
          const url  = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href     = url;
          link.download = `luna-finance-${new Date().toISOString().slice(0, 10)}.csv`;
          link.click();
          URL.revokeObjectURL(url);
          toast.success('CSV exportado com sucesso!');
        }
      } else {
        const doc = await generatePDF();
        if (doc) {
          doc.save(`luna-finance-${new Date().toISOString().slice(0, 10)}.pdf`);
          toast.success('PDF exportado com sucesso!');
        }
      }
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Erro ao exportar', { description: 'Tente novamente.' });
    } finally {
      setIsExporting(false);
    }
  };

  // ── UI ─────────────────────────────────────────────────────────────────────

  const allCatsSelected     = selectedCategories.size === ALL_CATEGORIES.length;
  const allSourcesSelected  = selectedSources.size === paymentSources.length + 1;
  const allSectionsSelected = Object.values(sections).every(Boolean);

  return (
    <Card data-testid="export-data">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Download className="h-5 w-5 text-primary" />
          Exportar Dados
        </CardTitle>
        <CardDescription>
          Relatório em CSV ou PDF com filtros avançados
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">

        {/* ── Formato + botão exportar ────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <Select value={exportFormat} onValueChange={setExportFormat}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">
                <span className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />CSV
                </span>
              </SelectItem>
              <SelectItem value="pdf">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />PDF
                </span>
              </SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1"
            data-testid="export-button"
          >
            {isExporting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Exportando...</>
            ) : (
              <><Download className="h-4 w-4 mr-2" />Exportar {exportFormat.toUpperCase()}</>
            )}
          </Button>

          <button
            onClick={() => setFiltersOpen(v => !v)}
            className={cn(
              'h-10 w-10 rounded-xl border flex items-center justify-center transition-all shrink-0',
              filtersOpen
                ? 'bg-primary/10 border-primary/40 text-primary'
                : 'bg-muted/40 border-border/40 text-muted-foreground hover:text-foreground'
            )}
            title="Filtros avançados"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>

        {/* ── Painel de filtros ───────────────────────────────────────────── */}
        {filtersOpen && (
          <div className="space-y-4 pt-1 border-t border-border/40">

            {/* Seções */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <LayoutList className="h-3.5 w-3.5" />
                  Seções
                </div>
                <button
                  onClick={allSectionsSelected ? () => setSections({ projection: false, transactions: false, sources: false, summary: false }) : selectAll}
                  className="text-[11px] text-primary hover:opacity-80 transition-opacity"
                >
                  {allSectionsSelected ? 'Desmarcar todas' : 'Selecionar todas'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <SectionToggle icon={FileText}     label="Projeção"      checked={sections.projection}   onChange={v => toggleSection('projection')} />
                <SectionToggle icon={LayoutList}   label="Lançamentos"   checked={sections.transactions} onChange={v => toggleSection('transactions')} />
                <SectionToggle icon={CreditCard}   label="Fontes"        checked={sections.sources}      onChange={v => toggleSection('sources')} />
                <SectionToggle icon={Tag}          label="Resumo/fonte"  checked={sections.summary}      onChange={v => toggleSection('summary')} />
              </div>
            </div>

            {/* Período */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <Calendar className="h-3.5 w-3.5" />
                Período
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PERIOD_PRESETS.map(p => (
                  <button
                    key={p.value}
                    onClick={() => setPeriodPreset(p.value)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-medium border transition-all',
                      periodPreset === p.value
                        ? 'bg-primary/10 border-primary/40 text-primary'
                        : 'bg-muted/40 border-border/40 text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {periodPreset === 'custom' && (
                <div className="flex items-center gap-2 pt-1">
                  <div className="flex-1">
                    <p className="text-[10px] text-muted-foreground mb-1">De</p>
                    <input
                      type="date"
                      value={customFrom}
                      onChange={e => setCustomFrom(e.target.value)}
                      className="w-full h-8 rounded-lg bg-muted/50 border border-border/40 px-2 text-xs text-foreground focus:outline-none focus:border-primary/40"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-muted-foreground mb-1">Até</p>
                    <input
                      type="date"
                      value={customTo}
                      onChange={e => setCustomTo(e.target.value)}
                      className="w-full h-8 rounded-lg bg-muted/50 border border-border/40 px-2 text-xs text-foreground focus:outline-none focus:border-primary/40"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Categorias */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <Tag className="h-3.5 w-3.5" />
                  Categorias
                </div>
                <button
                  onClick={allCatsSelected ? clearAllCategories : selectAllCategories}
                  className="text-[11px] text-primary hover:opacity-80 transition-opacity"
                >
                  {allCatsSelected ? 'Desmarcar todas' : 'Selecionar todas'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                {ALL_CATEGORIES.map(id => (
                  <CheckItem
                    key={id}
                    label={CATEGORY_LABELS[id]}
                    checked={selectedCategories.has(id)}
                    onChange={val => toggleCategory(id, val)}
                  />
                ))}
              </div>
            </div>

            {/* Fontes */}
            {paymentSources.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <CreditCard className="h-3.5 w-3.5" />
                    Fontes de Pagamento
                  </div>
                  <button
                    onClick={allSourcesSelected ? clearAllSources : selectAllSources}
                    className="text-[11px] text-primary hover:opacity-80 transition-opacity"
                  >
                    {allSourcesSelected ? 'Desmarcar todas' : 'Selecionar todas'}
                  </button>
                </div>
                <div className="space-y-2">
                  {paymentSources.map(s => (
                    <CheckItem
                      key={s.id}
                      label={s.name}
                      checked={selectedSources.has(s.id)}
                      onChange={val => toggleSource(s.id, val)}
                      color={s.color}
                    />
                  ))}
                  <CheckItem
                    label="Sem fonte cadastrada"
                    checked={selectedSources.has('__none__')}
                    onChange={val => toggleSource('__none__', val)}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Resumo do que será exportado ────────────────────────────────── */}
        <div className="text-xs text-muted-foreground space-y-1 pt-1 border-t border-border/30">
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground text-[11px]">O que será exportado:</span>
            {from && (
              <span className="text-[10px] text-primary">
                {fmtDate(from)} → {fmtDate(to)}
              </span>
            )}
          </div>
          {sections.projection && projection.length > 0 && (
            <p>• Projeção: <span className="text-foreground">{projection.length} meses</span></p>
          )}
          {sections.transactions && (
            <p>• Lançamentos: <span className="text-primary font-medium">{filteredTransactions.length}</span>
              {filteredTransactions.length !== transactions.length && (
                <span className="text-muted-foreground"> (de {transactions.length} total)</span>
              )}
            </p>
          )}
          {sections.sources && paymentSources.length > 0 && (
            <p>• Fontes: <span className="text-foreground">{paymentSources.length}</span></p>
          )}
        </div>

      </CardContent>
    </Card>
  );
};

export default ExportData;