/**
 * ==============================================================================
 * CONFIGURACIÓN CENTRAL DE RIFACHO (EDITA AQUÍ FÁCILMENTE)
 * ==============================================================================
 * En este archivo puedes cambiar:
 * 1. Dominio personalizado y URL base.
 * 2. Logo, Favicon (Icono de la web) y fotos del sorteo.
 * 3. Nombre del creador/organizador y textos del pie de página.
 * 4. La pasarela de pagos (TuCompra, Wompi, ePayco, MercadoPago, Bold, Webhook).
 * 5. Envío automático de correos electrónicos a los compradores con sus boletos.
 * 6. Precios por boleto, porcentaje de la barra de progreso, cantidades y textos.
 * 7. Enlaces a Telegram, WhatsApp, Email y Redes Sociales.
 * ==============================================================================
 */

import { WinnerInfo } from '../types';

export interface PaymentGatewayConfig {
  provider: 'tucompra' | 'wompi' | 'epayco' | 'mercadopago' | 'bold' | 'custom_webhook' | 'demo_local';

  tucompra: {
    usuario: string;
    llave: string;
    endpointUrl: string;
    sandbox: boolean;
  };

  wompi: {
    publicKey: string;
    integritySecret?: string;
    redirectUrl?: string;
  };

  epayco: {
    publicKey: string;
    testMode: boolean;
  };

  mercadopago: {
    publicKey: string;
    preferenceUrl?: string;
  };

  bold: {
    apiKey: string;
  };

  customWebhookUrl: string;
}

export interface DomainConfig {
  customDomain: string; // ej: "rifacho.com" o "misorteo.com"
  protocol: 'https' | 'http';
  canonicalUrl: string; // ej: "https://rifacho.com"
  dnsProviderGuide: 'cloudflare' | 'hostinger' | 'godaddy' | 'cpanel' | 'vercel' | 'general';
}

export interface EmailNotificationsConfig {
  enabled: boolean;
  provider: 'browser_auto' | 'emailjs' | 'resend' | 'webhook' | 'disabled';
  senderName: string;
  senderEmail: string;
  
  // Opciones para EmailJS (envío sin servidor directo desde el navegador)
  emailjsServiceId?: string;
  emailjsTemplateId?: string;
  emailjsPublicKey?: string;

  // Opciones para Resend API
  resendApiKey?: string;

  // Endpoint Webhook para backend propio (PHP, Node, Python, Zapier)
  webhookEndpoint?: string;
}

export interface SiteConfig {
  // Dominio nuevo
  domain: DomainConfig;

  // Estado del sorteo y ciclo de vida
  raffleStatus: 'activo' | 'finalizado';
  editionNumber: number;
  currentWinner?: WinnerInfo;

  // Información básica del sorteo y creador
  creatorName: string; // Nombre del creador u organizador oficial
  creatorTitle: string; // Título o cargo del creador
  systemCreatorName: string; // "The User Trafficker"
  systemCreatorWebsite: string; // "www.theusertrafficker.com"
  raffleName: string;
  raffleSubtitle: string;
  awardHighlightText: string;
  productTitle: string; // "Acc Combo Tesla"
  
  // Precios y boletos
  pricePerTicketCOP: number; // Precio por número en COP (ej: 1000)
  minTicketQuantity: number; // Mínimo de boletos para comprar (ej: 20)
  progressPercentage: number; // Porcentaje mostrado en la barra (ej: 31.38)
  totalAvailableTickets: number; // Total de números en el sorteo (ej: 100000)

  // Enlaces de contacto y soporte
  contact: {
    telegramUsername: string;
    telegramUrl: string;
    whatsappNumber: string;
    whatsappUrl: string;
    supportEmail: string;
  };

  // Imágenes principales (pueden ser rutas relativas, URLs web o imágenes subidas en base64)
  images: {
    logo: string;
    favicon: string; // Favicon de la pestaña del navegador
    flyer: string;
    bannerSecondary: string;
  };

  // Notificaciones por Correo Electrónico
  emailNotifications: EmailNotificationsConfig;

  // Paquetes rápidos preconfigurados (Botones rojos de la página principal)
  ticketPackages: Array<{
    id: string;
    quantity: number;
    label: string;
    popular?: boolean;
  }>;

  // Pasarelas de pago
  payments: PaymentGatewayConfig;
}

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  domain: {
    customDomain: "rifacho.com",
    protocol: "https",
    canonicalUrl: "https://rifacho.com",
    dnsProviderGuide: "general",
  },

  raffleStatus: "activo",
  editionNumber: 1,
  currentWinner: undefined,

  creatorName: "Rifacho Oficial",
  creatorTitle: "Organizador Principal",
  systemCreatorName: "The User Trafficker",
  systemCreatorWebsite: "www.theusertrafficker.com",
  raffleName: "Rifacho",
  raffleSubtitle: "COMBO TESLA 2026",
  awardHighlightText: "20 NÚMEROS PREMIADOS",
  productTitle: "Acc Combo Tesla",

  pricePerTicketCOP: 1000,
  minTicketQuantity: 20,
  progressPercentage: 31.38,
  totalAvailableTickets: 100000,

  contact: {
    telegramUsername: "soporterifacho",
    telegramUrl: "https://t.me/soporterifacho",
    whatsappNumber: "+573104567890",
    whatsappUrl: "https://wa.me/573104567890?text=Hola,%20tengo%20una%20consulta%20sobre%20el%20sorteo",
    supportEmail: "ventas@rifacho.com",
  },

  images: {
    logo: "/images/rifacho-logo.svg",
    favicon: "/images/rifacho-favicon.svg",
    flyer: "/images/flyer.jpeg",
    bannerSecondary: "/images/banner-2m.png",
  },

  emailNotifications: {
    enabled: true,
    provider: "browser_auto",
    senderName: "Rifacho Oficial",
    senderEmail: "boletos@rifacho.com",
    emailjsServiceId: "service_rifacho",
    emailjsTemplateId: "template_boletos",
    emailjsPublicKey: "",
    resendApiKey: "",
    webhookEndpoint: "https://tu-servidor-o-webhook.com/api/enviar-correo",
  },

  ticketPackages: [
    { id: "pkg-20", quantity: 20, label: "20 Números $ 20.000 COP" },
    { id: "pkg-27", quantity: 27, label: "27 Números $ 27.000 COP" },
    { id: "pkg-36", quantity: 36, label: "36 Números $ 36.000 COP" },
    { id: "pkg-50", quantity: 50, label: "50 Números $ 50.000 COP", popular: true },
    { id: "pkg-100", quantity: 100, label: "100 Números $ 100.000 COP" },
    { id: "pkg-200", quantity: 200, label: "200 Números $ 200.000 COP" },
    { id: "pkg-400", quantity: 400, label: "400 Números $ 400.000 COP" },
    { id: "pkg-700", quantity: 700, label: "700 Números $ 700.000 COP" },
  ],

  payments: {
    provider: "tucompra",

    tucompra: {
      usuario: "TU_USUARIO_TUCOMPRA",
      llave: "TU_LLAVE_PUBLICA_TUCOMPRA",
      endpointUrl: "https://gateway.tucompra.net/service/checkout",
      sandbox: true,
    },

    wompi: {
      publicKey: "pub_test_Q5yDA9xoKdePzhSGeVe9KStXgn7EqWik",
      redirectUrl: typeof window !== 'undefined' ? window.location.origin : '',
    },

    epayco: {
      publicKey: "TU_LLAVE_PUBLICA_EPAYCO",
      testMode: true,
    },

    mercadopago: {
      publicKey: "TEST-TU-PUBLIC-KEY-MERCADOPAGO",
    },

    bold: {
      apiKey: "TU_API_KEY_BOLD",
    },

    customWebhookUrl: "https://tu-servidor-o-webhook.com/api/pagos",
  },
};

const STORAGE_KEY = 'rifacho_site_config_v1';

/**
 * Aplica el favicon dinámicamente al <link rel="icon"> del DOM
 */
export function applyFaviconToDocument(faviconUrl: string): void {
  if (typeof document === 'undefined') return;
  try {
    let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.type = 'image/png';
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.href = faviconUrl;
  } catch (e) {
    console.error('Error actualizando favicon:', e);
  }
}

/**
 * Carga la configuración persistida en el navegador o usa los valores por defecto
 */
export function getActiveSiteConfig(): SiteConfig {
  if (typeof window === 'undefined') return DEFAULT_SITE_CONFIG;
  try {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('latropa_site_config_v4') || localStorage.getItem('latropa_site_config_v3');
    if (saved) {
      let parsed = JSON.parse(saved);
      // Reemplazar automáticamente referencias anteriores a 'La Tropa' por 'Rifacho'
      if (parsed.raffleName === 'La Tropa' || !parsed.raffleName) {
        parsed.raffleName = 'Rifacho';
      }
      if (parsed.creatorName === 'La Tropa Oficial' || !parsed.creatorName) {
        parsed.creatorName = 'Rifacho Oficial';
      }
      if (parsed.domain?.customDomain === 'latropa.co' || !parsed.domain?.customDomain) {
        parsed.domain = { ...parsed.domain, customDomain: 'rifacho.com', canonicalUrl: 'https://rifacho.com' };
      }
      if (parsed.images?.logo === '/images/logo.jpg' || !parsed.images?.logo) {
        parsed.images = { ...parsed.images, logo: '/images/rifacho-logo.svg', favicon: '/images/rifacho-favicon.svg' };
      }
      if (parsed.emailNotifications?.senderName === 'La Tropa Oficial') {
        parsed.emailNotifications.senderName = 'Rifacho Oficial';
      }
      if (parsed.emailNotifications?.senderEmail === 'boletos@latropa.co') {
        parsed.emailNotifications.senderEmail = 'boletos@rifacho.com';
      }

      const merged: SiteConfig = {
        ...DEFAULT_SITE_CONFIG,
        ...parsed,
        creatorName: parsed.creatorName || DEFAULT_SITE_CONFIG.creatorName,
        creatorTitle: parsed.creatorTitle || DEFAULT_SITE_CONFIG.creatorTitle,
        domain: { ...DEFAULT_SITE_CONFIG.domain, ...(parsed.domain || {}) },
        images: { ...DEFAULT_SITE_CONFIG.images, ...(parsed.images || {}) },
        contact: { ...DEFAULT_SITE_CONFIG.contact, ...(parsed.contact || {}) },
        payments: { ...DEFAULT_SITE_CONFIG.payments, ...(parsed.payments || {}) },
        emailNotifications: { ...DEFAULT_SITE_CONFIG.emailNotifications, ...(parsed.emailNotifications || {}) },
      };

      if (merged.images?.favicon) {
        applyFaviconToDocument(merged.images.favicon);
      }
      return merged;
    }
  } catch (e) {
    console.error('Error cargando configuración guardada:', e);
  }
  return DEFAULT_SITE_CONFIG;
}

/**
 * Guarda los cambios en LocalStorage para que nunca se pierdan al recargar
 */
export function persistSiteConfig(config: SiteConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    // Actualizar objeto en memoria
    Object.assign(siteConfig, config);
    if (config.images?.favicon) {
      applyFaviconToDocument(config.images.favicon);
    }
  } catch (e) {
    console.error('Error guardando configuración:', e);
  }
}

/**
 * Restablece la configuración original
 */
export function resetSiteConfig(): SiteConfig {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('latropa_site_config_v4');
    localStorage.removeItem('latropa_site_config_v3');
    localStorage.removeItem('latropa_site_config_v2');
  }
  Object.assign(siteConfig, DEFAULT_SITE_CONFIG);
  if (DEFAULT_SITE_CONFIG.images?.favicon) {
    applyFaviconToDocument(DEFAULT_SITE_CONFIG.images.favicon);
  }
  return DEFAULT_SITE_CONFIG;
}

// Objeto mutable activo exportado
export const siteConfig: SiteConfig = getActiveSiteConfig();
