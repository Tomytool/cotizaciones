---
name: brand-identity-designer
description: "Crea y diseña marcas personales y corporativas desde cero. Este skill guía todo el flujo de trabajo de branding, integrando el análisis del modelo de negocio (Canvas), la paleta de colores monocromática (con oklch/color-expert), el diseño y procesamiento del logotipo (logo-creator), y el diseño final de empaques o dielines (canvas-design)."
---

# Brand Identity Designer (Diseñador de Identidad de Marca)

Este skill permite a Claude guiar paso a paso el diseño estratégico y visual de una marca personal o corporativa, desde su concepto de negocio hasta el empaque físico imprimible.

---

## Flujo de Trabajo Principal

El proceso se divide en cinco fases estructuradas que deben ejecutarse secuencialmente.

### Fase 1: Recopilación de Requisitos (Discovery)
Antes de generar cualquier propuesta, debes solicitar al usuario la siguiente información esencial:
1.  **Descripción de la marca:** Qué hace, qué valores transmite y cuál es su esencia.
2.  **Color o colores base:** Tonos favoritos o sugeridos que representen el espíritu de la marca.
3.  **Nombre de la marca:** Nombre del proyecto o marca personal.
4.  **Imágenes de referencia:** Diseños, fotos de productos, aros, o texturas que sirvan de inspiración visual.
5.  **Información adicional:** Cualquier detalle extra relevante para el diseño (ej. público objetivo, tipo de joyería o producto).

> [!NOTE]
> Si alguna información falta o necesitas más detalles sobre las referencias, debes detenerte y pedir aclaraciones al usuario antes de avanzar a la Fase 2.

---

### Fase 2: Modelo de Negocio (Business Model Canvas)
Utiliza la metodología del **Business Model Canvas** para estructurar la estrategia comercial de la marca:
*   Define claramente los 9 bloques del lienzo (Segmentos de Clientes, Propuesta de Valor, Canales, Relaciones, Ingresos, Recursos Clave, Actividades Clave, Socios y Costes).
*   Enfoca la propuesta de valor en el aspecto artístico, manual y emocional descrito por el usuario.

---

### Fase 3: Identidad Visual y Colores (Color Expert)
Diseña una paleta de colores robusta utilizando el espacio de color **OKLCH** para asegurar uniformidad perceptual:
*   Define el color identitario base y desglósalo en una escala monocromática de 9 pasos (desde fondos claros 100 hasta texto de alto contraste 900).
*   Establece las reglas de aplicación del color siguiendo la proporción **60-30-10** (60% fondos, 30% estructura/texto, 10% acento).
*   Asegura que las combinaciones pasen las pruebas de legibilidad y contraste (APCA > 90 o WCAG).

---

### Fase 4: Creación y Procesamiento del Logotipo (Logo Creator)
1.  **Propuesta de Conceptos:** Diseña al menos 2 conceptos conceptuales de logotipo inspirados en las referencias visuales del usuario.
2.  **Generación de Variaciones:** Utiliza las herramientas de generación de imágenes para crear las propuestas visuales bajo las especificaciones acordadas (relación de aspecto, estilo hecho a mano o minimalista).
3.  **Procesamiento Final:** Una vez que el usuario elija su propuesta favorita, limpia y procesa el archivo:
    *   Recorta los márgenes innecesarios para centrarlo en formato 1:1.
    *   Guarda los archivos procesados en la carpeta del proyecto.

---

### Fase 5: Diseño del Empaque (Canvas Design)
1.  **Filosofía de Diseño:** Escribe un manifiesto de diseño bajo el framework `canvas-design` que sirva como guía de la estética tridimensional de los empaques.
2.  **Troquel / Dieline:** Genera una plantilla física del empaque o bolsa de regalo a escala real (1:1), dibujando en un lienzo (PDF) las líneas continuas de corte y las líneas segmentadas de plegado/doblez.
3.  **Integración de Identidad:** Aplica las texturas de color y posiciona el logotipo final en el dieline del empaque para entregarlo listo para impresión.
