import React, { useState } from 'react';
import { siteConfig } from '../config/siteConfig';

interface AccessLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPublicPreview?: () => void;
  onOpenDashboard?: () => void;
}

export const AccessLinksModal: React.FC<AccessLinksModalProps> = ({
  isOpen,
  onClose,
  onOpenPublicPreview,
  onOpenDashboard,
}) => {
  const [selectedBase, setSelectedBase] = useState<'current' | 'custom'>('current');
  const [copiedPublic, setCopiedPublic] = useState(false);
  const [copiedAdmin, setCopiedAdmin] = useState(false);
  const [showQrType, setShowQrType] = useState<'public' | 'admin' | null>(null);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://rifacho.com';
  const customOrigin = `${siteConfig.domain.protocol}://${siteConfig.domain.customDomain}`;

  const baseOrigin = selectedBase === 'custom' && siteConfig.domain.customDomain ? customOrigin : currentOrigin;

  // Enlace Público: raíz limpia
  const publicLink = `${baseOrigin}/`;

  // Enlace Administrador: con parámetro de acceso directo ?admin=true
  const adminLink = `${baseOrigin}/?admin=true`;

  const handleCopyPublic = async () => {
    try {
      await navigator.clipboard.writeText(publicLink);
      setCopiedPublic(true);
      setTimeout(() => setCopiedPublic(false), 2500);
    } catch {
      // Fallback
      prompt('Copia el enlace público:', publicLink);
    }
  };

  const handleCopyAdmin = async () => {
    try {
      await navigator.clipboard.writeText(adminLink);
      setCopiedAdmin(true);
      setTimeout(() => setCopiedAdmin(false), 2500);
    } catch {
      // Fallback
      prompt('Copia el enlace de administrador:', adminLink);
    }
  };

  const whatsappShareText = encodeURIComponent(
    `🎟️ ¡Participa ya en nuestro sorteo de ${siteConfig.raffleName}! 🔥 ${siteConfig.awardHighlightText} - ${siteConfig.productTitle}.\n\n👇 Compra tus boletos aquí (números aleatorios generados automáticamente al pagar):\n${publicLink}`
  );
  const whatsappUrl = `https://api.whatsapp.com/send?text=${whatsappShareText}`;

  // QR Code images via safe public generator API
  const publicQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(publicLink)}`;
  const adminQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(adminLink)}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white text-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto border border-gray-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-950 via-gray-900 to-black text-white p-5 sm:p-6 rounded-t-2xl flex items-center justify-between border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-xl font-bold text-white shadow-md">
              🔗
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                Enlaces de Acceso al Sitio Web
              </h2>
              <p className="text-xs text-gray-400">
                El enlace que ve el público y tu enlace privado de administrador
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition cursor-pointer text-xl font-bold"
            aria-label="Cerrar ventana"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-7 space-y-6">
          
          {/* Selector de Base de URL (Dominio o Hosting actual) */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                  Servidor o Dominio para generar los links:
                </label>
                <p className="text-xs text-gray-500">
                  Elige si deseas los enlaces con el servidor actual o tu dominio propio configurado.
                </p>
              </div>
              <div className="inline-flex rounded-lg bg-gray-200 p-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedBase('current')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                    selectedBase === 'current'
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  🌐 Servidor Actual
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBase('custom')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                    selectedBase === 'custom'
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  ⚡ Dominio ({siteConfig.domain.customDomain || 'rifacho.com'})
                </button>
              </div>
            </div>
          </div>

          {/* 1. ENLACE PÚBLICO (PARA EL PÚBLICO Y CLIENTES) */}
          <div className="border-2 border-green-500/40 bg-gradient-to-b from-green-50/50 to-white rounded-xl p-4 sm:p-5 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-green-600 text-white text-[11px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider flex items-center gap-1">
              <span>✓</span>
              <span>Para Clientes</span>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🌐</span>
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  1. Enlace Público (El que va a ver el público)
                </h3>
                <p className="text-xs text-green-800 font-medium">
                  Limpio, sin botones de administración ni edición. Para tus clientes y compradores.
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600 mb-3">
              Comparte este link en tus redes sociales (Instagram, WhatsApp, TikTok, Telegram o campañas de publicidad). Tus clientes ingresan aquí para comprar boletos y ver el estado del sorteo.
            </p>

            {/* Input con el link */}
            <div className="flex flex-col sm:flex-row items-stretch gap-2 mb-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  readOnly
                  value={publicLink}
                  className="w-full bg-white border border-green-300 font-mono text-xs sm:text-sm text-gray-800 rounded-lg px-3 py-2.5 shadow-inner focus:outline-hidden select-all"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
              </div>
              <button
                type="button"
                onClick={handleCopyPublic}
                className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 shrink-0 cursor-pointer ${
                  copiedPublic
                    ? 'bg-green-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                <span>{copiedPublic ? '✓' : '📋'}</span>
                <span>{copiedPublic ? '¡Copiado!' : 'Copiar Enlace'}</span>
              </button>
            </div>

            {/* Acciones para el enlace público */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-green-100">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#25D366] hover:bg-[#20bd5a] text-white px-3 py-1.5 rounded-md transition shadow-xs"
              >
                <span>💬</span>
                <span>Enviar por WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => setShowQrType(showQrType === 'public' ? null : 'public')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md transition cursor-pointer"
              >
                <span>📱</span>
                <span>{showQrType === 'public' ? 'Ocultar Código QR' : 'Ver Código QR'}</span>
              </button>

              {onOpenPublicPreview && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenPublicPreview();
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-white border border-gray-300 hover:bg-gray-50 px-3 py-1.5 rounded-md transition cursor-pointer ml-auto"
                >
                  <span>👁️</span>
                  <span>Ver cómo lo ve el cliente</span>
                </button>
              )}
            </div>

            {/* QR Modal embed para el público */}
            {showQrType === 'public' && (
              <div className="mt-4 p-4 bg-white border border-gray-200 rounded-xl flex flex-col sm:flex-row items-center gap-4 animate-in fade-in">
                <img
                  src={publicQrUrl}
                  alt="QR Enlace Público"
                  className="w-36 h-36 rounded-lg border border-gray-200 shadow-sm"
                />
                <div className="space-y-2 text-center sm:text-left">
                  <h4 className="text-sm font-bold text-gray-900">Código QR para Clientes</h4>
                  <p className="text-xs text-gray-600 max-w-xs">
                    Escanea este código con cualquier teléfono celular para ir directo a la compra de boletos. Ideal para imprimir en volantes físicos o afiches.
                  </p>
                  <a
                    href={publicQrUrl}
                    download="qr_sorteo_publico.png"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-xs font-bold text-blue-600 hover:underline"
                  >
                    ⬇️ Descargar imagen QR
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* 2. ENLACE DE ADMINISTRADOR (PRIVADO) */}
          <div className="border-2 border-red-500/40 bg-gradient-to-b from-red-50/40 to-white rounded-xl p-4 sm:p-5 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-red-600 text-white text-[11px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider flex items-center gap-1">
              <span>🔒</span>
              <span>Privado / Administrador</span>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🔐</span>
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  2. Enlace para Entrar al Administrador
                </h3>
                <p className="text-xs text-red-700 font-medium">
                  Exclusivo para ti. Abre el panel de ventas, reporte de clientes, boletos y ajustes.
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600 mb-3">
              Guarda este enlace en tus marcadores o favoritos privados. Al ingresar con este link podrás ver el reporte de compradores, números generados, anulación de boletos, cambio de fotos, logo y pasarelas.
            </p>

            {/* Input con el link admin */}
            <div className="flex flex-col sm:flex-row items-stretch gap-2 mb-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  readOnly
                  value={adminLink}
                  className="w-full bg-white border border-red-300 font-mono text-xs sm:text-sm text-gray-800 rounded-lg px-3 py-2.5 shadow-inner focus:outline-hidden select-all"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
              </div>
              <button
                type="button"
                onClick={handleCopyAdmin}
                className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 shrink-0 cursor-pointer ${
                  copiedAdmin
                    ? 'bg-red-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                <span>{copiedAdmin ? '✓' : '📋'}</span>
                <span>{copiedAdmin ? '¡Copiado!' : 'Copiar Enlace Admin'}</span>
              </button>
            </div>

            {/* Credenciales de Acceso e Información */}
            <div className="bg-white border border-red-200 rounded-lg p-3 text-xs text-gray-700 space-y-1 mb-3">
              <div className="font-bold text-gray-900 flex items-center gap-1.5">
                <span>🔑</span>
                <span>Datos de inicio de sesión de administrador:</span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-gray-800 pt-1">
                <span className="bg-gray-100 px-2.5 py-1 rounded border border-gray-300">
                  Usuario: <strong className="text-red-600 font-bold">admin</strong>
                </span>
                <span className="bg-gray-100 px-2.5 py-1 rounded border border-gray-300">
                  Contraseña: <strong className="text-red-600 font-bold">admin123</strong>
                </span>
                <span className="text-[11px] font-sans text-gray-500">
                  (Puedes cambiar o agregar más operadores en el panel de usuarios)
                </span>
              </div>
            </div>

            {/* Acciones para el enlace admin */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-red-100">
              {onOpenDashboard && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenDashboard();
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold bg-gray-900 hover:bg-black text-white px-3.5 py-1.5 rounded-md transition shadow-xs cursor-pointer"
                >
                  <span>📊</span>
                  <span>Abrir Panel de Ventas Ahora</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowQrType(showQrType === 'admin' ? null : 'admin')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md transition cursor-pointer"
              >
                <span>📱</span>
                <span>{showQrType === 'admin' ? 'Ocultar QR Admin' : 'QR para entrar desde el Celular'}</span>
              </button>
            </div>

            {/* QR Modal embed para el admin */}
            {showQrType === 'admin' && (
              <div className="mt-4 p-4 bg-white border border-gray-200 rounded-xl flex flex-col sm:flex-row items-center gap-4 animate-in fade-in">
                <img
                  src={adminQrUrl}
                  alt="QR Enlace Administrador"
                  className="w-36 h-36 rounded-lg border border-gray-200 shadow-sm"
                />
                <div className="space-y-2 text-center sm:text-left">
                  <h4 className="text-sm font-bold text-gray-900">QR para Acceso Administrativo Móvil</h4>
                  <p className="text-xs text-gray-600 max-w-xs">
                    Escanea este código con la cámara de tu teléfono móvil para abrir el panel de control administrativo directamente en tu celular.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Resumen rápido de diferencias */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900">
            <h4 className="font-bold text-sm mb-1.5 flex items-center gap-1.5 text-blue-950">
              <span>💡</span>
              <span>¿Cómo funciona la separación de enlaces?</span>
            </h4>
            <ul className="space-y-1.5 list-disc list-inside text-blue-800">
              <li>
                <strong>Público:</strong> Las personas que visitan tu enlace principal ven exclusivamente el catálogo del sorteo, fotos, selector de boletos y pasarela de pago. Nunca ven botones de edición ni estadísticas internas.
              </li>
              <li>
                <strong>Administrador:</strong> Al abrir el enlace con <code className="bg-blue-100 px-1 py-0.5 rounded font-mono text-blue-900 font-bold">?admin=true</code> o ingresar con tu clave, se activa la barra de control superior para gestionar todo el sistema.
              </li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 sm:p-5 flex justify-end gap-2 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer transition"
          >
            Entendido / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
