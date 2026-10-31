-- =============================================================================
-- Migración: 20261029220000_create_construction_budget_schema.sql
-- Diseñado siguiendo las directrices de @database-schema-designer (3NF)
-- Referencia: Presupuesto Constructora María Graciela Silva Gallardo
-- =============================================================================

-- =============================================================================
-- UP MIGRATION
-- =============================================================================
BEGIN;

-- 1. Tabla de Catálogo de Unidades de Medida (3NF)
CREATE TABLE measurement_units (
  id SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(60) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Catálogo de Cabeceras / Capítulos (Ítems 1.0 al 8.0)
CREATE TABLE catalog_sections (
  id SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  section_code VARCHAR(10) NOT NULL UNIQUE,
  title VARCHAR(150) NOT NULL,
  sort_order SMALLINT NOT NULL UNIQUE CHECK (sort_order > 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_catalog_sections_order ON catalog_sections(sort_order);

-- 3. Tabla de Catálogo de Partidas Seleccionables (Ítems 1.1, 1.2, 2.1, etc.)
CREATE TABLE catalog_items (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  section_id SMALLINT NOT NULL REFERENCES catalog_sections(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  default_unit_id SMALLINT NOT NULL REFERENCES measurement_units(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  item_code VARCHAR(15) NOT NULL UNIQUE,
  description VARCHAR(255) NOT NULL,
  subheader_code VARCHAR(15) NULL,
  subheader_title VARCHAR(150) NULL,
  reference_unit_cost DECIMAL(14, 2) NOT NULL DEFAULT 0.00 CHECK (reference_unit_cost >= 0),
  sort_order SMALLINT NOT NULL CHECK (sort_order > 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para claves foráneas y búsquedas por sección/código
CREATE INDEX idx_catalog_items_section ON catalog_items(section_id, sort_order);
CREATE INDEX idx_catalog_items_unit ON catalog_items(default_unit_id);

-- 4. Tabla de Clientes (Creados desde el formulario inicial o reutilizados)
CREATE TABLE clients (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  client_name VARCHAR(150) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_clients_name ON clients(client_name);

-- 5. Tabla de Cabecera de Presupuestos / Obras
CREATE TABLE budgets (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  client_id BIGINT NULL REFERENCES clients(id) ON DELETE SET NULL ON UPDATE CASCADE,
  company_name VARCHAR(150) NOT NULL DEFAULT 'Constructora María Graciela Silva Gallardo',
  project_name VARCHAR(200) NOT NULL,
  location VARCHAR(150) NOT NULL,
  budget_date DATE NOT NULL,
  signer_name VARCHAR(120) NOT NULL DEFAULT 'MARIO CONTRERAS FRIAS',
  total_amount DECIMAL(14, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_budgets_client ON budgets(client_id);
CREATE INDEX idx_budgets_date ON budgets(budget_date);

-- 5. Tabla de Partidas Ingresadas por Formulario en un Presupuesto
CREATE TABLE budget_line_items (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  budget_id BIGINT NOT NULL REFERENCES budgets(id) ON DELETE CASCADE ON UPDATE CASCADE,
  catalog_item_id INT NOT NULL REFERENCES catalog_items(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  unit_id SMALLINT NOT NULL REFERENCES measurement_units(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  quantity DECIMAL(10, 2) NOT NULL CHECK (quantity > 0),
  unit_cost DECIMAL(14, 2) NOT NULL CHECK (unit_cost >= 0),
  total_cost DECIMAL(14, 2) NOT NULL CHECK (total_cost >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (budget_id, catalog_item_id)
);

-- Índices en todas las claves foráneas para optimizar JOINs
CREATE INDEX idx_budget_lines_budget ON budget_line_items(budget_id);
CREATE INDEX idx_budget_lines_catalog_item ON budget_line_items(catalog_item_id);
CREATE INDEX idx_budget_lines_unit ON budget_line_items(unit_id);

-- =============================================================================
-- DATOS SEMILLA (Catálogo Oficial del Documento PDF)
-- =============================================================================

-- Unidades de medida
INSERT INTO measurement_units (code, name) VALUES
  ('Global', 'Global'),
  ('M.O.', 'Mano de Obra'),
  ('m2', 'Metro cuadrado'),
  ('ml', 'Metro lineal'),
  ('unidad', 'Unidad'),
  ('Puerta', 'Puerta'),
  ('mt.', 'Metro');

-- Cabeceras principales (1.0 a 8.0)
INSERT INTO catalog_sections (section_code, title, sort_order) VALUES
  ('1.0', 'Obras preliminares', 1),
  ('2.0', 'Obra gruesa (Incluye caja escala y balcón)', 2),
  ('3.0', 'Obras de terminación', 3),
  ('4.0', 'PINTURAS', 4),
  ('5.0', 'Quincallería', 5),
  ('6.0', 'Bisagras y topes', 6),
  ('7.0', 'Instalación sanitaria, agua potable y gas', 7),
  ('8.0', 'ANEXOS', 8);

-- Catálogo de ítems seleccionables (1.1 a 8.1)
INSERT INTO catalog_items (section_id, default_unit_id, item_code, description, subheader_code, subheader_title, reference_unit_cost, sort_order) VALUES
  -- 1.0 Obras preliminares
  (1, 1, '1.1', 'Instalación de faena', NULL, NULL, 290000.00, 1),
  (1, 2, '1.2', 'Movimiento de tierra', NULL, NULL, 43500.00, 2),
  (1, 1, '1.3', 'Trazado y niveles', NULL, NULL, 65250.00, 3),
  (1, 2, '1.4', 'Traslado a botadero de escombros', NULL, NULL, 43500.00, 4),

  -- 2.0 Obra gruesa (Incluye caja escala y balcón)
  (2, 2, '2.1', 'Construcción de estructura de fierro (MM, Soldador, ayudante)', NULL, NULL, 4140000.00, 5),
  (2, 3, '2.2', 'Material y montaje de estructura de fierro (perfiles de fierro estructural)', NULL, NULL, 36250.00, 6),
  (2, 3, '2.3', 'Construcción y montaje de estructura de piso', NULL, NULL, 12615.00, 7),
  (2, 3, '2.3.1', 'Estructura de piso, terciado estructural, con madera de pino', NULL, NULL, 9672.00, 8),
  (2, 3, '2.4', 'Muros perimetrales y estructurales exteriores, Metalcom', NULL, NULL, 41470.00, 9),
  (2, 3, '2.5', 'Estructura de techumbre, Metalcom', NULL, NULL, 25955.00, 10),
  (2, 4, '2.5.1', 'Aleros y tapacanes', NULL, NULL, 13674.00, 11),
  (2, 3, '2.5.2', 'Cubierta, planchas zinc', NULL, NULL, 34655.00, 12),
  (2, 4, '2.5.3', 'Aguas lluvia y hojalatería', NULL, NULL, 11441.00, 13),

  -- 3.0 Obras de terminación (Subcabecera 3.1: Piso y revestimiento de muros)
  (3, 3, '3.1.1', 'Piso de baño y cocina, cerámica', '3.1', 'Piso y revestimiento de muros', 37686.00, 14),
  (3, 3, '3.1.2', 'Piso estar y pasillo, piso flotante', '3.1', 'Piso y revestimiento de muros', 43355.00, 15),
  (3, 3, '3.1.3', 'Piso dormitorio, piso flotante', '3.1', 'Piso y revestimiento de muros', 43355.00, 16),
  (3, 3, '3.2', 'Estructura muros interiores, Metalcom', NULL, NULL, 17255.00, 17),
  (3, 3, '3.2.1', 'Revestimiento baño y cocina, permanit base', NULL, NULL, 27072.00, 18),
  (3, 3, '3.2.2', 'Revestimiento dormitorio en yeso cartón', NULL, NULL, 14921.00, 19),
  (3, 3, '3.2.3', 'Revestimiento estar en yeso cartón', NULL, NULL, 14921.00, 20),
  (3, 3, '3.2.4', 'Revestimiento exterior', NULL, NULL, 26521.00, 21),
  (3, 3, '3.3', 'Cielos, estar y dormitorio', NULL, NULL, 14196.00, 22),
  (3, 3, '3.4', 'Cielo baño', NULL, NULL, 27072.00, 23),
  (3, 5, '3.5', 'Ventanas', NULL, NULL, 137736.00, 24),
  (3, 6, '3.5.1', 'Puerta acceso, contempla centro de puerta', NULL, NULL, 362355.00, 25),
  (3, 6, '3.5.2', 'Puertas interiores, contempla centro de puerta', NULL, NULL, 130355.00, 26),
  (3, 3, '3.6', 'Aislación', NULL, NULL, 6525.00, 27),
  (3, 1, '3.7', 'Molduras', NULL, NULL, 185600.00, 28),
  (3, 1, '3.7.1', 'Guardapolvos', NULL, NULL, 162400.00, 29),
  (3, 1, '3.7.2', 'Junquillos', NULL, NULL, 210250.00, 30),

  -- 4.0 PINTURAS
  (4, 3, '4.1', 'Pintura exterior', NULL, NULL, 7975.00, 31),
  (4, 3, '4.2', 'Pintura interior', NULL, NULL, 7975.00, 32),
  (4, 3, '4.2.1', 'Empaste', NULL, NULL, 5075.00, 33),
  (4, 3, '4.2.2', 'Esmalte al agua cielo', NULL, NULL, 8700.00, 34),
  (4, 3, '4.2.3', 'Oleo baño', NULL, NULL, 9425.00, 35),

  -- 5.0 Quincallería
  (5, 1, '5.1', 'Puertas y ventanas', NULL, NULL, 487500.00, 36),

  -- 6.0 Bisagras y topes
  (6, 1, '6.1', 'Puertas ventanas', NULL, NULL, 142100.00, 37),

  -- 7.0 Instalación sanitaria, agua potable y gas
  (7, 1, '7.1', 'Instalación sanitaria', NULL, NULL, 127600.00, 38),
  (7, 1, '7.1.1', 'Alcantarillado a existente. Contempla dos cámaras', NULL, NULL, 220500.00, 39),
  (7, 1, '7.1.2', 'Instalación sanitaria en PVC', NULL, NULL, 188500.00, 40),
  (7, 1, '7.1.3', 'Artefactos sanitarios grifería y otros', NULL, NULL, 362500.00, 41),
  (7, 7, '7.2', 'Instalación interior agua potable', NULL, NULL, 12311.00, 42),
  (7, 1, '7.2.1', 'Empalme agua potable a existente', NULL, NULL, 50750.00, 43),
  (7, 1, '7.2.2', 'Gasfitería de agua potable fría y caliente en Cu.', NULL, NULL, 217500.00, 44),
  (7, 1, '7.2.3', 'Instalación Calefón', NULL, NULL, 101500.00, 45),
  (7, 1, '7.2.4', 'Instalación mueble base lavaplatos izquierdo', NULL, NULL, 256505.00, 46),
  (7, 1, '7.2.5', 'Instalación de gas licuado', NULL, NULL, 159500.00, 47),

  -- 8.0 ANEXOS
  (8, 1, '8.1', 'Aseo general y retiro de escombros', NULL, NULL, 362500.00, 48);

COMMIT;

-- =============================================================================
-- DOWN MIGRATION (Reversible)
-- =============================================================================
-- BEGIN;
-- DROP TABLE IF EXISTS budget_line_items;
-- DROP TABLE IF EXISTS budgets;
-- DROP TABLE IF EXISTS catalog_items;
-- DROP TABLE IF EXISTS catalog_sections;
-- DROP TABLE IF EXISTS measurement_units;
-- COMMIT;
