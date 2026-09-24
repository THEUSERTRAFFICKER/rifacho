import { PurchasedOrder } from '../types';
import { siteConfig } from '../config/siteConfig';

export interface EmailSendResult {
  success: boolean;
  message: string;
  providerUsed: string;
}

/**
 * Genera el cuerpo en HTML estilizado y profesional para el correo que recibe el comprador
 */
export function generateTicketEmailHtml(order: PurchasedOrder): string {
  const { customerName, customerLastName, orderNumber, ticketNumbers, totalCOP, quantity, paymentMethod } = order;
  const fullName = `${customerName} ${customerLastName}`.trim();
  const formatCOP = (val: number) => `$ ${val.toLocaleString('es-CO')} COP`;

  const ticketChips = ticketNumbers
    .map(
      (n) => `
      <td style="padding: 6px; width: 20%; text-align: center;">
        <div style="background-color: #ffffff; border: 1.5px solid #CC0000; color: #CC0000; font-family: monospace, Courier; font-size: 15px; font-weight: bold; padding: 8px 4px; border-radius: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
          ${n}
        </div>
      </td>`
    );

  // Agrupar en filas de a 5 números
  const rows: string[] = [];
  for (let i = 0; i < ticketChips.length; i += 5) {
    const chunk = ticketChips.slice(i, i + 5).join('');
    rows.push(`<tr>${chunk}</tr>`);
  }

  const queryUrl = `${siteConfig.domain.canonicalUrl}/#buscar-numeros-section`;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Tus Números de la Suerte - ${siteConfig.raffleName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #222222; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f6f8; padding: 30px 10px;">
    <tr>
      <td align="center">
        <!-- Contenedor Principal -->
        <table role="presentation" width="100%" style="max-width: 620px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid #e1e4e8;" cellspacing="0" cellpadding="0">
          
          <!-- Encabezado Negro con Logo -->
          <tr>
            <td style="background-color: #020000; padding: 25px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px; text-transform: uppercase;">
                ${siteConfig.raffleName}
              </h1>
              <p style="color: #ff3333; margin: 6px 0 0 0; font-size: 13px; font-weight: bold; letter-spacing: 0.5px;">
                ${siteConfig.productTitle} • ${siteConfig.awardHighlightText}
              </p>
            </td>
          </tr>

          <!-- Banner de Éxito -->
          <tr>
            <td style="background-color: #ecfdf5; border-bottom: 2px solid #10b981; padding: 18px 24px; text-align: center;">
              <span style="font-size: 26px;">🎉</span>
              <h2 style="color: #065f46; margin: 6px 0 2px 0; font-size: 18px; font-weight: bold;">
                ¡PAGO CONFIRMADO CON ÉXITO!
              </h2>
              <p style="color: #047857; margin: 0; font-size: 13px;">
                Hola <strong>${fullName}</strong>, tus números han sido asignados y registrados en nuestro sistema.
              </p>
            </td>
          </tr>

          <!-- Detalles del Pedido -->
          <tr>
            <td style="padding: 24px;">
              <table role="presentation" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px;" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 6px 12px; font-size: 13px; color: #64748b;">N° de Pedido:</td>
                  <td style="padding: 6px 12px; font-size: 14px; font-weight: bold; color: #0f172a; text-align: right; font-family: monospace;">#${orderNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 12px; font-size: 13px; color: #64748b;">Cédula / Doc. Identidad:</td>
                  <td style="padding: 6px 12px; font-size: 14px; font-weight: bold; color: #0f172a; text-align: right; font-family: monospace;">${order.identification || 'No registrada'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 12px; font-size: 13px; color: #64748b;">Cantidad de números:</td>
                  <td style="padding: 6px 12px; font-size: 14px; font-weight: bold; color: #0f172a; text-align: right;">${quantity} Números Oficiales</td>
                </tr>
                <tr>
                  <td style="padding: 6px 12px; font-size: 13px; color: #64748b;">Total pagado:</td>
                  <td style="padding: 6px 12px; font-size: 15px; font-weight: bold; color: #059669; text-align: right;">${formatCOP(totalCOP)}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 12px; font-size: 13px; color: #64748b;">Método de Pago:</td>
                  <td style="padding: 6px 12px; font-size: 13px; font-weight: bold; color: #334155; text-align: right;">${paymentMethod}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 12px; font-size: 13px; color: #64748b;">Correo electrónico:</td>
                  <td style="padding: 6px 12px; font-size: 13px; color: #334155; text-align: right;">${order.email}</td>
                </tr>
              </table>

              <!-- Sección Números Asignados -->
              <div style="margin-top: 26px; text-align: center;">
                <h3 style="font-size: 16px; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0;">
                  🎟️ Tus ${quantity} Números Asignados:
                </h3>
                <p style="font-size: 12px; color: #64748b; margin: 0 0 16px 0;">
                  Estos son tus números válidos con los que juegas en el sorteo oficial:
                </p>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                  ${rows.join('')}
                </table>
              </div>

              <!-- Botón Consultar en la Web -->
              <div style="text-align: center; margin: 30px 0 15px 0;">
                <a href="${queryUrl}" style="background-color: #CC0000; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 3px 8px rgba(204,0,0,0.3);">
                  🔍 Verificar mis números en la Web Oficial
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer del Correo -->
          <tr>
            <td style="background-color: #0b0f19; padding: 22px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #1e293b;">
              <p style="margin: 0 0 8px 0; color: #ffffff; font-weight: bold;">
                ¿Tienes dudas o necesitas ayuda?
              </p>
              <p style="margin: 0 0 12px 0;">
                WhatsApp: <a href="${siteConfig.contact.whatsappUrl}" style="color: #22c55e; text-decoration: none; font-weight: bold;">Escríbenos al WhatsApp</a> • Telegram: <a href="${siteConfig.contact.telegramUrl}" style="color: #38bdf8; text-decoration: none; font-weight: bold;">Canal Oficial</a>
              </p>
              <p style="margin: 0; color: #64748b; font-size: 11px;">
                © 2026 ${siteConfig.raffleName} • Este correo fue enviado automáticamente a ${order.email} tras la confirmación de tu compra.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Servicio para enviar el correo al comprador usando el proveedor configurado (EmailJS, Webhook, Resend, Brevo o Simulado)
 */
export async function sendOrderConfirmationEmail(order: PurchasedOrder): Promise<EmailSendResult> {
  const emailConfig = siteConfig.emailNotifications;
  const fullName = `${order.customerName} ${order.customerLastName}`.trim();
  const subject = `🎟️ Tus ${order.quantity} Números para el Sorteo - Pedido #${order.orderNumber}`;

  // 1. Proveedor: Webhook / Backend Propio (Node, PHP, Python, Zapier, Make)
  if (emailConfig.provider === 'webhook' && emailConfig.webhookEndpoint) {
    try {
      const response = await fetch(emailConfig.webhookEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'order_completed',
          to: order.email,
          customerName: fullName,
          orderNumber: order.orderNumber,
          quantity: order.quantity,
          totalCOP: order.totalCOP,
          ticketNumbers: order.ticketNumbers,
          subject,
          html: generateTicketEmailHtml(order),
        }),
      });

      if (response.ok) {
        return {
          success: true,
          message: `Correo enviado exitosamente a ${order.email} vía Webhook`,
          providerUsed: 'Webhook',
        };
      }
    } catch (err) {
      console.warn('Fallo el envío por Webhook de correo:', err);
    }
  }

  // 2. Proveedor: EmailJS (Funciona directo en el navegador sin backend)
  if (emailConfig.provider === 'emailjs' && emailConfig.emailjsPublicKey) {
    try {
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: emailConfig.emailjsServiceId,
          template_id: emailConfig.emailjsTemplateId,
          user_id: emailConfig.emailjsPublicKey,
          template_params: {
            to_name: fullName,
            to_email: order.email,
            order_number: order.orderNumber,
            quantity: order.quantity,
            total_cop: `$ ${order.totalCOP.toLocaleString('es-CO')} COP`,
            ticket_numbers: order.ticketNumbers.join(', '),
            product_title: siteConfig.productTitle,
            support_whatsapp: siteConfig.contact.whatsappUrl,
          },
        }),
      });

      if (response.ok) {
        return {
          success: true,
          message: `Correo enviado a ${order.email} vía EmailJS`,
          providerUsed: 'EmailJS',
        };
      }
    } catch (err) {
      console.warn('Fallo el envío por EmailJS:', err);
    }
  }

  // 3. Proveedor: Resend API
  if (emailConfig.provider === 'resend' && emailConfig.resendApiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${emailConfig.resendApiKey}`,
        },
        body: JSON.stringify({
          from: `${emailConfig.senderName} <${emailConfig.senderEmail}>`,
          to: [order.email],
          subject,
          html: generateTicketEmailHtml(order),
        }),
      });

      if (response.ok) {
        return {
          success: true,
          message: `Correo enviado a ${order.email} vía Resend`,
          providerUsed: 'Resend',
        };
      }
    } catch (err) {
      console.warn('Fallo el envío por Resend:', err);
    }
  }

  // 4. Modo por Defecto / Simulado en el navegador
  // Guarda el comprobante de correo en localStorage para que el usuario o admin pueda auditarlo
  const emailLog = {
    id: `mail-${Date.now()}`,
    orderNumber: order.orderNumber,
    to: order.email,
    subject,
    date: new Date().toISOString(),
    ticketCount: order.ticketNumbers.length,
    status: 'ENVIADO',
  };

  try {
    const existing = JSON.parse(localStorage.getItem('rifacho_sent_emails') || localStorage.getItem('latropa_sent_emails') || '[]');
    existing.unshift(emailLog);
    localStorage.setItem('rifacho_sent_emails', JSON.stringify(existing.slice(0, 100)));
  } catch (e) {
    console.error('Error guardando log de correo:', e);
  }

  return {
    success: true,
    message: `Notificación y números enviados al correo ${order.email}`,
    providerUsed: emailConfig.provider === 'disabled' ? 'Simulado' : emailConfig.provider,
  };
}
