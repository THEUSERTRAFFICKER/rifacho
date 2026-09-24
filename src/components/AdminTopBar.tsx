import React from 'react';
import { AdminUser } from '../types';

interface AdminTopBarProps {
  adminUser: AdminUser;
  currentPage: 'home' | 'checkout' | 'admin_dashboard';
  viewMode: 'admin' | 'public_preview';
  onToggleViewMode: () => void;
  onOpenDashboard: () => void;
  onOpenPrizeReports?: () => void;
  unreadPrizeCount?: number;
  onOpenSettings: () => void;
  onOpenLinksModal: () => void;
  onOpenRaffleManager?: () => void;
  onLogout: () => void;
}

export const AdminTopBar: React.FC<AdminTopBarProps> = ({
  adminUser,
  currentPage,
  viewMode,
  onToggleViewMode,
  onOpenDashboard,
  onOpenPrizeReports,
  unreadPrizeCount = 0,
  onOpenSettings,
  onOpenLinksModal,
  onOpenRaffleManager,
  onLogout,
}) => {
  return (
    <aside aria-label="Barra de herramientas de administrador" className="bg-[#111827] text-white border-b-2 border-red-600 px-3 sm:px-6 py-2 text-xs sticky top-0 z-50 shadow-lg">
      <div className="max-w-[1240px] mx-auto flex flex-wrap items-center justify-between gap-2">
        {/* User identification */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-red-600 text-white uppercase tracking-wider">
            🔐 Admin
          </span>
          <span className="font-semibold text-gray-200">
            {adminUser.name} <span className="text-gray-400 font-normal">(@{adminUser.username})</span>
          </span>
          {viewMode === 'public_preview' && (
            <span className="hidden md:inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded text-[11px] font-medium">
              👁️ Simulando vista de cliente
            </span>
          )}
        </div>

        {/* Admin Action Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Comenzar Nuevo Sorteo */}
          {onOpenRaffleManager && (
            <button
              type="button"
              onClick={onOpenRaffleManager}
              className="inline-flex items-center gap-1 px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-extrabold transition cursor-pointer shadow-xs"
              title="Comenzar un nuevo sorteo o finalizar el actual con ganador"
            >
              <span>🎲</span>
              <span>Nuevo Sorteo</span>
            </button>
          )}

          {/* Enlaces Público & Admin */}
          <button
            type="button"
            onClick={onOpenLinksModal}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-white font-bold transition cursor-pointer shadow-xs"
            title="Ver y copiar el link para el público y el link de administrador"
          >
            <span>🔗</span>
            <span>Enlaces</span>
          </button>

          {/* Botón Reportes de Premios en Segundo Plano */}
          {onOpenPrizeReports && (
            <button
              type="button"
              onClick={onOpenPrizeReports}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-bold transition cursor-pointer shadow-xs ${
                unreadPrizeCount > 0
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 ring-2 ring-yellow-300 animate-pulse'
                  : 'bg-gray-800 hover:bg-gray-700 text-amber-300 border border-amber-500/40'
              }`}
              title="Ver reportes y auditoría de tiques premiados entregados detrás de plataforma"
            >
              <span>🚨</span>
              <span>Premios</span>
              {unreadPrizeCount > 0 && (
                <span className="bg-red-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-xs animate-bounce">
                  {unreadPrizeCount}
                </span>
              )}
            </button>
          )}

          {/* Panel Ventas & Clientes */}
          <button
            type="button"
            onClick={onOpenDashboard}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-semibold transition cursor-pointer ${
              currentPage === 'admin_dashboard'
                ? 'bg-white text-gray-900'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <span>📊</span>
            <span className="hidden sm:inline">
              {currentPage === 'admin_dashboard' ? 'Cerrar Panel' : 'Panel Ventas'}
            </span>
            <span className="sm:hidden">Panel</span>
          </button>

          {/* Ajustes & Pasarelas */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold border border-gray-700 transition cursor-pointer"
          >
            <span>⚙️</span>
            <span className="hidden sm:inline">Ajustes</span>
          </button>

          {/* Toggle Vista Pública vs Admin */}
          <button
            type="button"
            onClick={onToggleViewMode}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded border transition cursor-pointer ${
              viewMode === 'public_preview'
                ? 'bg-amber-500 hover:bg-amber-600 text-black border-amber-400 font-bold'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700'
            }`}
            title="Alternar entre ver las herramientas de edición o la página 100% limpia como la ven tus clientes"
          >
            <span>{viewMode === 'public_preview' ? '✏️ Modo Edición' : '👁️ Vista Cliente'}</span>
          </button>

          {/* Logout */}
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-red-400 hover:text-red-300 hover:bg-red-950/40 transition cursor-pointer ml-1"
            title="Cerrar sesión de administrador"
          >
            <span>🚪</span>
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
