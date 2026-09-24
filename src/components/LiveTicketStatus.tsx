import React from 'react';
import { getRaffleTicketStats } from '../utils/orderStore';
import { siteConfig } from '../config/siteConfig';

interface LiveTicketStatusProps {
  onBuyClick?: () => void;
  onStartNewRaffleClick?: () => void;
  isAdmin?: boolean;
}

export const LiveTicketStatus: React.FC<LiveTicketStatusProps> = ({
  onBuyClick,
  onStartNewRaffleClick,
  isAdmin,
}) => {
  const stats = getRaffleTicketStats();
  const isFinished = siteConfig.raffleStatus === 'finalizado';

  // Porcentaje a mostrar (el configurado o el real calculado según órdenes)
  const displayPercentage = isFinished ? 100 : Math.max(stats.percentage, siteConfig.progressPercentage);

  return (
    <section className="w-full max-w-[768px] mx-auto my-4 px-2 sm:px-0">
      <div className={`bg-white rounded-xl border shadow-sm p-4 sm:p-5 ${
        isFinished ? 'border-amber-400 ring-2 ring-amber-300/40' : 'border-gray-200'
      }`}>
        
        {/* Banner de Sorteo Finalizado si aplica */}
        {isFinished && (
          <div className="mb-4 bg-linear-to-r from-amber-500 via-amber-600 to-amber-700 text-white rounded-xl p-4 shadow-md">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🏆</span>
                <div>
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <span className="font-black text-sm uppercase tracking-wide">
                      ¡Este Sorteo Ha Finalizado!
                    </span>
                    <span className="bg-black/30 text-[10px] font-mono px-2 py-0.5 rounded-full">
                      Edición #{siteConfig.editionNumber || 1}
                    </span>
                  </div>
                  {siteConfig.currentWinner ? (
                    <div className="text-xs text-amber-100 mt-0.5 font-medium">
                      Boleto Ganador: <strong className="text-white text-sm font-mono bg-black/40 px-1.5 py-0.5 rounded">#{siteConfig.currentWinner.ticketNumber}</strong> — Ganador: <strong className="text-white">{siteConfig.currentWinner.winnerName}</strong> ({siteConfig.currentWinner.lotteryOrSource || 'Sorteo Oficial'})
                    </div>
                  ) : (
                    <div className="text-xs text-amber-100 mt-0.5">
                      Venta de boletos cerrada para esta edición.
                    </div>
                  )}
                </div>
              </div>

              {/* Botón para Comenzar Nuevo Sorteo */}
              {onStartNewRaffleClick && (
                <button
                  type="button"
                  onClick={onStartNewRaffleClick}
                  className="px-4 py-2.5 bg-white hover:bg-gray-100 text-gray-900 font-extrabold text-xs sm:text-sm rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition transform active:scale-95 shrink-0"
                >
                  <span>🎉</span>
                  <span>Comenzar Nuevo Sorteo</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Encabezado con estado en vivo */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isFinished ? 'bg-amber-400' : 'bg-emerald-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${
                isFinished ? 'bg-amber-500' : 'bg-emerald-500'
              }`}></span>
            </span>
            <span className="font-extrabold text-xs sm:text-sm text-gray-900 uppercase tracking-wide">
              {isFinished ? 'Resumen Oficial de Boletos' : 'Disponibilidad de Boletos en Tiempo Real'}
            </span>
            <span className="text-[11px] font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
              Edición #{siteConfig.editionNumber || 1}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
              isFinished
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}>
              {isFinished ? '🏁 Sorteo Culminado' : 'Sorteo Activo'}
            </span>

            {/* Si es admin y el sorteo está activo, permitir gestionar/comenzar nuevo */}
            {isAdmin && onStartNewRaffleClick && !isFinished && (
              <button
                type="button"
                onClick={onStartNewRaffleClick}
                className="text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 px-2 py-0.5 rounded-md cursor-pointer transition flex items-center gap-1"
                title="Finalizar este sorteo o comenzar uno nuevo"
              >
                <span>⚙️</span>
                <span>Finalizar / Nuevo Sorteo</span>
              </button>
            )}

            {!isFinished && onBuyClick && (
              <button
                type="button"
                onClick={onBuyClick}
                className="text-xs font-bold text-red-600 hover:text-red-700 underline cursor-pointer"
              >
                Comprar boletos →
              </button>
            )}
          </div>
        </div>

        {/* Barra de progreso oficial con estilo de Rifacho */}
        <div className="mb-4">
          <div
            className="tuskcode-progress custom-class"
            role="progressbar"
            aria-valuenow={displayPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Porcentaje de boletos vendidos"
          >
            <div
              className="tuskcode-bar"
              style={{ width: `${displayPercentage}%` }}
            ></div>
            <div className="tuskcode-text">
              <span>{displayPercentage}%</span>
            </div>
          </div>
        </div>

        {/* 3 Tarjetas de métricas en vivo */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
          {/* Boletos Disponibles */}
          <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-lg p-2.5 sm:p-3">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
              🎟️ Disponibles
            </span>
            <span className="text-base sm:text-xl md:text-2xl font-black font-mono text-emerald-700 block mt-0.5">
              {stats.availableTickets.toLocaleString('es-CO')}
            </span>
            <span className="text-[9px] sm:text-[10px] text-emerald-600">
              Listos para asignar
            </span>
          </div>

          {/* Boletos Vendidos */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 sm:p-3">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-600 block">
              ✓ Vendidos
            </span>
            <span className="text-base sm:text-xl md:text-2xl font-black font-mono text-gray-900 block mt-0.5">
              {stats.soldTickets.toLocaleString('es-CO')}
            </span>
            <span className="text-[9px] sm:text-[10px] text-gray-500">
              En manos de clientes
            </span>
          </div>

          {/* Total del Sorteo */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 sm:p-3">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-600 block">
              🔢 Total Sorteo
            </span>
            <span className="text-base sm:text-xl md:text-2xl font-black font-mono text-gray-800 block mt-0.5">
              {stats.totalTickets.toLocaleString('es-CO')}
            </span>
            <span className="text-[9px] sm:text-[10px] text-gray-500">
              Emisión oficial
            </span>
          </div>
        </div>

        {/* Pie informativo */}
        <div className="mt-3 pt-2.5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-500 gap-1">
          <span>🎲 Asignación al azar: Los números se generan aleatoriamente al instante de procesar el pago.</span>
          <span className="font-semibold text-gray-700">Precios desde $ 1.000 COP / número</span>
        </div>

      </div>
    </section>
  );
};
