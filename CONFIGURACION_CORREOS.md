# Configuración de Envío de Correos Automáticos (Boletos y Comprobantes)

Cada vez que una persona realiza una compra en tu página, el sistema genera de forma automática sus números de la suerte y se los envía directamente a su correo electrónico.

---

## 1. ¿Cómo funciona el envío al correo?

Cuando el cliente pulsa el botón **"Finalizar compra"** en el Checkout:
1. Se procesa el pago con la pasarela seleccionada (TuCompra, Wompi, ePayco, etc.).
2. El sistema reserva y genera los números únicos de la persona (ej: `18492`, `93819`, etc.).
3. Se despacha un correo electrónico con una plantilla en HTML con el logotipo, nombre del sorteo, total pagado, número de orden y la lista completa de números adquiridos.
4. En la pantalla del cliente se muestra el mensaje de confirmación:
   `"¡Números enviados a tu correo! Hemos enviado tus X números y el comprobante oficial a tu correo"`, además de un botón para **Reenviar correo** en caso de que lo necesite.
5. Si el cliente busca sus números en la sección *"Buscar Números"*, también tiene disponible un botón directo: **"📧 Reenviar a mi correo"**.

---

## 2. Opciones de Proveedor de Correo Disponibles

Puedes configurar el método que prefieras en el **Panel de Control** (botón de engranaje ⚙️ en el encabezado, pestaña **✉️ Correo Automático**):

### Opción A: Modo Automático Integrado (Por Defecto)
* **Requisitos:** Ninguno, funciona de inmediato sin necesidad de claves de API ni registro previo.
* Ideal para pruebas o lanzamientos rápidos.

### Opción B: EmailJS (Recomendado para páginas estáticas sin servidor propio)
* Permite enviar correos reales usando tu propia cuenta de **Gmail**, **Outlook** o **SMTP corporativo** directamente desde el navegador del cliente.
* **Pasos:**
  1. Regístrate gratis en [EmailJS](https://www.emailjs.com/).
  2. Conecta tu servicio de correo (Gmail, Outlook o tu servidor SMTP).
  3. Crea una plantilla de correo con las variables:
     * `{{to_name}}` - Nombre del comprador.
     * `{{to_email}}` - Correo del comprador.
     * `{{order_number}}` - Código de orden.
     * `{{quantity}}` - Cantidad de números.
     * `{{ticket_numbers}}` - Lista de números comprados.
     * `{{total_cop}}` - Total en pesos colombianos.
  4. En el Panel de Control, ve a **✉️ Correo Automático** -> selecciona **EmailJS** y pega tu:
     * `Service ID`
     * `Template ID`
     * `Public Key`
  5. Haz clic en **Guardar Cambios**.

### Opción C: Webhook / Backend Propio (PHP, Node.js, Python, Zapier, Make)
* Si tienes tu propio servidor o usas Zapier/Make para disparar correos desde SendGrid, Mailgun o Postmark:
  1. Ingresa la URL de tu endpoint (ej: `https://tudominio.com/api/enviar-correo`).
  2. Cuando el cliente compre, la app enviará un `POST` con formato JSON:
     ```json
     {
       "event": "order_completed",
       "to": "cliente@correo.com",
       "customerName": "Carlos Rodríguez",
       "orderNumber": "LT-84920",
       "quantity": 20,
       "totalCOP": 20000,
       "ticketNumbers": ["10384", "18492", "24910", ...],
       "subject": "🎟️ Tus 20 Números para el Sorteo - Pedido #LT-84920",
       "html": "<html>...</html>"
     }
     ```

### Opción D: Resend API
* Si usas [Resend](https://resend.com/):
  1. Crea tu cuenta y obtén tu API Key (`re_xxxxxxxx`).
  2. Selecciona **Resend API** en el panel y pega tu clave.

---

## 3. ¿Cómo editar el nombre y correo del remitente?

En el Panel de Control (**✉️ Correo Automático**):
* **Nombre del Remitente:** Cambia `"La Tropa Oficial"` por el nombre de tu marca o sorteo.
* **Correo del Remitente:** Cambia `"boletos@latropa.co"` por tu correo oficial (ej: `sorteos@tudominio.com`).
