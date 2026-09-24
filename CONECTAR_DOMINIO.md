# GUÍA COMPLETA: CONECTAR DOMINIO NUEVO Y CAMBIAR LOGO / FOTOS

Esta guía te explica cómo conectar tu propio dominio (ej: `misorteo.com`, `latropa.co`, `rifapremios.store`) y cómo cambiar el Logo y todas las fotos.

---

## 1. CÓMO CAMBIAR EL LOGO Y LAS FOTOS

Tienes **2 métodos muy sencillos**:

### Método A: Desde la Pantalla (Recomendado - Sin programar)
1. Abre tu página en el navegador.
2. En la parte superior verás el botón rojo **"⚙️ Editar Logo, Fotos & Dominio"** (o pasa el mouse sobre cualquier foto y haz clic en **"📷 Cambiar esta foto"**).
3. Se abrirá la pestaña **"🖼️ Logo & Fotos"**:
   - **Logotipo Principal**: Haz clic en **"📁 Subir Logo desde tu equipo"** para seleccionar una imagen desde tu PC o celular, o pega un enlace de internet.
   - **Flyer Principal**: Haz clic en **"📁 Subir Flyer desde tu equipo"**.
   - **Banner Secundario**: Haz clic en **"📁 Subir Banner desde tu equipo"**.
4. Haz clic en **"Guardar Cambios"** abajo a la derecha. ¡Se actualiza al instante y queda guardado de forma permanente!

### Método B: Reemplazando los archivos de imagen
Si prefieres tener los archivos directamente en tu hosting o proyecto, solo reemplaza estas 3 imágenes dentro de la carpeta `/public/images/`:
- 📂 `/public/images/logo.jpg` ➔ Tu nuevo logo.
- 📂 `/public/images/flyer.jpeg` ➔ La foto principal del sorteo / vehículo / premio.
- 📂 `/public/images/banner-2m.png` ➔ El banner de premios adicionales.

---

## 2. CÓMO CONECTAR TU NUEVO DOMINIO

Para que las personas entren a tu web escribiendo tu dirección (por ejemplo `www.misorteo.com`), debes configurar **2 registros DNS** en el lugar donde compraste el dominio (GoDaddy, Hostinger, Namecheap, Cloudflare, DonDominio, etc.).

### Paso 1: Configurar los Registros DNS
Entra al panel de tu registrador de dominio, busca la sección **"Zona DNS"** o **"Administrar DNS"** y añade estos dos registros:

| Tipo | Nombre / Host | Valor / Destino | TTL |
| :--- | :--- | :--- | :--- |
| **A** | `@` | `IP_DE_TU_SERVIDOR` (La IP de tu hosting o servidor) | Automático o 3600 |
| **CNAME** | `www` | `@` (o `tudominio.com`) | Automático o 3600 |

> 💡 **Nota sobre la IP**: Si usas un hosting como Hostinger o cPanel, ellos te dan la IP de tu cuenta en el panel principal. Si usas Vercel, la IP del registro A es `76.76.21.21`.

---

### Paso 2: Instrucciones según tu Proveedor

#### A. Si usas Hostinger:
1. Entra a **hPanel** > **Dominios** > Tu dominio.
2. Ve a **DNS / Servidores de nombres**.
3. En la tabla de registros:
   - Modifica el registro de tipo **A** con Host `@` para que apunte a la IP de tu hosting.
   - Asegúrate de que exista un registro **CNAME** con Nombre `www` apuntando a `@`.
4. Guarda los cambios.

#### B. Si usas GoDaddy:
1. Entra a **Mis productos** > **Dominios** > Haz clic en **DNS** de tu dominio.
2. En la sección **Registros de DNS**:
   - Edita el registro **Tipo A** (`@`) y coloca la IP de tu servidor.
   - En **CNAME**, pon `www` apuntando a `@`.
3. Haz clic en **Guardar**.

#### C. Si usas Cloudflare (Recomendado para SSL Gratis y Protección Rápida):
1. Añade tu dominio en Cloudflare.
2. En la pestaña **DNS > Records**:
   - Tipo **A** | Name `@` | IPv4 address: `Tu IP` | Proxy status: **Proxied (Nube Naranja)**.
   - Tipo **CNAME** | Name `www` | Target: `tudominio.com` | Proxy status: **Proxied**.
3. En la pestaña **SSL/TLS**: Selecciona modo **Full** o **Flexible**.
4. ¡Listo! Cloudflare activa el candado de seguridad HTTPS de inmediato.

---

## 3. CÓMO PUBLICAR / DESPLEGAR LA WEB

Para subir este proyecto a producción:

1. **Generar los archivos de producción:**
   ```bash
   npm run build
   ```
2. Esto creará una carpeta llamada **`/dist`**.
3. **Subir los archivos:**
   - Si usas **cPanel / Hostinger / FTP**: Sube todo el contenido que está dentro de la carpeta `/dist` a la carpeta `public_html`.
   - Si usas **Vercel / Netlify**: Conecta tu repositorio de GitHub, selecciona el framework **Vite**, y automáticamente se publicará con tu dominio.

---

## 4. ACTIVAR EL CANDADO DE SEGURIDAD (HTTPS / SSL)
Los compradores exigen ver el candado verde/seguro para pagar con confianza:
- En cPanel / Hostinger: Ve a la opción **"Estado de SSL / TLS"** y haz clic en **"Ejecutar AutoSSL"** (Es 100% gratuito con Let's Encrypt).
- En Cloudflare: Es automático.
