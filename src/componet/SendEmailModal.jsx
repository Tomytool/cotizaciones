import { useEffect, useRef, useState } from "react";
import { CATALOG_SECTIONS } from "../data/itemsData";

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
 * Construye el cuerpo de correo formal con el resumen ejecutivo de la cotización
 */
const buildDefaultEmailBody = (budgetInfo, items) => {
  const billableItems = (items || []).filter((item) => {
    const qty = Number(item.quantity) || 0;
    const unitCost = Number(item.unitCost) || 0;
    const total = Number(item.totalCost) || Math.round(qty * unitCost);
    return qty > 0 && unitCost > 0 && total > 0;
  });

  const grandTotal = billableItems.reduce(
    (acc, item) =>
      acc +
      (Number(item.totalCost) ||
        Math.round((Number(item.quantity) || 0) * (Number(item.unitCost) || 0))),
    0
  );

  const chapterLines = CATALOG_SECTIONS.map((sec) => {
    const subtotal = billableItems
      .filter((i) => i.sectionCode === sec.sectionCode)
      .reduce(
        (acc, i) =>
          acc +
          (Number(i.totalCost) ||
            Math.round((Number(i.quantity) || 0) * (Number(i.unitCost) || 0))),
        0
      );
    return subtotal > 0
      ? `• ${sec.sectionCode} ${sec.title}: ${formatCurrency(subtotal)}`
      : undefined;
  }).filter(Boolean);

  const clientGreeting = budgetInfo.clientName?.trim()
    ? `Estimado/a ${budgetInfo.clientName.trim()},`
    : "Estimado/a cliente,";

  return [
    clientGreeting,
    "",
    `Junto con saludar, adjuntamos el documento PDF con el Presupuesto Oficial de Construcción correspondiente al proyecto «${
      budgetInfo.projectName?.trim() || "Cotización de Obra"
    }».`,
    "",
    "DETALLE GENERAL DE LA COTIZACIÓN:",
    `• Obra: ${budgetInfo.projectName?.trim() || "Por definir"}`,
    `• Ubicación: ${budgetInfo.location?.trim() || "Por definir"}`,
    `• Fecha tentativa de inicio: ${budgetInfo.budgetDate || "Por definir"}`,
    `• Partidas valorizadas: ${billableItems.length}`,
    "",
    ...(chapterLines.length > 0
      ? ["RESUMEN POR CAPÍTULOS:", ...chapterLines, ""]
      : []),
    `TOTAL PRESUPUESTO: ${formatCurrency(grandTotal)}`,
    "",
    "Quedamos atentos a sus comentarios o consultas.",
    "",
    "Atentamente,",
    budgetInfo.signerName || "MARIO CONTRERAS FRIAS",
    budgetInfo.companyName || "Constructora María Graciela Silva Gallardo",
  ].join("\n");
};

/**
 * Modal accesible para generar el archivo PDF de la cotización y enviarlo
 * al correo electrónico del cliente (@frontend-ui-engineering y @react-best-practices).
 */
export default function SendEmailModal({
  isOpen,
  onClose,
  budgetInfo,
  items,
  onUpdateClientEmail,
}) {
  const emailInputRef = useRef(null);

  const [recipientEmail, setRecipientEmail] = useState(
    () => budgetInfo.clientEmail || ""
  );
  const [subject, setSubject] = useState(
    () =>
      `Cotización de Obra: ${
        budgetInfo.projectName?.trim() || "Presupuesto Oficial"
      } — ${
        budgetInfo.companyName || "Constructora María Graciela Silva Gallardo"
      }`
  );
  const [messageBody, setMessageBody] = useState(() =>
    buildDefaultEmailBody(budgetInfo, items)
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState(undefined);

  // Soporte de navegación con teclado (Escape para cerrar y auto-enfoque inicial)
  useEffect(() => {
    if (!isOpen) return;
    emailInputRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const safeSuffix = (budgetInfo.clientName || budgetInfo.location || "Obra")
    .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_-]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const previewFileName = `Presupuesto_MGSG_${safeSuffix || "Oficial"}.pdf`;

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    recipientEmail.trim()
  );

  // Verifica si el navegador soporta compartir archivos PDF directamente (Web Share API Level 2)
  const canUseNativeFileShare =
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function";

  // 1. Generar PDF y abrir el cliente de correo predeterminado (mailto:)
  const handleSendViaDefaultMailClient = async (e) => {
    e.preventDefault();
    if (!isValidEmail || isProcessing) return;

    setIsProcessing(true);
    setStatusFeedback(undefined);

    try {
      const cleanEmail = recipientEmail.trim();
      if (onUpdateClientEmail && cleanEmail !== budgetInfo.clientEmail) {
        onUpdateClientEmail(cleanEmail);
      }

      const { createBudgetPdfFile } = await import(
        "../utils/generateBudgetPdf"
      );
      const { download, fileName } = await createBudgetPdfFile({
        budgetInfo: { ...budgetInfo, clientEmail: cleanEmail },
        items,
      });

      // Descargamos automáticamente el PDF generado para que el usuario lo adjunte en su correo
      download();

      // Abrimos el cliente de correo del usuario con destinatario, asunto y cuerpo precargados
      const mailtoUrl = `mailto:${encodeURIComponent(
        cleanEmail
      )}?subject=${encodeURIComponent(subject.trim())}&body=${encodeURIComponent(
        messageBody
      )}`;
      window.location.href = mailtoUrl;

      setStatusFeedback({
        type: "success",
        text: `Se descargó «${fileName}» y se abrió tu aplicación de correo para ${cleanEmail}. Solo adjunta el archivo PDF descargado y pulsa Enviar.`,
      });
    } catch (error) {
      console.error("Error al preparar el envío por correo:", error);
      setStatusFeedback({
        type: "error",
        text: "No se pudo generar el documento PDF para el correo. Inténtalo nuevamente.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Generar PDF y abrir directamente Gmail Web en una nueva pestaña
  const handleSendViaGmailWeb = async () => {
    if (!isValidEmail || isProcessing) return;

    setIsProcessing(true);
    setStatusFeedback(undefined);

    try {
      const cleanEmail = recipientEmail.trim();
      if (onUpdateClientEmail && cleanEmail !== budgetInfo.clientEmail) {
        onUpdateClientEmail(cleanEmail);
      }

      const { createBudgetPdfFile } = await import(
        "../utils/generateBudgetPdf"
      );
      const { download, fileName } = await createBudgetPdfFile({
        budgetInfo: { ...budgetInfo, clientEmail: cleanEmail },
        items,
      });

      // Descargamos el PDF oficial
      download();

      // Abrimos redacción en Gmail Web con Para, Asunto y Cuerpo listos
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
        cleanEmail
      )}&su=${encodeURIComponent(subject.trim())}&body=${encodeURIComponent(
        messageBody
      )}`;
      window.open(gmailUrl, "_blank", "noopener,noreferrer");

      setStatusFeedback({
        type: "success",
        text: `Se descargó «${fileName}» y se abrió Gmail Web para ${cleanEmail}. Arrastra el PDF recién descargado al correo.`,
      });
    } catch (error) {
      console.error("Error al abrir Gmail Web:", error);
      setStatusFeedback({
        type: "error",
        text: "Ocurrió un problema al preparar el PDF para Gmail.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Compartir el archivo PDF directamente mediante el selector nativo del sistema (Móvil / Escritorio compatible)
  const handleNativeShareWithPdf = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setStatusFeedback(undefined);

    try {
      const cleanEmail = recipientEmail.trim();
      const { createBudgetPdfFile } = await import(
        "../utils/generateBudgetPdf"
      );
      const { pdfFile, download, fileName } = await createBudgetPdfFile({
        budgetInfo: { ...budgetInfo, clientEmail: cleanEmail },
        items,
      });

      if (
        canUseNativeFileShare &&
        navigator.canShare({ files: [pdfFile] })
      ) {
        await navigator.share({
          title: subject.trim(),
          text: messageBody,
          files: [pdfFile],
        });
        setStatusFeedback({
          type: "success",
          text: `Archivo «${fileName}» compartido directamente con el adjunto PDF.`,
        });
      } else {
        download();
        setStatusFeedback({
          type: "success",
          text: `Tu navegador descargó «${fileName}». Usa cualquiera de los botones de correo abajo para enviarlo.`,
        });
      }
    } catch (error) {
      if (error?.name !== "AbortError") {
        console.error("Error al compartir el archivo PDF:", error);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="send-email-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-2.5 backdrop-blur-xs sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-xl">
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-900 px-4 py-3.5 text-white sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white">
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
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </span>
            <div>
              <h2
                id="send-email-modal-title"
                className="text-sm font-bold text-white sm:text-base"
              >
                Enviar Cotización PDF al Cliente
              </h2>
              <p className="text-xs text-slate-300">
                Genera el PDF firmado y envíalo al correo electrónico del
                cliente.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana de envío por correo"
            className="inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-xl text-slate-300 transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            ✕
          </button>
        </div>

        {/* Cuerpo del Modal con scroll interno */}
        <form
          onSubmit={handleSendViaDefaultMailClient}
          className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-6"
        >
          {/* Tarjeta del Documento PDF que se adjuntará */}
          <div className="flex flex-col justify-between gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-xs font-black text-white">
                PDF
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-emerald-950 sm:text-sm">
                  {previewFileName}
                </p>
                <p className="text-[11px] font-medium text-emerald-800">
                  Incluye logo MGSG, firma de Mario Contreras y partidas &gt; $0
                </p>
              </div>
            </div>

            {canUseNativeFileShare && (
              <button
                type="button"
                onClick={handleNativeShareWithPdf}
                disabled={isProcessing}
                className="min-h-[40px] shrink-0 cursor-pointer rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-bold text-emerald-900 transition-colors hover:bg-emerald-100/60"
              >
                Adjuntar Directo (App Nativa)
              </button>
            )}
          </div>

          {/* Campo 1: Correo electrónico del cliente */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="recipientEmailInput"
              className="text-xs font-bold uppercase tracking-wide text-slate-700"
            >
              Correo electrónico del cliente (Para) *
            </label>
            <input
              ref={emailInputRef}
              id="recipientEmailInput"
              type="email"
              inputMode="email"
              required
              placeholder="cliente@correo.cl"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-base font-medium text-slate-900 transition-colors focus-visible:border-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/20 sm:text-sm"
            />
            {!isValidEmail && recipientEmail.trim() !== "" && (
              <span role="alert" className="text-xs font-medium text-red-600">
                Ingresa una dirección de correo electrónico válida.
              </span>
            )}
          </div>

          {/* Campo 2: Asunto del correo */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="emailSubjectInput"
              className="text-xs font-bold uppercase tracking-wide text-slate-700"
            >
              Asunto del correo *
            </label>
            <input
              id="emailSubjectInput"
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-900 transition-colors focus-visible:border-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/20"
            />
          </div>

          {/* Campo 3: Mensaje / Resumen de la cotización */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="emailBodyTextarea"
              className="text-xs font-bold uppercase tracking-wide text-slate-700"
            >
              Mensaje con resumen del presupuesto *
            </label>
            <textarea
              id="emailBodyTextarea"
              rows={7}
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50/60 p-3 text-xs leading-relaxed text-slate-800 transition-colors focus-visible:border-emerald-700 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/20 sm:text-sm"
            />
          </div>

          {/* Mensaje de confirmación o error */}
          {statusFeedback && (
            <div
              role="status"
              aria-live="polite"
              className={`rounded-xl border px-3.5 py-2.5 text-xs font-semibold ${
                statusFeedback.type === "error"
                  ? "border-red-200 bg-red-50 text-red-800"
                  : "border-emerald-300 bg-emerald-50 text-emerald-950"
              }`}
            >
              {statusFeedback.text}
            </div>
          )}

          {/* Botones de Acción Táctiles (>= 44px, Contraste WCAG AA >= 5.48:1) */}
          <div className="mt-1 flex flex-col gap-2.5 border-t border-slate-200 pt-3.5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100"
            >
              Cerrar
            </button>

            <button
              type="button"
              onClick={handleSendViaGmailWeb}
              disabled={!isValidEmail || isProcessing}
              className="min-h-[44px] cursor-pointer rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Descargar PDF y Abrir en Gmail
            </button>

            <button
              type="submit"
              disabled={!isValidEmail || isProcessing}
              className="inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <span>
                {isProcessing
                  ? "Preparando PDF..."
                  : "Descargar PDF y Enviar por Correo"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

