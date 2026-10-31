import firmaMarioUrl from "../assets/firma_mario.png";
import mgsgLogoUrl from "../assets/mgsg-logo.svg";
import { CATALOG_SECTIONS } from "../data/itemsData";

/**
 * Formatea un número entero con separador de miles chileno (ej: 36.701.586)
 */
const formatNumberCL = (value) =>
  new Intl.NumberFormat("es-CL", {
    maximumFractionDigits: 0,
  }).format(Math.round(Number(value) || 0));

/**
 * Formatea una fecha ISO (YYYY-MM-DD) al formato largo en español (ej: "16 de febrero del 2026")
 */
const formatLongDateCL = (isoDate) => {
  if (!isoDate) return "Sin especificar";
  const parts = isoDate.split("-");
  if (parts.length !== 3) return isoDate;
  const [year, month, day] = parts.map(Number);
  const meses = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];
  const mesNombre = meses[(month || 1) - 1] || "";
  return `${day} de ${mesNombre} del ${year}`;
};

/**
 * Convierte el archivo SVG del logo MGSG a un DataURL PNG de alta resolución
 * para insertarlo nítidamente en el documento PDF.
 */
const loadLogoAsPngDataUrl = () =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 480;
      canvas.height = 440;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      } else {
        resolve(undefined);
      }
    };
    img.onerror = () => resolve(undefined);
    img.src = mgsgLogoUrl;
  });

/**
 * Carga la imagen de la firma (firma_mario.png) como DataURL PNG junto con su relación de aspecto
 * para insertarla de forma proporcional y nítida sobre la línea de firma del PDF.
 */
const loadSignatureAsPngDataUrl = () =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const naturalW = img.naturalWidth || 600;
      const naturalH = img.naturalHeight || 220;
      const canvas = document.createElement("canvas");
      canvas.width = naturalW;
      canvas.height = naturalH;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, naturalW, naturalH);
        resolve({
          dataUrl: canvas.toDataURL("image/png"),
          aspectRatio: naturalW / naturalH,
        });
      } else {
        resolve(undefined);
      }
    };
    img.onerror = () => resolve(undefined);
    img.src = firmaMarioUrl;
  });

/**
 * Construye en memoria el documento PDF oficial del presupuesto plasmando exclusivamente
 * las partidas y capítulos que tengan saldo o valor mayor a $0, junto con la firma firma_mario.png.
 */
export async function buildBudgetPdfDocument({ budgetInfo, items }) {
  // Carga diferida y en paralelo siguiendo @react-best-practices (async-parallel + bundle-defer-third-party)
  const [{ jsPDF }, logoDataUrl, signatureAsset] = await Promise.all([
    import("jspdf"),
    loadLogoAsPngDataUrl(),
    loadSignatureAsPngDataUrl(),
  ]);

  // Filtramos estrictamente los ítems que tengan cantidad, precio unitario y total mayores a 0
  const billableItems = (items || [])
    .map((item) => {
      const qty = Number(item.quantity) || 0;
      const unitCost = Number(item.unitCost) || 0;
      const computedTotal = Math.round(qty * unitCost);
      const totalCost = Number(item.totalCost) || computedTotal;
      return {
        ...item,
        quantity: qty,
        unitCost,
        totalCost,
      };
    })
    .filter(
      (item) => item.quantity > 0 && item.unitCost > 0 && item.totalCost > 0
    );

  // Calculamos el total general únicamente con las partidas válidas (> $0)
  const liveGrandTotal = billableItems.reduce(
    (acc, item) => acc + item.totalCost,
    0
  );

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const marginX = 12;
  const pageWidth = 210;
  const contentWidth = pageWidth - marginX * 2; // 186mm
  const maxPageY = 274; // Límite inferior antes del pie de página

  const longDateText = formatLongDateCL(budgetInfo.budgetDate);
  const clientText = budgetInfo.clientName?.trim() || "Sin especificar";
  const clientPhoneText = budgetInfo.clientPhone?.trim() || "";
  const clientEmailText = budgetInfo.clientEmail?.trim() || "";
  const projectText = budgetInfo.projectName?.trim() || "Sin especificar";
  const locationText = budgetInfo.location?.trim() || "Sin especificar";

  // Definición de columnas de la tabla (suma = 186mm)
  const cols = {
    code: { x: 12, w: 15 },
    desc: { x: 27, w: 91 },
    qty: { x: 118, w: 14 },
    unit: { x: 132, w: 16 },
    unitCost: { x: 148, w: 25 },
    totalCost: { x: 173, w: 25 },
  };

  /**
   * Dibuja el encabezado principal en la Página 1 con los datos reales de la cotización
   */
  const drawFirstPageHeader = () => {
    // Subtítulo superior verde
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(5, 150, 105);
    doc.text("PRESUPUESTO OFICIAL DE CONSTRUCCIÓN", marginX, 14);

    // Nombre de la Constructora
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17.5);
    doc.setTextColor(15, 23, 42);
    doc.text(
      budgetInfo.companyName || "Constructora María Graciela Silva Gallardo",
      marginX,
      21.5
    );

    // Bajada descriptiva
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      "Detalle de partidas, cubicaciones y costos de ejecución de obra",
      marginX,
      27
    );

    // Logotipo MGSG a la derecha
    if (logoDataUrl) {
      doc.addImage(logoDataUrl, "PNG", pageWidth - marginX - 25, 9, 25, 22.9);
    }

    // Franja divisoria verde esmeralda
    doc.setFillColor(5, 150, 105);
    doc.rect(marginX, 34, contentWidth, 1.1, "F");

    // Tarjeta de metadatos de la Cotización (Cliente, Contacto, Obra, Ubicación, Fecha y Total)
    const boxY = 38;
    const boxH = 24;
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(marginX, boxY, contentWidth, boxH, 1.5, 1.5, "FD");

    // Borde izquierdo verde acentuado en la tarjeta
    doc.setFillColor(5, 150, 105);
    doc.rect(marginX, boxY, 1.6, boxH, "F");

    // Columna 1: CLIENTE, CONTACTO Y OBRA
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text("CLIENTE / CONTACTO / OBRA", marginX + 4.5, boxY + 4.3);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.2);
    doc.setTextColor(5, 150, 105);
    const clientLines = doc.splitTextToSize(`Cliente: ${clientText}`, 65);
    doc.text(clientLines[0], marginX + 4.5, boxY + 8.3);

    const contactSummary = [clientPhoneText, clientEmailText]
      .filter(Boolean)
      .join(" · ");
    if (contactSummary) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.8);
      doc.setTextColor(71, 85, 105);
      const contactLines = doc.splitTextToSize(contactSummary, 65);
      doc.text(contactLines[0], marginX + 4.5, boxY + 12);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.6);
    doc.setTextColor(15, 23, 42);
    const obraLines = doc.splitTextToSize(`Obra: ${projectText}`, 65);
    doc.text(
      obraLines.slice(0, 2),
      marginX + 4.5,
      contactSummary ? boxY + 16 : boxY + 13
    );

    // Columna 2: DIRECCIÓN DE LA OBRA
    const col2X = 84;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text("DIRECCIÓN DE LA OBRA", col2X, boxY + 4.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.2);
    doc.setTextColor(15, 23, 42);
    const locLines = doc.splitTextToSize(locationText, 38);
    doc.text(locLines.slice(0, 3), col2X, boxY + 9);

    // Columna 3: FECHA TENTATIVA DE INICIO
    const col3X = 125;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text("FECHA DE INICIO", col3X, boxY + 4.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.2);
    doc.setTextColor(15, 23, 42);
    const dateLines = doc.splitTextToSize(longDateText, 29);
    doc.text(dateLines.slice(0, 2), col3X, boxY + 9);

    // Separador vertical antes del Total
    doc.setDrawColor(226, 232, 240);
    doc.line(156, boxY + 3, 156, boxY + boxH - 3);

    // Columna 4: TOTAL PRESUPUESTO
    const col4X = 160;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `TOTAL (${billableItems.length} ${
        billableItems.length === 1 ? "PARTIDA" : "PARTIDAS"
      })`,
      col4X,
      boxY + 4.5
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(4, 120, 87);
    doc.text(`$ ${formatNumberCL(liveGrandTotal)}`, col4X, boxY + 12);

    return 66;
  };

  /**
   * Dibuja el encabezado de continuación en la Página 2 y siguientes
   */
  const drawContinuationHeader = () => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(4, 120, 87);
    const contText = `CONTINUACIÓN DE PRESUPUESTO — CLIENTE: ${clientText.toUpperCase()} — ${locationText.toUpperCase()}`;
    doc.text(contText.slice(0, 105), marginX, 13);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13.5);
    doc.setTextColor(15, 23, 42);
    doc.text(
      budgetInfo.companyName || "Constructora María Graciela Silva Gallardo",
      marginX,
      19.5
    );

    if (logoDataUrl) {
      doc.addImage(logoDataUrl, "PNG", pageWidth - marginX - 18, 8.5, 18, 16.5);
    }

    doc.setFillColor(5, 150, 105);
    doc.rect(marginX, 26.5, contentWidth, 0.9, "F");

    return 31;
  };

  /**
   * Dibuja la fila de encabezados de columna de la tabla
   */
  const drawTableHeader = (y) => {
    const h = 8.5;
    doc.setFillColor(19, 42, 35); // Verde oscuro profundo (#132A23)
    doc.rect(marginX, y, contentWidth, h, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.2);
    doc.setTextColor(255, 255, 255);

    doc.text("CÓDIGO", cols.code.x + 2, y + 5.5);
    doc.text("ÍTEM / DESCRIPCIÓN DE PARTIDA", cols.desc.x + 2, y + 5.5);
    doc.text("CANT.", cols.qty.x + cols.qty.w / 2, y + 5.5, {
      align: "center",
    });
    doc.text("UNIDAD", cols.unit.x + cols.unit.w / 2, y + 5.5, {
      align: "center",
    });
    doc.text("COSTO", cols.unitCost.x + cols.unitCost.w - 2, y + 3.8, {
      align: "right",
    });
    doc.text("UNITARIO", cols.unitCost.x + cols.unitCost.w - 2, y + 6.8, {
      align: "right",
    });
    doc.text("COSTO", cols.totalCost.x + cols.totalCost.w - 2, y + 3.8, {
      align: "right",
    });
    doc.text("PARTIDA", cols.totalCost.x + cols.totalCost.w - 2, y + 6.8, {
      align: "right",
    });

    return y + h;
  };

  /**
   * Dibuja una fila de cabecera de capítulo (1.0 a 8.0) con su subtotal
   */
  const drawSectionHeaderRow = (y, section, sectionSubtotal, isContinuation) => {
    const h = 6.8;
    doc.setFillColor(230, 246, 238); // Fondo verde menta suave (#E6F6EE)
    doc.setDrawColor(209, 213, 219);
    doc.rect(marginX, y, contentWidth, h, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(section.sectionCode, cols.code.x + 2, y + 4.6);

    const titleSuffix = isContinuation ? " (Continuación)" : "";
    doc.text(`${section.title}${titleSuffix}`, cols.desc.x + 2, y + 4.6);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.8);
    doc.setTextColor(4, 120, 87);
    doc.text(
      `Subtotal Cap. ${section.sectionCode}: $ ${formatNumberCL(
        sectionSubtotal
      )}`,
      cols.totalCost.x + cols.totalCost.w - 2,
      y + 4.6,
      { align: "right" }
    );

    return y + h;
  };

  /**
   * Dibuja una fila de subcabecera (ej. 3.1 Piso y revestimiento de muros)
   */
  const drawSubheaderRow = (y, subheaderCode, subheaderTitle) => {
    const h = 6;
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(209, 213, 219);
    doc.rect(marginX, y, contentWidth, h, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.6);
    doc.setTextColor(30, 41, 59);
    doc.text(subheaderCode, cols.code.x + 2, y + 4.2);
    doc.text(subheaderTitle, cols.desc.x + 2, y + 4.2);

    return y + h;
  };

  // Inicializamos la Página 1
  let currentY = drawFirstPageHeader();
  currentY = drawTableHeader(currentY);

  // Recorremos las cabeceras estructurales (1.0 a 8.0) incluyendo solo aquellas con saldo > $0
  CATALOG_SECTIONS.forEach((section) => {
    const sectionItems = billableItems.filter(
      (item) => item.sectionCode === section.sectionCode
    );
    const sectionSubtotal = sectionItems.reduce(
      (acc, item) => acc + item.totalCost,
      0
    );

    // No mostramos capítulos sin ítems o con saldo $0 en el PDF final
    if (sectionItems.length === 0 || sectionSubtotal <= 0) {
      return;
    }

    // Si no queda espacio suficiente para la cabecera + al menos 1 fila, saltamos de página
    if (currentY + 14 > maxPageY) {
      doc.addPage();
      currentY = drawContinuationHeader();
      currentY = drawTableHeader(currentY);
    }

    currentY = drawSectionHeaderRow(currentY, section, sectionSubtotal, false);

    sectionItems.forEach((item, idx) => {
      const prevItem = sectionItems[idx - 1];
      const showSubheader =
        Boolean(item.subheaderCode) &&
        (!prevItem || prevItem.subheaderCode !== item.subheaderCode);

      // Si es una subpartida de tercer nivel (ej. 2.3.1, 3.1.1, 7.1.1), añadimos viñeta "• "
      const isThirdLevel = item.itemCode.split(".").length >= 3;
      const rawDesc = item.description || "";
      const formattedDesc =
        isThirdLevel && !rawDesc.startsWith("•") ? `• ${rawDesc}` : rawDesc;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.6);
      const descLines = doc.splitTextToSize(formattedDesc, cols.desc.w - 4);
      const rowH = Math.max(6, descLines.length * 3.8 + 2.2);
      const neededH = (showSubheader ? 6 : 0) + rowH;

      // Salto de página automático si la fila supera el margen inferior
      if (currentY + neededH > maxPageY) {
        doc.addPage();
        currentY = drawContinuationHeader();
        currentY = drawTableHeader(currentY);
        currentY = drawSectionHeaderRow(
          currentY,
          section,
          sectionSubtotal,
          true
        );
      }

      if (showSubheader) {
        currentY = drawSubheaderRow(
          currentY,
          item.subheaderCode,
          item.subheaderTitle
        );
      }

      // Fondo cebrado suave
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
      } else {
        doc.setFillColor(255, 255, 255);
      }
      doc.setDrawColor(226, 232, 240);
      doc.rect(marginX, currentY, contentWidth, rowH, "FD");

      // Líneas verticales de separación de celdas
      [
        cols.desc.x,
        cols.qty.x,
        cols.unit.x,
        cols.unitCost.x,
        cols.totalCost.x,
      ].forEach((colX) => {
        doc.line(colX, currentY, colX, currentY + rowH);
      });

      const textBaselineY =
        currentY + (rowH - (descLines.length - 1) * 3.6) / 2 + 1.1;
      const singleLineY = currentY + rowH / 2 + 1.2;

      // Código
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text(item.itemCode, cols.code.x + 2, singleLineY);

      // Descripción
      doc.setTextColor(30, 41, 59);
      doc.text(descLines, cols.desc.x + 2, textBaselineY);

      // Cantidad
      doc.setTextColor(15, 23, 42);
      doc.text(
        String(item.quantity),
        cols.qty.x + cols.qty.w / 2,
        singleLineY,
        { align: "center" }
      );

      // Unidad
      doc.setTextColor(71, 85, 105);
      doc.text(item.unit || "", cols.unit.x + cols.unit.w / 2, singleLineY, {
        align: "center",
      });

      // Costo Unitario ($ a la izquierda, monto a la derecha)
      doc.setTextColor(100, 116, 139);
      doc.text("$", cols.unitCost.x + 2, singleLineY);
      doc.setTextColor(15, 23, 42);
      doc.text(
        formatNumberCL(item.unitCost),
        cols.unitCost.x + cols.unitCost.w - 2,
        singleLineY,
        { align: "right" }
      );

      // Costo Partida ($ a la izquierda, monto en negrita a la derecha)
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("$", cols.totalCost.x + 2, singleLineY);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(
        formatNumberCL(item.totalCost),
        cols.totalCost.x + cols.totalCost.w - 2,
        singleLineY,
        { align: "right" }
      );

      currentY += rowH;
    });
  });

  // Calculamos las filas del resumen por capítulos excluyendo aquellas con saldo $0
  const getCapSubtotal = (code) =>
    billableItems
      .filter((i) => i.sectionCode === code)
      .reduce((acc, i) => acc + i.totalCost, 0);

  const summaryRows = CATALOG_SECTIONS.map((sec) => ({
    label: `${sec.sectionCode} ${sec.title}`,
    amount: getCapSubtotal(sec.sectionCode),
  })).filter((row) => row.amount > 0);

  // Bloque inferior: Firma del Responsable + Resumen por Capítulos
  const bodyH = Math.max(10, summaryRows.length * 4.6 + 2.5);
  const summaryBlockH = Math.max(46, 6.5 + bodyH + 9);

  if (currentY + summaryBlockH + 6 > maxPageY) {
    doc.addPage();
    currentY = drawContinuationHeader();
  } else {
    currentY += 6;
  }

  // 1. Recuadro Izquierdo: Firma (borde punteado)
  const sigBoxX = marginX;
  const sigBoxY = currentY + 2;
  const sigBoxW = 86;
  const sigBoxH = 42;

  doc.setDrawColor(203, 213, 225);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.roundedRect(sigBoxX, sigBoxY, sigBoxW, sigBoxH, 2, 2, "S");
  doc.setLineDashPattern([], 0);

  // Inserción de la firma real desde firma_mario.png centrada sobre la línea de firma
  if (signatureAsset?.dataUrl) {
    const maxSigW = 54;
    const maxSigH = 20;
    const ratio = signatureAsset.aspectRatio || 2.7;
    let sigW = maxSigW;
    let sigH = sigW / ratio;
    if (sigH > maxSigH) {
      sigH = maxSigH;
      sigW = sigH * ratio;
    }
    const sigX = sigBoxX + (sigBoxW - sigW) / 2;
    const sigY = sigBoxY + 26.5 - sigH;
    doc.addImage(signatureAsset.dataUrl, "PNG", sigX, sigY, sigW, sigH);
  }

  // Línea de firma
  doc.setDrawColor(15, 23, 42);
  doc.line(sigBoxX + 12, sigBoxY + 27, sigBoxX + sigBoxW - 12, sigBoxY + 27);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(
    budgetInfo.signerName || "MARIO CONTRERAS FRIAS",
    sigBoxX + sigBoxW / 2,
    sigBoxY + 32.5,
    { align: "center" }
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(100, 116, 139);
  doc.text(
    budgetInfo.companyName || "Constructora María Graciela Silva Gallardo",
    sigBoxX + sigBoxW / 2,
    sigBoxY + 37,
    { align: "center" }
  );

  // 2. Recuadro Derecho: RESUMEN POR CAPÍTULOS (solo capítulos con monto > $0)
  const sumBoxX = 104;
  const sumBoxY = currentY;
  const sumBoxW = 94;

  // Cabecera del recuadro resumen
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(30, 41, 59);
  doc.rect(sumBoxX, sumBoxY, sumBoxW, 6.5, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text("RESUMEN POR CAPÍTULOS", sumBoxX + 3.5, sumBoxY + 4.5);

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(30, 41, 59);
  doc.rect(sumBoxX, sumBoxY + 6.5, sumBoxW, bodyH, "FD");

  summaryRows.forEach((row, idx) => {
    const rY = sumBoxY + 10.5 + idx * 4.6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    doc.setTextColor(51, 65, 85);
    const labelLines = doc.splitTextToSize(row.label, 62);
    doc.text(labelLines[0], sumBoxX + 3.5, rY);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    doc.text(
      `$ ${formatNumberCL(row.amount)}`,
      sumBoxX + sumBoxW - 3.5,
      rY,
      { align: "right" }
    );
  });

  // Franja inferior TOTAL en el recuadro de resumen
  const totalBarY = sumBoxY + 6.5 + bodyH;
  const totalBarH = 9;
  doc.setFillColor(19, 42, 35);
  doc.rect(sumBoxX, totalBarY, sumBoxW, totalBarH, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text("TOTAL", sumBoxX + 3.5, totalBarY + 6);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(52, 211, 153);
  doc.text(
    `$ ${formatNumberCL(liveGrandTotal)}`,
    sumBoxX + sumBoxW - 3.5,
    totalBarY + 6.2,
    { align: "right" }
  );

  // Numeración y pie de página en todas las hojas (Página X de Y)
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(226, 232, 240);
    doc.line(marginX, 282, pageWidth - marginX, 282);

    // Punto verde corporativo
    doc.setFillColor(5, 150, 105);
    doc.circle(marginX + 1.5, 286.2, 1, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    doc.setTextColor(100, 116, 139);
    const footerLeft = `${budgetInfo.companyName} — Cliente: ${clientText} — Obra: ${projectText}, ${locationText}`;
    doc.text(footerLeft.slice(0, 115), marginX + 4.5, 287);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(51, 65, 85);
    doc.text(`Página ${p} de ${totalPages}`, pageWidth - marginX, 287, {
      align: "right",
    });
  }

  // Nombre de archivo limpio basado en el cliente o la ubicación
  const safeSuffix = (budgetInfo.clientName || budgetInfo.location || "Obra")
    .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_-]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const fileName = `Presupuesto_MGSG_${safeSuffix || "Oficial"}.pdf`;

  return {
    doc,
    fileName,
    billableCount: billableItems.length,
    liveGrandTotal,
  };
}

/**
 * Genera el archivo File / Blob del PDF oficial para adjuntarlo o compartirlo por correo electrónico.
 */
export async function createBudgetPdfFile({ budgetInfo, items }) {
  const { doc, fileName, billableCount, liveGrandTotal } =
    await buildBudgetPdfDocument({ budgetInfo, items });

  const pdfBlob = doc.output("blob");
  const pdfFile = new File([pdfBlob], fileName, {
    type: "application/pdf",
  });

  return {
    pdfBlob,
    pdfFile,
    fileName,
    billableCount,
    liveGrandTotal,
    download: () => doc.save(fileName),
  };
}

/**
 * Genera y descarga directamente el archivo PDF de la cotización.
 */
export async function generateBudgetPdf({ budgetInfo, items }) {
  const { doc, fileName } = await buildBudgetPdfDocument({ budgetInfo, items });
  doc.save(fileName);
}
