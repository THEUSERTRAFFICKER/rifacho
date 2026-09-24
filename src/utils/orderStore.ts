import { PurchasedOrder, TicketPackage, AdminUser, RaffleEdition, WinnerInfo } from '../types';
import { siteConfig, persistSiteConfig } from '../config/siteConfig';
import {
  getSpecialPrizeNumbers,
  saveSpecialPrizeNumbers,
  getPrizeNumbersSettings,
} from './prizeNumbersStore';
import {
  recordPrizeWonReport,
  getPrizeWonReports,
} from './prizeReportStore';

export * from './prizeNumbersStore';
export * from './prizeReportStore';

export const MIN_TICKETS = siteConfig.minTicketQuantity;
export const PRICE_PER_TICKET_COP = siteConfig.pricePerTicketCOP;
export const PRODUCT_NAME = siteConfig.productTitle;
export const TICKET_PACKAGES = siteConfig.ticketPackages;

const ORDERS_STORAGE_KEY = 'rifacho_purchased_orders';
const ADMIN_USERS_STORAGE_KEY = 'rifacho_admin_users_v1';

export function generateRandomTicketNumbers(count: number, excludeSet?: Set<string>): string[] {
  const numbersSet = new Set<string>();
  let attempts = 0;
  const maxAttempts = count * 100;
  while (numbersSet.size < count && attempts < maxAttempts) {
    attempts++;
    const num = Math.floor(Math.random() * 90000 + 10000).toString();
    if (excludeSet && excludeSet.has(num)) {
      continue;
    }
    numbersSet.add(num);
  }
  // Si se requirieran más números de respaldo
  while (numbersSet.size < count) {
    const num = Math.floor(Math.random() * 90000 + 10000).toString();
    numbersSet.add(num);
  }
  return Array.from(numbersSet).sort();
}

const INITIAL_DEMO_ORDERS: PurchasedOrder[] = [
  {
    id: 'ord-1001',
    orderNumber: 'LT-84920',
    customerName: 'Alberto',
    customerLastName: 'Covaleda',
    identification: '1032485912',
    address: 'Calle 100 # 19-61, Bogotá',
    phone: '3104567890',
    email: 'betocovaledar@gmail.com',
    productName: siteConfig.productTitle,
    quantity: 20,
    totalCOP: 20000,
    ticketNumbers: ['10384', '18492', '24910', '32901', '40192', '45829', '51203', '58391', '62910', '67401', '71294', '75819', '80194', '83910', '87291', '89401', '91204', '93819', '95012', '98410'],
    status: 'Completado',
    createdAt: '2026-09-20 15:42',
    paymentMethod: 'TuCompra (PSE Bancolombia)',
  },
  {
    id: 'ord-1002',
    orderNumber: 'LT-84918',
    customerName: 'Carlos',
    customerLastName: 'Rodríguez',
    identification: '1018234810',
    address: 'Carrera 43A # 1-50, Medellín',
    phone: '3001234567',
    email: 'carlos.rodriguez@gmail.com',
    productName: siteConfig.productTitle,
    quantity: 50,
    totalCOP: 50000,
    ticketNumbers: generateRandomTicketNumbers(50),
    status: 'Completado',
    createdAt: '2026-09-21 11:20',
    paymentMethod: 'TuCompra (Nequi)',
  },
  {
    id: 'ord-1003',
    orderNumber: 'LT-84915',
    customerName: 'Mariana',
    customerLastName: 'Gómez',
    identification: '52981234',
    address: 'Avenida 6N # 28-10, Cali',
    phone: '3157894561',
    email: 'mariana.gomez@hotmail.com',
    productName: siteConfig.productTitle,
    quantity: 36,
    totalCOP: 36000,
    ticketNumbers: generateRandomTicketNumbers(36),
    status: 'Completado',
    createdAt: '2026-09-22 09:15',
    paymentMethod: 'Wompi Bancolombia',
  },
  {
    id: 'ord-1004',
    orderNumber: 'LT-84910',
    customerName: 'Diego',
    customerLastName: 'Hernández',
    identification: '80123456',
    address: 'Calle 53 # 45-20, Barranquilla',
    phone: '3209876543',
    email: 'diego.h@gmail.com',
    productName: siteConfig.productTitle,
    quantity: 100,
    totalCOP: 100000,
    ticketNumbers: ['74120', ...generateRandomTicketNumbers(99)],
    status: 'Completado',
    createdAt: '2026-09-23 08:10',
    paymentMethod: 'ePayco Colombia',
    wonPrizes: [{ ticketNumber: '74120', prizeTitle: '$500.000 COP en Efectivo' }],
    hasWonPrize: true,
    prizeReportIds: ['rep-prz-74120'],
  }
];

export function getStoredOrders(): PurchasedOrder[] {
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY) || localStorage.getItem('latropa_purchased_orders');
    if (!raw) {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_ORDERS));
      return INITIAL_DEMO_ORDERS;
    }
    const parsed = JSON.parse(raw) as PurchasedOrder[];
    // Asegurar que las órdenes demo tengan cédula si venían de versiones previas
    let updated = false;
    parsed.forEach(o => {
      if (!o.identification) {
        if (o.id === 'ord-1001') { o.identification = '1032485912'; updated = true; }
        else if (o.id === 'ord-1002') { o.identification = '1018234810'; updated = true; }
        else if (o.id === 'ord-1003') { o.identification = '52981234'; updated = true; }
        else if (o.id === 'ord-1004') { o.identification = '80123456'; updated = true; }
      }
      if (o.id === 'ord-1004' && (!o.wonPrizes || o.wonPrizes.length === 0)) {
        o.wonPrizes = [{ ticketNumber: '74120', prizeTitle: '$500.000 COP en Efectivo' }];
        o.hasWonPrize = true;
        o.prizeReportIds = ['rep-prz-74120'];
        if (!o.ticketNumbers.includes('74120')) {
          o.ticketNumbers = ['74120', ...o.ticketNumbers.slice(1)].sort();
        }
        updated = true;
      }
      if (o.wonPrizes && o.wonPrizes.length > 0 && !o.hasWonPrize) {
        o.hasWonPrize = true;
        updated = true;
      }
    });
    if (updated) {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return INITIAL_DEMO_ORDERS;
  }
}

export function saveNewOrder(orderData: Omit<PurchasedOrder, 'id' | 'orderNumber' | 'ticketNumbers' | 'createdAt' | 'status'>): PurchasedOrder {
  const existing = getStoredOrders();
  const orderNumber = `RF-${Math.floor(10000 + Math.random() * 90000)}`;

  // Recopilar números ya asignados y activos para no repetirlos entre compradores
  const occupiedSet = new Set<string>();
  existing.forEach(o => {
    if (o.status !== 'Anulado' && Array.isArray(o.ticketNumbers)) {
      o.ticketNumbers.forEach(n => occupiedSet.add(n));
    }
  });

  let ticketNumbers = generateRandomTicketNumbers(orderData.quantity, occupiedSet);
  const now = new Date();
  const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // Verificar si hay Números Premiados activos configurados por el administrador
  const wonPrizesList: Array<{ ticketNumber: string; prizeTitle: string }> = [];
  const prizeSettings = getPrizeNumbersSettings();

  if (prizeSettings.enabled && prizeSettings.autoDeliveryOnPurchase) {
    const allPrizeNumbers = getSpecialPrizeNumbers();
    // Filtrar números premiados activos, que no hayan sido ganados aún y no estén ocupados
    const availablePrizes = allPrizeNumbers.filter(
      p => p.active && !p.won && !occupiedSet.has(p.ticketNumber)
    );

    if (availablePrizes.length > 0) {
      // Determinar si esta orden recibe un número premiado según la estrategia
      let shouldAward = false;
      if (prizeSettings.deliveryStrategy === 'guaranteed_next') {
        shouldAward = true;
      } else if (prizeSettings.deliveryStrategy === 'smart_spread') {
        // En paquetes grandes (>= 50) o probabilidad del 45%, se entrega un número premiado activo
        shouldAward = orderData.quantity >= 50 || Math.random() < 0.45;
      } else {
        // 'pure_random': probabilidad equilibrada
        shouldAward = Math.random() < 0.25;
      }

      if (shouldAward) {
        // Seleccionar 1 número premiado disponible de la lista
        const luckyPrize = availablePrizes[Math.floor(Math.random() * availablePrizes.length)];
        
        // Incluirlo en los ticketNumbers del comprador (reemplazando el primer número o asegurándolo en la lista)
        if (!ticketNumbers.includes(luckyPrize.ticketNumber)) {
          ticketNumbers = [luckyPrize.ticketNumber, ...ticketNumbers.slice(1)].sort();
        }

        wonPrizesList.push({
          ticketNumber: luckyPrize.ticketNumber,
          prizeTitle: luckyPrize.prizeTitle,
        });

        // Marcar el número premiado como GANADO con los datos del comprador y su cédula
        luckyPrize.won = true;
        luckyPrize.wonByCustomerName = `${orderData.customerName} ${orderData.customerLastName}`.trim();
        luckyPrize.wonByCustomerCedula = orderData.identification || '';
        luckyPrize.wonByCustomerEmail = orderData.email;
        luckyPrize.wonByCustomerPhone = orderData.phone;
        luckyPrize.wonInOrderId = `ord-${Date.now()}`;
        luckyPrize.wonInOrderNumber = orderNumber;
        luckyPrize.wonAt = formattedDate;

        saveSpecialPrizeNumbers(allPrizeNumbers);
      } else {
        // También revisar si por pura casualidad el generador aleatorio generó un número premiado activo
        availablePrizes.forEach(p => {
          if (ticketNumbers.includes(p.ticketNumber)) {
            wonPrizesList.push({
              ticketNumber: p.ticketNumber,
              prizeTitle: p.prizeTitle,
            });
            p.won = true;
            p.wonByCustomerName = `${orderData.customerName} ${orderData.customerLastName}`.trim();
            p.wonByCustomerCedula = orderData.identification || '';
            p.wonByCustomerEmail = orderData.email;
            p.wonByCustomerPhone = orderData.phone;
            p.wonInOrderId = `ord-${Date.now()}`;
            p.wonInOrderNumber = orderNumber;
            p.wonAt = formattedDate;
          }
        });
        if (wonPrizesList.length > 0) {
          saveSpecialPrizeNumbers(allPrizeNumbers);
        }
      }
    }
  }

  const newOrderId = `ord-${Date.now()}`;
  const generatedReportIds: string[] = [];

  // Reporte en segundo plano automático si salieron tiques premiados
  if (wonPrizesList.length > 0) {
    const allPrizeNumbers = getSpecialPrizeNumbers();
    wonPrizesList.forEach((wp) => {
      const luckyMeta = allPrizeNumbers.find((p) => p.ticketNumber === wp.ticketNumber);
      const rep = recordPrizeWonReport({
        order: {
          id: newOrderId,
          orderNumber,
          customerName: orderData.customerName,
          customerLastName: orderData.customerLastName,
          identification: orderData.identification,
          phone: orderData.phone,
          email: orderData.email,
          address: orderData.address,
          paymentMethod: orderData.paymentMethod,
          totalCOP: orderData.totalCOP,
        },
        ticketNumber: wp.ticketNumber,
        prizeTitle: wp.prizeTitle,
        category: luckyMeta?.category || 'Premio de Hoy',
      });
      generatedReportIds.push(rep.id);
    });
  }

  const newOrder: PurchasedOrder = {
    ...orderData,
    id: newOrderId,
    orderNumber,
    ticketNumbers,
    status: 'Completado',
    createdAt: formattedDate,
    wonPrizes: wonPrizesList.length > 0 ? wonPrizesList : undefined,
    hasWonPrize: wonPrizesList.length > 0,
    prizeReportIds: generatedReportIds.length > 0 ? generatedReportIds : undefined,
  };

  const updated = [newOrder, ...existing];
  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error saving order', err);
  }

  return newOrder;
}

/**
 * Anula una orden y marca sus boletos como anulados
 */
export function cancelOrder(orderId: string, reason: string = 'Cancelado por administrador', byUser: string = 'Admin'): boolean {
  try {
    const orders = getStoredOrders();
    const index = orders.findIndex(o => o.id === orderId || o.orderNumber === orderId);
    if (index === -1) return false;

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    orders[index] = {
      ...orders[index],
      status: 'Anulado',
      cancelledAt: formattedDate,
      cancelledReason: reason,
      cancelledBy: byUser,
    };

    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    return true;
  } catch (e) {
    console.error('Error cancelando orden:', e);
    return false;
  }
}

/**
 * Reactiva una orden previamente anulada
 */
export function reactivateOrder(orderId: string): boolean {
  try {
    const orders = getStoredOrders();
    const index = orders.findIndex(o => o.id === orderId || o.orderNumber === orderId);
    if (index === -1) return false;

    orders[index] = {
      ...orders[index],
      status: 'Completado',
      cancelledAt: undefined,
      cancelledReason: undefined,
      cancelledBy: undefined,
    };

    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    return true;
  } catch (e) {
    console.error('Error reactivando orden:', e);
    return false;
  }
}

export function searchOrdersByEmail(query: string): PurchasedOrder[] {
  return searchOrdersByQuery(query);
}

export function searchOrdersByQuery(query: string): PurchasedOrder[] {
  const clean = query.trim().toLowerCase().replace(/[\.\-\s]/g, '');
  if (!clean) return [];
  const orders = getStoredOrders();
  return orders.filter(o => {
    const emailMatch = o.email.trim().toLowerCase().includes(query.trim().toLowerCase());
    const idClean = (o.identification || '').replace(/[\.\-\s]/g, '').toLowerCase();
    const idMatch = idClean ? idClean.includes(clean) || clean.includes(idClean) : false;
    const phoneClean = (o.phone || '').replace(/[\.\-\s]/g, '').toLowerCase();
    const phoneMatch = phoneClean ? phoneClean.includes(clean) : false;
    const orderClean = o.orderNumber.replace(/[\.\-\s]/g, '').toLowerCase();
    const orderMatch = orderClean ? orderClean.includes(clean) : false;
    return emailMatch || idMatch || phoneMatch || orderMatch;
  });
}

/**
 * Obtiene las estadísticas de boletos en tiempo real:
 * - Total de boletos en el sorteo (según configuración)
 * - Boletos vendidos activos (excluye órdenes anuladas)
 * - Boletos disponibles restantes
 * - Porcentaje real vendido
 */
export function getRaffleTicketStats() {
  const total = siteConfig.totalAvailableTickets || 100000;
  const orders = getStoredOrders();
  const activeOrders = orders.filter(o => o.status === 'Completado');
  const soldActive = activeOrders.reduce((sum, o) => sum + o.quantity, 0);
  const cancelledOrders = orders.filter(o => o.status === 'Anulado');
  const cancelledCount = cancelledOrders.reduce((sum, o) => sum + o.quantity, 0);

  // Asegurar que no exceda el total
  const remaining = Math.max(0, total - soldActive);
  const realPercent = Math.min(100, parseFloat(((soldActive / total) * 100).toFixed(2)));

  return {
    totalTickets: total,
    soldTickets: soldActive,
    availableTickets: remaining,
    cancelledTickets: cancelledCount,
    percentage: realPercent > 0 ? realPercent : siteConfig.progressPercentage,
    activeOrdersCount: activeOrders.length,
  };
}

export function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount).replace('COP', '').trim() + ' COP';
}

// ==============================================================================
// GESTIÓN DE USUARIOS ADMINISTRADORES & CLAVES DE ACCESO
// ==============================================================================

const INITIAL_ADMIN_USERS: AdminUser[] = [
  {
    id: 'adm-1',
    username: 'admin',
    name: 'Super Administrador',
    email: 'admin@rifacho.com',
    role: 'superadmin',
    passwordHash: 'admin123',
    password: 'admin123',
    createdAt: '2026-09-01 10:00',
    active: true,
  },
  {
    id: 'adm-2',
    username: 'operador1',
    name: 'Operador de Pagos',
    email: 'pagos@rifacho.com',
    role: 'operador',
    passwordHash: 'operador123',
    password: 'operador123',
    createdAt: '2026-09-10 14:30',
    active: true,
  }
];

export function getAdminUsers(): AdminUser[] {
  try {
    const raw = localStorage.getItem(ADMIN_USERS_STORAGE_KEY) || localStorage.getItem('latropa_admin_users_v1');
    if (!raw) {
      localStorage.setItem(ADMIN_USERS_STORAGE_KEY, JSON.stringify(INITIAL_ADMIN_USERS));
      return INITIAL_ADMIN_USERS;
    }
    const parsed = JSON.parse(raw) as AdminUser[];
    let updated = false;
    parsed.forEach((u) => {
      if (!u.passwordHash && !u.password) {
        u.passwordHash = u.username === 'admin' ? 'admin123' : 'operador123';
        u.password = u.passwordHash;
        updated = true;
      }
    });
    if (updated) {
      localStorage.setItem(ADMIN_USERS_STORAGE_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return INITIAL_ADMIN_USERS;
  }
}

export function saveAdminUser(userData: Omit<AdminUser, 'id' | 'createdAt'>): AdminUser {
  const existing = getAdminUsers();
  const now = new Date();
  const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const assignedPassword = userData.passwordHash || userData.password || 'admin123';

  const newUser: AdminUser = {
    ...userData,
    passwordHash: assignedPassword,
    password: assignedPassword,
    id: `adm-${Date.now()}`,
    createdAt: formattedDate,
  };

  const updated = [...existing, newUser];
  try {
    localStorage.setItem(ADMIN_USERS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error guardando usuario admin:', e);
  }
  return newUser;
}

export function updateAdminUser(id: string, updates: Partial<AdminUser>): boolean {
  try {
    const existing = getAdminUsers();
    const idx = existing.findIndex((u) => u.id === id);
    if (idx === -1) return false;

    if (updates.passwordHash || updates.password) {
      const pwd = updates.passwordHash || updates.password;
      updates.passwordHash = pwd;
      updates.password = pwd;
    }

    existing[idx] = {
      ...existing[idx],
      ...updates,
    };

    localStorage.setItem(ADMIN_USERS_STORAGE_KEY, JSON.stringify(existing));

    // Si el usuario actual modificado es la sesión activa, sincronizarla
    const currentSession = getAdminSession();
    if (currentSession && currentSession.id === id) {
      setAdminSession(existing[idx]);
    }

    return true;
  } catch (e) {
    console.error('Error actualizando usuario admin:', e);
    return false;
  }
}

export function changeAdminUserPassword(id: string, newPassword: string): boolean {
  try {
    const cleanPwd = newPassword.trim();
    if (!cleanPwd) return false;
    return updateAdminUser(id, {
      passwordHash: cleanPwd,
      password: cleanPwd,
    });
  } catch (e) {
    console.error('Error cambiando contraseña de admin:', e);
    return false;
  }
}

export function deleteAdminUser(id: string): boolean {
  try {
    const existing = getAdminUsers();
    // No permitir borrar el admin principal
    if (id === 'adm-1') return false;
    const filtered = existing.filter(u => u.id !== id);
    localStorage.setItem(ADMIN_USERS_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (e) {
    console.error('Error eliminando admin:', e);
    return false;
  }
}

export function toggleAdminUserStatus(id: string): boolean {
  try {
    const existing = getAdminUsers();
    const idx = existing.findIndex(u => u.id === id);
    if (idx === -1) return false;
    existing[idx].active = !existing[idx].active;
    localStorage.setItem(ADMIN_USERS_STORAGE_KEY, JSON.stringify(existing));
    return true;
  } catch (e) {
    console.error('Error actualizando estado admin:', e);
    return false;
  }
}

// ==============================================================================
// SESIÓN DE ADMINISTRADOR
// ==============================================================================
const ADMIN_SESSION_STORAGE_KEY = 'rifacho_admin_active_session';

export function getAdminSession(): AdminUser | null {
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_STORAGE_KEY) || localStorage.getItem('latropa_admin_active_session');
    if (!raw) return null;
    const user = JSON.parse(raw) as AdminUser;
    // Verify user is still active in admin users list
    const allUsers = getAdminUsers();
    const found = allUsers.find(u => u.id === user.id || u.username.toLowerCase() === user.username.toLowerCase());
    if (found && found.active) {
      return found;
    }
    return null;
  } catch {
    return null;
  }
}

export function setAdminSession(user: AdminUser | null): void {
  try {
    if (user) {
      localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
    }
  } catch (e) {
    console.error('Error setting admin session', e);
  }
}

export function verifyAdminLogin(username: string, password?: string): { success: boolean; user?: AdminUser; error?: string } {
  const cleanUsername = username.trim().toLowerCase();
  const allUsers = getAdminUsers();
  
  const user = allUsers.find(u => u.username.toLowerCase() === cleanUsername || u.email.toLowerCase() === cleanUsername);
  
  if (!user) {
    return { success: false, error: 'Usuario no encontrado. Verifica tu nombre de usuario o correo.' };
  }

  if (!user.active) {
    return { success: false, error: 'Este usuario administrador se encuentra desactivado.' };
  }

  // Password verification: custom password or default
  const expectedPassword = user.passwordHash || user.password || 'admin123';
  if (password !== undefined && password !== expectedPassword) {
    return { success: false, error: 'Contraseña incorrecta. Verifica tu clave de acceso.' };
  }

  return { success: true, user };
}

// ==============================================================================
// GESTIÓN DEL CICLO DE VIDA DEL SORTEO (FINALIZAR & COMENZAR NUEVO SORTEO)
// ==============================================================================
const RAFFLE_HISTORY_STORAGE_KEY = 'rifacho_raffle_history_v1';
const ARCHIVED_ORDERS_KEY_PREFIX = 'rifacho_archived_orders_edition_';

export function getRaffleHistory(): RaffleEdition[] {
  try {
    const raw = localStorage.getItem(RAFFLE_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error cargando historial de sorteos:', e);
    return [];
  }
}

export function saveRaffleHistory(history: RaffleEdition[]): void {
  try {
    localStorage.setItem(RAFFLE_HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch (e) {
    console.error('Error guardando historial de sorteos:', e);
  }
}

export function getArchivedOrders(editionNumber: number): PurchasedOrder[] {
  try {
    const raw = localStorage.getItem(`${ARCHIVED_ORDERS_KEY_PREFIX}${editionNumber}`);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Finaliza el sorteo actual y declara el número y nombre del ganador oficial
 */
export function finishCurrentRaffle(winnerData: WinnerInfo): { success: boolean; error?: string } {
  try {
    if (!winnerData.ticketNumber) {
      return { success: false, error: 'Debes indicar el número de boleto ganador.' };
    }

    siteConfig.raffleStatus = 'finalizado';
    siteConfig.currentWinner = winnerData;
    persistSiteConfig(siteConfig);

    return { success: true };
  } catch (e) {
    console.error('Error finalizando sorteo:', e);
    return { success: false, error: 'Error al finalizar el sorteo.' };
  }
}

/**
 * Reactiva el sorteo actual si fue finalizado por error
 */
export function reopenCurrentRaffle(): { success: boolean } {
  try {
    siteConfig.raffleStatus = 'activo';
    siteConfig.currentWinner = undefined;
    persistSiteConfig(siteConfig);
    return { success: true };
  } catch (e) {
    console.error('Error reabriendo sorteo:', e);
    return { success: false };
  }
}

export interface NewRaffleParams {
  raffleName?: string;
  raffleSubtitle: string;
  productTitle: string;
  awardHighlightText: string;
  pricePerTicketCOP: number;
  minTicketQuantity: number;
  totalAvailableTickets: number;
  progressPercentage: number;
  flyerImage?: string;
  bannerSecondary?: string;
  archivePreviousOrders?: boolean;
  winnerData?: WinnerInfo;
}

/**
 * Comienza un nuevo sorteo:
 * 1. Archiva el sorteo actual con sus métricas y ganador (si aplica) en el historial.
 * 2. Guarda las órdenes actuales en la base histórica de esa edición.
 * 3. Reinicia la lista de boletos y órdenes para que el nuevo sorteo inicie limpio desde 0 boletos vendidos.
 * 4. Actualiza los parámetros de la rifa (nombre, subtítulo, precio, boletos, imagen, progreso).
 * 5. Reactiva el estado a 'activo'.
 */
export function startNewRaffle(params: NewRaffleParams): { success: boolean; newEditionNumber: number } {
  try {
    const currentOrders = getStoredOrders();
    const activeOrders = currentOrders.filter(o => o.status === 'Completado');
    const totalSalesCOP = activeOrders.reduce((acc, o) => acc + o.totalCOP, 0);
    const totalTicketsSold = activeOrders.reduce((acc, o) => acc + o.quantity, 0);
    const currentEditionNumber = siteConfig.editionNumber || 1;

    // 1. Crear registro histórico de la edición que termina
    const finishedEdition: RaffleEdition = {
      id: `edition-${currentEditionNumber}-${Date.now()}`,
      editionNumber: currentEditionNumber,
      title: siteConfig.raffleName,
      subtitle: siteConfig.raffleSubtitle,
      productTitle: siteConfig.productTitle,
      prizeHighlight: siteConfig.awardHighlightText,
      pricePerTicketCOP: siteConfig.pricePerTicketCOP,
      totalTickets: siteConfig.totalAvailableTickets,
      startDate: 'Edición anterior',
      endDate: new Date().toISOString().split('T')[0],
      status: 'finalizado',
      winner: params.winnerData || siteConfig.currentWinner,
      totalOrdersCount: activeOrders.length,
      totalTicketsSold,
      totalSalesCOP,
      flyerImage: siteConfig.images.flyer,
    };

    // Guardar en historial
    const history = getRaffleHistory();
    history.unshift(finishedEdition);
    saveRaffleHistory(history);

    // 2. Archivar órdenes de esta edición si se especificó
    if (params.archivePreviousOrders !== false) {
      try {
        localStorage.setItem(`${ARCHIVED_ORDERS_KEY_PREFIX}${currentEditionNumber}`, JSON.stringify(currentOrders));
        // Vaciar órdenes actuales para que el nuevo sorteo empiece en 0 boletos vendidos
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify([]));
      } catch (err) {
        console.error('Error archivando órdenes:', err);
      }
    }

    // 3. Configurar nueva edición
    const nextEditionNumber = currentEditionNumber + 1;
    const newPrice = params.pricePerTicketCOP || siteConfig.pricePerTicketCOP || 1000;

    // Paquetes actualizados según el nuevo precio por boleto
    const newPackages = [20, 27, 36, 50, 100, 200, 400, 700].map(qty => ({
      id: `pkg-${qty}`,
      quantity: qty,
      label: `${qty} Números $ ${(qty * newPrice).toLocaleString('es-CO')} COP`,
      popular: qty === 50,
    }));

    siteConfig.editionNumber = nextEditionNumber;
    siteConfig.raffleStatus = 'activo';
    siteConfig.currentWinner = undefined;
    if (params.raffleName) siteConfig.raffleName = params.raffleName;
    siteConfig.raffleSubtitle = params.raffleSubtitle;
    siteConfig.productTitle = params.productTitle;
    siteConfig.awardHighlightText = params.awardHighlightText;
    siteConfig.pricePerTicketCOP = newPrice;
    siteConfig.minTicketQuantity = params.minTicketQuantity || 20;
    siteConfig.totalAvailableTickets = params.totalAvailableTickets || 100000;
    siteConfig.progressPercentage = params.progressPercentage !== undefined ? params.progressPercentage : 0;
    siteConfig.ticketPackages = newPackages;

    if (params.flyerImage) {
      siteConfig.images.flyer = params.flyerImage;
    }
    if (params.bannerSecondary) {
      siteConfig.images.bannerSecondary = params.bannerSecondary;
    }

    persistSiteConfig(siteConfig);

    return { success: true, newEditionNumber: nextEditionNumber };
  } catch (e) {
    console.error('Error comenzando nuevo sorteo:', e);
    return { success: false, newEditionNumber: siteConfig.editionNumber || 1 };
  }
}

