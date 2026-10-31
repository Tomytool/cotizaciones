import { useState } from "react";

/**
 * Botón dedicado para generar y descargar el PDF oficial del presupuesto.
 * Solo permite la descarga cuando existe al menos una partida con saldo mayor a $0.
 */
export default function DownloadPdfButton({ budgetInfo, items, grandTotal }) {
  const [isGenerating, setIsGenerating] = useState(false);

  const validItemsCount = (items || []).filter((item) => {
    const qty = Number(item.quantity) || 0;
    const unitCost = Number(item.unitCost) || 0;
    const total = Number(item.totalCost) || Math.round(qty * unitCost);
    return qty > 0 && unitCost > 0 && total > 0;
  }).length;

  const isDisabled = isGenerating || validItemsCount === 0;

  const handleDownload = async () => {
    if (isDisabled) return;
    setIsGenerating(true);
    try {
      const { generateBudgetPdf } = await import("../utils/generateBudgetPdf");
      await generateBudgetPdf({ budgetInfo, items, grandTotal });
    } catch (error) {
      console.error("Error al generar el PDF del presupuesto:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={isDisabled}
      aria-busy={isGenerating}
      title={
        validItemsCount === 0
          ? "Agrega al menos una partida con valor mayor a $0 para descargar el PDF"
          : "Descargar cotización en PDF"
      }
      className="inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-2xs transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <svg
        className="h-4 w-4 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <span>{isGenerating ? "Generando PDF..." : "Descargar PDF"}</span>
    </button>
  );
}
