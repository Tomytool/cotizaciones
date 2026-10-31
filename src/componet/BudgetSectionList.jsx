import { Fragment } from "react";
import { CATALOG_SECTIONS, UNIDADES_DISPONIBLES } from "../data/itemsData";

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
 * Componente de listado del presupuesto con Estrategia UI/UX para 320px:
 * 1. Jerarquía por Acordeones colapsables (1.0 a 8.0) cerrados inicialmente con barra de subtotal.
 * 2. Vista Móvil (< 768px / 320px): Tarjetas (Cards) verticales independientes por partida.
 * 3. Vista Escritorio (>= 768px): Tabla clásica con encabezados horizontales y columnas alineadas.
 * 4. Inputs táctiles (>= 44px) con teclado numérico nativo (inputMode="decimal" / "numeric").
 */
export default function BudgetSectionList({
  items,
  expandedSections,
  onToggleSection,
  onExpandAll,
  onCollapseAll,
  editingItemCode,
  editFormData,
  onEditFormChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDeleteItem,
  grandTotal,
  signerName,
}) {
  const allExpanded = CATALOG_SECTIONS.every(
    (s) => expandedSections[s.sectionCode]
  );

  return (
    <section
      aria-label="Capítulos del presupuesto"
      className="flex flex-col gap-3"
    >
      {/* Barra de herramientas de los acordeones */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
            Capítulos de la Cotización (1.0 — 8.0)
          </h2>
          <p className="text-xs text-slate-500">
            Toca un capítulo para desplegar, revisar o editar las partidas
            ingresadas.
          </p>
        </div>

        <button
          type="button"
          onClick={allExpanded ? onCollapseAll : onExpandAll}
          className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
        >
          <span>
            {allExpanded ? "Contraer capítulos" : "Expandir capítulos"}
          </span>
        </button>
      </div>

      {/* Lista de Acordeones por Capítulo (1.0 a 8.0) */}
      <div className="flex flex-col gap-2.5">
        {CATALOG_SECTIONS.map((section) => {
          const sectionItems = items.filter(
            (item) => item.sectionCode === section.sectionCode
          );
          const sectionSubtotal = sectionItems.reduce(
            (sum, i) => sum + (Number(i.totalCost) || 0),
            0
          );
          const isOpen = Boolean(expandedSections[section.sectionCode]);

          return (
            <div
              key={section.sectionCode}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs transition-colors"
            >
              {/* Barra del Acordeón (Altura mínima táctil >= 44px, muestra subtotal reactivo) */}
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => onToggleSection(section.sectionCode)}
                className="flex min-h-[52px] w-full cursor-pointer items-center justify-between gap-2 bg-slate-900 px-3.5 py-3 text-left text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-400 sm:px-5"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <span
                    translate="no"
                    className="notranslate tabular-nums inline-flex shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 px-2 py-1 font-mono text-xs font-extrabold text-emerald-300"
                  >
                    {section.sectionCode}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-white sm:text-base">
                      {section.title}
                    </span>
                    <span
                      key={`count-${section.sectionCode}-${sectionItems.length}`}
                      translate="no"
                      className="notranslate block text-[11px] text-slate-400"
                    >
                      {`${sectionItems.length} ${
                        sectionItems.length === 1 ? "partida" : "partidas"
                      }`}
                    </span>
                  </div>
                </div>

                <div
                  key={`sub-${section.sectionCode}-${sectionSubtotal}`}
                  translate="no"
                  className="notranslate flex shrink-0 items-center gap-2.5"
                >
                  <div className="text-right">
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Subtotal
                    </span>
                    <span className="tabular-nums text-sm font-extrabold text-emerald-400 sm:text-base">
                      {formatCurrency(sectionSubtotal)}
                    </span>
                  </div>
                  <svg
                    className={`h-5 w-5 shrink-0 text-slate-300 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-emerald-400" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>

              {/* Contenido colapsable del Capítulo */}
              {isOpen && (
                <div className="border-t border-slate-200">
                  {sectionItems.length === 0 ? (
                    <div className="p-5 text-center text-xs text-slate-500">
                      Sin partidas ingresadas en{" "}
                      <strong>
                        {section.sectionCode} {section.title}
                      </strong>
                      . Selecciónalas en el formulario superior para agregarlas.
                    </div>
                  ) : (
                    <>
                      {/* =========================================================
                          1. VISTA MÓVIL (< 768px y especialmente 320px): CARDS
                         ========================================================= */}
                      <div className="flex flex-col divide-y divide-slate-200 bg-slate-50/60 p-2.5 md:hidden">
                        {sectionItems.map((item, idx) => {
                          const prevItem = sectionItems[idx - 1];
                          const showSubheader =
                            item.subheaderCode &&
                            (!prevItem ||
                              prevItem.subheaderCode !== item.subheaderCode);
                          const isEditing = editingItemCode === item.itemCode;
                          const previewTotalCost =
                            (Number(editFormData.quantity) || 0) *
                            (Number(editFormData.unitCost) || 0);

                          return (
                            <Fragment key={item.itemCode}>
                              {showSubheader && (
                                <div className="mb-2 mt-1 rounded-xl bg-slate-200/80 px-3 py-2 text-xs font-bold text-slate-800">
                                  <span className="font-mono text-emerald-800">
                                    {item.subheaderCode}
                                  </span>{" "}
                                  — {item.subheaderTitle}
                                </div>
                              )}

                              <article
                                className={`mb-2.5 rounded-xl border p-3 shadow-2xs transition-colors last:mb-0 ${
                                  isEditing
                                    ? "border-blue-400 bg-blue-50/40"
                                    : "border-slate-200 bg-white"
                                }`}
                              >
                                {/* Cabecera de la Card: Código + Descripción en todo el ancho superior + Botón flotante eliminar */}
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <span
                                      translate="no"
                                      className="notranslate tabular-nums inline-block rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-700"
                                    >
                                      {`Ítem ${item.itemCode}`}
                                    </span>

                                    {isEditing ? (
                                      <div className="mt-2">
                                        <label className="mb-1 block text-[11px] font-bold uppercase text-slate-600">
                                          Descripción
                                        </label>
                                        <input
                                          type="text"
                                          value={editFormData.description}
                                          onChange={(e) =>
                                            onEditFormChange({
                                              ...editFormData,
                                              description: e.target.value,
                                            })
                                          }
                                          className="min-h-[44px] w-full rounded-xl border border-blue-400 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                        />
                                      </div>
                                    ) : (
                                      <h3 className="mt-1.5 text-sm font-bold leading-snug text-slate-900">
                                        {item.description}
                                      </h3>
                                    )}
                                  </div>

                                  {/* Botón icono flotante para eliminar fila (>= 44x44px) */}
                                  <button
                                    type="button"
                                    onClick={() => onDeleteItem(item.itemCode)}
                                    aria-label={`Eliminar partida ${item.itemCode}`}
                                    title="Eliminar partida"
                                    className="inline-flex min-h-[44px] min-w-[44px] shrink-0 cursor-pointer items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                                  >
                                    <svg
                                      className="h-5 w-5"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                      strokeWidth={2}
                                      aria-hidden="true"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                  </button>
                                </div>

                                {/* Cuadrícula compacta para campos numéricos: Cantidad, Unidad y P. Unitario */}
                                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                                  {/* Cantidad */}
                                  <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                                    <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                      Cantidad
                                    </span>
                                    {isEditing ? (
                                      <input
                                        type="number"
                                        inputMode="decimal"
                                        step="any"
                                        min="0.01"
                                        value={editFormData.quantity}
                                        onChange={(e) =>
                                          onEditFormChange({
                                            ...editFormData,
                                            quantity: e.target.value,
                                          })
                                        }
                                        className="tabular-nums mt-1 min-h-[44px] w-full rounded-lg border border-blue-400 bg-white px-2.5 py-1.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                      />
                                    ) : (
                                      <span
                                        translate="no"
                                        className="notranslate tabular-nums mt-0.5 block text-sm font-bold text-slate-900"
                                      >
                                        {item.quantity}
                                      </span>
                                    )}
                                  </div>

                                  {/* Unidad */}
                                  <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                                    <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                      Unidad
                                    </span>
                                    {isEditing ? (
                                      <select
                                        value={editFormData.unit}
                                        onChange={(e) =>
                                          onEditFormChange({
                                            ...editFormData,
                                            unit: e.target.value,
                                          })
                                        }
                                        className="mt-1 min-h-[44px] w-full rounded-lg border border-blue-400 bg-white px-2 py-1.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                      >
                                        {UNIDADES_DISPONIBLES.map((unidad) => (
                                          <option key={unidad} value={unidad}>
                                            {unidad}
                                          </option>
                                        ))}
                                      </select>
                                    ) : (
                                      <span
                                        translate="no"
                                        className="notranslate mt-0.5 inline-block rounded-full bg-slate-200/80 px-2 py-0.5 text-xs font-semibold text-slate-800"
                                      >
                                        {item.unit}
                                      </span>
                                    )}
                                  </div>

                                  {/* Precio Unitario (ocupa las 2 columnas en 320px para comodidad táctil) */}
                                  <div className="col-span-2 rounded-lg bg-slate-50 px-2.5 py-2">
                                    <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                      Precio Unitario (CLP)
                                    </span>
                                    {isEditing ? (
                                      <input
                                        type="number"
                                        inputMode="numeric"
                                        step="1"
                                        min="0"
                                        value={editFormData.unitCost}
                                        onChange={(e) =>
                                          onEditFormChange({
                                            ...editFormData,
                                            unitCost: e.target.value,
                                          })
                                        }
                                        className="tabular-nums mt-1 min-h-[44px] w-full rounded-lg border border-blue-400 bg-white px-2.5 py-1.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                      />
                                    ) : (
                                      <span
                                        translate="no"
                                        className="notranslate tabular-nums mt-0.5 block text-sm font-semibold text-slate-800"
                                      >
                                        {formatCurrency(item.unitCost)}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Pie de la Card: Botón Editar a la izquierda + Total de la partida destacado en la esquina inferior derecha */}
                                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                                  <div>
                                    {isEditing ? (
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            onSaveEdit(item.itemCode)
                                          }
                                          className="min-h-[44px] cursor-pointer rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-2xs transition-colors hover:bg-emerald-800"
                                        >
                                          Guardar
                                        </button>
                                        <button
                                          type="button"
                                          onClick={onCancelEdit}
                                          className="min-h-[44px] cursor-pointer rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                                        >
                                          Cancelar
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => onStartEdit(item)}
                                        className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-50"
                                      >
                                        <svg
                                          className="h-4 w-4"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                          strokeWidth={2}
                                          aria-hidden="true"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                          />
                                        </svg>
                                        <span>Editar fila</span>
                                      </button>
                                    )}
                                  </div>

                                  {/* Total de la partida destacado en la esquina inferior derecha */}
                                  <div
                                    translate="no"
                                    className="notranslate rounded-xl bg-emerald-50 px-3 py-1.5 text-right"
                                  >
                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                                      Total Partida
                                    </span>
                                    <span className="tabular-nums text-base font-black text-emerald-950">
                                      {isEditing
                                        ? formatCurrency(previewTotalCost)
                                        : formatCurrency(item.totalCost)}
                                    </span>
                                  </div>
                                </div>
                              </article>
                            </Fragment>
                          );
                        })}
                      </div>

                      {/* =========================================================
                          2. VISTA ESCRITORIO (>= 768px): TABLA CLÁSICA ALINEADA
                         ========================================================= */}
                      <div className="hidden overflow-x-auto md:block">
                        <table className="w-full border-collapse text-left text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-100 text-xs font-bold uppercase tracking-wider text-slate-700">
                              <th className="w-20 border-r border-slate-200 px-3 py-2.5">
                                Ítem
                              </th>
                              <th className="border-r border-slate-200 px-4 py-2.5">
                                Descripción / Partida
                              </th>
                              <th className="w-24 border-r border-slate-200 px-3 py-2.5 text-center">
                                Cantidad
                              </th>
                              <th className="w-28 border-r border-slate-200 px-3 py-2.5 text-center">
                                Unidad
                              </th>
                              <th className="w-36 border-r border-slate-200 px-3 py-2.5 text-right">
                                Costo unitario
                              </th>
                              <th className="w-36 border-r border-slate-200 px-3 py-2.5 text-right">
                                Costo partida
                              </th>
                              <th className="w-40 px-3 py-2.5 text-center">
                                Acción
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {sectionItems.map((item, idx) => {
                              const prevItem = sectionItems[idx - 1];
                              const showSubheader =
                                item.subheaderCode &&
                                (!prevItem ||
                                  prevItem.subheaderCode !==
                                    item.subheaderCode);
                              const isEditing =
                                editingItemCode === item.itemCode;
                              const previewTotalCost =
                                (Number(editFormData.quantity) || 0) *
                                (Number(editFormData.unitCost) || 0);

                              return (
                                <Fragment key={item.itemCode}>
                                  {showSubheader && (
                                    <tr className="bg-slate-50 font-bold text-slate-800">
                                      <td className="border-r border-slate-200 px-3 py-2 font-mono text-xs">
                                        {item.subheaderCode}
                                      </td>
                                      <td colSpan={6} className="px-4 py-2">
                                        {item.subheaderTitle}
                                      </td>
                                    </tr>
                                  )}

                                  <tr
                                    className={
                                      isEditing
                                        ? "bg-blue-50/60"
                                        : "transition-colors hover:bg-emerald-50/40"
                                    }
                                  >
                                    <td
                                      translate="no"
                                      className="notranslate tabular-nums whitespace-nowrap border-r border-slate-200 px-3 py-2.5 font-mono text-xs font-semibold text-slate-700"
                                    >
                                      {item.itemCode}
                                    </td>

                                    <td className="border-r border-slate-200 px-4 py-2.5 text-slate-900">
                                      {isEditing ? (
                                        <input
                                          type="text"
                                          value={editFormData.description}
                                          onChange={(e) =>
                                            onEditFormChange({
                                              ...editFormData,
                                              description: e.target.value,
                                            })
                                          }
                                          className="min-h-[44px] w-full rounded-lg border border-blue-400 bg-white px-2.5 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                        />
                                      ) : (
                                        item.description
                                      )}
                                    </td>

                                    <td
                                      translate="no"
                                      className="notranslate tabular-nums whitespace-nowrap border-r border-slate-200 px-3 py-2.5 text-center text-slate-800"
                                    >
                                      {isEditing ? (
                                        <input
                                          type="number"
                                          inputMode="decimal"
                                          step="any"
                                          min="0.01"
                                          value={editFormData.quantity}
                                          onChange={(e) =>
                                            onEditFormChange({
                                              ...editFormData,
                                              quantity: e.target.value,
                                            })
                                          }
                                          className="tabular-nums min-h-[44px] w-20 rounded-lg border border-blue-400 bg-white px-2 py-1.5 text-center text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                        />
                                      ) : (
                                        item.quantity
                                      )}
                                    </td>

                                    <td
                                      translate="no"
                                      className="notranslate whitespace-nowrap border-r border-slate-200 px-3 py-2.5 text-center text-slate-800"
                                    >
                                      {isEditing ? (
                                        <select
                                          value={editFormData.unit}
                                          onChange={(e) =>
                                            onEditFormChange({
                                              ...editFormData,
                                              unit: e.target.value,
                                            })
                                          }
                                          className="min-h-[44px] rounded-lg border border-blue-400 bg-white px-2 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                        >
                                          {UNIDADES_DISPONIBLES.map(
                                            (unidad) => (
                                              <option
                                                key={unidad}
                                                value={unidad}
                                              >
                                                {unidad}
                                              </option>
                                            )
                                          )}
                                        </select>
                                      ) : (
                                        item.unit
                                      )}
                                    </td>

                                    <td
                                      translate="no"
                                      className="notranslate tabular-nums whitespace-nowrap border-r border-slate-200 px-3 py-2.5 text-right text-slate-800"
                                    >
                                      {isEditing ? (
                                        <input
                                          type="number"
                                          inputMode="numeric"
                                          step="1"
                                          min="0"
                                          value={editFormData.unitCost}
                                          onChange={(e) =>
                                            onEditFormChange({
                                              ...editFormData,
                                              unitCost: e.target.value,
                                            })
                                          }
                                          className="tabular-nums min-h-[44px] w-28 rounded-lg border border-blue-400 bg-white px-2 py-1.5 text-right text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                        />
                                      ) : (
                                        formatCurrency(item.unitCost)
                                      )}
                                    </td>

                                    <td
                                      translate="no"
                                      className="notranslate tabular-nums whitespace-nowrap border-r border-slate-200 px-3 py-2.5 text-right font-bold text-slate-950"
                                    >
                                      {isEditing
                                        ? formatCurrency(previewTotalCost)
                                        : formatCurrency(item.totalCost)}
                                    </td>

                                    <td className="whitespace-nowrap px-3 py-2.5 text-center">
                                      {isEditing ? (
                                        <div className="flex items-center justify-center gap-1.5">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              onSaveEdit(item.itemCode)
                                            }
                                            className="min-h-[44px] cursor-pointer rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-emerald-800"
                                          >
                                            Guardar
                                          </button>
                                          <button
                                            type="button"
                                            onClick={onCancelEdit}
                                            className="min-h-[44px] cursor-pointer rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                                          >
                                            Cancelar
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="flex items-center justify-center gap-1.5">
                                          <button
                                            type="button"
                                            onClick={() => onStartEdit(item)}
                                            className="min-h-[44px] cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-50"
                                          >
                                            Editar
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              onDeleteItem(item.itemCode)
                                            }
                                            className="min-h-[44px] cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                                          >
                                            Quitar
                                          </button>
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                </Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pie de Resumen General y Firma */}
      <footer
        key={`footer-total-${items.length}-${grandTotal}`}
        translate="no"
        className="notranslate mt-2 flex flex-col justify-between gap-3 rounded-2xl border-2 border-slate-900 bg-slate-900 px-4 py-4 text-white sm:flex-row sm:items-center sm:px-6"
      >
        <div>
          <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Responsable / Firma
          </span>
          <span className="text-sm font-bold tracking-wide text-slate-100">
            {signerName}
          </span>
        </div>

        <div className="flex items-baseline justify-between gap-4 border-t border-slate-800 pt-3 sm:border-t-0 sm:pt-0">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            {`Total General (${items.length} ${
              items.length === 1 ? "partida" : "partidas"
            })`}
          </span>
          <output
            aria-live="polite"
            className="fluid-kpi tabular-nums font-black text-white"
          >
            {formatCurrency(grandTotal)}
          </output>
        </div>
      </footer>
    </section>
  );
}
