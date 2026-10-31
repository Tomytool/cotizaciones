import { lazy, Suspense, useState } from "react";
import ClientForm from "./componet/ClientForm";
import {
  CATALOG_SECTIONS,
  INITIAL_BUDGET_INFO,
  INITIAL_CLIENTS,
  INITIAL_PROJECTS,
} from "./data/itemsData";

// Carga diferida de los componentes del Paso 2 para optimizar el rendimiento inicial (Lighthouse Performance)
const BudgetHeader = lazy(() => import("./componet/BudgetHeader"));
const Input = lazy(() => import("./componet/Input"));
const BudgetSectionList = lazy(() => import("./componet/BudgetSectionList"));

const CLIENTS_STORAGE_KEY = "mgsg_saved_clients";
const PROJECTS_STORAGE_KEY = "mgsg_saved_projects";

/**
 * Carga inicial perezosa de clientes guardados desde localStorage o catálogo base
 * siguiendo @react-best-practices (rerender-lazy-state-init).
 */
const loadSavedClients = () => {
  try {
    const raw = window.localStorage.getItem(CLIENTS_STORAGE_KEY);
    if (!raw) return INITIAL_CLIENTS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : INITIAL_CLIENTS;
  } catch {
    return INITIAL_CLIENTS;
  }
};

/**
 * Carga inicial perezosa de proyectos/cotizaciones anteriores desde localStorage o catálogo base
 * siguiendo @react-best-practices (rerender-lazy-state-init).
 */
const loadSavedProjects = () => {
  try {
    const raw = window.localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!raw) return INITIAL_PROJECTS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : INITIAL_PROJECTS;
  } catch {
    return INITIAL_PROJECTS;
  }
};

/**
 * Comparador para ordenar códigos jerárquicos de partidas (ej. 1.1, 2.3, 2.3.1, 3.1.1)
 */
const compareItemCodes = (a, b) => {
  const partsA = a.itemCode.split(".").map(Number);
  const partsB = b.itemCode.split(".").map(Number);
  const maxLen = Math.max(partsA.length, partsB.length);
  for (let i = 0; i < maxLen; i++) {
    const valA = partsA[i] ?? 0;
    const valB = partsB[i] ?? 0;
    if (valA !== valB) return valA - valB;
  }
  return 0;
};

export default function App() {
  // Estado para controlar la página activa: "client" (creación/búsqueda de cliente y obra) | "budget" (ingreso de ítems)
  const [currentPage, setCurrentPage] = useState("client");

  // Directorio de clientes y proyectos registrados (permite buscarlos por nombre de cliente o proyecto)
  const [savedClients, setSavedClients] = useState(loadSavedClients);
  const [savedProjects, setSavedProjects] = useState(loadSavedProjects);
  const [activeProjectId, setActiveProjectId] = useState(undefined);

  // Datos generales del cliente y de la obra inicializados en blanco para crear la cotización
  const [budgetInfo, setBudgetInfo] = useState({
    companyName: INITIAL_BUDGET_INFO.companyName,
    signerName: INITIAL_BUDGET_INFO.signerName,
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    projectName: "",
    location: "",
    budgetDate: "",
  });

  // Las partidas de la cotización inician vacías ([] -> 0 partidas y $ 0) para generarse desde cero
  const [items, setItems] = useState([]);

  // Estado de acordeones por capítulo (1.0 a 8.0): inician cerrados para evitar fatiga visual en móvil
  const [expandedSections, setExpandedSections] = useState({});

  // Estados para la edición en línea de una fila o Card (CRUD Update)
  const [editingItemCode, setEditingItemCode] = useState(undefined);
  const [editFormData, setEditFormData] = useState({
    description: "",
    quantity: 1,
    unit: "Global",
    unitCost: 0,
  });

  // Sincroniza los cambios del proyecto activo en el historial persistente (localStorage)
  const syncActiveProjectInStorage = (
    projId,
    nextBudgetInfo,
    nextItems
  ) => {
    if (!projId) return;
    setSavedProjects((prevProjects) => {
      const idx = prevProjects.findIndex((p) => p.id === projId);
      if (idx < 0) return prevProjects;

      const updated = [...prevProjects];
      updated[idx] = {
        ...updated[idx],
        clientName: nextBudgetInfo.clientName,
        clientPhone: nextBudgetInfo.clientPhone,
        clientEmail: nextBudgetInfo.clientEmail,
        projectName: nextBudgetInfo.projectName,
        projectAddress: nextBudgetInfo.location,
        tentativeStartDate: nextBudgetInfo.budgetDate,
        items: nextItems,
      };

      try {
        window.localStorage.setItem(
          PROJECTS_STORAGE_KEY,
          JSON.stringify(updated)
        );
      } catch {
        // Ignorar errores de almacenamiento restringido
      }

      return updated;
    });
  };

  // Alternar apertura/cierre de un capítulo específico (1.0 - 8.0)
  const handleToggleSection = (sectionCode) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionCode]: !prev[sectionCode],
    }));
  };

  // Expandir todos los capítulos
  const handleExpandAll = () => {
    const allOpen = {};
    CATALOG_SECTIONS.forEach((sec) => {
      allOpen[sec.sectionCode] = true;
    });
    setExpandedSections(allOpen);
  };

  // Contraer todos los capítulos
  const handleCollapseAll = () => {
    setExpandedSections({});
  };

  // Actualizar metadatos desde BudgetHeader y sincronizar con el proyecto activo
  const handleUpdateBudgetInfo = (nextBudgetInfo) => {
    setBudgetInfo(nextBudgetInfo);
    syncActiveProjectInStorage(activeProjectId, nextBudgetInfo, items);
  };

  // Cuando se confirma el formulario inicial, guardamos/actualizamos cliente + proyecto y pasamos al Paso 2
  const handleClientCreated = ({
    clientId,
    projectId,
    clientName,
    clientPhone,
    clientEmail,
    projectName,
    projectAddress,
    tentativeStartDate,
    loadedItems,
  }) => {
    const nextBudgetInfo = {
      ...budgetInfo,
      clientName,
      clientPhone,
      clientEmail,
      projectName,
      location: projectAddress,
      budgetDate: tentativeStartDate,
    };
    setBudgetInfo(nextBudgetInfo);

    const nextItems = Array.isArray(loadedItems) ? loadedItems : items;
    if (Array.isArray(loadedItems)) {
      setItems(loadedItems);
    }

    // 1. Guardamos o actualizamos el cliente en el directorio
    let resolvedClientId = clientId || `cli-${Date.now()}`;
    setSavedClients((prevClients) => {
      const normalizedEmail = clientEmail.toLowerCase();
      const normalizedName = clientName.toLowerCase();
      const existingIdx = prevClients.findIndex(
        (c) =>
          (clientId && c.id === clientId) ||
          c.clientEmail.toLowerCase() === normalizedEmail ||
          c.clientName.toLowerCase() === normalizedName
      );

      let nextClients;
      if (existingIdx >= 0) {
        resolvedClientId = prevClients[existingIdx].id;
        nextClients = [...prevClients];
        nextClients[existingIdx] = {
          ...nextClients[existingIdx],
          clientName,
          clientPhone,
          clientEmail,
        };
      } else {
        const newClientRecord = {
          id: resolvedClientId,
          clientName,
          clientPhone,
          clientEmail,
        };
        nextClients = [newClientRecord, ...prevClients];
      }

      try {
        window.localStorage.setItem(
          CLIENTS_STORAGE_KEY,
          JSON.stringify(nextClients)
        );
      } catch {
        // Ignorar errores de almacenamiento restringido
      }

      return nextClients;
    });

    // 2. Guardamos o actualizamos el proyecto en el historial buscable
    const resolvedProjectId = projectId || `proj-${Date.now()}`;
    setActiveProjectId(resolvedProjectId);

    setSavedProjects((prevProjects) => {
      const normalizedProjName = projectName.toLowerCase();
      const normalizedClientName = clientName.toLowerCase();
      const existingIdx = prevProjects.findIndex(
        (p) =>
          (projectId && p.id === projectId) ||
          (p.projectName.toLowerCase() === normalizedProjName &&
            p.clientName.toLowerCase() === normalizedClientName)
      );

      let nextProjects;
      if (existingIdx >= 0) {
        nextProjects = [...prevProjects];
        nextProjects[existingIdx] = {
          ...nextProjects[existingIdx],
          clientId: resolvedClientId,
          clientName,
          clientPhone,
          clientEmail,
          projectName,
          projectAddress,
          tentativeStartDate,
          items: nextItems,
        };
      } else {
        const newProjectRecord = {
          id: resolvedProjectId,
          clientId: resolvedClientId,
          clientName,
          clientPhone,
          clientEmail,
          projectName,
          projectAddress,
          tentativeStartDate,
          items: nextItems,
        };
        nextProjects = [newProjectRecord, ...prevProjects];
      }

      try {
        window.localStorage.setItem(
          PROJECTS_STORAGE_KEY,
          JSON.stringify(nextProjects)
        );
      } catch {
        // Ignorar errores de almacenamiento restringido
      }

      return nextProjects;
    });

    setCurrentPage("budget");
  };

  // Agregar o actualizar una partida ingresada desde el formulario Input y abrir su capítulo
  const handleAddItem = (newItem) => {
    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (item) => item.itemCode === newItem.itemCode
      );
      let nextItems;
      if (existingIndex >= 0) {
        nextItems = [...prevItems];
        nextItems[existingIndex] = newItem;
      } else {
        // Ordenamiento inmutable según @react-best-practices (js-tosorted-immutable)
        nextItems = [...prevItems, newItem].toSorted(compareItemCodes);
      }

      syncActiveProjectInStorage(activeProjectId, budgetInfo, nextItems);
      return nextItems;
    });

    // Abrimos automáticamente el acordeón del capítulo donde se agregó la partida
    setExpandedSections((prev) => ({
      ...prev,
      [newItem.sectionCode]: true,
    }));
  };

  // Iniciar la edición de una fila o tarjeta
  const handleStartEdit = (item) => {
    setEditingItemCode(item.itemCode);
    setEditFormData({
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unitCost: item.unitCost,
    });
  };

  // Cancelar la edición activa
  const handleCancelEdit = () => {
    setEditingItemCode(undefined);
  };

  // Guardar los cambios realizados en la partida editada
  const handleSaveEdit = (itemCode) => {
    const quantityNum = Number(editFormData.quantity) || 0;
    const unitCostNum = Number(editFormData.unitCost) || 0;

    if (
      !editFormData.description.trim() ||
      quantityNum <= 0 ||
      unitCostNum < 0
    ) {
      return;
    }

    setItems((prevItems) => {
      const nextItems = prevItems.map((item) =>
        item.itemCode === itemCode
          ? {
              ...item,
              description: editFormData.description.trim(),
              quantity: quantityNum,
              unit: editFormData.unit,
              unitCost: unitCostNum,
              totalCost: Math.round(quantityNum * unitCostNum),
            }
          : item
      );
      syncActiveProjectInStorage(activeProjectId, budgetInfo, nextItems);
      return nextItems;
    });
    setEditingItemCode(undefined);
  };

  // Eliminar una partida individual del presupuesto actualizando inmediatamente el estado
  const handleDeleteItem = (itemCodeToRemove) => {
    if (editingItemCode === itemCodeToRemove) {
      setEditingItemCode(undefined);
    }
    setItems((prevItems) => {
      const nextItems = prevItems.filter(
        (item) => item.itemCode !== itemCodeToRemove
      );
      syncActiveProjectInStorage(activeProjectId, budgetInfo, nextItems);
      return nextItems;
    });
  };

  // Cálculo reactivo del total general del presupuesto a partir de los ítems vigentes
  const grandTotal = items.reduce(
    (acc, item) => acc + (Number(item.totalCost) || 0),
    0
  );

  // Vista 1: Página de Creación o Búsqueda de Cliente y Proyecto
  if (currentPage === "client") {
    return (
      <main className="min-h-dvh bg-slate-50 px-2.5 py-4 text-slate-900 sm:px-6 lg:px-8">
        <ClientForm
          initialValues={{
            clientName: budgetInfo.clientName,
            clientPhone: budgetInfo.clientPhone,
            clientEmail: budgetInfo.clientEmail,
            projectName: budgetInfo.projectName,
            projectAddress: budgetInfo.location,
            tentativeStartDate: budgetInfo.budgetDate,
          }}
          savedClients={savedClients}
          savedProjects={savedProjects}
          onClientCreated={handleClientCreated}
        />
      </main>
    );
  }

  // Vista 2: Página de Ingreso y Gestión de Ítems de la Obra
  return (
    <main className="min-h-dvh bg-slate-50 px-2.5 py-4 text-slate-900 sm:px-6 sm:py-6 lg:px-8">
      <Suspense
        fallback={
          <div
            role="status"
            aria-live="polite"
            className="mx-auto flex max-w-6xl flex-col gap-4 py-8 text-center text-sm font-semibold text-slate-600"
          >
            Cargando entorno de cotización...
          </div>
        }
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:gap-6">
          {/* Cabecera Ejecutiva del Presupuesto */}
          <BudgetHeader
            budgetInfo={budgetInfo}
            onUpdateBudgetInfo={handleUpdateBudgetInfo}
            items={items}
            grandTotal={grandTotal}
            onBackToClient={() => setCurrentPage("client")}
            onClearItems={() => {
              setEditingItemCode(undefined);
              setItems([]);
              syncActiveProjectInStorage(activeProjectId, budgetInfo, []);
            }}
          />

          {/* Formulario de Ingreso con Teclado Numérico Nativo y Altura Táctil >= 44px */}
          <Input onAddItem={handleAddItem} />

          {/* Capítulos en Acordeón (Cards en Móvil 320px / Tabla en Escritorio >= 768px) */}
          <BudgetSectionList
            items={items}
            expandedSections={expandedSections}
            onToggleSection={handleToggleSection}
            onExpandAll={handleExpandAll}
            onCollapseAll={handleCollapseAll}
            editingItemCode={editingItemCode}
            editFormData={editFormData}
            onEditFormChange={setEditFormData}
            onStartEdit={handleStartEdit}
            onCancelEdit={handleCancelEdit}
            onSaveEdit={handleSaveEdit}
            onDeleteItem={handleDeleteItem}
            grandTotal={grandTotal}
            signerName={budgetInfo.signerName}
          />
        </div>
      </Suspense>
    </main>
  );
}
