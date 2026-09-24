# Manual del Panel Administrativo de Sorteos

Tu plataforma ahora incluye un **Panel Administrativo Completo** accesible tanto desde el botón azul **"📊 Panel Ventas & Clientes"** como desde el botón **"⚙️ Logo, Favicon & Pagos"** en el encabezado de la página.

---

## 1. Modificar el Nombre del Creador / Organizador
* Haz clic en **"⚙️ Logo, Favicon & Pagos"**.
* Ve a la pestaña **🎟️ Precios & Textos**.
* En el primer bloque encontrarás:
  * **Nombre del Creador / Organizador** (ej: *La Tropa Oficial* o tu nombre personal/empresa).
  * **Título o Cargo del Creador** (ej: *Organizador Principal*, *Team Sorteos*).
* Al guardar, se actualizará automáticamente en los derechos de autor del pie de página y en los comprobantes.

---

## 2. Cambiar Logos y Favicon (Icono de la Pestaña)
* Abre **"⚙️ Logo, Favicon & Pagos"** y ve a la pestaña **🖼️ Logo & Fotos**:
  * **Logotipo Principal:** Puedes subir tu logo desde tu equipo (botón *📁 Subir Logo*) o ingresar una URL. Se actualiza en la barra superior oscura y en el pie de página.
  * **⭐ Favicon (Icono del Navegador):** Sube cualquier imagen o archivo `.png` o `.ico`. El sistema actualiza el icono de la pestaña del navegador inmediatamente.
  * **Flyer / Banner Principal:** Cambia la foto grande del premio (Combo Tesla o tu premio actual).
  * **Banner Secundario:** Modifica la franja intermedia (2 Millones).

---

## 3. Reporte de Ventas (Diario, Semanal, Mensual y por Medio de Pago)
* Haz clic en el botón azul de la cabecera: **"📊 Panel Ventas & Clientes"** -> pestaña **📊 Reporte de Ventas**:
  * **Filtros rápidos de tiempo:**
    * 📅 **Diario (Hoy):** Total recaudado y boletos vendidos solo en el día de hoy.
    * 🗓️ **Esta Semana:** Ventas acumuladas de los últimos 7 días.
    * 📆 **Este Mes:** Total mensual acumulado.
    * **Histórico Completo:** Todas las ventas desde el lanzamiento.
  * **Métricas en tiempo real:**
    * Recaudación Total Efectiva (en COP).
    * Cantidad de boletos vendidos.
    * Ticket promedio por comprador.
    * Cantidad de órdenes anuladas y valor devuelto.
  * **Desglose por Medio de Pago:**
    * Barras comparativas automáticas para ver cuánto dinero entró por **TuCompra (PSE, Nequi, Daviplata, Tarjeta)**, **Wompi**, **ePayco**, etc.
  * **Exportar a Excel / CSV:**
    * Pulsa **📥 Exportar CSV** para descargar la lista completa con todos los datos y conciliar con tus cuentas bancarias.

---

## 4. Consulta de Datos de Compradores
* En el Panel Administrativo -> pestaña **🎟️ Boletos & Clientes**:
  * Podrás ver la tabla con:
    * **N° de Orden** (ej: `#LT-84920`).
    * **Fecha y hora** exacta de compra.
    * **Datos completos del comprador:** Nombre, Apellidos, Correo Electrónico, Teléfono Celular y Dirección de residencia.
    * **Medio de pago** utilizado.
    * **Cantidad de boletos** y total en COP.
    * **Buscador en vivo:** Permite buscar por nombre, correo, teléfono o número específico de boleto para verificar si un cliente realmente compró.

---

## 5. Opción de Anular Boletos / Tickets
* En la tabla de **Boletos & Clientes**, cada orden activa cuenta con el botón rojo **"Anular Ticket"**:
  1. Al pulsarlo, se abre un cuadro de confirmación pidiendo el **motivo de anulación** (ej: *"Pago rechazado en el banco"*, *"Solicitud de devolución"* o *"Duplicado"*).
  2. Al confirmar, el estado de la orden cambia a **ANULADO**.
  3. Esos números de la suerte quedan deshabilitados inmediatamente:
     * En la sección de búsqueda pública de boletos, el cliente verá su comprobante con un aviso rojo de anulación y sus números tachados.
     * En el reporte de ventas, el dinero de esa orden se resta automáticamente de las ventas efectivas para mantener tu contabilidad exacta.
  4. Si por error se anuló una orden válida, cuentas con el botón **"Reactivar"** para restaurarla.

---

## 6. Crear y Gestionar Usuarios Administradores
* En el Panel Administrativo -> pestaña **👥 Usuarios Administradores**:
  * Visualiza todos los usuarios autorizados para gestionar la plataforma.
  * Botón **"+ Crear Nuevo Administrador"**:
    * **Usuario (Login):** ej. `operador_bogota`
    * **Nombre Completo:** ej. `Carlos Pérez`
    * **Correo Electrónico:** ej. `carlos@latropa.co`
    * **Rol de Permisos:**
      * **Super Administrador:** Acceso total a configuración, pagos y anulaciones.
      * **Operador:** Gestión de pagos y anulación de boletos.
      * **Auditor:** Consulta y descarga de reportes (solo lectura).
  * Opciones para **Activar / Desactivar** o **Eliminar** administradores según lo requieras.
