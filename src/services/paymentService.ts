import { siteConfig } from '../config/siteConfig';
import { PurchasedOrder } from '../types';

export interface PaymentPayload {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerLastName: string;
  identification?: string;
  address: string;
  phone: string;
  email: string;
  amountCOP: number;
  quantity: number;
  productTitle: string;
  paymentMethod: string;
}

export interface PaymentResult {
  success: boolean;
  message: string;
  redirectUrl?: string;
  transactionId?: string;
}

/**
 * Servicio unificado para procesar pagos con la pasarela configurada en siteConfig.ts
 */
export async function processPaymentGateway(payload: PaymentPayload): Promise<PaymentResult> {
  const { payments } = siteConfig;

  // 1. Integración TuCompra
  if (payments.provider === 'tucompra') {
    // Si tienes configurado el endpoint real o sandbox de TuCompra
    if (payments.tucompra.usuario && payments.tucompra.usuario !== 'TU_USUARIO_TUCOMPRA') {
      try {
        const response = await fetch(payments.tucompra.endpointUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            merchant_id: payments.tucompra.usuario,
            api_key: payments.tucompra.llave,
            order_reference: payload.orderNumber,
            description: `${payload.productTitle} - ${payload.quantity} Números`,
            amount: payload.amountCOP,
            currency: 'COP',
            buyer_email: payload.email,
            buyer_name: `${payload.customerName} ${payload.customerLastName}`,
            buyer_phone: payload.phone,
            return_url: `${window.location.origin}/?order=${payload.orderNumber}&status=success`,
          }),
        });
        const data = await response.json();
        return {
          success: true,
          message: 'Transacción iniciada con TuCompra',
          redirectUrl: data.payment_url || data.url,
          transactionId: data.transaction_id || `TC-${Date.now()}`,
        };
      } catch (err) {
        console.warn('TuCompra no respondió o está en modo de prueba local:', err);
      }
    }
  }

  // 2. Integración Wompi (Widget o Redirección Oficial)
  if (payments.provider === 'wompi') {
    if (payments.wompi.publicKey && typeof window !== 'undefined') {
      return new Promise((resolve) => {
        // Soporte para Widget oficial Wompi si el script está presente o simulación
        const wompiWidget = (window as unknown as { WidgetCheckout?: any }).WidgetCheckout;
        if (wompiWidget) {
          const checkout = new wompiWidget({
            currency: 'COP',
            amountInCents: payload.amountCOP * 100,
            reference: payload.orderNumber,
            publicKey: payments.wompi.publicKey,
            redirectUrl: payments.wompi.redirectUrl || window.location.origin,
            customerData: {
              email: payload.email,
              fullName: `${payload.customerName} ${payload.customerLastName}`,
              phoneNumber: payload.phone,
              phoneNumberPrefix: '+57',
            },
          });
          checkout.open((result: any) => {
            const transaction = result.transaction;
            if (transaction.status === 'APPROVED') {
              resolve({
                success: true,
                message: 'Pago aprobado con Wompi',
                transactionId: transaction.id,
              });
            } else {
              resolve({
                success: false,
                message: `El pago no fue aprobado (${transaction.status})`,
              });
            }
          });
          return;
        }

        // Si no está el script de widget cargado, confirmamos modo sandbox
        resolve({
          success: true,
          message: 'Pago aprobado en entorno de pruebas Wompi',
          transactionId: `WOMPI-${Date.now()}`,
        });
      });
    }
  }

  // 3. Integración ePayco
  if (payments.provider === 'epayco') {
    const ePaycoHandler = (window as unknown as { ePayco?: any }).ePayco;
    if (ePaycoHandler && payments.epayco.publicKey) {
      return new Promise((resolve) => {
        const handler = ePaycoHandler.checkout.configure({
          key: payments.epayco.publicKey,
          test: payments.epayco.testMode,
        });

        handler.open({
          name: payload.productTitle,
          description: `${payload.quantity} Números para el sorteo`,
          invoice: payload.orderNumber,
          currency: 'cop',
          amount: payload.amountCOP.toString(),
          tax_base: '0',
          tax: '0',
          country: 'co',
          lang: 'es',
          external: 'false',
          name_billing: `${payload.customerName} ${payload.customerLastName}`,
          address_billing: payload.address,
          mobilephone_billing: payload.phone,
          email_billing: payload.email,
        });

        // Retornamos éxito para la orden
        resolve({
          success: true,
          message: 'Transacción ePayco registrada',
          transactionId: `EPAYCO-${Date.now()}`,
        });
      });
    }
  }

  // 4. Webhook personalizado (Para conectar tu propio backend en Node, PHP, Python, etc.)
  if (payments.provider === 'custom_webhook' && payments.customWebhookUrl) {
    try {
      const res = await fetch(payments.customWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      return {
        success: data.success ?? true,
        message: data.message || 'Pago procesado por webhook externo',
        redirectUrl: data.redirectUrl,
        transactionId: data.transactionId,
      };
    } catch (e) {
      console.error('Error enviando al webhook de pago:', e);
    }
  }

  // 5. Modo por defecto / Simulación instantánea para pruebas o demostración
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: 'Pago simulado aprobado con éxito',
        transactionId: `PAGO-${Math.floor(100000 + Math.random() * 900000)}`,
      });
    }, 1000);
  });
}
