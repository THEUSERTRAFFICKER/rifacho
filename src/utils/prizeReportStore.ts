import { PrizeWonReport, PurchasedOrder } from '../types';

const PRIZE_REPORTS_KEY = 'rifacho_prize_won_reports_v1';

// Initial demo prize reports for quick audit visualization
const INITIAL_DEMO_REPORTS: PrizeWonReport[] = [
  {
    id: 'rep-prz-74120',
    reportNumber: 'REP-001',
    ticketNumber: '74120',
    prizeTitle: '$500.000 COP en Efectivo',
    category: 'Premio Hoy',
    orderId: 'ord-1004',
    orderNumber: 'LT-84910',
    customerName: 'Diego',
    customerLastName: 'Hernández',
    identification: '80123456',
    phone: '3209876543',
    email: 'diego.h@gmail.com',
    address: 'Calle 53 # 45-20, Barranquilla',
    paymentMethod: 'ePayco Colombia',
    totalPaidCOP: 100000,
    detectedAt: '2026-09-23 08:10:22',
    timestamp: 1790151022000,
    reportedInBackground: true,
    status: 'detectado',
    adminNotes: 'Tique premiado asignado automáticamente por el motor de sorteos en segundo plano.',
    viewedByAdmin: false,
  },
];

/**
 * Emite un sonido suave de notificación (Chime sintético con Web Audio API)
 * No requiere descargar archivos externos de audio y funciona en cualquier navegador.
 */
export function playPrizeAlertSound(): void {
  try {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Secuencia de notas triunfales: C5, E5, G5, C6
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
      
      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.12);
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + idx * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.35);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(ctx.currentTime + idx * 0.12);
      osc.stop(ctx.currentTime + idx * 0.12 + 0.38);
    });
  } catch {
    // Si el usuario no ha interactuado aún con el DOM, el navegador silencia sin romper
  }
}

/**
 * Obtiene todos los reportes de premios registrados en segundo plano
 */
export function getPrizeWonReports(): PrizeWonReport[] {
  try {
    if (typeof window === 'undefined') return INITIAL_DEMO_REPORTS;
    const raw = localStorage.getItem(PRIZE_REPORTS_KEY);
    if (!raw) {
      localStorage.setItem(PRIZE_REPORTS_KEY, JSON.stringify(INITIAL_DEMO_REPORTS));
      return INITIAL_DEMO_REPORTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEMO_REPORTS;
  }
}

/**
 * Guarda los reportes en localStorage
 */
export function savePrizeWonReports(reports: PrizeWonReport[]): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(PRIZE_REPORTS_KEY, JSON.stringify(reports));
    }
  } catch (err) {
    console.error('Error guardando reportes de premios en segundo plano:', err);
  }
}

/**
 * Crea y registra un reporte en segundo plano cuando se detecta un tique premiado
 */
export function recordPrizeWonReport(params: {
  order: Partial<PurchasedOrder>;
  ticketNumber: string;
  prizeTitle: string;
  category?: string;
}): PrizeWonReport {
  const existing = getPrizeWonReports();
  const nextNum = existing.length + 1;
  const reportNumber = `REP-${String(nextNum).padStart(3, '0')}`;
  
  const now = new Date();
  const detectedAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  
  const newReport: PrizeWonReport = {
    id: `rep-prz-${params.ticketNumber}-${Date.now()}`,
    reportNumber,
    ticketNumber: params.ticketNumber,
    prizeTitle: params.prizeTitle,
    category: params.category || 'Premio de Hoy',
    orderId: params.order.id || `ord-${Date.now()}`,
    orderNumber: params.order.orderNumber || 'N/A',
    customerName: params.order.customerName || 'Cliente',
    customerLastName: params.order.customerLastName || '',
    identification: params.order.identification || 'Sin registrar',
    phone: params.order.phone || '',
    email: params.order.email || '',
    address: params.order.address || '',
    paymentMethod: params.order.paymentMethod || 'Pasarela en línea',
    totalPaidCOP: params.order.totalCOP || 0,
    detectedAt,
    timestamp: Date.now(),
    reportedInBackground: true,
    status: 'detectado',
    adminNotes: 'Detectado y reportado automáticamente por el motor de sorteos en segundo plano.',
    viewedByAdmin: false,
  };

  const updated = [newReport, ...existing];
  savePrizeWonReports(updated);

  // Reproducir sonido de alerta en segundo plano
  playPrizeAlertSound();

  // Disparar evento en tiempo real para que la plataforma y el dashboard se enteren al instante
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('rifacho_prize_won_detected', {
        detail: newReport,
      })
    );
  }

  return newReport;
}

/**
 * Obtiene el conteo de reportes no leídos / no vistos por el administrador
 */
export function getUnreadPrizeReportsCount(): number {
  const reports = getPrizeWonReports();
  return reports.filter((r) => !r.viewedByAdmin).length;
}

/**
 * Marca un reporte específico como visto por el administrador
 */
export function markReportAsViewed(reportId: string): void {
  const reports = getPrizeWonReports();
  let modified = false;
  reports.forEach((r) => {
    if (r.id === reportId && !r.viewedByAdmin) {
      r.viewedByAdmin = true;
      modified = true;
    }
  });
  if (modified) {
    savePrizeWonReports(reports);
  }
}

/**
 * Marca todos los reportes como vistos
 */
export function markAllReportsAsViewed(): void {
  const reports = getPrizeWonReports();
  reports.forEach((r) => {
    r.viewedByAdmin = true;
  });
  savePrizeWonReports(reports);
}

/**
 * Actualiza el estado administrativo de un reporte (detectado -> verificado -> entregado)
 */
export function updateReportStatus(
  reportId: string,
  status: 'detectado' | 'verificado' | 'entregado',
  adminNotes?: string
): boolean {
  const reports = getPrizeWonReports();
  const idx = reports.findIndex((r) => r.id === reportId);
  if (idx === -1) return false;

  reports[idx].status = status;
  if (adminNotes !== undefined) {
    reports[idx].adminNotes = adminNotes;
  }
  if (status === 'verificado' || status === 'entregado') {
    const now = new Date();
    reports[idx].verifiedAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }
  savePrizeWonReports(reports);
  return true;
}

/**
 * Elimina un reporte
 */
export function deletePrizeReport(reportId: string): boolean {
  const reports = getPrizeWonReports();
  const filtered = reports.filter((r) => r.id !== reportId);
  savePrizeWonReports(filtered);
  return true;
}
