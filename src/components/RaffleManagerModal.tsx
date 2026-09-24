import React, { useState } from 'react';
import { siteConfig } from '../config/siteConfig';
import {
  startNewRaffle,
  finishCurrentRaffle,
  reopenCurrentRaffle,
  getRaffleHistory,
  getRaffleTicketStats,
  formatCOP,
} from '../utils/orderStore';
import { WinnerInfo, RaffleEdition } from '../types';

interface RaffleManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRaffleUpdated: () => void;
  initialMode?: 'new_raffle' | 'finish_raffle' | 'history';
}

const PRESET_RAFFLES = [
  {
    name: 'Rifacho',
    subtitle: 'COMBO TOYOTA HILUX 4X4 2026',
    award: '20 NÚMEROS PREMIADOS + BONOS',
    product: 'Acc Combo Toyota Hilux',
    price: 1000,
    minQty: 20,
    totalTickets: 100000,
    flyer: '/images/flyer.jpeg',
  },
  {
    name: 'Rifacho',
    subtitle: 'COMBO TESLA MODEL 3 2026',
    award: '20 NÚMEROS PREMIADOS',
    product: 'Acc Combo Tesla',
    price: 1000,
    minQty: 20,
    totalTickets: 100000,
    flyer: '/images/flyer.jpeg',
  },
  {
    name: 'Rifacho',
    subtitle: 'MOTO YAMAHA MT-09 + $10 MILLONES',
    award: '15 NÚMEROS PREMIADOS',
    product: 'Acc Combo Yamaha MT-09',
    price: 1000,
    minQty: 20,
    totalTickets: 50000,
    flyer: '/images/flyer.jpeg',
  },
  {
    name: 'Rifacho',
    subtitle: '$100.000.000 COP EN EFECTIVO',
    award: 'PREMIO MAYOR EN EFECTIVO',
    product: 'Acc 100 Millones Efectivo',
    price: 2000,
    minQty: 10,
    totalTickets: 60000,
    flyer: '/images/flyer.jpeg',
  },
];

export const RaffleManagerModal: React.FC<RaffleManagerModalProps> = ({
  isOpen,
  onClose,
  onRaffleUpdated,
  initialMode = 'new_raffle',
}) => {
  const [activeTab, setActiveTab] = useState<'new_raffle' | 'finish_raffle' | 'history'>(initialMode);
  const isFinished = siteConfig.raffleStatus === 'finalizado';
  const currentStats = getRaffleTicketStats();
  const historyList = getRaffleHistory();

  // New Raffle Form State
  const [raffleName, setRaffleName] = useState(siteConfig.raffleName || 'Rifacho');
  const [subtitle, setSubtitle] = useState('COMBO TOYOTA HILUX 4X4 2026');
  const [awardHighlight, setAwardHighlight] = useState('20 NÚMEROS PREMIADOS');
  const [productTitle, setProductTitle] = useState('Acc Combo Toyota Hilux');
  const [pricePerTicket, setPricePerTicket] = useState<number>(siteConfig.pricePerTicketCOP || 1000);
  const [minQty, setMinQty] = useState<number>(siteConfig.minTicketQuantity || 20);
  const [totalTickets, setTotalTickets] = useState<number>(siteConfig.totalAvailableTickets || 100000);
  const [initialProgress, setInitialProgress] = useState<number>(0);
  const [flyerImage, setFlyerImage] = useState<string>(siteConfig.images.flyer || '/images/flyer.jpeg');
  const [archivePreviousOrders, setArchivePreviousOrders] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Finish Raffle Form State
  const [winnerTicket, setWinnerTicket] = useState('');
  const [winnerName, setWinnerName] = useState('');
  const [winnerPrize, setWinnerPrize] = useState(siteConfig.raffleSubtitle || 'Gran Premio');
  const [drawLottery, setDrawLottery] = useState('Lotería de Medellín');
  const [drawDate, setDrawDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [winnerNotes, setWinnerNotes] = useState('Sorteo oficial verificado en transmisión en vivo.');

  if (!isOpen) return null;

  const handleApplyPreset = (p: typeof PRESET_RAFFLES[0]) => {
    setRaffleName(p.name);
    setSubtitle(p.subtitle);
    setAwardHighlight(p.award);
    setProductTitle(p.product);
    setPricePerTicket(p.price);
    setMinQty(p.minQty);
    setTotalTickets(p.totalTickets);
  };

  const handleFlyerFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setFlyerImage(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleStartNewRaffleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subtitle.trim() || !productTitle.trim()) {
      alert('Por favor especifica el nombre y subtítulo del nuevo sorteo.');
      return;
    }

    if (pricePerTicket < 100) {
      alert('El precio por boleto debe ser mayor a $100 COP.');
      return;
    }

    setIsSubmitting(true);
    const result = startNewRaffle({
      raffleName: raffleName.trim() || 'Rifacho',
      raffleSubtitle: subtitle.trim(),
      productTitle: productTitle.trim(),
      awardHighlightText: awardHighlight.trim() || '20 NÚMEROS PREMIADOS',
      pricePerTicketCOP: Number(pricePerTicket),
      minTicketQuantity: Number(minQty) || 20,
      totalAvailableTickets: Number(totalTickets) || 100000,
      progressPercentage: Number(initialProgress) || 0,
      flyerImage: flyerImage || undefined,
      archivePreviousOrders,
    });

    setIsSubmitting(false);

    if (result.success) {
      setSuccessMessage(`¡El nuevo sorteo (Edición #${result.newEditionNumber}) ha comenzado con éxito!`);
      onRaffleUpdated();
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1500);
    } else {
      alert('Ocurrió un error al comenzar el nuevo sorteo. Inténtalo nuevamente.');
    }
  };

  const handleFinishRaffleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!winnerTicket.trim()) {
      alert('Por favor ingresa el número del boleto ganador.');
      return;
    }

    const winnerData: WinnerInfo = {
      ticketNumber: winnerTicket.trim(),
      winnerName: winnerName.trim() || 'Ganador Confirmado',
      prizeAwarded: winnerPrize.trim() || siteConfig.raffleSubtitle,
      drawDate: drawDate,
      lotteryOrSource: drawLottery.trim(),
      notes: winnerNotes.trim(),
    };

    const res = finishCurrentRaffle(winnerData);
    if (res.success) {
      setSuccessMessage('¡Sorteo finalizado con éxito! El ganador ha sido registrado en la plataforma.');
      onRaffleUpdated();
      setTimeout(() => {
        setSuccessMessage(null);
        setActiveTab('new_raffle');
      }, 1500);
    } else {
      alert(res.error || 'Error al finalizar el sorteo.');
    }
  };

  const handleReopenRaffle = () => {
    if (confirm('¿Deseas reactivar el sorteo actual y reabrir la venta de boletos?')) {
      reopenCurrentRaffle();
      onRaffleUpdated();
      setSuccessMessage('Sorteo reactivado.');
      setTimeout(() => setSuccessMessage(null), 1500);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 my-6 max-h-[90vh] flex flex-col">
        
        {/* Header con gradiente distintivo */}
        <div className="bg-linear-to-r from-gray-900 via-gray-800 to-black text-white px-5 py-4 flex items-center justify-between border-b-2 border-red-600 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-xl">
              🎲
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight text-white">
                  Gestión del Sorteo en Rifacho
                </h3>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isFinished
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {isFinished ? '🏁 Sorteo Finalizado' : '🟢 Sorteo Activo'}
                </span>
                <span className="text-[11px] bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full font-mono">
                  Edición #{siteConfig.editionNumber || 1}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Inicia un nuevo sorteo, finaliza el actual con ganador o revisa ediciones anteriores.
              </p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer"
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        {/* Notificación flotante de éxito */}
        {successMessage && (
          <div className="bg-emerald-600 text-white text-xs sm:text-sm font-bold py-2.5 px-4 text-center shrink-0 animate-in fade-in">
            ✓ {successMessage}
          </div>
        )}

        {/* Pestañas de navegación */}
        <div className="bg-gray-100 p-2 flex gap-1.5 border-b border-gray-200 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('new_raffle')}
            className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'new_raffle'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-white text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>🚀</span>
            <span>Comenzar Nuevo Sorteo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('finish_raffle')}
            className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'finish_raffle'
                ? 'bg-gray-900 text-white shadow-sm'
                : 'bg-white text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>🏁</span>
            <span>Finalizar Sorteo Actual</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`py-2 px-4 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'history'
                ? 'bg-gray-900 text-white shadow-sm'
                : 'bg-white text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>📚</span>
            <span>Historial ({historyList.length})</span>
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">

          {/* TAB 1: COMENZAR NUEVO SORTEO */}
          {activeTab === 'new_raffle' && (
            <form onSubmit={handleStartNewRaffleSubmit} className="space-y-5">
              
              {/* Alerta informativa si el actual está activo */}
              {!isFinished && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-start gap-3 text-xs text-blue-900">
                  <span className="text-xl shrink-0">💡</span>
                  <div>
                    <strong className="block font-bold">Tienes un sorteo activo en este momento ({siteConfig.raffleSubtitle}).</strong>
                    <span>
                      Al presionar <em>"Comenzar Nuevo Sorteo"</em>, el sorteo actual quedará guardado y archivado automáticamente en el historial de Rifacho, y la plataforma comenzará de inmediato con el nuevo premio y contador en limpio.
                    </span>
                  </div>
                </div>
              )}

              {/* Botones de Presets Rápidos */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                  ⚡ Plantillas Rápidas con 1 Clic (Opcional):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PRESET_RAFFLES.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="p-2.5 text-left rounded-lg border border-gray-200 bg-gray-50 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition cursor-pointer text-xs"
                    >
                      <div className="font-extrabold line-clamp-1">{preset.subtitle}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5 font-mono">
                        ${preset.price.toLocaleString('es-CO')} COP / boleto
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Datos del Sorteo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Nombre de la Plataforma / Sorteo
                  </label>
                  <input
                    type="text"
                    value={raffleName}
                    onChange={(e) => setRaffleName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                    placeholder="Rifacho"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Subtítulo / Premio Principal del Sorteo
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none font-bold"
                    placeholder="COMBO TOYOTA HILUX 4X4 2026"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Texto Destacado de Premios
                  </label>
                  <input
                    type="text"
                    value={awardHighlight}
                    onChange={(e) => setAwardHighlight(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                    placeholder="20 NÚMEROS PREMIADOS + BONOS"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Título del Producto en Recibos
                  </label>
                  <input
                    type="text"
                    value={productTitle}
                    onChange={(e) => setProductTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                    placeholder="Acc Combo Toyota Hilux"
                    required
                  />
                </div>
              </div>

              {/* Parámetros de Precios y Boletos */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
                <div className="font-bold text-xs uppercase tracking-wide text-gray-800 flex items-center gap-1.5">
                  <span>🎟️</span>
                  <span>Parámetros de Boletos y Precios del Nuevo Sorteo</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                      Precio por Boleto (COP)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-gray-400 text-xs font-bold">$</span>
                      <input
                        type="number"
                        min="100"
                        step="100"
                        value={pricePerTicket}
                        onChange={(e) => setPricePerTicket(Number(e.target.value))}
                        className="w-full pl-6 pr-2 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md font-mono font-bold"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                      Mínimo de Compra
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={minQty}
                      onChange={(e) => setMinQty(Number(e.target.value))}
                      className="w-full px-2 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                      Total Números Emitidos
                    </label>
                    <input
                      type="number"
                      min="100"
                      value={totalTickets}
                      onChange={(e) => setTotalTickets(Number(e.target.value))}
                      className="w-full px-2 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                      % Barra Progreso Inicial
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={initialProgress}
                        onChange={(e) => setInitialProgress(Number(e.target.value))}
                        className="w-full pl-2 pr-6 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md font-mono"
                      />
                      <span className="absolute right-2 top-2 text-gray-400 text-xs">%</span>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-gray-500">
                  ⚡ Los paquetes de compra rápida de la página principal (20, 27, 36, 50, 100...) se calcularán automáticamente con el nuevo precio configurado.
                </div>
              </div>

              {/* Flyer / Foto del Premio */}
              <div className="border border-gray-200 rounded-xl p-4 bg-white">
                <label className="block text-xs font-bold text-gray-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <span>📷</span>
                  <span>Imagen del Premio / Flyer Principal:</span>
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {flyerImage && (
                    <img
                      src={flyerImage}
                      alt="Vista previa flyer"
                      className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-lg border border-gray-200 shadow-xs shrink-0"
                    />
                  )}

                  <div className="flex-1 w-full space-y-2">
                    <label className="block text-xs text-gray-600 font-semibold">
                      Subir foto del nuevo sorteo desde tu equipo:
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFlyerFileUpload}
                      className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 cursor-pointer"
                    />
                    <div className="text-[11px] text-gray-400">
                      O pega una URL de imagen directamente:
                    </div>
                    <input
                      type="text"
                      value={flyerImage}
                      onChange={(e) => setFlyerImage(e.target.value)}
                      className="w-full px-2.5 py-1 text-xs border border-gray-200 rounded-md font-mono"
                      placeholder="https://... o /images/flyer.jpeg"
                    />
                  </div>
                </div>
              </div>

              {/* Casilla de archivo y reinicio limpio */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={archivePreviousOrders}
                    onChange={(e) => setArchivePreviousOrders(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <div className="text-xs text-amber-950">
                    <span className="font-bold block">
                      Archivar ventas del sorteo anterior y reiniciar contador a 0 boletos vendidos (Recomendado)
                    </span>
                    <span className="text-amber-800">
                      Guarda el historial de clientes y boletos del sorteo anterior de forma segura, y deja el nuevo sorteo listo para recibir nuevos compradores con el 100% de los boletos disponibles.
                    </span>
                  </div>
                </label>
              </div>

              {/* Botón de acción final para comenzar */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-gray-600 hover:text-gray-900 transition cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-extrabold text-sm rounded-xl shadow-lg hover:shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer transition transform active:scale-98"
                >
                  <span>🚀</span>
                  <span>Comenzar Nuevo Sorteo Ahora</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: FINALIZAR SORTEO ACTUAL */}
          {activeTab === 'finish_raffle' && (
            <div className="space-y-6">
              {isFinished ? (
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 text-center space-y-3">
                  <div className="text-3xl">🏆</div>
                  <h4 className="text-base font-extrabold text-amber-950">
                    Este sorteo ya se encuentra finalizado
                  </h4>
                  {siteConfig.currentWinner ? (
                    <div className="max-w-md mx-auto bg-white p-4 rounded-xl border border-amber-200 shadow-xs text-left text-xs space-y-1.5">
                      <div>
                        <span className="text-gray-500 font-bold uppercase">Boleto Ganador:</span>{' '}
                        <span className="text-base font-black text-red-600 font-mono">
                          #{siteConfig.currentWinner.ticketNumber}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 font-bold uppercase">Ganador:</span>{' '}
                        <span className="font-bold text-gray-900">{siteConfig.currentWinner.winnerName}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 font-bold uppercase">Premio:</span>{' '}
                        <span className="font-semibold">{siteConfig.currentWinner.prizeAwarded}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 font-bold uppercase">Lotería / Referencia:</span>{' '}
                        <span>{siteConfig.currentWinner.lotteryOrSource || 'Sorteo oficial'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 font-bold uppercase">Fecha de Cierre:</span>{' '}
                        <span className="font-mono">{siteConfig.currentWinner.drawDate}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-amber-800">
                      El sorteo fue marcado como concluido.
                    </p>
                  )}

                  <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleReopenRaffle}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold rounded-lg cursor-pointer transition"
                    >
                      ↺ Reabrir Sorteo (Deshacer)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('new_raffle')}
                      className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold rounded-lg shadow-sm cursor-pointer transition flex items-center gap-1.5"
                    >
                      <span>🚀</span>
                      <span>Comenzar Nuevo Sorteo</span>
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleFinishRaffleSubmit} className="space-y-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800 mb-1 flex items-center gap-1.5">
                      <span>📊</span>
                      <span>Resumen del Sorteo que estás por Finalizar</span>
                    </h4>
                    <p className="text-xs text-gray-600">
                      <strong>{siteConfig.raffleSubtitle}</strong> (Edición #{siteConfig.editionNumber || 1})
                    </p>
                    <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs">
                      <div className="bg-white p-2 rounded-lg border border-gray-200">
                        <span className="text-gray-500 block text-[10px] uppercase font-bold">Boletos Vendidos</span>
                        <span className="font-mono font-bold text-gray-900 text-sm">
                          {currentStats.soldTickets.toLocaleString('es-CO')}
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-gray-200">
                        <span className="text-gray-500 block text-[10px] uppercase font-bold">Órdenes Totales</span>
                        <span className="font-mono font-bold text-gray-900 text-sm">
                          {currentStats.activeOrdersCount}
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-gray-200">
                        <span className="text-gray-500 block text-[10px] uppercase font-bold">% Vendido</span>
                        <span className="font-mono font-bold text-red-600 text-sm">
                          {currentStats.percentage}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Número de Boleto Ganador *
                        </label>
                        <input
                          type="text"
                          value={winnerTicket}
                          onChange={(e) => setWinnerTicket(e.target.value)}
                          placeholder="Ej: 45829"
                          className="w-full px-3 py-2 text-base font-mono font-black text-red-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Nombre del Ganador Oficial
                        </label>
                        <input
                          type="text"
                          value={winnerName}
                          onChange={(e) => setWinnerName(e.target.value)}
                          placeholder="Ej: Carlos Alberto Rodríguez"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Premio Entregado
                        </label>
                        <input
                          type="text"
                          value={winnerPrize}
                          onChange={(e) => setWinnerPrize(e.target.value)}
                          placeholder={siteConfig.raffleSubtitle}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Lotería o Medio de Sorteo
                        </label>
                        <input
                          type="text"
                          value={drawLottery}
                          onChange={(e) => setDrawLottery(e.target.value)}
                          placeholder="Lotería de Medellín / Transmisión en Vivo"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Fecha del Sorteo
                        </label>
                        <input
                          type="date"
                          value={drawDate}
                          onChange={(e) => setDrawDate(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Notas o Comprobante
                        </label>
                        <input
                          type="text"
                          value={winnerNotes}
                          onChange={(e) => setWinnerNotes(e.target.value)}
                          placeholder="Verificado con premio entregado"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 flex flex-col sm:flex-row items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-6 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-extrabold rounded-xl shadow cursor-pointer transition flex items-center justify-center gap-1.5"
                    >
                      <span>🏆</span>
                      <span>Declarar Ganador y Finalizar Sorteo</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: HISTORIAL DE SORTEOS ANTERIORES */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Ediciones Anteriores Archivadas en Rifacho
                </h4>
                <button
                  type="button"
                  onClick={() => setActiveTab('new_raffle')}
                  className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>➕</span>
                  <span>Comenzar Nuevo Sorteo</span>
                </button>
              </div>

              {historyList.length === 0 ? (
                <div className="p-8 text-center bg-gray-50 rounded-xl border border-gray-200">
                  <div className="text-3xl mb-2">📦</div>
                  <p className="text-xs text-gray-500">
                    Aún no hay sorteos archivados en el historial. Al finalizar la edición actual o presionar <strong>"Comenzar Nuevo Sorteo"</strong>, aparecerán aquí con todos sus datos y recaudos.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {historyList.map((edition) => (
                    <div
                      key={edition.id}
                      className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs hover:border-gray-300 transition space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-gray-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold bg-gray-900 text-white px-2 py-0.5 rounded-md">
                            Edición #{edition.editionNumber}
                          </span>
                          <span className="font-extrabold text-sm text-gray-900">
                            {edition.subtitle}
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-400 font-mono">
                          Finalizado el {edition.endDate || 'Reciente'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                        <div>
                          <span className="text-gray-400 block text-[10px] uppercase font-bold">Total Recaudado</span>
                          <span className="font-bold text-gray-800 font-mono">
                            {formatCOP(edition.totalSalesCOP || 0)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[10px] uppercase font-bold">Boletos Vendidos</span>
                          <span className="font-bold text-gray-800 font-mono">
                            {(edition.totalTicketsSold || 0).toLocaleString('es-CO')}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[10px] uppercase font-bold">Órdenes</span>
                          <span className="font-bold text-gray-800 font-mono">
                            {edition.totalOrdersCount || 0}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[10px] uppercase font-bold">Ganador</span>
                          <span className="font-bold text-red-600 font-mono">
                            {edition.winner?.ticketNumber ? `#${edition.winner.ticketNumber}` : 'No registrado'}
                          </span>
                        </div>
                      </div>

                      {edition.winner && (
                        <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-2 text-xs flex items-center justify-between text-amber-900">
                          <div>
                            <strong>🏆 Ganador:</strong> {edition.winner.winnerName} ({edition.winner.lotteryOrSource || 'Sorteo oficial'})
                          </div>
                          <span className="font-mono text-[11px] font-bold text-amber-700">
                            Boleto #{edition.winner.ticketNumber}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer info */}
        <div className="bg-gray-50 border-t border-gray-200 px-5 py-3 flex items-center justify-between text-xs text-gray-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <span>🛡️</span>
            <span>Rifacho - Sistema Oficial de Sorteos Automatizados</span>
          </div>
          <span className="font-mono text-[11px]">
            {currentStats.availableTickets.toLocaleString('es-CO')} boletos disponibles en edición activa
          </span>
        </div>

      </div>
    </div>
  );
};
