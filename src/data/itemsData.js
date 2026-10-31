/**
 * Estructura de base de datos relacional (3NF) en cliente para el sistema de presupuestos.
 * Basado en el documento de referencia: Constructora María Graciela Silva Gallardo.
 */

// 1. Tabla `budgets`: Información de cabecera del presupuesto/obra
export const INITIAL_BUDGET_INFO = {
  id: 1,
  companyName: "Constructora María Graciela Silva Gallardo",
  projectName: "Casa habitación 70m2 sobre estructura metálica en dos pisos",
  location: "C° La Cruz, Valparaíso",
  budgetDate: "2026-02-16",
  budgetDateDisplay: "16 de febrero del 2026",
  signerName: "MARIO CONTRERAS FRIAS",
};

// 1b. Tabla `clients`: Directorio inicial de clientes registrados anteriormente
export const INITIAL_CLIENTS = [
  {
    id: "cli-1",
    clientName: "Carlos Muñoz Rojas",
    clientPhone: "+56 9 8412 3590",
    clientEmail: "cmunoz.rojas@gmail.com",
  },
  {
    id: "cli-2",
    clientName: "Carolina Fernández Soto",
    clientPhone: "+56 9 7623 9104",
    clientEmail: "cfernandez@inversionesvalpo.cl",
  },
  {
    id: "cli-3",
    clientName: "Roberto Valenzuela Díaz",
    clientPhone: "+56 9 9150 4822",
    clientEmail: "rvalenzuela@constructoraandes.cl",
  },
];

// 2. Tabla `measurement_units`: Catálogo de unidades de medida
export const UNIDADES_DISPONIBLES = [
  "Global",
  "M.O.",
  "m2",
  "ml",
  "unidad",
  "Puerta",
  "mt.",
];

// 3. Tabla `catalog_sections`: Cabeceras de referencia (1.0 al 8.0)
export const CATALOG_SECTIONS = [
  { id: 1, sectionCode: "1.0", title: "Obras preliminares", sortOrder: 1 },
  {
    id: 2,
    sectionCode: "2.0",
    title: "Obra gruesa (Incluye caja escala y balcón)",
    sortOrder: 2,
  },
  { id: 3, sectionCode: "3.0", title: "Obras de terminación", sortOrder: 3 },
  { id: 4, sectionCode: "4.0", title: "PINTURAS", sortOrder: 4 },
  { id: 5, sectionCode: "5.0", title: "Quincallería", sortOrder: 5 },
  { id: 6, sectionCode: "6.0", title: "Bisagras y topes", sortOrder: 6 },
  {
    id: 7,
    sectionCode: "7.0",
    title: "Instalación sanitaria, agua potable y gas",
    sortOrder: 7,
  },
  { id: 8, sectionCode: "8.0", title: "ANEXOS", sortOrder: 8 },
];

// 4. Tabla `catalog_items` / `budget_line_items`: Catálogo completo de ítems seleccionables (1.1 a 8.1)
export const CATALOG_ITEMS = [
  // 1.0 Obras preliminares
  { sectionCode: "1.0", itemCode: "1.1", description: "Instalación de faena", defaultQuantity: 1, unit: "Global", referenceUnitCost: 290000, defaultTotalCost: 290000 },
  { sectionCode: "1.0", itemCode: "1.2", description: "Movimiento de tierra", defaultQuantity: 4, unit: "M.O.", referenceUnitCost: 43500, defaultTotalCost: 174000 },
  { sectionCode: "1.0", itemCode: "1.3", description: "Trazado y niveles", defaultQuantity: 1, unit: "Global", referenceUnitCost: 65250, defaultTotalCost: 65250 },
  { sectionCode: "1.0", itemCode: "1.4", description: "Traslado a botadero de escombros", defaultQuantity: 3, unit: "M.O.", referenceUnitCost: 43500, defaultTotalCost: 130500 },

  // 2.0 Obra gruesa (Incluye caja escala y balcón)
  { sectionCode: "2.0", itemCode: "2.1", description: "Construcción de estructura de fierro (MM, Soldador, ayudante)", defaultQuantity: 1, unit: "M.O.", referenceUnitCost: 4140000, defaultTotalCost: 4140000 },
  { sectionCode: "2.0", itemCode: "2.2", description: "Material y montaje de estructura de fierro (perfiles de fierro estructural)", defaultQuantity: 70, unit: "m2", referenceUnitCost: 36250, defaultTotalCost: 2537500 },
  { sectionCode: "2.0", itemCode: "2.3", description: "Construcción y montaje de estructura de piso", defaultQuantity: 70, unit: "m2", referenceUnitCost: 12615, defaultTotalCost: 883050 },
  { sectionCode: "2.0", itemCode: "2.3.1", description: "Estructura de piso, terciado estructural, con madera de pino", defaultQuantity: 70, unit: "m2", referenceUnitCost: 9672, defaultTotalCost: 677005 },
  { sectionCode: "2.0", itemCode: "2.4", description: "Muros perimetrales y estructurales exteriores, Metalcom", defaultQuantity: 120, unit: "m2", referenceUnitCost: 41470, defaultTotalCost: 4976400 },
  { sectionCode: "2.0", itemCode: "2.5", description: "Estructura de techumbre, Metalcom", defaultQuantity: 36, unit: "m2", referenceUnitCost: 25955, defaultTotalCost: 934380 },
  { sectionCode: "2.0", itemCode: "2.5.1", description: "Aleros y tapacanes", defaultQuantity: 32, unit: "ml", referenceUnitCost: 13674, defaultTotalCost: 437552 },
  { sectionCode: "2.0", itemCode: "2.5.2", description: "Cubierta, planchas zinc", defaultQuantity: 36, unit: "m2", referenceUnitCost: 34655, defaultTotalCost: 1247580 },
  { sectionCode: "2.0", itemCode: "2.5.3", description: "Aguas lluvia y hojalatería", defaultQuantity: 32, unit: "ml", referenceUnitCost: 11441, defaultTotalCost: 366096 },

  // 3.0 Obras de terminación (incluye subcabecera 3.1 Piso y revestimiento de muros)
  { sectionCode: "3.0", subheaderCode: "3.1", subheaderTitle: "Piso y revestimiento de muros", itemCode: "3.1.1", description: "Piso de baño y cocina, cerámica", defaultQuantity: 8, unit: "m2", referenceUnitCost: 37686, defaultTotalCost: 301484 },
  { sectionCode: "3.0", subheaderCode: "3.1", subheaderTitle: "Piso y revestimiento de muros", itemCode: "3.1.2", description: "Piso estar y pasillo, piso flotante", defaultQuantity: 34, unit: "m2", referenceUnitCost: 43355, defaultTotalCost: 1474070 },
  { sectionCode: "3.0", subheaderCode: "3.1", subheaderTitle: "Piso y revestimiento de muros", itemCode: "3.1.3", description: "Piso dormitorio, piso flotante", defaultQuantity: 28, unit: "m2", referenceUnitCost: 43355, defaultTotalCost: 1213940 },
  { sectionCode: "3.0", itemCode: "3.2", description: "Estructura muros interiores, Metalcom", defaultQuantity: 82, unit: "m2", referenceUnitCost: 17255, defaultTotalCost: 1414910 },
  { sectionCode: "3.0", itemCode: "3.2.1", description: "Revestimiento baño y cocina, permanit base", defaultQuantity: 14, unit: "m2", referenceUnitCost: 27072, defaultTotalCost: 379001 },
  { sectionCode: "3.0", itemCode: "3.2.2", description: "Revestimiento dormitorio en yeso cartón", defaultQuantity: 34, unit: "m2", referenceUnitCost: 14921, defaultTotalCost: 507297 },
  { sectionCode: "3.0", itemCode: "3.2.3", description: "Revestimiento estar en yeso cartón", defaultQuantity: 36, unit: "m2", referenceUnitCost: 14921, defaultTotalCost: 537138 },
  { sectionCode: "3.0", itemCode: "3.2.4", description: "Revestimiento exterior", defaultQuantity: 60, unit: "m2", referenceUnitCost: 26521, defaultTotalCost: 1591230 },
  { sectionCode: "3.0", itemCode: "3.3", description: "Cielos, estar y dormitorio", defaultQuantity: 35, unit: "m2", referenceUnitCost: 14196, defaultTotalCost: 496843 },
  { sectionCode: "3.0", itemCode: "3.4", description: "Cielo baño", defaultQuantity: 6, unit: "m2", referenceUnitCost: 27072, defaultTotalCost: 162429 },
  { sectionCode: "3.0", itemCode: "3.5", description: "Ventanas", defaultQuantity: 12, unit: "unidad", referenceUnitCost: 137736, defaultTotalCost: 1652826 },
  { sectionCode: "3.0", itemCode: "3.5.1", description: "Puerta acceso, contempla centro de puerta", defaultQuantity: 1, unit: "Puerta", referenceUnitCost: 362355, defaultTotalCost: 362355 },
  { sectionCode: "3.0", itemCode: "3.5.2", description: "Puertas interiores, contempla centro de puerta", defaultQuantity: 6, unit: "Puerta", referenceUnitCost: 130355, defaultTotalCost: 782130 },
  { sectionCode: "3.0", itemCode: "3.6", description: "Aislación", defaultQuantity: 160, unit: "m2", referenceUnitCost: 6525, defaultTotalCost: 1044000 },
  { sectionCode: "3.0", itemCode: "3.7", description: "Molduras", defaultQuantity: 1, unit: "Global", referenceUnitCost: 185600, defaultTotalCost: 185600 },
  { sectionCode: "3.0", itemCode: "3.7.1", description: "Guardapolvos", defaultQuantity: 1, unit: "Global", referenceUnitCost: 162400, defaultTotalCost: 162400 },
  { sectionCode: "3.0", itemCode: "3.7.2", description: "Junquillos", defaultQuantity: 1, unit: "Global", referenceUnitCost: 210250, defaultTotalCost: 210250 },

  // 4.0 PINTURAS
  { sectionCode: "4.0", itemCode: "4.1", description: "Pintura exterior", defaultQuantity: 140, unit: "m2", referenceUnitCost: 7975, defaultTotalCost: 1116500 },
  { sectionCode: "4.0", itemCode: "4.2", description: "Pintura interior", defaultQuantity: 177, unit: "m2", referenceUnitCost: 7975, defaultTotalCost: 1411575 },
  { sectionCode: "4.0", itemCode: "4.2.1", description: "Empaste", defaultQuantity: 177, unit: "m2", referenceUnitCost: 5075, defaultTotalCost: 898275 },
  { sectionCode: "4.0", itemCode: "4.2.2", description: "Esmalte al agua cielo", defaultQuantity: 70, unit: "m2", referenceUnitCost: 8700, defaultTotalCost: 609000 },
  { sectionCode: "4.0", itemCode: "4.2.3", description: "Oleo baño", defaultQuantity: 30, unit: "m2", referenceUnitCost: 9425, defaultTotalCost: 282750 },

  // 5.0 Quincallería
  { sectionCode: "5.0", itemCode: "5.1", description: "Puertas y ventanas", defaultQuantity: 1, unit: "Global", referenceUnitCost: 487500, defaultTotalCost: 487500 },

  // 6.0 Bisagras y topes
  { sectionCode: "6.0", itemCode: "6.1", description: "Puertas ventanas", defaultQuantity: 1, unit: "Global", referenceUnitCost: 142100, defaultTotalCost: 142100 },

  // 7.0 Instalación sanitaria, agua potable y gas
  { sectionCode: "7.0", itemCode: "7.1", description: "Instalación sanitaria", defaultQuantity: 1, unit: "Global", referenceUnitCost: 127600, defaultTotalCost: 127600 },
  { sectionCode: "7.0", itemCode: "7.1.1", description: "Alcantarillado a existente. Contempla dos cámaras", defaultQuantity: 1, unit: "Global", referenceUnitCost: 220500, defaultTotalCost: 220500 },
  { sectionCode: "7.0", itemCode: "7.1.2", description: "Instalación sanitaria en PVC", defaultQuantity: 1, unit: "Global", referenceUnitCost: 188500, defaultTotalCost: 188500 },
  { sectionCode: "7.0", itemCode: "7.1.3", description: "Artefactos sanitarios grifería y otros", defaultQuantity: 1, unit: "Global", referenceUnitCost: 362500, defaultTotalCost: 362500 },
  { sectionCode: "7.0", itemCode: "7.2", description: "Instalación interior agua potable", defaultQuantity: 30, unit: "mt.", referenceUnitCost: 12311, defaultTotalCost: 369315 },
  { sectionCode: "7.0", itemCode: "7.2.1", description: "Empalme agua potable a existente", defaultQuantity: 1, unit: "Global", referenceUnitCost: 50750, defaultTotalCost: 50750 },
  { sectionCode: "7.0", itemCode: "7.2.2", description: "Gasfitería de agua potable fría y caliente en Cu.", defaultQuantity: 1, unit: "Global", referenceUnitCost: 217500, defaultTotalCost: 217500 },
  { sectionCode: "7.0", itemCode: "7.2.3", description: "Instalación Calefón", defaultQuantity: 1, unit: "Global", referenceUnitCost: 101500, defaultTotalCost: 101500 },
  { sectionCode: "7.0", itemCode: "7.2.4", description: "Instalación mueble base lavaplatos izquierdo", defaultQuantity: 1, unit: "Global", referenceUnitCost: 256505, defaultTotalCost: 256505 },
  { sectionCode: "7.0", itemCode: "7.2.5", description: "Instalación de gas licuado", defaultQuantity: 1, unit: "Global", referenceUnitCost: 159500, defaultTotalCost: 159500 },

  // 8.0 ANEXOS
  { sectionCode: "8.0", itemCode: "8.1", description: "Aseo general y retiro de escombros", defaultQuantity: 1, unit: "Global", referenceUnitCost: 362500, defaultTotalCost: 362500 },
];

// Registros iniciales de `budget_line_items` basados en el PDF ($ 36.701.586)
export const INITIAL_ITEMS = CATALOG_ITEMS.map((item) => ({
  sectionCode: item.sectionCode,
  subheaderCode: item.subheaderCode || null,
  subheaderTitle: item.subheaderTitle || null,
  itemCode: item.itemCode,
  description: item.description,
  quantity: item.defaultQuantity,
  unit: item.unit,
  unitCost: item.referenceUnitCost,
  totalCost: item.defaultTotalCost,
}));

// 5. Tabla `budgets`: Historial inicial de proyectos/cotizaciones anteriores para el buscador
export const INITIAL_PROJECTS = [
  {
    id: "proj-1",
    clientId: "cli-1",
    clientName: "Carlos Muñoz Rojas",
    clientPhone: "+56 9 8412 3590",
    clientEmail: "cmunoz.rojas@gmail.com",
    projectName: "Casa habitación 70m2 sobre estructura metálica en dos pisos",
    projectAddress: "C° La Cruz, Valparaíso",
    tentativeStartDate: "2026-02-16",
    items: INITIAL_ITEMS,
  },
  {
    id: "proj-2",
    clientId: "cli-2",
    clientName: "Carolina Fernández Soto",
    clientPhone: "+56 9 7623 9104",
    clientEmail: "cfernandez@inversionesvalpo.cl",
    projectName: "Ampliación segundo piso y remodelación cocina 45m2",
    projectAddress: "Av. Libertad 840, Viña del Mar",
    tentativeStartDate: "2026-03-10",
    items: INITIAL_ITEMS.slice(0, 6),
  },
  {
    id: "proj-3",
    clientId: "cli-3",
    clientName: "Roberto Valenzuela Díaz",
    clientPhone: "+56 9 9150 4822",
    clientEmail: "rvalenzuela@constructoraandes.cl",
    projectName: "Habilitación oficina comercial y tabiquería Metalcom",
    projectAddress: "Calle Arlegui 415, Viña del Mar",
    tentativeStartDate: "2026-04-01",
    items: INITIAL_ITEMS.slice(0, 4),
  },
];
