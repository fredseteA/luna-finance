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

export const ExportData = () => {
  const { projection, financialData, settings, currency, summary, scoreBreakdown } = useFinancial();
  const [exportFormat, setExportFormat] = useState('csv');
  const [isExporting, setIsExporting] = useState(false);

  const currencySymbol = CURRENCIES[currency]?.symbol || 'R$';

  const generateCSV = () => {
    if (projection.length === 0) return null;

    const headers = [
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

    const rows = projection.map(month => [
      month.month,
      month.monthLabel,
      month.income.toFixed(2),
      month.fixedCosts.toFixed(2),
      month.variableExpenses.toFixed(2),
      month.surplus.toFixed(2),
      (month.grossReturns ? Object.values(month.grossReturns).reduce((a, b) => a + b, 0) : month.investmentReturns).toFixed(2),
      month.investmentReturns.toFixed(2),
      month.patrimony.toFixed(2),
      (month.patrimonyReal || month.patrimony).toFixed(2),
      month.breakdown.cdi.toFixed(2),
      month.breakdown.selic.toFixed(2),
      month.breakdown.cdb.toFixed(2),
      month.breakdown.fii.toFixed(2),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csvContent;
  };

  const generatePDF = async () => {
    if (projection.length === 0) return null;

    const { jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // ========== COVER PAGE ==========
    // Background header
    doc.setFillColor(9, 10, 11);
    doc.rect(0, 0, pageWidth, 100, 'F');
    
    // Title
    doc.setFontSize(28);
    doc.setTextColor(52, 211, 153);
    doc.text('Planejador Financeiro', pageWidth / 2, 45, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(200, 200, 200);
    doc.text('Relatório de Projeção Financeira', pageWidth / 2, 58, { align: 'center' });
    
    // Date
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR', { 
      day: '2-digit', month: 'long', year: 'numeric' 
    })}`, pageWidth / 2, 75, { align: 'center' });

    // Summary box
    doc.setFillColor(18, 20, 23);
    doc.roundedRect(20, 115, pageWidth - 40, 80, 5, 5, 'F');
    
    doc.setFontSize(12);
    doc.setTextColor(52, 211, 153);
    doc.text('RESUMO EXECUTIVO', 30, 130);
    
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    
    const summaryItems = [
      ['Patrimônio Atual:', formatCurrency(summary.currentPatrimony, currency)],
      ['Patrimônio Projetado:', formatCurrency(summary.projectedPatrimony, currency)],
      ['Crescimento Total:', `${formatCurrency(summary.totalGrowth, currency)} (${formatPercentage(summary.totalGrowthPercentage)})`],
      ['Sobra Mensal:', formatCurrency(summary.monthlySurplus, currency)],
      ['Taxa de Poupança:', formatPercentage(summary.savingsRate)],
      ['Score Financeiro:', `${scoreBreakdown?.totalScore || 0}/100 (${scoreBreakdown?.grade || 'N/A'})`],
    ];

    summaryItems.forEach(([label, value], idx) => {
      const y = 145 + (idx * 8);
      doc.setTextColor(150, 150, 150);
      doc.text(label, 30, y);
      doc.setTextColor(255, 255, 255);
      doc.text(value, 100, y);
    });

    // Period info
    doc.setFillColor(18, 20, 23);
    doc.roundedRect(20, 205, pageWidth - 40, 30, 5, 5, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('Período de Análise:', 30, 220);
    doc.setTextColor(255, 255, 255);
    doc.text(`${financialData.durationMonths} meses (${(financialData.durationMonths / 12).toFixed(1)} anos)`, 85, 220);
    
    doc.setTextColor(150, 150, 150);
    doc.text('Início:', 130, 220);
    doc.setTextColor(255, 255, 255);
    const startDate = new Date(financialData.startDate);
    doc.text(startDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }), 145, 220);

    // ========== PAGE 2: CONFIGURATION ==========
    doc.addPage();
    
    doc.setFontSize(16);
    doc.setTextColor(52, 211, 153);
    doc.text('Configuração Financeira', 14, 25);
    
    // Income section
    doc.setFontSize(12);
    doc.setTextColor(60, 130, 246);
    doc.text('Renda e Patrimônio', 14, 40);
    
    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.text(`Renda Mensal: ${formatCurrency(financialData.monthlyIncome, currency)}`, 14, 50);
    doc.text(`Patrimônio Inicial: ${formatCurrency(financialData.initialPatrimony, currency)}`, 14, 58);

    // Expenses section
    doc.setFontSize(12);
    doc.setTextColor(244, 63, 94);
    doc.text('Despesas', 14, 75);
    
    const totalFixed = financialData.fixedCosts?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
    const totalVariable = financialData.variableExpenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
    
    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.text(`Custos Fixos: ${formatCurrency(totalFixed, currency)}`, 14, 85);
    doc.text(`Gastos Variáveis: ${formatCurrency(totalVariable, currency)}`, 14, 93);
    doc.text(`Total Despesas: ${formatCurrency(totalFixed + totalVariable, currency)}`, 14, 101);

    // Allocation section
    doc.setFontSize(12);
    doc.setTextColor(52, 211, 153);
    doc.text('Alocação de Investimentos', 14, 118);
    
    const allocation = financialData.allocation || { cdi: 25, selic: 25, cdb: 25, fii: 25 };
    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.text(`CDI: ${allocation.cdi}% | Selic: ${allocation.selic}% | CDB: ${allocation.cdb}% | FII: ${allocation.fii}%`, 14, 128);

    // Rates section
    doc.setFontSize(12);
    doc.setTextColor(251, 191, 36);
    doc.text('Taxas de Mercado', 14, 145);
    
    const rates = settings.rates;
    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.text(`CDI: ${rates.cdi}% a.a. (${rates.cdiPercentage}%) | Selic: ${rates.selic}% a.a. | CDB: ${rates.cdb}% a.a. | FII: ${rates.fii}% a.m.`, 14, 155);
    doc.text(`Inflação: ${settings.inflation || 0}% a.a. | Impostos: ${settings.taxes?.enabled ? 'Sim' : 'Não'}`, 14, 163);

    // ========== PAGE 3: MONTHLY TABLE ==========
    doc.addPage();
    
    doc.setFontSize(16);
    doc.setTextColor(52, 211, 153);
    doc.text('Projeção Mensal Detalhada', 14, 25);

    const tableHeaders = [['Mês', 'Receita', 'Despesas', 'Sobra', 'Rendimentos', 'Patrimônio', 'Real*']];
    const tableData = projection.map(month => [
      month.monthLabel,
      formatCurrency(month.income, currency),
      formatCurrency(month.fixedCosts + month.variableExpenses, currency),
      formatCurrency(month.surplus, currency),
      formatCurrency(month.investmentReturns, currency),
      formatCurrency(month.patrimony, currency),
      formatCurrency(month.patrimonyReal || month.patrimony, currency),
    ]);

    autoTable(doc, {
      head: tableHeaders,
      body: tableData,
      startY: 35,
      theme: 'striped',
      headStyles: { 
        fillColor: [52, 211, 153], 
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      styles: { 
        fontSize: 8, 
        cellPadding: 3,
        halign: 'right',
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 25 },
      },
    });

    // Note about real values
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text('* Patrimônio Real = Valor ajustado pela inflação', 14, doc.lastAutoTable.finalY + 10);

    // ========== PAGE 4: INSIGHTS ==========
    if (scoreBreakdown?.improvements?.length > 0) {
      doc.addPage();
      
      doc.setFontSize(16);
      doc.setTextColor(52, 211, 153);
      doc.text('Insights e Recomendações', 14, 25);

      doc.setFontSize(12);
      doc.setTextColor(60);
      doc.text('Oportunidades de Melhoria', 14, 40);

      scoreBreakdown.improvements.slice(0, 5).forEach((imp, idx) => {
        const y = 55 + (idx * 20);
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

    // Footer on all pages
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Página ${i} de ${pageCount} • Planejador Financeiro Pessoal`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    return doc;
  };

  const handleExport = async () => {
    if (projection.length === 0) {
      toast.error('Nenhum dado para exportar', {
        description: 'Configure seus dados financeiros primeiro.',
      });
      return;
    }

    setIsExporting(true);

    try {
      if (exportFormat === 'csv') {
        const csvContent = generateCSV();
        if (csvContent) {
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
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
      toast.error('Erro ao exportar', {
        description: 'Tente novamente mais tarde.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className="card-grid-border" data-testid="export-data">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Download className="h-5 w-5 text-primary" />
          Exportar Dados
        </CardTitle>
        <CardDescription>
          Relatório profissional em CSV ou PDF
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
            disabled={isExporting || projection.length === 0}
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

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• <strong>CSV</strong>: Dados completos para Excel/Sheets</p>
          <p>• <strong>PDF</strong>: Relatório profissional com capa e insights</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExportData;
