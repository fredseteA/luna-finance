import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { useFinancial } from '../../contexts/FinancialContext';
import { formatCurrency, formatPercentage, CURRENCIES } from '../../services/financialEngine';
import { toast } from 'sonner';

// ─── Helpers locais ───────────────────────────────────────────────────────────

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

// ─── Componente ───────────────────────────────────────────────────────────────

export const ExportData = () => {
  const {
    projection,
    financialData,
    settings,
    currency,
    summary,
    scoreBreakdown,
    // Novos dados
    transactions,
    currentMonthTransactions,
    paymentSources,
    spentBySourceThisMonth,
  } = useFinancial();

  const [exportFormat, setExportFormat] = useState('csv');
  const [isExporting,  setIsExporting]  = useState(false);

  const currencySymbol = CURRENCIES[currency]?.symbol || 'R$';

  // ─── CSV ────────────────────────────────────────────────────────────────────

  const generateCSV = () => {
    const sections = [];

    // ── 1. Projeção mensal ──────────────────────────────────────────────────
    if (projection.length > 0) {
      const projHeaders = [
        'Mês',
        'Data',
        `Receita (${currencySymbol})`,
        `Custos Fixos (${currencySymbol})`,
        `Gastos Variáveis (${currencySymbol})`,
        `Sobra (${currencySymbol})`,
        `Rendimentos Brutos (${currencySymbol})`,
        `Rendimentos Líquidos (${currencySymbol})`,
        `Patrimônio Nominal (${currencySymbol})`,
        `Patrimônio Real (${currencySymbol})`,
        `CDI (${currencySymbol})`,
        `Selic (${currencySymbol})`,
        `CDB (${currencySymbol})`,
        `FII (${currencySymbol})`,
      ];

      const projRows = projection.map(month => [
        month.month,
        month.monthLabel,
        month.income.toFixed(2),
        month.fixedCosts.toFixed(2),
        month.variableExpenses.toFixed(2),
        month.surplus.toFixed(2),
        (month.grossReturns
          ? Object.values(month.grossReturns).reduce((a, b) => a + b, 0)
          : month.investmentReturns
        ).toFixed(2),
        month.investmentReturns.toFixed(2),
        month.patrimony.toFixed(2),
        (month.patrimonyReal || month.patrimony).toFixed(2),
        month.breakdown.cdi.toFixed(2),
        month.breakdown.selic.toFixed(2),
        month.breakdown.cdb.toFixed(2),
        month.breakdown.fii.toFixed(2),
      ]);

      sections.push(
        'PROJEÇÃO MENSAL',
        projHeaders.join(','),
        ...projRows.map(r => r.join(',')),
      );
    }

    // ── 2. Fontes de pagamento ──────────────────────────────────────────────
    if (paymentSources.length > 0) {
      const sourceHeaders = [
        'Nome',
        'Tipo',
        'Titular',
        'Nome do titular',
        'Inclui nas análises',
        `Limite mensal (${currencySymbol})`,
        `Gasto no mês atual (${currencySymbol})`,
      ];

      const sourceRows = paymentSources.map(s => [
        `"${s.name}"`,
        s.type,
        s.owner === 'self' ? 'Própria' : 'Terceiro',
        s.owner === 'third_party' ? `"${s.ownerName || ''}"` : '-',
        s.includeInProjection ? 'Sim' : 'Não',
        s.monthlyLimit ? s.monthlyLimit.toFixed(2) : '-',
        (spentBySourceThisMonth.get(s.id) || 0).toFixed(2),
      ]);

      sections.push(
        '',
        'FONTES DE PAGAMENTO',
        sourceHeaders.join(','),
        ...sourceRows.map(r => r.join(',')),
      );
    }

    // ── 3. Lançamentos (transactions) ───────────────────────────────────────
    if (transactions.length > 0) {
      const txHeaders = [
        'Data',
        'Descrição',
        'Categoria',
        `Valor (${currencySymbol})`,
        'Fonte de pagamento',
        'Titular da fonte',
        'Incluído nas análises',
      ];

      // Ordena do mais recente para o mais antigo
      const sorted = [...transactions].sort((a, b) =>
        (b.date || b.createdAt || '').localeCompare(a.date || a.createdAt || '')
      );

      const txRows = sorted.map(t => {
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

      sections.push(
        '',
        'LANÇAMENTOS DO PERÍODO',
        txHeaders.join(','),
        ...txRows.map(r => r.join(',')),
      );

      // ── Resumo por fonte ──────────────────────────────────────────────────
      if (paymentSources.length > 0) {
        const resumoHeaders = [`Fonte (${currencySymbol})`, 'Total gasto', 'Qtd. lançamentos'];
        const resumoRows = paymentSources.map(s => {
          const sourceTxs = transactions.filter(t => t.sourceId === s.id);
          const total     = sourceTxs.reduce((sum, t) => sum + (t.amount || 0), 0);
          return [`"${s.name}"`, total.toFixed(2), sourceTxs.length];
        });

        // Sem fonte
        const noSourceTxs = transactions.filter(t => !t.sourceId);
        if (noSourceTxs.length > 0) {
          resumoRows.push([
            'Sem fonte',
            noSourceTxs.reduce((sum, t) => sum + (t.amount || 0), 0).toFixed(2),
            noSourceTxs.length,
          ]);
        }

        sections.push(
          '',
          'RESUMO POR FONTE',
          resumoHeaders.join(','),
          ...resumoRows.map(r => r.join(',')),
        );
      }
    }

    return sections.join('\n');
  };

  // ─── PDF ────────────────────────────────────────────────────────────────────

  const generatePDF = async () => {
    if (projection.length === 0 && transactions.length === 0) return null;

    const { jsPDF }            = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc        = new jsPDF();
    const pageWidth  = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // ── Capa ────────────────────────────────────────────────────────────────
    doc.setFillColor(9, 10, 11);
    doc.rect(0, 0, pageWidth, 100, 'F');

    doc.setFontSize(28);
    doc.setTextColor(52, 211, 153);
    doc.text('Planejador Financeiro', pageWidth / 2, 45, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(200, 200, 200);
    doc.text('Relatório de Projeção Financeira', pageWidth / 2, 58, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Gerado em ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`,
      pageWidth / 2, 75, { align: 'center' }
    );

    // Resumo executivo
    doc.setFillColor(18, 20, 23);
    doc.roundedRect(20, 115, pageWidth - 40, 80, 5, 5, 'F');

    doc.setFontSize(12);
    doc.setTextColor(52, 211, 153);
    doc.text('RESUMO EXECUTIVO', 30, 130);

    doc.setFontSize(10);
    const summaryItems = [
      ['Patrimônio Atual:',    formatCurrency(summary.currentPatrimony, currency)],
      ['Patrimônio Projetado:', formatCurrency(summary.projectedPatrimony, currency)],
      ['Crescimento Total:',   `${formatCurrency(summary.totalGrowth, currency)} (${formatPercentage(summary.totalGrowthPercentage)})`],
      ['Sobra Mensal:',        formatCurrency(summary.monthlySurplus, currency)],
      ['Taxa de Poupança:',    formatPercentage(summary.savingsRate)],
      ['Score Financeiro:',    `${scoreBreakdown?.totalScore || 0}/100 (${scoreBreakdown?.grade || 'N/A'})`],
    ];
    summaryItems.forEach(([label, value], idx) => {
      const y = 145 + idx * 8;
      doc.setTextColor(150, 150, 150);
      doc.text(label, 30, y);
      doc.setTextColor(255, 255, 255);
      doc.text(value, 100, y);
    });

    // Período
    doc.setFillColor(18, 20, 23);
    doc.roundedRect(20, 205, pageWidth - 40, 30, 5, 5, 'F');
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('Período de Análise:', 30, 220);
    doc.setTextColor(255, 255, 255);
    doc.text(
      `${financialData.durationMonths} meses (${(financialData.durationMonths / 12).toFixed(1)} anos)`,
      85, 220
    );
    doc.setTextColor(150, 150, 150);
    doc.text('Início:', 130, 220);
    doc.setTextColor(255, 255, 255);
    const startDate = new Date(financialData.startDate);
    doc.text(startDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }), 145, 220);

    // ── Pág 2: Configuração ──────────────────────────────────────────────────
    doc.addPage();

    doc.setFontSize(16);
    doc.setTextColor(52, 211, 153);
    doc.text('Configuração Financeira', 14, 25);

    doc.setFontSize(12);
    doc.setTextColor(60, 130, 246);
    doc.text('Renda e Patrimônio', 14, 40);

    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.text(`Renda Mensal: ${formatCurrency(financialData.monthlyIncome, currency)}`, 14, 50);
    doc.text(`Patrimônio Inicial: ${formatCurrency(financialData.initialPatrimony, currency)}`, 14, 58);

    doc.setFontSize(12);
    doc.setTextColor(244, 63, 94);
    doc.text('Despesas', 14, 75);

    const totalFixed    = financialData.fixedCosts?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
    const totalVariable = financialData.variableExpenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;

    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.text(`Custos Fixos: ${formatCurrency(totalFixed, currency)}`, 14, 85);
    doc.text(`Gastos Variáveis: ${formatCurrency(totalVariable, currency)}`, 14, 93);
    doc.text(`Total Despesas: ${formatCurrency(totalFixed + totalVariable, currency)}`, 14, 101);

    doc.setFontSize(12);
    doc.setTextColor(52, 211, 153);
    doc.text('Alocação de Investimentos', 14, 118);

    const allocation = financialData.allocation || { cdi: 25, selic: 25, cdb: 25, fii: 25 };
    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.text(`CDI: ${allocation.cdi}% | Selic: ${allocation.selic}% | CDB: ${allocation.cdb}% | FII: ${allocation.fii}%`, 14, 128);

    doc.setFontSize(12);
    doc.setTextColor(251, 191, 36);
    doc.text('Taxas de Mercado', 14, 145);

    const rates = settings.rates;
    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.text(
      `CDI: ${rates.cdi}% a.a. (${rates.cdiPercentage}%) | Selic: ${rates.selic}% a.a. | CDB: ${rates.cdb}% a.a. | FII: ${rates.fii}% a.m.`,
      14, 155
    );
    doc.text(
      `Inflação: ${settings.inflation || 0}% a.a. | Impostos: ${settings.taxes?.enabled ? 'Sim' : 'Não'}`,
      14, 163
    );

    // ── NOVO: Fontes de pagamento na pág 2 ──────────────────────────────────
    if (paymentSources.length > 0) {
      let yPos = 180;
      doc.setFontSize(12);
      doc.setTextColor(96, 165, 250);
      doc.text('Fontes de Pagamento', 14, yPos);
      yPos += 12;

      autoTable(doc, {
        startY: yPos,
        head: [['Nome', 'Tipo', 'Titular', 'Análises', 'Limite/mês', 'Gasto atual']],
        body: paymentSources.map(s => [
          s.name,
          s.type,
          s.owner === 'self' ? 'Própria' : `Terceiro (${s.ownerName || ''})`,
          s.includeInProjection ? 'Incluída' : 'Excluída',
          s.monthlyLimit ? formatCurrency(s.monthlyLimit, currency) : '-',
          formatCurrency(spentBySourceThisMonth.get(s.id) || 0, currency),
        ]),
        theme: 'striped',
        headStyles: { fillColor: [60, 130, 246], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 3 },
      });
    }

    // ── Pág 3: Projeção mensal ───────────────────────────────────────────────
    if (projection.length > 0) {
      doc.addPage();

      doc.setFontSize(16);
      doc.setTextColor(52, 211, 153);
      doc.text('Projeção Mensal Detalhada', 14, 25);

      autoTable(doc, {
        head: [['Mês', 'Receita', 'Despesas', 'Sobra', 'Rendimentos', 'Patrimônio', 'Real*']],
        body: projection.map(month => [
          month.monthLabel,
          formatCurrency(month.income, currency),
          formatCurrency(month.fixedCosts + month.variableExpenses, currency),
          formatCurrency(month.surplus, currency),
          formatCurrency(month.investmentReturns, currency),
          formatCurrency(month.patrimony, currency),
          formatCurrency(month.patrimonyReal || month.patrimony, currency),
        ]),
        startY: 35,
        theme: 'striped',
        headStyles: { fillColor: [52, 211, 153], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        styles: { fontSize: 8, cellPadding: 3, halign: 'right' },
        columnStyles: { 0: { halign: 'left', cellWidth: 25 } },
      });

      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text('* Patrimônio Real = Valor ajustado pela inflação', 14, doc.lastAutoTable.finalY + 10);
    }

    // ── NOVO: Pág 4 — Lançamentos do período ────────────────────────────────
    if (transactions.length > 0) {
      doc.addPage();

      doc.setFontSize(16);
      doc.setTextColor(52, 211, 153);
      doc.text('Lançamentos do Período', 14, 25);

      // Total geral
      const totalGeral = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      doc.setFontSize(10);
      doc.setTextColor(60);
      doc.text(
        `Total de lançamentos: ${transactions.length}  |  Valor total: ${formatCurrency(totalGeral, currency)}`,
        14, 38
      );

      const sorted = [...transactions].sort((a, b) =>
        (b.date || b.createdAt || '').localeCompare(a.date || a.createdAt || '')
      );

      autoTable(doc, {
        head: [['Data', 'Descrição', 'Categoria', 'Fonte', 'Titular', 'Inclui', `Valor (${currencySymbol})`]],
        body: sorted.map(t => {
          const source = paymentSources.find(s => s.id === t.sourceId);
          return [
            fmtDate(t.date),
            t.description || '-',
            CATEGORY_LABELS[t.category] || t.category || '-',
            source?.name || 'Sem fonte',
            source?.owner === 'third_party' ? (source?.ownerName || '-') : '-',
            source ? (source.includeInProjection ? 'Sim' : 'Não') : 'Sim',
            (t.amount || 0).toFixed(2),
          ];
        }),
        startY: 48,
        theme: 'striped',
        headStyles: { fillColor: [52, 211, 153], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        styles: { fontSize: 7.5, cellPadding: 2.5 },
        columnStyles: {
          0: { cellWidth: 18 },
          5: { halign: 'center', cellWidth: 14 },
          6: { halign: 'right', cellWidth: 22 },
        },
      });

      // ── Resumo por fonte ────────────────────────────────────────────────────
      const resumoStartY = doc.lastAutoTable.finalY + 12;

      if (pageHeight - resumoStartY > 60) {
        doc.setFontSize(12);
        doc.setTextColor(52, 211, 153);
        doc.text('Resumo por Fonte', 14, resumoStartY);

        const resumoBody = paymentSources
          .filter(s => transactions.some(t => t.sourceId === s.id))
          .map(s => {
            const sourceTxs = transactions.filter(t => t.sourceId === s.id);
            const total     = sourceTxs.reduce((sum, t) => sum + (t.amount || 0), 0);
            return [
              s.name,
              s.owner === 'self' ? 'Própria' : `Terceiro (${s.ownerName || ''})`,
              s.includeInProjection ? 'Sim' : 'Não',
              sourceTxs.length,
              formatCurrency(total, currency),
            ];
          });

        const noSource = transactions.filter(t => !t.sourceId);
        if (noSource.length > 0) {
          resumoBody.push([
            'Sem fonte',
            '-',
            'Sim',
            noSource.length,
            formatCurrency(noSource.reduce((sum, t) => sum + (t.amount || 0), 0), currency),
          ]);
        }

        if (resumoBody.length > 0) {
          autoTable(doc, {
            head: [['Fonte', 'Titular', 'Análises', 'Qtd.', 'Total']],
            body: resumoBody,
            startY: resumoStartY + 6,
            theme: 'striped',
            headStyles: { fillColor: [96, 165, 250], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 8, cellPadding: 3 },
            columnStyles: { 4: { halign: 'right' } },
          });
        }
      }
    }

    // ── Pág 5: Insights ─────────────────────────────────────────────────────
    if (scoreBreakdown?.improvements?.length > 0) {
      doc.addPage();

      doc.setFontSize(16);
      doc.setTextColor(52, 211, 153);
      doc.text('Insights e Recomendações', 14, 25);

      doc.setFontSize(12);
      doc.setTextColor(60);
      doc.text('Oportunidades de Melhoria', 14, 40);

      scoreBreakdown.improvements.slice(0, 5).forEach((imp, idx) => {
        const y = 55 + idx * 20;
        doc.setFontSize(10);
        doc.setTextColor(52, 211, 153);
        doc.text(`+${imp.potentialGain} pontos`, 14, y);
        doc.setTextColor(0);
        doc.text(imp.category, 45, y);
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(imp.action, 14, y + 6);
      });
    }

    // ── Footer em todas as páginas ──────────────────────────────────────────
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Página ${i} de ${pageCount} • Planejador Financeiro Pessoal`,
        pageWidth / 2, pageHeight - 10,
        { align: 'center' }
      );
    }

    return doc;
  };

  // ─── Handler de exportação ───────────────────────────────────────────────

  const handleExport = async () => {
    const hasProjection  = projection.length > 0;
    const hasTransactions = transactions.length > 0;

    if (!hasProjection && !hasTransactions) {
      toast.error('Nenhum dado para exportar', {
        description: 'Configure seus dados financeiros ou registre algum gasto primeiro.',
      });
      return;
    }

    setIsExporting(true);

    try {
      if (exportFormat === 'csv') {
        const csvContent = generateCSV();
        if (csvContent) {
          const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
          const url  = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href     = url;
          link.download = `planejamento-financeiro-${new Date().toISOString().slice(0, 10)}.csv`;
          link.click();
          URL.revokeObjectURL(url);
          toast.success('CSV exportado com sucesso!');
        }
      } else if (exportFormat === 'pdf') {
        const doc = await generatePDF();
        if (doc) {
          doc.save(`planejamento-financeiro-${new Date().toISOString().slice(0, 10)}.pdf`);
          toast.success('PDF exportado com sucesso!');
        }
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erro ao exportar', { description: 'Tente novamente mais tarde.' });
    } finally {
      setIsExporting(false);
    }
  };

  // ─── UI ─────────────────────────────────────────────────────────────────────

  return (
    <Card className="card-grid-border" data-testid="export-data">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Download className="h-5 w-5 text-primary" />
          Exportar Dados
        </CardTitle>
        <CardDescription>
          Relatório profissional em CSV ou PDF — inclui lançamentos e fontes de pagamento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Select value={exportFormat} onValueChange={setExportFormat}>
            <SelectTrigger className="w-[140px]" data-testid="export-format-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">
                <span className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  CSV
                </span>
              </SelectItem>
              <SelectItem value="pdf">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  PDF
                </span>
              </SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={handleExport}
            disabled={isExporting || (projection.length === 0 && transactions.length === 0)}
            className="flex-1"
            data-testid="export-button"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Exportar {exportFormat.toUpperCase()}
              </>
            )}
          </Button>
        </div>

        {/* Resumo do que será exportado */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">O que será incluído:</p>
          <p>• <strong>CSV</strong>: projeção, fontes, lançamentos e resumo por fonte</p>
          <p>• <strong>PDF</strong>: relatório completo com capa, configuração, projeção, lançamentos por fonte e insights</p>
          {transactions.length > 0 && (
            <p className="text-primary">
              → {transactions.length} lançamento{transactions.length > 1 ? 's' : ''} registrado{transactions.length > 1 ? 's' : ''}
            </p>
          )}
          {paymentSources.length > 0 && (
            <p className="text-primary">
              → {paymentSources.length} fonte{paymentSources.length > 1 ? 's' : ''} de pagamento
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExportData;