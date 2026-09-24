import React from 'react';
import { siteConfig } from '../config/siteConfig';

interface HeaderProps {
  onGoHome?: () => void;
  currentPage?: 'home' | 'checkout' | 'admin_dashboard';
  isAdmin?: boolean;
  isPublicPreview?: boolean;
  onOpenAdminConfig?: () => void;
  onOpenDashboard?: () => void;
  onOpenLinksModal?: () => void;
  onSearchClick?: () => void;
  onBuyClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onGoHome,
  currentPage = 'home',
  isAdmin = false,
  isPublicPreview = false,
  onOpenAdminConfig,
  onOpenDashboard,
  onOpenLinksModal,
  onSearchClick,
  onBuyClick,
}) => {
  const showAdminTools = isAdmin && !isPublicPreview;

  return (
    <header id="masthead" className="bg-[#020000] w-full py-[14px] sm:py-[18px] px-4 flex justify-center items-center shadow-md relative z-40">
      <div className="w-full max-w-[1140px] flex items-center justify-between relative">
        
        {/* Left Side: En modo Admin muestra accesos rápidos; en modo Público muestra botón de consulta de boletos */}
        <div className="flex items-center gap-2">
          {showAdminTools ? (
            <>
              {onOpenLinksModal && (
                <button
                  onClick={onOpenLinksModal}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-full transition shadow-xs cursor-pointer"
                  title="Copiar link público para clientes y link privado para administrador"
                >
                  <span>🔗</span>
                  <span className="hidden sm:inline">Links del Sitio</span>
                </button>
              )}

              {onOpenDashboard && (
                <button
                  onClick={onOpenDashboard}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition shadow-xs cursor-pointer ${
                    currentPage === 'admin_dashboard'
                      ? 'bg-white text-gray-900'
                      : 'text-white bg-blue-600 hover:bg-blue-700'
                  }`}
                  title="Ver Reporte de Ventas, Clientes, Boletos, Anulaciones y Usuarios"
                >
                  <span>📊</span>
                  <span className="hidden md:inline">Panel Ventas</span>
                </button>
              )}

              {onOpenAdminConfig && (
                <button
                  onClick={onOpenAdminConfig}
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-full transition shadow-xs cursor-pointer"
                  title="Cambiar Logo, Fotos, Pasarela de Pagos y Dominio"
                >
                  <span>⚙️</span>
                  <span>Ajustes</span>
                </button>
              )}
            </>
          ) : (
            /* Vista Pública (Cliente): Botón discreto para consultar boletos ya comprados */
            onSearchClick && currentPage !== 'admin_dashboard' && (
              <button
                type="button"
                onClick={onSearchClick}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-gray-200 hover:text-white bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-full transition cursor-pointer"
                title="Consultar los números que compraste con tu correo"
              >
                <span>🔍</span>
                <span className="hidden sm:inline">Buscar mis Boletos</span>
                <span className="sm:hidden">Boletos</span>
              </button>
            )
          )}
        </div>

        {/* Logo Centrado */}
        <div className="flex-1 flex justify-center">
          <div className="relative group">
            <a
              href="/"
              onClick={(e) => {
                if (onGoHome) {
                  e.preventDefault();
                  onGoHome();
                }
              }}
              className="inline-block transition-transform hover:opacity-95"
              title={siteConfig.raffleName}
            >
              <img
                src={siteConfig.images.logo}
                alt={siteConfig.raffleName}
                className="h-12 sm:h-16 md:h-20 w-auto object-contain"
              />
            </a>
            {/* Quick edit logo hover trigger SOLO en modo admin */}
            {showAdminTools && onOpenAdminConfig && (
              <button
                type="button"
                onClick={onOpenAdminConfig}
                className="absolute -bottom-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 text-white p-1 rounded-full text-[10px] shadow cursor-pointer"
                title="Cambiar Logo de la Web"
              >
                ✏️
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Acciones según página */}
        <div className="flex items-center gap-2">
          {currentPage === 'checkout' && onGoHome ? (
            <button
              onClick={onGoHome}
              className="text-xs sm:text-sm text-gray-300 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded transition cursor-pointer"
            >
              ← Volver
            </button>
          ) : currentPage === 'home' && onBuyClick ? (
            <button
              onClick={onBuyClick}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 rounded-full transition shadow-sm cursor-pointer"
            >
              <span>🎟️</span>
              <span>Comprar</span>
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
};
