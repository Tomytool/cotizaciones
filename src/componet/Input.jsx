import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  CATALOG_ITEMS,
  CATALOG_SECTIONS,
  UNIDADES_DISPONIBLES,
} from "../data/itemsData";

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
 * Normaliza un valor numérico para Cantidad (admite decimales con punto o coma)
 */
const parseQuantityValue = (raw) => {
  if (raw === "" || raw === null || raw === undefined) return 0;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0;
  const normalized = String(raw).trim().replace(",", ".");
  const parsed = parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Normaliza un valor numérico para Precio Unitario en CLP
 */
const parseUnitCostValue = (raw) => {
  if (raw === "" || raw === null || raw === undefined) return 0;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0;
  const cleaned = String(raw).replace(/[^\d.-]/g, "");
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Formulario con react-hook-form (useForm) optimizado para 320px:
 * - Selector de Cabecera (1.0 a 8.0)
 * - Selector de Ítem (1.1, 1.2, 2.1, etc.)
 * - Inputs numéricos con inputMode="decimal" e inputMode="numeric" (teclado numérico nativo)
 * - Cálculo en tiempo real de TOTAL PARTIDA compatible con React Compiler
 * - Altura mínima táctil de 44px en todos los campos y botones
 */
export default function Input({ onAddItem }) {
  "use no memo";

  const [liveSectionCode, setLiveSectionCode] = useState("1.0");
  const [liveItemCode, setLiveItemCode] = useState("");
  const [liveQuantity, setLiveQuantity] = useState("");
  const [liveUnitCost, setLiveUnitCost] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      sectionCode: "1.0",
      itemCode: "",
      description: "",
      quantity: "",
      unit: "",
      unitCost: "",
    },
  });

  // Filtramos las opciones de ítems (1.1, 1.2, etc.) según la cabecera seleccionada (1.0 - 8.0)
  const availableItems = liveSectionCode
    ? CATALOG_ITEMS.filter((item) => item.sectionCode === liveSectionCode)
    : CATALOG_ITEMS;

  // Buscamos la referencia en el catálogo para mostrarla como sugerencia en el placeholder
  const selectedCatalogItem = CATALOG_ITEMS.find(
    (item) => item.itemCode === liveItemCode
  );

  // Cálculo automático en tiempo real del costo de la partida (Cantidad * P. Unitario)
  const numericQuantity = parseQuantityValue(liveQuantity);
  const numericUnitCost = parseUnitCostValue(liveUnitCost);
  const calculatedTotalCost = Math.round(numericQuantity * numericUnitCost);

  // Al cambiar la cabecera (1.0 - 8.0), limpiamos el ítem seleccionado para elegir uno de esa sección
  const handleSectionChange = (e) => {
    const newSection = e.target.value;
    setLiveSectionCode(newSection);
    setLiveItemCode("");
    setLiveQuantity("");
    setLiveUnitCost("");

    setValue("sectionCode", newSection, { shouldValidate: true });
    setValue("itemCode", "");
    setValue("description", "");
    setValue("unit", "");
    setValue("unitCost", "");
    setValue("quantity", "");
  };

  // Al seleccionar un ítem (ej. 1.1, 1.2) en el selector, cargamos su descripción y unidad
  const handleItemSelectChange = (e) => {
    const chosenCode = e.target.value;
    setLiveItemCode(chosenCode);
    setValue("itemCode", chosenCode, { shouldValidate: true });

    const catalogEntry = CATALOG_ITEMS.find(
      (item) => item.itemCode === chosenCode
    );

    if (catalogEntry) {
      setLiveSectionCode(catalogEntry.sectionCode);
      setValue("sectionCode", catalogEntry.sectionCode, {
        shouldValidate: true,
      });
      setValue("description", catalogEntry.description, {
        shouldValidate: true,
      });
      setValue("unit", catalogEntry.unit, { shouldValidate: true });
    }
  };

  // Envío del formulario hacia la estructura de base de datos del presupuesto
  const onSubmit = (data) => {
    const finalSectionCode = data.sectionCode || liveSectionCode || "1.0";
    const finalItemCode = data.itemCode || liveItemCode;

    const catalogEntry = CATALOG_ITEMS.find(
      (item) => item.itemCode === finalItemCode
    );

    const qtyNum = parseQuantityValue(
      data.quantity !== "" && data.quantity !== undefined
        ? data.quantity
        : liveQuantity
    );
    const costNum = parseUnitCostValue(
      data.unitCost !== "" && data.unitCost !== undefined
        ? data.unitCost
        : liveUnitCost
    );
    const totalPartida = Math.round(qtyNum * costNum);

    const newItem = {
      sectionCode: finalSectionCode,
      subheaderCode: catalogEntry?.subheaderCode || undefined,
      subheaderTitle: catalogEntry?.subheaderTitle || undefined,
      itemCode: finalItemCode,
      description: (data.description || catalogEntry?.description || "").trim(),
      quantity: qtyNum,
      unit: data.unit || catalogEntry?.unit || "Global",
      unitCost: costNum,
      totalCost: totalPartida,
    };

    if (onAddItem) {
      onAddItem(newItem);
    }

    // Reiniciamos los campos del ítem manteniendo la cabecera actual para agilizar la carga en terreno
    setLiveItemCode("");
    setLiveQuantity("");
    setLiveUnitCost("");

    reset({
      sectionCode: finalSectionCode,
      itemCode: "",
      description: "",
      quantity: "",
      unit: "",
      unitCost: "",
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="w-full rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-6"
    >
      <div className="mb-4 flex flex-col justify-between gap-1 border-b border-slate-100 pb-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">
            Agregar Partida a la Cotización
          </h2>
          <p className="text-xs text-slate-600 sm:text-sm">
            Selecciona el capítulo (`1.0` a `8.0`), elige la partida (`1.1`,
            `1.2`...) e ingresa su cantidad y costo unitario.
          </p>
        </div>
      </div>

      {/* Grilla responsiva Mobile-First (320px -> 1 col, sm -> 2 cols, lg -> 12 cols) */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-12">
        {/* 1. Selector de Cabecera / Capítulo (1.0 al 8.0) */}
        <div className="flex flex-col gap-1 sm:col-span-1 lg:col-span-4">
          <label
            htmlFor="sectionCode"
            className="text-xs font-bold uppercase tracking-wide text-slate-700"
          >
            1. Capítulo (`1.0` - `8.0`)
          </label>
          <select
            id="sectionCode"
            {...register("sectionCode", {
              required: "Selecciona una cabecera",
              onChange: handleSectionChange,
            })}
            className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-colors focus-visible:border-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/20"
          >
            {CATALOG_SECTIONS.map((sec) => (
              <option key={sec.sectionCode} value={sec.sectionCode}>
                {sec.sectionCode} — {sec.title}
              </option>
            ))}
          </select>
          {errors.sectionCode && (
            <span role="alert" className="text-xs font-medium text-red-600">
              {errors.sectionCode.message}
            </span>
          )}
        </div>

        {/* 2. Selector de Ítem (1.1, 1.2, 2.1, etc.) */}
        <div className="flex flex-col gap-1 sm:col-span-1 lg:col-span-4">
          <label
            htmlFor="itemCode"
            className="text-xs font-bold uppercase tracking-wide text-slate-700"
          >
            2. Partida (`1.1`, `1.2`...)
          </label>
          <select
            id="itemCode"
            {...register("itemCode", {
              required: "Debes seleccionar un ítem de la lista",
              onChange: handleItemSelectChange,
            })}
            className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-colors focus-visible:border-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/20"
          >
            <option value="" disabled>
              -- Elige un ítem ({availableItems.length} opciones) --
            </option>
            {availableItems.map((item) => (
              <option key={item.itemCode} value={item.itemCode}>
                {item.itemCode} — {item.description}
              </option>
            ))}
          </select>
          {errors.itemCode && (
            <span role="alert" className="text-xs font-medium text-red-600">
              {errors.itemCode.message}
            </span>
          )}
        </div>

        {/* 3. Descripción de la Partida */}
        <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-4">
          <label
            htmlFor="description"
            className="text-xs font-bold uppercase tracking-wide text-slate-700"
          >
            Descripción de la Partida
          </label>
          <input
            id="description"
            type="text"
            placeholder="Se autocompleta al elegir el ítem..."
            {...register("description", {
              required: "La descripción es obligatoria",
            })}
            className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-slate-50/70 px-3 py-2 text-sm text-slate-900 transition-colors focus-visible:border-emerald-600 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/20"
          />
          {errors.description && (
            <span role="alert" className="text-xs font-medium text-red-600">
              {errors.description.message}
            </span>
          )}
        </div>

        {/* Sub-grilla compacta 2x2 en móvil (320px) para Cantidad, Unidad, Costo Unitario y Total */}
        <div className="grid grid-cols-2 gap-3 sm:col-span-2 lg:col-span-10 lg:grid-cols-10">
          {/* 4. Cantidad (con inputMode="decimal" para teclado numérico nativo) */}
          <div className="flex flex-col gap-1 lg:col-span-2">
            <label
              htmlFor="quantity"
              className="text-xs font-bold uppercase tracking-wide text-slate-700"
            >
              Cantidad
            </label>
            <input
              id="quantity"
              type="number"
              inputMode="decimal"
              step="any"
              min="0.01"
              placeholder={
                selectedCatalogItem
                  ? `Ej: ${selectedCatalogItem.defaultQuantity}`
                  : "Ej: 1"
              }
              {...register("quantity", {
                required: "Ingresa la cantidad",
                onChange: (e) => setLiveQuantity(e.target.value),
                validate: (val) =>
                  parseQuantityValue(val) > 0 || "Mayor a 0",
              })}
              onInput={(e) => setLiveQuantity(e.currentTarget.value)}
              className="tabular-nums min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 transition-colors focus-visible:border-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/20"
            />
            {errors.quantity && (
              <span role="alert" className="text-xs font-medium text-red-600">
                {errors.quantity.message}
              </span>
            )}
          </div>

          {/* 5. Selector de Unidad (placeholder --unidad-- oculto en el desplegable) */}
          <div className="flex flex-col gap-1 lg:col-span-2">
            <label
              htmlFor="unit"
              className="text-xs font-bold uppercase tracking-wide text-slate-700"
            >
              Unidad
            </label>
            <select
              id="unit"
              {...register("unit", {
                required: "Selecciona unidad",
              })}
              className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-2.5 py-2 text-sm font-medium text-slate-900 transition-colors focus-visible:border-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/20"
            >
              <option value="" disabled hidden>
                --unidad--
              </option>
              {UNIDADES_DISPONIBLES.map((unidad) => (
                <option key={unidad} value={unidad}>
                  {unidad}
                </option>
              ))}
            </select>
            {errors.unit && (
              <span role="alert" className="text-xs font-medium text-red-600">
                {errors.unit.message}
              </span>
            )}
          </div>

          {/* 6. Costo Unitario (con inputMode="numeric" para teclado numérico nativo) */}
          <div className="flex flex-col gap-1 lg:col-span-3">
            <label
              htmlFor="unitCost"
              className="text-xs font-bold uppercase tracking-wide text-slate-700"
            >
              P. Unitario (CLP)
            </label>
            <input
              id="unitCost"
              type="number"
              inputMode="numeric"
              step="1"
              min="0"
              placeholder={
                selectedCatalogItem
                  ? `Ref: ${selectedCatalogItem.referenceUnitCost}`
                  : "Ej: 29000"
              }
              {...register("unitCost", {
                required: "Ingresa el costo unitario",
                onChange: (e) => setLiveUnitCost(e.target.value),
                validate: (val) =>
                  (val !== "" && parseUnitCostValue(val) >= 0) ||
                  "Ingresa un monto válido",
              })}
              onInput={(e) => setLiveUnitCost(e.currentTarget.value)}
              className="tabular-nums min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 transition-colors focus-visible:border-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/20"
            />
            {errors.unitCost && (
              <span role="alert" className="text-xs font-medium text-red-600">
                {errors.unitCost.message}
              </span>
            )}
          </div>

          {/* 7. Costo Partida Calculado (totalCost) */}
          <div
            key={`live-total-${calculatedTotalCost}`}
            className="flex flex-col gap-1 lg:col-span-3"
            translate="no"
          >
            <label
              htmlFor="totalCostDisplay"
              className="text-xs font-bold uppercase tracking-wide text-slate-700"
            >
              Total Partida
            </label>
            <input
              id="totalCostDisplay"
              type="text"
              readOnly
              value={formatCurrency(calculatedTotalCost)}
              className="notranslate tabular-nums min-h-[44px] w-full cursor-not-allowed rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-sm font-extrabold text-emerald-950"
            />
          </div>
        </div>

        {/* 8. Botón de Acción Táctil (>= 44px, contraste WCAG AA >= 5.48:1) */}
        <div className="flex items-end sm:col-span-2 lg:col-span-2">
          <button
            type="submit"
            className="flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
          >
            <svg
              className="h-4 w-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>Agregar Ítem</span>
          </button>
        </div>
      </div>
    </form>
  );
}
