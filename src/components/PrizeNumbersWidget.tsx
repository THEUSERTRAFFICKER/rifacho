import React, { useState, useEffect } from 'react';
import { SpecialPrizeNumber, PrizeNumbersSettings } from '../types';
import { getSpecialPrizeNumbers, getPrizeNumbersSettings } from '../utils/prizeNumbersStore';

interface PrizeNumbersWidgetProps {
  isAdmin?: boolean;
  onOpenAdminPrizeManager?: () => void;
  onBuyTicketsClick: () => void;
}

export const PrizeNumbersWidget: React.FC<PrizeNumbersWidgetProps> = ({
  isAdmin,
  onOpenAdminPrizeManager,
  onBuyTicketsClick,
}) => {
  const [prizes, setPrizes] = useState<SpecialPrizeNumber[]>(() => getSpecialPrizeNumbers());
  const [settings, setSettings] = useState<PrizeNumbersSettings>(() => getPrizeNumbersSettings());

  useEffect(() => {
    const handleUpdate = () => {
      setPrizes(getSpecialPrizeNumbers());
      setSettings(getPrizeNumbersSettings());
    };
    window.addEventListener('storage', handleUpdate);
    const interval = setInterval(handleUpdate, 3000);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      clearInterval(interval);
    };
  }, []);

  if (!settings.enabled || !settings.publicDisplay) {
    if (isAdmin) {
      return (
        <section className="w-full max-w-[860px] mx-auto my-4 px-3">
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎁</span>
              <span>
                <strong>Módulo de Números Premiados Oculto:</strong> Actualmente está desactivado o en modo privado.
              </span>
            </div>
            {onOpenAdminPrizeManager && (
              <button
                type="button"
                onClick={onOpenAdminPrizeManager}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold cursor-pointer transition shrink-0"
              >
                Activar / Configurar
              </button>
            )}
          </div>
        </section>
      );
    }
    return null;
  }

  const activeUnwon = prizes.filter((p) => p.active && !p.won);
  const wonList = prizes.filter((p) => p.won);

  if (prizes.length === 0 && !isAdmin) {
    return null;
  }

  const formatTicketDisplay = (num: string) => {
    if (settings.hideWinningDigits && num.length >= 4) {
      return num.slice(0, 3) + '**';
    }
    return num;
  };

  return (
    <section className="w-full max-w-[860px] mx-auto my-6 px-3">
      <div className="bg-gradient-to-b from-[#18181b] via-[#09090b] to-[#18181b] border-2 border-amber-500/60 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden text-white">
        
        {/* Glow corner effects */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-red-600/20 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-white/10 pb-4 mb-4">
          <div className="text-center sm:text-left">
            <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[11px] sm:text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full mb-1.5 shadow-xs">
              <span className="animate-pulse">✨</span>
              <span>Premios Anticipados en Juego</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white flex items-center justify-center sm:justify-start gap-2">
              <span>🎁</span>
              <span>{settings.publicTitle || '¡NÚMEROS PREMIADOS DE HOY!'}</span>
            </h3>
            <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-xl">
              {settings.publicSubtitle || '¡El que compre hoy puede llevarse uno de estos números con premio garantizado!'}
            </p>
          </div>

          {/* Counters / Stats */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-white/10 border border-white/15 rounded-xl px-3 py-1.5 text-center">
              <span className="block text-base sm:text-lg font-mono font-black text-amber-400">
                {activeUnwon.length}
              </span>
              <span className="text-[10px] text-gray-400 uppercase font-semibold">
                🟢 Por Salir
              </span>
            </div>
            <div className="bg-white/10 border border-white/15 rounded-xl px-3 py-1.5 text-center">
              <span className="block text-base sm:text-lg font-mono font-black text-green-400">
                {wonList.length}
              </span>
              <span className="text-[10px] text-gray-400 uppercase font-semibold">
                🏆 Ganados
              </span>
            </div>
          </div>
        </div>

        {/* Instructions banner */}
        <div className="relative z-10 bg-amber-500/10 border border-amber-400/30 rounded-xl p-3 mb-5 flex items-center gap-3 text-xs text-amber-200">
          <span className="text-xl shrink-0">⚡</span>
          <p className="flex-1">
            <strong>¿Cómo funciona?</strong> Estos números fueron seleccionados exclusivamente de los <strong>números no vendidos</strong>. Desde que se activaron hoy, al comprar cualquier paquete de boletos, el sistema <strong>puede asignarte uno de estos números premiados automáticamente</strong>.
          </p>
        </div>

        {/* Prize Numbers Grid */}
        <div className="relative z-10">
          {prizes.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-xs">
              No hay números premiados activos en este momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {prizes.map((p) => {
                const isWon = p.won;
                return (
                  <div
                    key={p.id}
                    className={`rounded-xl p-3.5 border transition-all flex flex-col justify-between ${
                      isWon
                        ? 'bg-gradient-to-br from-green-950/70 to-emerald-950/80 border-green-500/50 shadow-inner'
                        : p.active
                        ? 'bg-gradient-to-br from-white/10 to-white/5 border-amber-400/40 hover:border-amber-300 shadow-md hover:scale-[1.01]'
                        : 'bg-white/5 border-white/10 opacity-60'
                    }`}
                  >
                    <div>
                      {/* Top badges */}
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isWon
                            ? 'bg-green-500/30 text-green-300 border border-green-400/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                        }`}>
                          {isWon ? '🎉 ¡GANADO!' : p.category || 'Premio de Hoy'}
                        </span>
                        
                        {!isWon && p.active && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-400">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-ping inline-block" />
                            <span>🟢 DISPONIBLE</span>
                          </span>
                        )}
                      </div>

                      {/* Number Badge */}
                      <div className="text-center my-2">
                        <div className={`inline-block font-mono font-black text-2xl tracking-wider px-3 py-1 rounded-lg border ${
                          isWon
                            ? 'bg-green-900/60 text-green-200 border-green-400/50'
                            : 'bg-amber-400/10 text-amber-300 border-amber-400/40'
                        }`}>
                          #{formatTicketDisplay(p.ticketNumber)}
                        </div>
                      </div>

                      {/* Prize Title */}
                      <div className="text-center font-extrabold text-sm sm:text-base text-white my-1">
                        🏆 {p.prizeTitle}
                      </div>
                    </div>

                    {/* Footer info (Available / Winner) */}
                    <div className="mt-3 pt-2.5 border-t border-white/10 text-[11px]">
                      {isWon ? (
                        <div className="text-green-300 space-y-0.5">
                          <p className="font-semibold truncate">
                            👤 Ganador: <strong>{p.wonByCustomerName || 'Comprador verificado'}</strong>
                          </p>
                          {p.wonByCustomerCedula && (
                            <p className="text-[10px] text-green-400/90 font-mono">
                              🆔 C.C: •••{p.wonByCustomerCedula.slice(-4)}
                            </p>
                          )}
                          <p className="text-[10px] text-gray-400">
                            🎟️ En Orden #{p.wonInOrderNumber || 'Oficial'}
                          </p>
                        </div>
                      ) : (
                        <div className="text-gray-300 flex items-center justify-between">
                          <span className="text-[10px] text-amber-200">
                            {p.validDate || 'Válido para compras de hoy'}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            ¡Te puede salir!
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Button & Admin Tools */}
        <div className="relative z-10 mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-300 text-center sm:text-left">
            🎯 Entre más boletos compres, más probabilidades tienes de que el sistema te asigne uno de los <strong>números premiados</strong> de hoy.
          </p>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isAdmin && onOpenAdminPrizeManager && (
              <button
                type="button"
                onClick={onOpenAdminPrizeManager}
                className="px-3 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold rounded-xl border border-gray-700 transition cursor-pointer shrink-0"
                title="Abrir generador y panel de control de números premiados"
              >
                ⚙️ Gestionar Números
              </button>
            )}

            <button
              type="button"
              onClick={onBuyTicketsClick}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-xs sm:text-sm font-black rounded-xl shadow-lg transition transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>🎟️</span>
              <span>¡Comprar Boletos Ahora!</span>
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};
