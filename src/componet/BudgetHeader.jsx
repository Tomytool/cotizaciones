import { lazy, Suspense, useState } from "react";
import mgsgLogo from "../assets/mgsg-logo.svg";
import DownloadPdfButton from "./DownloadPdfButton";

const SendEmailModal = lazy(() => import("./SendEmailModal"));

/**
 * Formateador de números a moneda chilena (CLP)
 */
const formatCurrency = (value) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value || 0);

/**
 * Encabezado ejecutivo del presupuesto con soporte responsivo desde 320px,
 * edición de metadatos del cliente (Nombre, Teléfono, Correo) y de la obra,
 * botón de descarga PDF y actualización reactiva inmediata del Total Presupuesto.
 */
export default function BudgetHeader({
  budgetInfo,
  onUpdateBudgetInfo,
  items,
  grandTotal,
  onBackToClient,
  onClearItems,
}) {
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const itemsCount = items.length;

  const validItemsCount = (items || []).filter((item) => {
    const qty = Number(item.quantity) || 0;
    const unitCost = Number(item.unitCost) || 0;
    const total = Number(item.totalCost) || Math.round(qty * unitCost);
    return qty > 0 && unitCost > 0 && total > 0;
  }).length;

  return (
    <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Barra superior oscura con identidad MGSG, botón PDF y navegación al Paso 1 */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-800 bg-slate-900 px-3.5 py-3 text-white sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src={mgsgLogo}
            alt="Logo Constructora María Graciela Silva Gallardo (MGSG)"
            width={56}
            height={48}
            decoding="async"
            className="h-12 w-14 shrink-0 rounded-lg border border-slate-700"
          />
          <div className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-300">
              Paso 2 de 2 · Cotización de Obra
            </span>
            <h1 className="truncate text-sm font-black tracking-tight text-white sm:text-lg">
              {budgetInfo.companyName}
            </h1>
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
          <DownloadPdfButton
            budgetInfo={budgetInfo}
            items={items}
            grandTotal={grandTotal}
          />

          <button
            type="button"
            onClick={() => setIsEmailModalOpen(true)}
            disabled={validItemsCount === 0}
            title={
              validItemsCount === 0
                ? "Agrega al menos una partida con valor mayor a $0 para enviar por correo"
                : `Enviar cotización PDF al correo ${
                    budgetInfo.clientEmail || "del cliente"
                  }`
            }
            className="inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-800 px-3.5 py-2 text-xs font-bold text-white shadow-2xs transition-colors hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg
              className="h-4 w-4 shrink-0 text-emerald-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <span>Enviar al Correo</span>
          </button>

          <button
            type="button"
            onClick={onBackToClient}
            className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-100 transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <svg
              className="h-4 w-4 shrink-0 text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11 17l-5-5m0 0l5-5m-5 5h12"
              />
            </svg>
            <span>Datos Cliente / Obra</span>
          </button>
        </div>
      </div>

      {/* Cuerpo del encabezado: Datos editables y KPI Total */}
      <div className="flex flex-col gap-4 p-3.5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
        {/* Cuadrícula de datos del cliente (Nombre, Teléfono, Correo) y de la obra */}
        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="clientNameHeader"
              className="text-[11px] font-bold uppercase tracking-wide text-slate-500"
            >
              Cliente
            </label>
            <input
              id="clientNameHeader"
              type="text"
              placeholder="Nombre del cliente"
              value={budgetInfo.clientName}
              onChange={(e) =>
                onUpdateBudgetInfo({
                  ...budgetInfo,
                  clientName: e.target.value,
                })
              }
              className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm font-semibold text-slate-800 transition-colors hover:border-slate-300 focus-visible:border-emerald-600 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/20"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="clientPhoneHeader"
              className="text-[11px] font-bold uppercase tracking-wide text-slate-500"
            >
              Teléfono de contacto
            </label>
            <input
              id="clientPhoneHeader"
              type="tel"
              inputMode="tel"
              placeholder="+56 9 ..."
              value={budgetInfo.clientPhone || ""}
              onChange={(e) =>
                onUpdateBudgetInfo({
                  ...budgetInfo,
                  clientPhone: e.target.value,
                })
              }
              className="tabular-nums min-h-[44px] w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm font-semibold text-slate-800 transition-colors hover:border-slate-300 focus-visible:border-emerald-600 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/20"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="clientEmailHeader"
              className="text-[11px] font-bold uppercase tracking-wide text-slate-500"
            >
              Correo electrónico
            </label>
            <input
              id="clientEmailHeader"
              type="email"
              inputMode="email"
              placeholder="correo@cliente.cl"
              value={budgetInfo.clientEmail || ""}
              onChange={(e) =>
                onUpdateBudgetInfo({
                  ...budgetInfo,
                  clientEmail: e.target.value,
                })
              }
              className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm font-semibold text-slate-800 transition-colors hover:border-slate-300 focus-visible:border-emerald-600 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/20"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="projectName"
              className="text-[11px] font-bold uppercase tracking-wide text-slate-500"
            >
              Nombre / Descripción de la Obra
            </label>
            <input
              id="projectName"
              type="text"
              placeholder="Descripción de la obra"
              value={budgetInfo.projectName}
              onChange={(e) =>
                onUpdateBudgetInfo({
                  ...budgetInfo,
                  projectName: e.target.value,
                })
              }
              className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm font-semibold text-slate-800 transition-colors hover:border-slate-300 focus-visible:border-emerald-600 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/20"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="location"
              className="text-[11px] font-bold uppercase tracking-wide text-slate-500"
            >
              Dirección de la Obra
            </label>
            <input
              id="location"
              type="text"
              placeholder="Ubicación de la obra"
              value={budgetInfo.location}
              onChange={(e) =>
                onUpdateBudgetInfo({
                  ...budgetInfo,
                  location: e.target.value,
                })
              }
              className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm font-semibold text-slate-800 transition-colors hover:border-slate-300 focus-visible:border-emerald-600 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/20"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="budgetDate"
              className="text-[11px] font-bold uppercase tracking-wide text-slate-500"
            >
              Fecha tentativa de inicio
            </label>
            <input
              id="budgetDate"
              type="date"
              value={budgetInfo.budgetDate}
              onChange={(e) =>
                onUpdateBudgetInfo({
                  ...budgetInfo,
                  budgetDate: e.target.value,
                })
              }
              className="min-h-[44px] w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm font-semibold text-slate-800 transition-colors hover:border-slate-300 focus-visible:border-emerald-600 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/20"
            />
          </div>
        </div>

        {/* Tarjeta resumen de Total General protegida con translate="no" y key reactiva */}
        <div
          key={`total-card-${itemsCount}-${grandTotal}`}
          translate="no"
          className="notranslate flex flex-col gap-2.5 lg:items-end"
        >
          <div className="flex items-center justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 lg:flex-col lg:items-end lg:gap-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              {`Total Presupuesto (${itemsCount} ${
                itemsCount === 1 ? "partida" : "partidas"
              })`}
            </span>
            <output
              aria-live="polite"
              className="fluid-kpi tabular-nums font-black text-emerald-950"
            >
              {formatCurrency(grandTotal)}
            </output>
          </div>

          {itemsCount > 0 && (
            <button
              type="button"
              onClick={onClearItems}
              className="min-h-[44px] w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 lg:w-auto"
            >
              Vaciar todas las partidas
            </button>
          )}
        </div>
      </div>

      {/* Modal de envío del documento PDF al correo electrónico del cliente */}
      {isEmailModalOpen && (
        <Suspense fallback={null}>
          <SendEmailModal
            isOpen={isEmailModalOpen}
            onClose={() => setIsEmailModalOpen(false)}
            budgetInfo={budgetInfo}
            items={items}
            onUpdateClientEmail={(newEmail) =>
              onUpdateBudgetInfo({
                ...budgetInfo,
                clientEmail: newEmail,
              })
            }
          />
        </Suspense>
      )}
    </header>
  );
}
