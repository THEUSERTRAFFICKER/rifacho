# GUÍA RÁPIDA: CÓMO EDITAR Y CONECTAR TU PASARELA DE PAGOS

Tienes **2 formas muy sencillas** de conectar tu pasarela de pagos y cambiar precios:

---

### Opción 1: Desde la Pantalla (Sin programar nada)
1. Abre la aplicación en tu navegador.
2. En la parte superior izquierda del encabezado negro verás un botón que dice **"⚙️ Configurar Pasarela"**.
3. Al hacer clic se abrirá un panel lateral donde puedes:
   - Cambiar la pasarela activa (**TuCompra**, **Wompi Bancolombia**, **ePayco**, **Webhook / Backend Propio**, o **Modo Pruebas Simulado**).
   - Ingresar tu Llave Pública / Merchant ID / API Key.
   - Activar o desactivar el modo sandbox/pruebas.
   - Cambiar los precios por boleto, porcentaje de avance en la barra, cantidad mínima y teléfonos de soporte.
   - Hacer clic en **"Guardar Cambios"** y se aplicarán al instante.

---

### Opción 2: Editando el Archivo de Configuración
Todo el proyecto está centralizado en un solo archivo principal:
📂 **`/src/config/siteConfig.ts`**

#### 1. Conectar TuCompra (La pasarela original de latropa.co)
En `/src/config/siteConfig.ts`, edita:
```typescript
payments: {
  provider: "tucompra",
  tucompra: {
    usuario: "TU_USUARIO_AQUÍ",
    llave: "TU_LLAVE_O_TOKEN_AQUÍ",
    endpointUrl: "https://gateway.tucompra.net/service/checkout",
    sandbox: false // Pon false para dinero real, true para pruebas
  }
}
```

#### 2. Conectar Wompi (Bancolombia, Nequi, PSE, Tarjetas)
```typescript
payments: {
  provider: "wompi",
  wompi: {
    publicKey: "pub_prod_TU_LLAVE_PUBLICA_DE_WOMPI",
    redirectUrl: "https://tudominio.com"
  }
}
```

#### 3. Conectar ePayco Colombia
```typescript
payments: {
  provider: "epayco",
  epayco: {
    publicKey: "TU_LLAVE_PUBLICA_EPAYCO",
    testMode: false
  }
}
```

#### 4. Conectar tu propio Backend / Servidor / Webhook
Si tienes un servidor en Node.js, PHP, Python, etc.:
```typescript
payments: {
  provider: "custom_webhook",
  customWebhookUrl: "https://tu-api.com/procesar-pago"
}
```
Tu webhook recibirá automáticamente este formato JSON:
```json
{
  "orderId": "ord-123456",
  "orderNumber": "LT-58291",
  "customerName": "Juan",
  "customerLastName": "Perez",
  "address": "Calle 100 # 19-61, Bogotá",
  "phone": "3001234567",
  "email": "juan@correo.com",
  "amountCOP": 20000,
  "quantity": 20,
  "productTitle": "Acc Combo Tesla",
  "paymentMethod": "TuCompra (Nequi)"
}
```

---

### ¿Cómo cambiar los precios y textos?
En el mismo archivo `/src/config/siteConfig.ts`:
- **`pricePerTicketCOP: 1000`** ➔ Cambia el valor por número en pesos colombianos.
- **`minTicketQuantity: 20`** ➔ Mínimo de boletos que se pueden comprar.
- **`progressPercentage: 31.38`** ➔ Porcentaje que se muestra en la barra azul.
- **`ticketPackages`** ➔ Lista de los botones rojos para agregar o quitar opciones de compra rápida.
- **`contact`** ➔ Enlaces de WhatsApp, Telegram y correo electrónico.
