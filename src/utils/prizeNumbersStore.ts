import { SpecialPrizeNumber, PrizeNumbersSettings, PurchasedOrder } from '../types';
import { getStoredOrders } from './orderStore';

const PRIZE_NUMBERS_KEY = 'rifacho_special_prize_numbers_v1';
const PRIZE_SETTINGS_KEY = 'rifacho_prize_numbers_settings_v1';

export const DEFAULT_PRIZE_SETTINGS: PrizeNumbersSettings = {
  enabled: true,
  publicDisplay: true,
  hideWinningDigits: false,
  autoDeliveryOnPurchase: true,
  deliveryStrategy: 'smart_spread',
  publicTitle: '🎁 ¡NÚMEROS PREMIADOS EN JUEGO HOY!',
  publicSubtitle: '¡El que compre hoy puede llevarse uno de estos números con premio oficial garantizado!',
};

// Números premiados demo iniciales (garantizados que NO están en las órdenes demo iniciales)
const INITIAL_DEMO_PRIZE_NUMBERS: SpecialPrizeNumber[] = [
  {
    id: 'prz-1',
    ticketNumber: '74120',
    prizeTitle: '$500.000 COP en Efectivo',
    category: 'Premio Hoy',
    active: true,
    createdAt: '2026-09-23 08:10',
    validDate: 'Válido para compras de hoy',
    won: true,
    wonByCustomerName: 'Diego Hernández',
    wonByCustomerCedula: '80123456',
    wonByCustomerEmail: 'diego.h@gmail.com',
    wonByCustomerPhone: '3209876543',
    wonInOrderId: 'ord-1004',
    wonInOrderNumber: 'LT-84910',
    wonAt: '2026-09-23 08:10',
  },
  {
    id: 'prz-2',
    ticketNumber: '88319',
    prizeTitle: 'Moto Eléctrica Urbana',
    category: 'Premio Mayor Anticipado',
    active: true,
    createdAt: '2026-09-24 08:00',
    validDate: 'Válido para compras de hoy',
    won: false,
  },
  {
    id: 'prz-3',
    ticketNumber: '39104',
    prizeTitle: '$200.000 COP en Efectivo',
    category: 'Premio Relámpago',
    active: true,
    createdAt: '2026-09-24 08:00',
    validDate: 'Válido para compras de hoy',
    won: false,
  },
  {
    id: 'prz-4',
    ticketNumber: '52048',
    prizeTitle: 'Smart TV 55 Pulgadas 4K',
    category: 'Premio Especial',
    active: true,
    createdAt: '2026-09-24 08:00',
    validDate: 'Válido para compras de hoy',
    won: false,
  },
  {
    id: 'prz-5',
    ticketNumber: '61923',
    prizeTitle: '$100.000 COP en Efectivo',
    category: 'Premio Hoy',
    active: true,
    createdAt: '2026-09-24 08:00',
    validDate: 'Válido para compras de hoy',
    won: false,
  },
];

export function getPrizeNumbersSettings(): PrizeNumbersSettings {
  try {
    const raw = localStorage.getItem(PRIZE_SETTINGS_KEY);
    if (!raw) {
      localStorage.setItem(PRIZE_SETTINGS_KEY, JSON.stringify(DEFAULT_PRIZE_SETTINGS));
      return DEFAULT_PRIZE_SETTINGS;
    }
    return { ...DEFAULT_PRIZE_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PRIZE_SETTINGS;
  }
}

export function savePrizeNumbersSettings(settings: PrizeNumbersSettings): void {
  try {
    localStorage.setItem(PRIZE_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error guardando configuración de números premiados:', e);
  }
}

export function getSpecialPrizeNumbers(): SpecialPrizeNumber[] {
  try {
    const raw = localStorage.getItem(PRIZE_NUMBERS_KEY);
    if (!raw) {
      localStorage.setItem(PRIZE_NUMBERS_KEY, JSON.stringify(INITIAL_DEMO_PRIZE_NUMBERS));
      return INITIAL_DEMO_PRIZE_NUMBERS;
    }
    const parsed = JSON.parse(raw) as SpecialPrizeNumber[];
    let updated = false;
    parsed.forEach(p => {
      if (p.id === 'prz-1' && !p.won) {
        p.won = true;
        p.wonByCustomerName = 'Diego Hernández';
        p.wonByCustomerCedula = '80123456';
        p.wonByCustomerEmail = 'diego.h@gmail.com';
        p.wonByCustomerPhone = '3209876543';
        p.wonInOrderId = 'ord-1004';
        p.wonInOrderNumber = 'LT-84910';
        p.wonAt = '2026-09-23 08:10';
        updated = true;
      }
    });
    if (updated) {
      localStorage.setItem(PRIZE_NUMBERS_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return INITIAL_DEMO_PRIZE_NUMBERS;
  }
}

export function saveSpecialPrizeNumbers(items: SpecialPrizeNumber[]): void {
  try {
    localStorage.setItem(PRIZE_NUMBERS_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Error guardando números premiados:', e);
  }
}

/**
 * Obtiene el conjunto de todos los números que ya fueron vendidos
 * en órdenes activas (no anuladas)
 */
export function getAllSoldTicketNumbers(): Set<string> {
  const orders = getStoredOrders();
  const sold = new Set<string>();
  orders.forEach((o) => {
    if (o.status !== 'Anulado' && Array.isArray(o.ticketNumbers)) {
      o.ticketNumbers.forEach((n) => sold.add(n));
    }
  });
  return sold;
}

/**
 * Verifica si un número de 5 dígitos específico ya fue vendido
 */
export function checkTicketNumberAvailability(ticketNumber: string): {
  isSold: boolean;
  order?: PurchasedOrder;
} {
  const clean = ticketNumber.trim();
  const orders = getStoredOrders();
  for (const o of orders) {
    if (o.status !== 'Anulado' && Array.isArray(o.ticketNumbers) && o.ticketNumbers.includes(clean)) {
      return { isSold: true, order: o };
    }
  }
  return { isSold: false };
}

/**
 * Genera números aleatorios NO VENDIDOS (libres en el sorteo)
 * para convertirlos en números premiados futuros
 */
export function generateUnsoldPrizeNumbers(
  count: number,
  defaultPrize: string = '$200.000 COP en Efectivo',
  category: string = 'Premio de Hoy'
): SpecialPrizeNumber[] {
  const soldSet = getAllSoldTicketNumbers();
  const existingPrizeNumbers = getSpecialPrizeNumbers();
  const existingPrizeSet = new Set(existingPrizeNumbers.map((p) => p.ticketNumber));

  const newNumbers: SpecialPrizeNumber[] = [];
  const now = new Date();
  const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  let attempts = 0;
  const maxAttempts = count * 200;

  while (newNumbers.length < count && attempts < maxAttempts) {
    attempts++;
    const candidate = Math.floor(Math.random() * 90000 + 10000).toString();

    // Debe ser NO vendido y no estar ya entre los números premiados
    if (soldSet.has(candidate) || existingPrizeSet.has(candidate)) {
      continue;
    }

    existingPrizeSet.add(candidate);
    newNumbers.push({
      id: `prz-${Date.now()}-${newNumbers.length}`,
      ticketNumber: candidate,
      prizeTitle: defaultPrize,
      category,
      active: true,
      createdAt: formattedDate,
      validDate: 'Válido para compras de hoy',
      won: false,
    });
  }

  const updated = [...newNumbers, ...existingPrizeNumbers];
  saveSpecialPrizeNumbers(updated);
  return newNumbers;
}

/**
 * Agrega un número premiado manual escogido por el administrador,
 * validando estrictamente que NO HAYA SIDO VENDIDO.
 */
export function addManualPrizeNumber(
  ticketNumber: string,
  prizeTitle: string,
  category: string = 'Premio de Hoy'
): { success: boolean; error?: string; item?: SpecialPrizeNumber } {
  const clean = ticketNumber.trim();

  // Validar formato 5 dígitos
  if (!/^\d{5}$/.test(clean)) {
    return {
      success: false,
      error: 'El número de boleto debe tener exactamente 5 dígitos numéricos (ej: 48291).',
    };
  }

  // Verificar si ya fue vendido
  const check = checkTicketNumberAvailability(clean);
  if (check.isSold && check.order) {
    return {
      success: false,
      error: `El número ${clean} YA FUE VENDIDO a ${check.order.customerName} ${check.order.customerLastName} (Cédula: ${check.order.identification || 'N/A'}) en la orden #${check.order.orderNumber}. Solo puedes elegir números que NO se hayan vendido.`,
    };
  }

  const existing = getSpecialPrizeNumbers();
  if (existing.some((p) => p.ticketNumber === clean)) {
    return {
      success: false,
      error: `El número ${clean} ya está registrado en la lista de números premiados.`,
    };
  }

  const now = new Date();
  const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const newItem: SpecialPrizeNumber = {
    id: `prz-${Date.now()}`,
    ticketNumber: clean,
    prizeTitle: prizeTitle.trim() || '$100.000 COP en Efectivo',
    category: category.trim() || 'Premio de Hoy',
    active: true,
    createdAt: formattedDate,
    validDate: 'Válido para compras de hoy',
    won: false,
  };

  const updated = [newItem, ...existing];
  saveSpecialPrizeNumbers(updated);

  return { success: true, item: newItem };
}

/**
 * Elimina un número premiado de la lista
 */
export function deletePrizeNumber(id: string): boolean {
  try {
    const existing = getSpecialPrizeNumbers();
    const filtered = existing.filter((p) => p.id !== id);
    saveSpecialPrizeNumbers(filtered);
    return true;
  } catch {
    return false;
  }
}

/**
 * Activa o desactiva un número premiado
 */
export function togglePrizeNumberActive(id: string): boolean {
  try {
    const existing = getSpecialPrizeNumbers();
    const idx = existing.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    existing[idx].active = !existing[idx].active;
    saveSpecialPrizeNumbers(existing);
    return true;
  } catch {
    return false;
  }
}

/**
 * Actualiza los datos de un número premiado (ej: título del premio, categoría)
 */
export function updatePrizeNumber(id: string, updates: Partial<SpecialPrizeNumber>): boolean {
  try {
    const existing = getSpecialPrizeNumbers();
    const idx = existing.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    existing[idx] = { ...existing[idx], ...updates };
    saveSpecialPrizeNumbers(existing);
    return true;
  } catch {
    return false;
  }
}

/**
 * Limpia todos los números premiados que no hayan sido ganados
 */
export function clearAllUnwonPrizeNumbers(): void {
  const existing = getSpecialPrizeNumbers();
  const onlyWon = existing.filter((p) => p.won);
  saveSpecialPrizeNumbers(onlyWon);
}

/**
 * Restablece los números premiados iniciales
 */
export function resetDefaultPrizeNumbers(): void {
  saveSpecialPrizeNumbers(INITIAL_DEMO_PRIZE_NUMBERS);
  savePrizeNumbersSettings(DEFAULT_PRIZE_SETTINGS);
}
