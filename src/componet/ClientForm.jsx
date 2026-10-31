import { useState } from "react";
import { useForm } from "react-hook-form";
import mgsgLogo from "../assets/mgsg-logo.svg";

/**
 * Normaliza texto eliminando tildes y pasando a minúsculas para búsquedas instantáneas
 * siguiendo @react-best-practices (structure-complex-derived-logic).
 */
const normalizeSearchText = (text) =>
  String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

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
 * Filtra proyectos y clientes anteriores según el término de búsqueda (por cliente, obra o dirección)
 */
const filterHistoryByQuery = (savedProjects, savedClients, rawQuery, scope) => {
  const query = normalizeSearchText(rawQuery);

  // Construimos registros unificados: cada proyecto anterior + clientes que aún no tengan proyecto
  const projectClientEmails = new Set(
    savedProjects.map((p) => normalizeSearchText(p.clientEmail))
  );

  const clientOnlyRecords = savedClients
    .filter((c) => !projectClientEmails.has(normalizeSearchText(c.clientEmail)))
    .map((c) => ({
      id: `client-only-${c.id}`,
      clientId: c.id,
      clientName: c.clientName,
      clientPhone: c.clientPhone,
      clientEmail: c.clientEmail,
      projectName: "",
      projectAddress: "",
      tentativeStartDate: "",
      items: [],
      isClientOnly: true,
    }));

  const allRecords = [...savedProjects, ...clientOnlyRecords];

  if (!query) {
    if (scope === "projects") {
      return allRecords.filter((r) => !r.isClientOnly && r.projectName);
    }
    return allRecords;
  }

  return allRecords.filter((record) => {
    const clientMatch =
      normalizeSearchText(record.clientName).includes(query) ||
      normalizeSearchText(record.clientEmail).includes(query) ||
      normalizeSearchText(record.clientPhone).includes(query);

    const projectMatch =
      normalizeSearchText(record.projectName).includes(query) ||
      normalizeSearchText(record.projectAddress).includes(query);

    if (scope === "clients") return clientMatch;
    if (scope === "projects") return projectMatch && Boolean(record.projectName);
    return clientMatch || projectMatch;
  });
};

/**
 * Formulario inicial (Paso 1 de 2) optimizado con @ui-ux-pro-max, @frontend-ui-engineering y @react-best-practices:
 * - Buscador Unificado e Instantáneo por Nombre de Cliente o Nombre de Proyecto.
 * - Permite dos acciones rápidas:
 *   1. "Ocupar Solo Cliente" (carga Nombre, Teléfono y Correo para un proyecto nuevo).
 *   2. "Cargar Proyecto Completo" (carga Cliente + Obra + Dirección + Fecha + Partidas guardadas).
 */
export default function ClientForm({
  initialValues,
  savedClients = [],
  savedProjects = [],
  onClientCreated,
}) {
  "use no memo";

  const [entryMode, setEntryMode] = useState("new"); // "new" | "search"
  const [searchQuery, setSearchQuery] = useState("");
  const [searchScope, setSearchScope] = useState("all"); // "all" | "clients" | "projects"
  const [selectedClientId, setSelectedClientId] = useState(undefined);
  const [selectedProjectId, setSelectedProjectId] = useState(undefined);
  const [loadedProjectItems, setLoadedProjectItems] = useState(undefined);
  const [selectionBanner, setSelectionBanner] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm({
    defaultValues: {
      clientName: initialValues?.clientName || "",
      clientPhone: initialValues?.clientPhone || "",
      clientEmail: initialValues?.clientEmail || "",
      projectName: initialValues?.projectName || "",
      projectAddress: initialValues?.projectAddress || "",
      tentativeStartDate: initialValues?.tentativeStartDate || "",
    },
  });

  const filteredRecords = filterHistoryByQuery(
    savedProjects,
    savedClients,
    searchQuery,
    searchScope
  );

  // Cambiar entre "Crear Desde Cero" y "Buscar Cliente o Proyecto Anterior"
  const handleModeSwitch = (mode) => {
    setEntryMode(mode);
    if (mode === "new") {
      setSelectedClientId(undefined);
      setSelectedProjectId(undefined);
      setLoadedProjectItems(undefined);
      setSelectionBanner("");
      setValue("clientName", "");
      setValue("clientPhone", "");
      setValue("clientEmail", "");
      setValue("projectName", "");
      setValue("projectAddress", "");
      setValue("tentativeStartDate", "");
      clearErrors();
    }
  };

  // Acción 1: Ocupar únicamente los datos del cliente (para cotizarle un proyecto nuevo)
  const handleUseClientOnly = (record) => {
    setSelectedClientId(record.clientId || record.id);
    setSelectedProjectId(undefined);
    setLoadedProjectItems([]);
    setSelectionBanner(
      `Cliente «${record.clientName}» cargado. Ahora ingresa abajo los datos del nuevo proyecto.`
    );

    setValue("clientName", record.clientName, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue("clientPhone", record.clientPhone, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue("clientEmail", record.clientEmail, {
      shouldValidate: true,
      shouldDirty: true,
    });

    // Limpiamos los campos de proyecto para que ingrese la nueva obra
    setValue("projectName", "");
    setValue("projectAddress", "");
    setValue("tentativeStartDate", "");
    clearErrors(["clientName", "clientPhone", "clientEmail"]);
  };

  // Acción 2: Cargar un proyecto anterior completo (Cliente + Obra + Dirección + Fecha + Partidas)
  const handleLoadFullProject = (record) => {
    setSelectedClientId(record.clientId || record.id);
    setSelectedProjectId(record.id);
    setLoadedProjectItems(Array.isArray(record.items) ? record.items : []);
    setSelectionBanner(
      `Proyecto «${record.projectName}» (${record.clientName}) cargado con ${
        record.items?.length || 0
      } partidas.`
    );

    setValue("clientName", record.clientName, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue("clientPhone", record.clientPhone, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue("clientEmail", record.clientEmail, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue("projectName", record.projectName, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue("projectAddress", record.projectAddress, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue("tentativeStartDate", record.tentativeStartDate, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  // Envío del formulario hacia la vista de cotización
  const onSubmit = (data) => {
    if (onClientCreated) {
      onClientCreated({
        clientId: selectedClientId,
        projectId: selectedProjectId,
        clientName: data.clientName.trim(),
        clientPhone: data.clientPhone.trim(),
        clientEmail: data.clientEmail.trim(),
        projectName: data.projectName.trim(),
        projectAddress: data.projectAddress.trim(),
        tentativeStartDate: data.tentativeStartDate,
        loadedItems: loadedProjectItems,
      });
    }
  };

  return (
    <section className="mx-auto flex min-h-[88dvh] w-full max-w-3xl flex-col justify-center py-3 sm:py-8">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Encabezado corporativo con el logo MGSG */}
        <div className="flex flex-col items-center gap-3.5 border-b border-slate-800 bg-slate-900 px-4 py-5 text-center text-white sm:flex-row sm:px-6 sm:py-6 sm:text-left">
          <img
            src={mgsgLogo}
            alt="Logo Constructora María Graciela Silva Gallardo (MGSG)"
            width={96}
            height={80}
            fetchPriority="high"
            decoding="async"
            className="h-20 w-24 shrink-0 rounded-xl border border-slate-700/80 shadow-sm"
          />
          <div className="min-w-0 flex-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-300">
              Paso 1 de 2 · Apertura y Búsqueda de Cotización
            </span>
            <h1 className="fluid-title mt-1.5 font-black tracking-tight text-white">
              Constructora María Graciela Silva Gallardo
            </h1>
            <p className="mt-1 text-xs leading-relaxed text-slate-200">
              Crea un cliente y obra desde cero, o busca por nombre de cliente o
              proyecto anterior para reutilizar sus datos.
            </p>
          </div>
        </div>

        {/* Selector Superior de Modo: Nuevo Registro vs Buscador de Cliente / Proyecto */}
        <div className="border-b border-slate-200 bg-slate-100/80 px-3.5 py-3 sm:px-6">
          <div
            role="group"
            aria-label="Modo de inicio de cotización"
            className="grid grid-cols-1 gap-2 rounded-xl bg-slate-200/80 p-1.5 sm:grid-cols-2"
          >
            <button
              type="button"
              aria-pressed={entryMode === "new"}
              onClick={() => handleModeSwitch("new")}
              className={`flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                entryMode === "new"
                  ? "bg-white text-emerald-800 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>Crear Nuevo Cliente / Proyecto</span>
            </button>

            <button
              type="button"
              aria-pressed={entryMode === "search"}
              onClick={() => setEntryMode("search")}
              className={`flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                entryMode === "search"
                  ? "bg-white text-emerald-800 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <span>
                Buscar Cliente o Proyecto Anterior ({savedProjects.length})
              </span>
            </button>
          </div>
        </div>

        {/* =====================================================================
            PANEL DE BÚSQUEDA UNIFICADA (POR CLIENTE O PROYECTO ANTERIOR)
           ===================================================================== */}
        {entryMode === "search" && (
          <div className="border-b border-emerald-200 bg-emerald-50/40 p-3.5 sm:px-6 sm:py-5">
            <div className="flex flex-col gap-3">
              {/* Barra de búsqueda instantánea + filtros rápidos */}
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                <label
                  htmlFor="unifiedHistorySearch"
                  className="text-xs font-bold uppercase tracking-wide text-emerald-950"
                >
                  Buscador por Nombre de Cliente o Proyecto
                </label>

                {/* Filtros rápidos de alcance */}
                <div
                  role="group"
                  aria-label="Filtrar búsqueda por tipo"
                  className="flex flex-wrap gap-1.5"
                >
                  {[
                    { id: "all", label: "Todos" },
                    { id: "projects", label: "Por Proyecto" },
                    { id: "clients", label: "Por Cliente" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSearchScope(tab.id)}
                      className={`min-h-[34px] cursor-pointer rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
                        searchScope === tab.id
                          ? "bg-emerald-700 text-white"
                          : "border border-emerald-200 bg-white text-slate-700 hover:bg-emerald-100/50"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input de búsqueda con icono y botón limpiar */}
              <div className="relative flex items-center">
                <svg
                  className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  id="unifiedHistorySearch"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Escribe el nombre del cliente (ej. Carlos) o del proyecto (ej. Casa 70m2, Valparaíso)..."
                  className="min-h-[44px] w-full rounded-xl border border-emerald-300 bg-white pl-10 pr-10 py-2.5 text-base text-slate-900 shadow-2xs transition-colors placeholder:text-slate-400 focus-visible:border-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/20 sm:text-sm"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Limpiar búsqueda"
                    className="absolute right-1.5 inline-flex min-h-[36px] min-w-[36px] cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Lista de resultados encontrados */}
              {filteredRecords.length === 0 ? (
                <div
                  role="status"
                  className="rounded-xl border border-slate-200 bg-white p-4 text-center text-xs text-slate-600"
                >
                  No se encontraron clientes ni proyectos que coincidan con{" "}
                  <strong>«{searchQuery}»</strong>. Puedes completar los campos
                  de abajo para crearlo desde cero.
                </div>
              ) : (
                <div className="grid max-h-72 grid-cols-1 gap-2.5 overflow-y-auto pr-0.5">
                  {filteredRecords.map((record) => {
                    const itemsCount = Array.isArray(record.items)
                      ? record.items.length
                      : 0;
                    const projectTotal = (record.items || []).reduce(
                      (acc, i) => acc + (Number(i.totalCost) || 0),
                      0
                    );
                    const isSelectedProject = selectedProjectId === record.id;
                    const isSelectedClient =
                      !selectedProjectId &&
                      selectedClientId &&
                      (selectedClientId === record.clientId ||
                        selectedClientId === record.id);

                    return (
                      <article
                        key={record.id}
                        className={`flex flex-col justify-between gap-3 rounded-xl border p-3 transition-colors sm:flex-row sm:items-center ${
                          isSelectedProject || isSelectedClient
                            ? "border-emerald-600 bg-emerald-50/90 ring-1 ring-emerald-600"
                            : "border-slate-200 bg-white hover:border-emerald-300"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          {/* Nombre del Cliente y Contacto */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2 py-0.5 text-[11px] font-bold text-white">
                              Cliente: {record.clientName}
                            </span>
                            <span className="text-xs text-slate-600">
                              {record.clientPhone} · {record.clientEmail}
                            </span>
                          </div>

                          {/* Nombre del Proyecto si existe */}
                          {record.projectName ? (
                            <div className="mt-1.5">
                              <p className="text-sm font-bold text-slate-900">
                                Obra: {record.projectName}
                              </p>
                              <p
                                translate="no"
                                className="notranslate mt-0.5 text-xs text-slate-600"
                              >
                                {record.projectAddress} · Inicio:{" "}
                                {record.tentativeStartDate || "Sin fecha"} ·{" "}
                                <strong className="text-emerald-800">
                                  {itemsCount}{" "}
                                  {itemsCount === 1 ? "partida" : "partidas"} (
                                  {formatCurrency(projectTotal)})
                                </strong>
                              </p>
                            </div>
                          ) : (
                            <p className="mt-1 text-xs italic text-slate-500">
                              Cliente registrado sin proyecto previo asociado
                            </p>
                          )}
                        </div>

                        {/* Botones de Acción Rápida (>= 44px) */}
                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleUseClientOnly(record)}
                            className="min-h-[44px] flex-1 cursor-pointer rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 transition-colors hover:bg-slate-200/70 sm:flex-initial"
                          >
                            Ocupar Solo Cliente
                          </button>

                          {record.projectName && (
                            <button
                              type="button"
                              onClick={() => handleLoadFullProject(record)}
                              className="min-h-[44px] flex-1 cursor-pointer rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold text-white shadow-2xs transition-colors hover:bg-emerald-800 sm:flex-initial"
                            >
                              Cargar Proyecto
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Banner de confirmación cuando se cargan datos desde el buscador */}
        {selectionBanner && (
          <div
            role="status"
            aria-live="polite"
            className="mx-3.5 mt-4 flex items-center justify-between gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-950 sm:mx-6"
          >
            <span>{selectionBanner}</span>
            <button
              type="button"
              onClick={() => handleModeSwitch("new")}
              className="shrink-0 cursor-pointer underline hover:text-emerald-700"
            >
              Limpiar formulario
            </button>
          </div>
        )}

        {/* Formulario estructurado en 2 bloques: 1. Cliente | 2. Proyecto */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex flex-col gap-5 p-3.5 sm:gap-6 sm:p-6"
        >
          {/* =================================================================
              BLOQUE 1: IDENTIFICACIÓN Y CONTACTO DEL CLIENTE
             ================================================================= */}
          <fieldset className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 sm:p-5">
            <legend className="sr-only">Datos del Cliente</legend>

            {/* Cabecera del Bloque 1 */}
            <div className="flex flex-col justify-between gap-2 border-b border-slate-200/80 pb-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-xs font-black text-white">
                  1
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                    Información del Cliente
                  </h2>
                  <p className="text-xs text-slate-600">
                    Nombre, teléfono de contacto y correo electrónico del
                    cliente.
                  </p>
                </div>
              </div>
            </div>

            {/* Campos de datos del Cliente: Nombre, Teléfono y Correo */}
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              {/* Campo 1.1: Nombre del cliente */}
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label
                  htmlFor="clientName"
                  className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-700"
                >
                  <svg
                    className="h-4 w-4 shrink-0 text-emerald-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span>Nombre del cliente *</span>
                </label>
                <input
                  id="clientName"
                  type="text"
                  autoComplete="name"
                  placeholder="Ej: Juan Pérez González"
                  {...register("clientName", {
                    required: "El nombre del cliente es obligatorio",
                    minLength: {
                      value: 3,
                      message: "Ingresa al menos 3 caracteres",
                    },
                  })}
                  className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 transition-colors placeholder:text-slate-400 focus-visible:border-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/20 sm:text-sm"
                />
                {errors.clientName && (
                  <span
                    role="alert"
                    className="text-xs font-medium text-red-600"
                  >
                    {errors.clientName.message}
                  </span>
                )}
              </div>

              {/* Campo 1.2: Teléfono de contacto */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="clientPhone"
                  className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-700"
                >
                  <svg
                    className="h-4 w-4 shrink-0 text-emerald-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <span>Teléfono de contacto *</span>
                </label>
                <input
                  id="clientPhone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="Ej: +56 9 8765 4321"
                  {...register("clientPhone", {
                    required: "El teléfono de contacto es obligatorio",
                    pattern: {
                      value: /^[+\d\s()-]{7,20}$/,
                      message: "Ingresa un número de teléfono válido",
                    },
                  })}
                  className="tabular-nums min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 transition-colors placeholder:text-slate-400 focus-visible:border-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/20 sm:text-sm"
                />
                {errors.clientPhone && (
                  <span
                    role="alert"
                    className="text-xs font-medium text-red-600"
                  >
                    {errors.clientPhone.message}
                  </span>
                )}
              </div>

              {/* Campo 1.3: Correo electrónico */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="clientEmail"
                  className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-700"
                >
                  <svg
                    className="h-4 w-4 shrink-0 text-emerald-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span>Correo electrónico *</span>
                </label>
                <input
                  id="clientEmail"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="Ej: cliente@correo.cl"
                  {...register("clientEmail", {
                    required: "El correo electrónico es obligatorio",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Ingresa un correo electrónico válido",
                    },
                  })}
                  className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 transition-colors placeholder:text-slate-400 focus-visible:border-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/20 sm:text-sm"
                />
                {errors.clientEmail && (
                  <span
                    role="alert"
                    className="text-xs font-medium text-red-600"
                  >
                    {errors.clientEmail.message}
                  </span>
                )}
              </div>
            </div>
          </fieldset>

          {/* =================================================================
              BLOQUE 2: DATOS DEL PROYECTO / OBRA
             ================================================================= */}
          <fieldset className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 sm:p-5">
            <legend className="sr-only">Datos del Proyecto</legend>

            {/* Cabecera del Bloque 2 */}
            <div className="flex items-center gap-2.5 border-b border-slate-200/80 pb-3">
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-black text-emerald-300">
                2
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                  Datos del Proyecto / Obra
                </h2>
                <p className="text-xs text-slate-600">
                  Especifica el nombre o descripción de la obra, su dirección y
                  fecha tentativa de inicio.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              {/* Campo 2.1: Nombre / Descripción de la Obra * */}
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label
                  htmlFor="projectName"
                  className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-700"
                >
                  <svg
                    className="h-4 w-4 shrink-0 text-emerald-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  <span>Nombre / Descripción de la Obra *</span>
                </label>
                <input
                  id="projectName"
                  type="text"
                  placeholder="Ej: Casa habitación 70m2 sobre estructura metálica"
                  {...register("projectName", {
                    required: "La descripción de la obra es obligatoria",
                    minLength: {
                      value: 3,
                      message: "Ingresa al menos 3 caracteres",
                    },
                  })}
                  className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 transition-colors placeholder:text-slate-400 focus-visible:border-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/20 sm:text-sm"
                />
                {errors.projectName && (
                  <span
                    role="alert"
                    className="text-xs font-medium text-red-600"
                  >
                    {errors.projectName.message}
                  </span>
                )}
              </div>

              {/* Campo 2.2: Dirección de la Obra * */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="projectAddress"
                  className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-700"
                >
                  <svg
                    className="h-4 w-4 shrink-0 text-emerald-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span>Dirección de la Obra *</span>
                </label>
                <input
                  id="projectAddress"
                  type="text"
                  autoComplete="street-address"
                  placeholder="Ej: C° La Cruz, Valparaíso"
                  {...register("projectAddress", {
                    required: "La dirección de la obra es obligatoria",
                    minLength: {
                      value: 4,
                      message: "Ingresa una dirección válida",
                    },
                  })}
                  className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 transition-colors placeholder:text-slate-400 focus-visible:border-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/20 sm:text-sm"
                />
                {errors.projectAddress && (
                  <span
                    role="alert"
                    className="text-xs font-medium text-red-600"
                  >
                    {errors.projectAddress.message}
                  </span>
                )}
              </div>

              {/* Campo 2.3: Fecha tentativa de inicio * */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="tentativeStartDate"
                  className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-700"
                >
                  <svg
                    className="h-4 w-4 shrink-0 text-emerald-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span>Fecha tentativa de inicio *</span>
                </label>
                <input
                  id="tentativeStartDate"
                  type="date"
                  {...register("tentativeStartDate", {
                    required: "Selecciona la fecha tentativa de inicio",
                  })}
                  className="min-h-[44px] w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 transition-colors focus-visible:border-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/20 sm:text-sm"
                />
                {errors.tentativeStartDate && (
                  <span
                    role="alert"
                    className="text-xs font-medium text-red-600"
                  >
                    {errors.tentativeStartDate.message}
                  </span>
                )}
              </div>
            </div>
          </fieldset>

          {/* Botón táctil principal (>= 48px, contraste 5.48:1 WCAG AA / 7.43:1 hover AAA) */}
          <button
            type="submit"
            className="flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
          >
            <span>
              {selectedProjectId
                ? "Abrir Proyecto Cargado y sus Partidas"
                : "Guardar Datos e Ingresar Partidas de la Obra"}
            </span>
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
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </button>
        </form>
      </div>
    </section>
  );
}
