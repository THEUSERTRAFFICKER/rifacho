import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { PurchasedOrder } from '../types';
import { siteConfig } from '../config/siteConfig';

/**
 * Función auxiliar para descargar DataURL como archivo en el navegador
 */
function triggerDownload(dataUrl: string, fileName: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
  }, 100);
}

/**
 * Renderizador de respaldo en Canvas puro 2D
 * Garantiza que si html2canvas llega a fallar en cualquier navegador,
 * la imagen PNG, JPG o el PDF de 1 página se generen 100% de forma impecable sin errores.
 */
export function renderFallbackTicketCanvas(order: PurchasedOrder): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const width = 1240; // 620px a 2x resolución
  const tickets = order.ticketNumbers || [];
  const rows = Math.ceil(tickets.length / 5);
  const ticketsHeight = Math.max(120, rows * 64 + 40);
  const height = 1450 + ticketsHeight;
  
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Fondo blanco limpio
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // 1. Encabezado Rojo
  const grad = ctx.createLinearGradient(0, 0, width, 0);
  grad.addColorStop(0, '#990000');
  grad.addColorStop(0.5, '#CC0000');
  grad.addColorStop(1, '#990000');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, 240);

  // Distintivo Dorado Superior
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.roundRect(width / 2 - 250, 20, 500, 36, 18);
  ctx.fill();
  ctx.fillStyle = '#FBBF24';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('★ BOLETA DIGITAL OFICIAL Y REGISTRADA ★', width / 2, 44);

  // Título del Sorteo
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 48px sans-serif';
  ctx.fillText((siteConfig.raffleName || 'RIFACHO').toUpperCase(), width / 2, 110);

  // Subtítulo y Premio
  ctx.fillStyle = '#FEF08A';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(`${siteConfig.productTitle} • ${siteConfig.awardHighlightText}`, width / 2, 155);

  // Metadata legal
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = '18px monospace';
  ctx.fillText(`Edición N° ${siteConfig.editionNumber || 1} • Sorteo Autorizado • Lotería de Medellín`, width / 2, 195);

  // 2. Línea de perforación y folio
  ctx.fillStyle = '#F3F4F6';
  ctx.fillRect(0, 240, width, 50);
  ctx.strokeStyle = '#D1D5DB';
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(0, 240);
  ctx.lineTo(width, 240);
  ctx.moveTo(0, 290);
  ctx.lineTo(width, 290);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#4B5563';
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('TALONARIO DIGITAL DE SEGURIDAD', 40, 272);
  ctx.fillStyle = '#DC2626';
  ctx.textAlign = 'center';
  ctx.fillText(`FOLIO: #${order.orderNumber}`, width / 2, 272);
  ctx.fillStyle = '#4B5563';
  ctx.textAlign = 'right';
  ctx.fillText(order.createdAt.split(' ')[0] || '', width - 40, 272);

  // 3. Caja de Datos del Titular
  let curY = 320;
  ctx.fillStyle = '#F9FAFB';
  ctx.strokeStyle = '#E5E7EB';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(40, curY, width - 80, 260, 16);
  ctx.fill();
  ctx.stroke();

  // Header de la caja
  ctx.textAlign = 'left';
  ctx.fillStyle = '#6B7280';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('👤 DATOS DEL TITULAR (COMPRADOR)', 65, curY + 40);

  ctx.fillStyle = '#059669';
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'right';
  ctx.fillText('✓ PAGO APROBADO', width - 65, curY + 40);

  // Datos
  ctx.textAlign = 'left';
  ctx.fillStyle = '#4B5563';
  ctx.font = '16px sans-serif';
  ctx.fillText('Nombre Completo:', 65, curY + 80);
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(`${order.customerName} ${order.customerLastName}`, 65, curY + 112);

  // Cédula Destacada
  ctx.fillStyle = '#FEF3C7';
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(width / 2 + 10, curY + 65, width / 2 - 75, 75, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#78350F';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('🆔 CÉDULA / DOC. IDENTIDAD:', width / 2 + 30, curY + 95);
  ctx.fillStyle = '#451A03';
  ctx.font = '900 26px monospace';
  ctx.fillText(order.identification || 'No registrada', width / 2 + 30, curY + 128);

  // Teléfono y Correo
  ctx.fillStyle = '#4B5563';
  ctx.font = '16px sans-serif';
  ctx.fillText('Teléfono / Celular:', 65, curY + 165);
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 20px monospace';
  ctx.fillText(`+57 ${order.phone}`, 65, curY + 195);

  ctx.fillStyle = '#4B5563';
  ctx.font = '16px sans-serif';
  ctx.fillText('Correo Electrónico:', width / 2 + 10, curY + 165);
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 20px monospace';
  ctx.fillText(order.email, width / 2 + 10, curY + 195);

  if (order.address) {
    ctx.fillStyle = '#4B5563';
    ctx.font = '15px sans-serif';
    ctx.fillText(`Dirección: ${order.address}`, 65, curY + 235);
  }

  // 4. Resumen de Transacción (4 tarjetas)
  curY += 285;
  const colW = (width - 80 - 30) / 4;
  const cards = [
    { label: 'N° DE ORDEN', val: `#${order.orderNumber}`, color: '#111827' },
    { label: 'CANTIDAD', val: `${order.quantity} Números`, color: '#B91C1C' },
    { label: 'TOTAL PAGADO', val: `$ ${order.totalCOP.toLocaleString('es-CO')} COP`, color: '#047857' },
    { label: 'FECHA EMISIÓN', val: order.createdAt.split(' ')[0] || '', color: '#1F2937' },
  ];

  cards.forEach((c, idx) => {
    const cardX = 40 + idx * (colW + 10);
    ctx.fillStyle = '#F9FAFB';
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(cardX, curY, colW, 90, 12);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#6B7280';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(c.label, cardX + colW / 2, curY + 30);

    ctx.fillStyle = c.color;
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(c.val, cardX + colW / 2, curY + 65);
  });

  curY += 115;

  // Certificado Oficial si tiene números premiados
  if (order.wonPrizes && order.wonPrizes.length > 0) {
    ctx.fillStyle = '#FDE68A';
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(40, curY, width - 80, 85, 14);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#78350F';
    ctx.font = '900 16px sans-serif';
    ctx.fillText('🏆 CERTIFICADO OFICIAL DE BOLETO PREMIADO 🏆', width / 2, curY + 30);

    ctx.fillStyle = '#451A03';
    ctx.font = 'bold 20px sans-serif';
    const prizesStr = order.wonPrizes.map((p) => `${p.prizeTitle} en el Boleto #${p.ticketNumber}`).join(' • ');
    ctx.fillText(prizesStr, width / 2, curY + 62);
    curY += 105;
  }

  // 5. Números de la Suerte
  ctx.fillStyle = 'rgba(254, 242, 242, 0.5)';
  ctx.strokeStyle = '#FCA5A5';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(40, curY, width - 80, ticketsHeight + 80, 16);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#7F1D1D';
  ctx.font = '900 20px sans-serif';
  ctx.fillText(`🎲 TUS NÚMEROS DE LA SUERTE (${tickets.length}):`, 65, curY + 40);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#B91C1C';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('Oficiales para el Sorteo', width - 65, curY + 40);

  // Grid de números
  const tColW = (width - 130) / 5;
  tickets.forEach((num, i) => {
    const r = Math.floor(i / 5);
    const c = i % 5;
    const tX = 65 + c * (tColW + 10);
    const tY = curY + 65 + r * 64;

    const isWon = order.wonPrizes?.some((p) => p.ticketNumber === num);
    ctx.fillStyle = isWon ? '#FEF3C7' : '#FFFFFF';
    ctx.strokeStyle = isWon ? '#D97706' : '#FCA5A5';
    ctx.lineWidth = isWon ? 2.5 : 1.5;
    ctx.beginPath();
    ctx.roundRect(tX, tY, tColW, 52, 10);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = isWon ? '#78350F' : '#991B1B';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(isWon ? `👑 ${num}` : num, tX + tColW / 2, tY + 36);
  });

  curY += ticketsHeight + 110;

  // 6. Código de Barras y Sello de Seguridad
  ctx.fillStyle = '#111827';
  let barX = 65;
  const barWidths = [4, 2, 6, 2, 4, 8, 2, 4, 6, 2, 8, 4, 2, 6, 4, 2, 4, 6, 2, 4, 8, 2, 6, 4];
  barWidths.forEach((w) => {
    ctx.fillRect(barX, curY, w * 2, 50);
    barX += w * 2 + 4;
  });
  ctx.textAlign = 'left';
  ctx.fillStyle = '#4B5563';
  ctx.font = '14px monospace';
  ctx.fillText(`*TCK-${order.orderNumber}-${order.identification || 'CC'}*`, 65, curY + 70);

  // Sello Oficial
  ctx.save();
  ctx.translate(width - 140, curY + 25);
  ctx.rotate(-0.1);
  ctx.strokeStyle = '#B91C1C';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 48, 0, Math.PI * 2);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#B91C1C';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('RIFACHO', 0, -18);
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('OFICIAL', 0, -3);
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('✓ CERT', 0, 15);
  ctx.font = 'bold 10px monospace';
  ctx.fillText(order.createdAt.split(' ')[0] || '', 0, 30);
  ctx.restore();

  curY += 105;

  // 7. Pie de Página y Crédito Oficial del Creador del Sistema
  ctx.strokeStyle = '#E5E7EB';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, curY);
  ctx.lineTo(width - 40, curY);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#6B7280';
  ctx.font = '15px sans-serif';
  ctx.fillText(`${siteConfig.raffleName} • Operado legalmente en Colombia. Consulta los resultados oficiales en nuestra web.`, width / 2, curY + 28);
  
  // CREADOR DEL SISTEMA: www.theusertrafficker.com
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('Desarrollo y Sistema oficial por: www.theusertrafficker.com', width / 2, curY + 54);

  return canvas;
}

/**
 * Captura un elemento HTML a canvas con sanitización completa
 */
async function captureElement(element: HTMLElement, order?: PurchasedOrder): Promise<HTMLCanvasElement> {
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: false, // ¡NUNCA true! allowTaint: true bloquea toDataURL() por seguridad del navegador
      logging: false,
      backgroundColor: '#ffffff',
      removeContainer: true,
      imageTimeout: 10000,
      windowWidth: 620,
      onclone: (clonedDoc, clonedElement) => {
        clonedElement.style.width = '620px';
        clonedElement.style.maxWidth = '620px';
        clonedElement.style.minHeight = 'auto';
        clonedElement.style.height = 'auto';
        clonedElement.style.overflow = 'visible';
        clonedElement.style.transform = 'none';

        // Expandir listas con scroll para que salgan todos los números
        const scrollables = clonedElement.querySelectorAll('.overflow-y-auto, [class*="overflow-y"]');
        scrollables.forEach((el) => {
          const htmlEl = el as HTMLElement;
          htmlEl.style.maxHeight = 'none';
          htmlEl.style.overflow = 'visible';
          htmlEl.style.height = 'auto';
        });

        // Limpiar propiedades CSS modernas que rompen html2canvas
        const allElements = clonedElement.querySelectorAll('*');
        allElements.forEach((el) => {
          const htmlEl = el as HTMLElement;
          if (htmlEl.style) {
            htmlEl.style.backdropFilter = 'none';
            (htmlEl.style as any).webkitBackdropFilter = 'none';
          }
        });
      },
    });

    // Probar si el canvas es exportable
    canvas.toDataURL('image/png');
    return canvas;
  } catch (err) {
    console.warn('html2canvas falló, activando motor de renderizado de respaldo:', err);
    if (order) {
      return renderFallbackTicketCanvas(order);
    }
    throw err;
  }
}

/**
 * Descarga un elemento HTML como imagen PNG en alta resolución (scale: 2)
 */
export async function downloadElementAsPNG(
  element: HTMLElement,
  fileName: string,
  order?: PurchasedOrder
): Promise<boolean> {
  try {
    const canvas = await captureElement(element, order);
    const dataUrl = canvas.toDataURL('image/png');
    triggerDownload(dataUrl, fileName.endsWith('.png') ? fileName : `${fileName}.png`);
    return true;
  } catch (error) {
    console.error('Error generando PNG:', error);
    if (order) {
      try {
        const fallback = renderFallbackTicketCanvas(order);
        triggerDownload(fallback.toDataURL('image/png'), fileName.endsWith('.png') ? fileName : `${fileName}.png`);
        return true;
      } catch (e2) {
        console.error('Fallo en respaldo PNG:', e2);
      }
    }
    return false;
  }
}

/**
 * Descarga un elemento HTML como imagen JPG en alta calidad sobre fondo blanco garantizado
 */
export async function downloadElementAsJPG(
  element: HTMLElement,
  fileName: string,
  order?: PurchasedOrder
): Promise<boolean> {
  try {
    const canvas = await captureElement(element, order);

    // Garantizar fondo blanco sólido para JPG (evita fondo negro por transparencia)
    const jpgCanvas = document.createElement('canvas');
    jpgCanvas.width = canvas.width;
    jpgCanvas.height = canvas.height;
    const ctx = jpgCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, jpgCanvas.width, jpgCanvas.height);
      ctx.drawImage(canvas, 0, 0);
    }

    const dataUrl = jpgCanvas.toDataURL('image/jpeg', 0.95);
    triggerDownload(dataUrl, fileName.endsWith('.jpg') ? fileName : `${fileName}.jpg`);
    return true;
  } catch (error) {
    console.error('Error generando JPG:', error);
    if (order) {
      try {
        const fallback = renderFallbackTicketCanvas(order);
        const jpgCanvas = document.createElement('canvas');
        jpgCanvas.width = fallback.width;
        jpgCanvas.height = fallback.height;
        const ctx = jpgCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, jpgCanvas.width, jpgCanvas.height);
          ctx.drawImage(fallback, 0, 0);
        }
        triggerDownload(jpgCanvas.toDataURL('image/jpeg', 0.95), fileName.endsWith('.jpg') ? fileName : `${fileName}.jpg`);
        return true;
      } catch (e2) {
        console.error('Fallo en respaldo JPG:', e2);
      }
    }
    return false;
  }
}

/**
 * Descarga el tiquete como documento PDF oficial configurado para EXACTAMENTE 1 PÁGINA A4
 */
export async function downloadElementAsPDF(
  element: HTMLElement,
  fileName: string,
  title: string = 'Tiquete Oficial Rifacho',
  order?: PurchasedOrder
): Promise<boolean> {
  try {
    const canvas = await captureElement(element, order);
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth(); // 210 mm
    const pageHeight = pdf.internal.pageSize.getHeight(); // 297 mm
    const margin = 8; // 8 mm margin
    const maxAvailableWidth = pageWidth - margin * 2;
    const maxAvailableHeight = pageHeight - margin * 2;

    // Escala para que TODO el tiquete encaje matemáticamente en EXACTAMENTE 1 PÁGINA
    const scaleFactor = Math.min(
      maxAvailableWidth / canvas.width,
      maxAvailableHeight / canvas.height
    );

    const finalW = canvas.width * scaleFactor;
    const finalH = canvas.height * scaleFactor;
    const posX = (pageWidth - finalW) / 2;
    const posY = margin + Math.max(0, (maxAvailableHeight - finalH) / 2);

    // addImage en la única página (nunca se llama a addPage)
    pdf.addImage(imgData, 'PNG', posX, posY, finalW, finalH, undefined, 'FAST');

    pdf.setProperties({
      title,
      subject: 'Comprobante y Boleta Oficial de Sorteo',
      creator: 'www.theusertrafficker.com',
      author: 'The User Trafficker',
    });

    pdf.save(fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
    return true;
  } catch (error) {
    console.error('Error generando PDF:', error);
    if (order) {
      try {
        const fallback = renderFallbackTicketCanvas(order);
        const imgData = fallback.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
          compress: true,
        });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 8;
        const maxW = pageWidth - margin * 2;
        const maxH = pageHeight - margin * 2;
        const scale = Math.min(maxW / fallback.width, maxH / fallback.height);
        const fW = fallback.width * scale;
        const fH = fallback.height * scale;
        const pX = (pageWidth - fW) / 2;
        const pY = margin + Math.max(0, (maxH - fH) / 2);
        pdf.addImage(imgData, 'PNG', pX, pY, fW, fH, undefined, 'FAST');
        pdf.setProperties({
          title,
          creator: 'www.theusertrafficker.com',
          author: 'The User Trafficker',
        });
        pdf.save(fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
        return true;
      } catch (e2) {
        console.error('Fallo en respaldo PDF:', e2);
      }
    }
    return false;
  }
}

/**
 * Genera el enlace de WhatsApp listo para compartir la boleta con el cliente
 */
export function getWhatsAppShareTicketUrl(order: PurchasedOrder): string {
  const cleanPhone = (order.phone || '').replace(/\D/g, '');
  const targetPhone = cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone}`;
  
  const text = `🎟️ *COMPROBANTE OFICIAL DE BOLETA - ${siteConfig.raffleName.toUpperCase()}* 🎟️

Hola *${order.customerName} ${order.customerLastName}*, tu compra ha sido confirmada exitosamente:

📋 *Orden:* #${order.orderNumber}
🆔 *Cédula:* ${order.identification || 'No registrada'}
🏆 *Premio:* ${siteConfig.productTitle} (${siteConfig.awardHighlightText})
💰 *Total Pagado:* $ ${order.totalCOP.toLocaleString('es-CO')} COP
📅 *Fecha:* ${order.createdAt}
🎟️ *Cantidad de Boletos:* ${order.quantity} números

🎲 *TUS NÚMEROS DE LA SUERTE:*
${order.ticketNumbers.slice(0, 50).join(' - ')}${order.ticketNumbers.length > 50 ? ` ...(+${order.ticketNumbers.length - 50} más)` : ''}

🔗 *Verifica tus números en la plataforma:*
${siteConfig.domain.canonicalUrl}/#buscar-numeros-section

Sistema desarrollado por www.theusertrafficker.com
¡Muchos éxitos en el sorteo! 🎉`;

  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`;
}
