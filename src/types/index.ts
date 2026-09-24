export interface TicketPackage {
  id: string;
  quantity: number;
  priceCOP: number;
  label: string;
}

export interface PurchasedOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerLastName: string;
  identification?: string; // Cédula de ciudadanía o documento de identidad del comprador
  address: string;
  phone: string;
  email: string;
  productName: string;
  quantity: number;
  totalCOP: number;
  ticketNumbers: string[];
  status: 'Completado' | 'En proceso' | 'Anulado';
  createdAt: string; // ISO o "YYYY-MM-DD HH:mm"
  paymentMethod: string;
  cancelledAt?: string;
  cancelledReason?: string;
  cancelledBy?: string;
  wonPrizes?: Array<{ ticketNumber: string; prizeTitle: string }>; // Premios ganados por números premiados activos
  hasWonPrize?: boolean; // Indicador rápido si la orden tiene tique premiado
  prizeReportIds?: string[]; // IDs de los reportes generados en segundo plano
}

export interface PrizeWonReport {
  id: string; // ej: "REP-PRZ-74120-1729482"
  reportNumber: string; // ej: "REP-001"
  ticketNumber: string; // ej: "74120"
  prizeTitle: string; // ej: "$500.000 COP en Efectivo"
  category?: string; // ej: "Premio Hoy"
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerLastName: string;
  identification: string; // Cédula de ciudadanía del ganador
  phone: string;
  email: string;
  address?: string;
  paymentMethod: string;
  totalPaidCOP: number;
  detectedAt: string; // Formato legible "YYYY-MM-DD HH:mm:ss"
  timestamp: number; // Date.now()
  reportedInBackground: boolean; // Flag de reporte en background
  status: 'detectado' | 'verificado' | 'entregado';
  adminNotes?: string;
  viewedByAdmin: boolean;
  verifiedAt?: string;
}

export interface SpecialPrizeNumber {
  id: string;
  ticketNumber: string; // 5 dígitos, ej: "48291"
  prizeTitle: string; // ej: "$500.000 COP en Efectivo"
  category: string; // ej: "Premio Hoy", "Premio Relámpago", "Premio Sorpresa"
  active: boolean; // Si está activo para salir en compras actuales
  createdAt: string;
  validDate?: string; // ej: "Válido hoy"
  won: boolean;
  wonByCustomerName?: string;
  wonByCustomerCedula?: string;
  wonByCustomerEmail?: string;
  wonByCustomerPhone?: string;
  wonInOrderId?: string;
  wonInOrderNumber?: string;
  wonAt?: string;
}

export interface PrizeNumbersSettings {
  enabled: boolean; // Sistema de números premiados activo
  publicDisplay: boolean; // Mostrar widget público en la portada
  hideWinningDigits: boolean; // Ocultar últimos dígitos en público (ej: 482**)
  autoDeliveryOnPurchase: boolean; // Si true, al comprar boletos desde que están activos, le pueden salir a los compradores
  deliveryStrategy: 'smart_spread' | 'guaranteed_next' | 'pure_random';
  publicTitle: string;
  publicSubtitle: string;
}

export interface AdminUser {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'superadmin' | 'operador' | 'auditor';
  passwordHash?: string;
  password?: string;
  createdAt: string;
  active: boolean;
}

export interface WinnerInfo {
  ticketNumber: string;
  winnerName: string;
  drawDate: string;
  lotteryOrSource?: string;
  prizeAwarded: string;
  notes?: string;
}

export interface RaffleEdition {
  id: string;
  editionNumber: number;
  title: string;
  subtitle: string;
  productTitle: string;
  prizeHighlight: string;
  pricePerTicketCOP: number;
  totalTickets: number;
  startDate: string;
  endDate?: string;
  status: 'activo' | 'finalizado';
  winner?: WinnerInfo;
  totalOrdersCount: number;
  totalTicketsSold: number;
  totalSalesCOP: number;
  flyerImage?: string;
}
