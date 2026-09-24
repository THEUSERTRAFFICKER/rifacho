import React, { useState, useEffect } from 'react';
import { SpecialPrizeNumber, PrizeNumbersSettings, PurchasedOrder } from '../types';
import {
  getSpecialPrizeNumbers,
  saveSpecialPrizeNumbers,
  getPrizeNumbersSettings,
  savePrizeNumbersSettings,
  generateUnsoldPrizeNumbers,
  addManualPrizeNumber,
  checkTicketNumberAvailability,
  deletePrizeNumber,
  togglePrizeNumberActive,
  updatePrizeNumber,
  clearAllUnwonPrizeNumbers,
  resetDefaultPrizeNumbers,
} from '../utils/prizeNumbersStore';

interface AdminPrizeNumbersPanelProps {
  onOpenOrderVoucher?: (orderNumber: string) => void;
  onOpenPrizeReport?: (ticketNumber: string) => void;
  orders?: PurchasedOrder[];
}

export const AdminPrizeNumbersPanel: React.FC<AdminPrizeNumbersPanelProps> = ({
  onOpenOrderVoucher,
  onOpenPrizeReport,
}) => {
  const [prizes, setPrizes] = useState<SpecialPrizeNumber[]>(() => getSpecialPrizeNumbers());
  const [settings, setSettings] = useState<PrizeNumbersSettings>(() => getPrizeNumbersSettings());
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'won'>('all');
  const [notification, setNotification] = useState<string | null>(null);

  // Formulario: Generador en lote de números no vendidos
  const [genCount, setGenCount] = useState<number>(5);
  const [genPrizeTitle, setGenPrizeTitle] = useState<string>('$200.000 COP en Efectivo');
  const [genCategory, setGenCategory] = useState<string>('Premio de Hoy');
  const [isGenerating, setIsGenerating] = useState(false);

  // Formulario: Selección manual de número
  const [manualNumber, setManualNumber] = useState('');
  const [manualPrizeTitle, setManualPrizeTitle] = useState('$500.000 COP en Efectivo');
  const [manualCategory, setManualCategory] = useState('Premio de Hoy');
  const [manualValidation, setManualValidation] = useState<{
    status: 'idle' | 'valid' | 'sold' | 'invalid_format' | 'duplicate';
    message?: string;
  }>({ status: 'idle' });

  // Modal para editar premio de un número
  const [editingPrize, setEditingPrize] = useState<SpecialPrizeNumber | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');

  const refreshData = () => {
    setPrizes(getSpecialPrizeNumbers());
    setSettings(getPrizeNumbersSettings());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Validar en tiempo real el número manual que escribe el administrador
  useEffect(() => {
    const clean = manualNumber.trim();
    if (!clean) {
      setManualValidation({ status: 'idle' });
      return;
    }
    if (!/^\d{5}$/.test(clean)) {
      setManualValidation({
        status: 'invalid_format',
        message: 'Debe tener exactamente 5 dígitos numéricos.',
      });
      return;
    }
    // Verificar si ya está en la lista de números premiados
    if (prizes.some((p) => p.ticketNumber === clean)) {
      setManualValidation({
        status: 'duplicate',
        message: '⚠️ Este número ya está registrado en tu lista de números premiados.',
      });
      return;
    }
    // Verificar disponibilidad en órdenes reales vendidas
    const check = checkTicketNumberAvailability(clean);
    if (check.isSold && check.order) {
      setManualValidation({
        status: 'sold',
        message: `❌ ¡YA VENDIDO! Este número pertenece a ${check.order.customerName} ${check.order.customerLastName} (Cédula: ${check.order.identification || 'N/A'}) en la orden #${check.order.orderNumber}. Solo puedes elegir números NO vendidos.`,
      });
      return;
    }

    setManualValidation({
      status: 'valid',
      message: '✓ ¡Número 100% disponible! No ha sido vendido y puede activarse para futuros compradores.',
    });
  }, [manualNumber, prizes]);

  // Manejo de generación automática de números no vendidos
  const handleGenerateUnsold = () => {
    if (genCount <= 0 || genCount > 100) {
      alert('Ingresa una cantidad entre 1 y 100.');
      return;
    }
    setIsGenerating(true);
    setTimeout(() => {
      try {
        const generated = generateUnsoldPrizeNumbers(genCount, genPrizeTitle, genCategory);
        refreshData();
        notify(`✓ Se generaron y activaron ${generated.length} números premiados NO VENDIDOS exitosamente.`);
      } catch (err) {
        console.error('Error generando números:', err);
      } finally {
        setIsGenerating(false);
      }
    }, 150);
  };

  // Manejo de agregar número manual
  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualValidation.status !== 'valid') {
      alert('Por favor corrige el número antes de agregarlo.');
      return;
    }
    const res = addManualPrizeNumber(manualNumber, manualPrizeTitle, manualCategory);
    if (!res.success) {
      alert(res.error || 'Error al agregar número');
      return;
    }
    setManualNumber('');
    refreshData();
    notify(`✓ Número #${manualNumber} agregado a los números premiados.`);
  };

  // Toggle de un número individual
  const handleToggleActive = (id: string) => {
    togglePrizeNumberActive(id);
    refreshData();
  };

  // Eliminar número individual
  const handleDelete = (id: string, num: string) => {
    if (window.confirm(`¿Estás seguro de eliminar el número premiado #${num}?`)) {
      deletePrizeNumber(id);
      refreshData();
      notify(`Número #${num} eliminado.`);
    }
  };

  // Guardar edición de premio
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPrize) return;
    updatePrizeNumber(editingPrize.id, {
      prizeTitle: editTitle.trim(),
      category: editCategory.trim(),
    });
    setEditingPrize(null);
    refreshData();
    notify('✓ Premio actualizado correctamente.');
  };

  // Actualizar configuraciones generales
  const handleUpdateSettings = (updates: Partial<PrizeNumbersSettings>) => {
    const updated = { ...settings, ...updates };
    setSettings(updated);
    savePrizeNumbersSettings(updated);
    notify('✓ Configuración de números premiados guardada.');
  };

  const handleClearUnwon = () => {
    if (window.confirm('¿Deseas eliminar todos los números premiados que aún NO han sido ganados?')) {
      clearAllUnwonPrizeNumbers();
      refreshData();
      notify('Lista de números no ganados limpiada.');
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('¿Restablecer los números premiados y configuración a los valores iniciales?')) {
      resetDefaultPrizeNumbers();
      refreshData();
      notify('Valores iniciales restablecidos.');
    }
  };

  // Métricas
  const totalCount = prizes.length;
  const availableCount = prizes.filter((p) => p.active && !p.won).length;
  const wonCount = prizes.filter((p) => p.won).length;
  const inactiveCount = prizes.filter((p) => !p.active && !p.won).length;

  const filteredPrizes = prizes.filter((p) => {
    if (statusFilter === 'available') return p.active && !p.won;
    if (statusFilter === 'won') return p.won;
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {notification && (
        <div className="bg-green-600 text-white text-xs sm:text-sm py-2 px-4 rounded-lg shadow-md font-bold flex items-center justify-between animate-in fade-in">
          <span>{notification}</span>
          <button type="button" onClick={() => setNotification(null)} className="text-white ml-2 cursor-pointer font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Banner Superior Explicativo */}
      <div className="bg-gradient-to-r from-neutral-900 via-zinc-900 to-black text-white p-5 rounded-2xl border border-amber-500/40 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-2xl shrink-0">
            🎁
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Generador de Números Premiados (Futuros No Vendidos)
              </h2>
              <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                settings.enabled ? 'bg-green-500/30 text-green-300 border border-green-400/40' : 'bg-red-500/30 text-red-300 border border-red-400/40'
              }`}>
                {settings.enabled ? '🟢 SISTEMA ACTIVO' : '🔴 PAUSADO'}
              </span>
            </div>
            <p className="text-xs text-gray-300 mt-1 max-w-2xl">
              Crea o selecciona números <strong>exclusivamente de los que NO se han vendido</strong>. Al activarlos, desde que un cliente compre hoy, el sistema podrá entregarle uno de estos números y premiarlo al instante con comprobante oficial.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={() => handleUpdateSettings({ enabled: !settings.enabled })}
            className={`px-4 py-2 text-xs font-bold rounded-xl cursor-pointer transition shadow-sm ${
              settings.enabled
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {settings.enabled ? '⏸️ Pausar Todo el Sistema' : '▶️ Activar Sistema'}
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas Rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium block">Total Premiados</span>
          <span className="text-2xl font-black text-gray-900 font-mono">{totalCount}</span>
          <span className="text-[11px] text-gray-400 block mt-0.5">Números configurados</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-amber-200 shadow-2xs">
          <span className="text-xs text-amber-700 font-semibold block">🟢 Disponibles Hoy</span>
          <span className="text-2xl font-black text-amber-600 font-mono">{availableCount}</span>
          <span className="text-[11px] text-gray-400 block mt-0.5">Esperando comprador</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-green-200 shadow-2xs">
          <span className="text-xs text-green-700 font-semibold block">🏆 Ya Ganados</span>
          <span className="text-2xl font-black text-green-600 font-mono">{wonCount}</span>
          <span className="text-[11px] text-gray-400 block mt-0.5">Entregados en compras</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-2xs">
          <span className="text-xs text-gray-500 font-medium block">Pausados / Inactivos</span>
          <span className="text-2xl font-black text-gray-700 font-mono">{inactiveCount}</span>
          <span className="text-[11px] text-gray-400 block mt-0.5">No salen en compras</span>
        </div>
      </div>

      {/* Grid con las 2 Secciones Principales: 1. Generador en Lote + 2. Selector Manual */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* PANEL 1: GENERADOR AUTOMÁTICO DE NÚMEROS NO VENDIDOS */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">⚡</span>
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">
                Generador Automático de Números No Vendidos
              </h3>
              <p className="text-[11px] text-gray-500">
                El sistema filtra automáticamente las órdenes previas y selecciona números que <strong>nadie ha comprado</strong>.
              </p>
            </div>
          </div>

          <div className="space-y-3.5 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                ¿Cuántos números premiados deseas generar?
              </label>
              <div className="flex items-center gap-2">
                {[3, 5, 10, 20].map((qty) => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => setGenCount(qty)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer border ${
                      genCount === qty
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {qty} Números
                  </button>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[11px] text-gray-500">O cantidad exacta:</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={genCount}
                  onChange={(e) => setGenCount(parseInt(e.target.value, 10) || 1)}
                  className="w-20 px-2 py-1 bg-white border border-gray-300 rounded text-xs text-center font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Premio Asignado
              </label>
              <input
                type="text"
                value={genPrizeTitle}
                onChange={(e) => setGenPrizeTitle(e.target.value)}
                placeholder="ej: $200.000 COP en Efectivo"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-red-500"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {['$100.000 COP', '$200.000 COP', '$500.000 COP', 'Moto Eléctrica', 'Smart TV 55"', 'Boleta de Oro'].map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setGenPrizeTitle(sug.includes('$') ? `${sug} en Efectivo` : sug)}
                    className="text-[10px] bg-white border border-gray-200 hover:border-gray-400 text-gray-700 px-2 py-0.5 rounded cursor-pointer transition"
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Categoría / Etiqueta
              </label>
              <select
                value={genCategory}
                onChange={(e) => setGenCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold"
              >
                <option value="Premio de Hoy">Premio de Hoy (Compras actuales)</option>
                <option value="Premio Relámpago">Premio Relámpago</option>
                <option value="Premio Mayor Anticipado">Premio Mayor Anticipado</option>
                <option value="Premio Sorpresa">Premio Sorpresa</option>
                <option value="Premio Especial">Premio Especial</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleGenerateUnsold}
              disabled={isGenerating}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>⚡</span>
              <span>{isGenerating ? 'Generando Números No Vendidos...' : `Generar y Activar ${genCount} Números No Vendidos`}</span>
            </button>
          </div>
        </div>

        {/* PANEL 2: SELECCIÓN MANUAL DE NÚMEROS NO VENDIDOS */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🎯</span>
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">
                Escoger un Número Manual (Validación de No Vendido)
              </h3>
              <p className="text-[11px] text-gray-500">
                Escribe un número específico que te guste. El sistema verificará de inmediato que <strong>no esté vendido</strong>.
              </p>
            </div>
          </div>

          <form onSubmit={handleAddManual} className="space-y-3.5 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Número de 5 Dígitos (ej: 77777, 45892)
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={5}
                  value={manualNumber}
                  onChange={(e) => setManualNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="ej: 77777"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-mono font-bold tracking-widest text-center focus:outline-none focus:border-red-500"
                />
                <span className="absolute right-3 top-2 text-xs text-gray-400 font-mono">
                  {manualNumber.length}/5
                </span>
              </div>

              {/* Indicador de Validación en Vivo */}
              {manualNumber.length > 0 && (
                <div className={`mt-2 p-2 rounded-lg text-xs font-medium border ${
                  manualValidation.status === 'valid'
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : manualValidation.status === 'sold'
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}>
                  {manualValidation.message}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Premio Asignado
              </label>
              <input
                type="text"
                value={manualPrizeTitle}
                onChange={(e) => setManualPrizeTitle(e.target.value)}
                placeholder="ej: $500.000 COP en Efectivo"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Categoría
              </label>
              <input
                type="text"
                value={manualCategory}
                onChange={(e) => setManualCategory(e.target.value)}
                placeholder="ej: Premio de Hoy"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold"
              />
            </div>

            <button
              type="submit"
              disabled={manualValidation.status !== 'valid'}
              className="w-full py-3 bg-gray-900 hover:bg-black text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>➕</span>
              <span>Guardar y Activar Número #{manualNumber || '00000'}</span>
            </button>
          </form>
        </div>

      </div>

      {/* PANEL 3: CONFIGURACIÓN DE ENTREGA EN COMPRAS Y VISIBILIDAD */}
      <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight flex items-center gap-2">
              <span>⚙️</span>
              <span>Configuración de Entrega en Compras & Portada</span>
            </h3>
            <p className="text-[11px] text-gray-500">
              Controla cómo se asignan a los clientes y cómo se ven en la página web.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Switch 1: Asignación al Comprar */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-gray-900">Entrega Activa en Compras</span>
                <input
                  type="checkbox"
                  checked={settings.autoDeliveryOnPurchase}
                  onChange={(e) => handleUpdateSettings({ autoDeliveryOnPurchase: e.target.checked })}
                  className="w-4 h-4 accent-red-600 rounded cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-gray-600">
                Al estar activo, cuando los clientes compren hoy, el sistema les puede asignar automáticamente uno de estos números premiados en su lote de boletos.
              </p>
            </div>
            <div className="mt-3 text-[10px] font-bold text-amber-700">
              {settings.autoDeliveryOnPurchase ? '🟢 Entrega en compras ACTIVA' : '⏸️ Entrega pausada'}
            </div>
          </div>

          {/* Switch 2: Mostrar en Portada */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-gray-900">Mostrar en Portada Web</span>
                <input
                  type="checkbox"
                  checked={settings.publicDisplay}
                  onChange={(e) => handleUpdateSettings({ publicDisplay: e.target.checked })}
                  className="w-4 h-4 accent-red-600 rounded cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-gray-600">
                Muestra el banner interactivo en la página principal para que los clientes vean qué números premiados hay en juego hoy.
              </p>
            </div>
            <div className="mt-3 text-[10px] font-bold text-blue-700">
              {settings.publicDisplay ? '🌐 Visible al público' : '🔒 Oculto en la web'}
            </div>
          </div>

          {/* Switch 3: Ocultar dígitos finales */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-gray-900">Modo Suspenso (ej: 482**)</span>
                <input
                  type="checkbox"
                  checked={settings.hideWinningDigits}
                  onChange={(e) => handleUpdateSettings({ hideWinningDigits: e.target.checked })}
                  className="w-4 h-4 accent-red-600 rounded cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-gray-600">
                Si está activado, en la portada se ocultan los últimos 2 dígitos con asteriscos (ej: #748**), generando misterio hasta que alguien lo compre.
              </p>
            </div>
            <div className="mt-3 text-[10px] font-bold text-purple-700">
              {settings.hideWinningDigits ? '🎭 Números en suspenso' : '👁️ Números completos visibles'}
            </div>
          </div>

        </div>

        {/* Modo de Reparto */}
        <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-xl">
          <label className="block text-xs font-bold text-amber-950 mb-1">
            Modo de Distribución a Compradores:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
            <button
              type="button"
              onClick={() => handleUpdateSettings({ deliveryStrategy: 'smart_spread' })}
              className={`p-2.5 rounded-lg text-left border text-xs cursor-pointer transition ${
                settings.deliveryStrategy === 'smart_spread'
                  ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                  : 'bg-white text-gray-800 border-gray-200 hover:bg-amber-100/50'
              }`}
            >
              <div className="font-bold">🌟 Reparto Inteligente</div>
              <div className={`text-[10px] mt-0.5 ${settings.deliveryStrategy === 'smart_spread' ? 'text-amber-100' : 'text-gray-500'}`}>
                Distribuye entre las órdenes del día con alta probabilidad para premiar las compras activas.
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleUpdateSettings({ deliveryStrategy: 'guaranteed_next' })}
              className={`p-2.5 rounded-lg text-left border text-xs cursor-pointer transition ${
                settings.deliveryStrategy === 'guaranteed_next'
                  ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                  : 'bg-white text-gray-800 border-gray-200 hover:bg-amber-100/50'
              }`}
            >
              <div className="font-bold">🎯 Próxima Compra Directa</div>
              <div className={`text-[10px] mt-0.5 ${settings.deliveryStrategy === 'guaranteed_next' ? 'text-amber-100' : 'text-gray-500'}`}>
                Asigna uno a cada cliente que compre sucesivamente hasta agotar los números disponibles.
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleUpdateSettings({ deliveryStrategy: 'pure_random' })}
              className={`p-2.5 rounded-lg text-left border text-xs cursor-pointer transition ${
                settings.deliveryStrategy === 'pure_random'
                  ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                  : 'bg-white text-gray-800 border-gray-200 hover:bg-amber-100/50'
              }`}
            >
              <div className="font-bold">🎲 Azar Natural</div>
              <div className={`text-[10px] mt-0.5 ${settings.deliveryStrategy === 'pure_random' ? 'text-amber-100' : 'text-gray-500'}`}>
                Solo se entrega si la probabilidad aleatoria del sorteo lo asigna al azar.
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* PANEL 4: LISTADO DETALLADO DE NÚMEROS PREMIADOS */}
      <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight flex items-center gap-2">
              <span>📋</span>
              <span>Números Premiados Registrados ({prizes.length})</span>
            </h3>
            <p className="text-[11px] text-gray-500">
              Revisa el estado de cada número, actívalo, paúsalo o consulta los datos del ganador.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filtros */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded cursor-pointer ${
                  statusFilter === 'all' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600'
                }`}
              >
                Todos ({prizes.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('available')}
                className={`px-2.5 py-1 rounded cursor-pointer ${
                  statusFilter === 'available' ? 'bg-white text-amber-700 shadow-xs' : 'text-gray-600'
                }`}
              >
                🟢 Disponibles ({availableCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('won')}
                className={`px-2.5 py-1 rounded cursor-pointer ${
                  statusFilter === 'won' ? 'bg-white text-green-700 shadow-xs' : 'text-gray-600'
                }`}
              >
                🏆 Ganados ({wonCount})
              </button>
            </div>

            <button
              type="button"
              onClick={handleClearUnwon}
              className="px-2.5 py-1.5 text-xs text-red-600 hover:text-red-800 font-bold border border-red-200 rounded-lg hover:bg-red-50 cursor-pointer transition"
              title="Borrar todos los números que no se han ganado"
            >
              Limpiar no ganados
            </button>

            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-2.5 py-1.5 text-xs text-gray-500 hover:text-gray-700 font-semibold border border-gray-200 rounded-lg hover:bg-gray-100 cursor-pointer transition"
              title="Restablecer los 5 números iniciales"
            >
              Restablecer
            </button>
          </div>
        </div>

        {/* Tabla / Lista */}
        {filteredPrizes.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <span className="text-3xl block mb-2">🎁</span>
            <p className="text-xs text-gray-600 font-bold">No hay números premiados con el filtro seleccionado.</p>
            <p className="text-[11px] text-gray-400 mt-1">Usa el generador arriba para crear números no vendidos con un solo clic.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100 text-gray-700 font-bold uppercase tracking-wider text-[10px] border-b border-gray-200">
                <tr>
                  <th className="py-3 px-3">Boleto</th>
                  <th className="py-3 px-3">Premio Asignado</th>
                  <th className="py-3 px-3">Categoría</th>
                  <th className="py-3 px-3">Estado</th>
                  <th className="py-3 px-3">Ganador / Comprador</th>
                  <th className="py-3 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPrizes.map((p) => {
                  const isWon = p.won;
                  return (
                    <tr
                      key={p.id}
                      className={isWon ? 'bg-green-50/40 hover:bg-green-50/70' : 'hover:bg-gray-50'}
                    >
                      {/* Número */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`inline-block font-mono font-bold text-sm px-2.5 py-1 rounded border ${
                          isWon
                            ? 'bg-green-100 text-green-800 border-green-300'
                            : 'bg-amber-50 text-amber-900 border-amber-300'
                        }`}>
                          #{p.ticketNumber}
                        </span>
                      </td>

                      {/* Premio */}
                      <td className="py-3 px-3 font-semibold text-gray-900">
                        🏆 {p.prizeTitle}
                      </td>

                      {/* Categoría */}
                      <td className="py-3 px-3">
                        <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-200">
                          {p.category || 'Premio de Hoy'}
                        </span>
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {isWon ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-black text-green-700 bg-green-100 border border-green-300 px-2 py-0.5 rounded-full">
                            <span>🎉 GANADO</span>
                          </span>
                        ) : p.active ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                            <span>🟢 Disponible</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-500 bg-gray-100 border border-gray-300 px-2 py-0.5 rounded-full">
                            <span>⏸️ Pausado</span>
                          </span>
                        )}
                      </td>

                      {/* Ganador */}
                      <td className="py-3 px-3">
                        {isWon ? (
                          <div className="space-y-0.5 text-green-900">
                            <p className="font-bold">{p.wonByCustomerName}</p>
                            <p className="text-[11px] text-green-800 font-mono">
                              🆔 Cédula: <strong>{p.wonByCustomerCedula || 'No registrada'}</strong>
                            </p>
                            <p className="text-[10px] text-gray-500">
                              Orden #{p.wonInOrderNumber} • {p.wonAt}
                            </p>
                            <div className="mt-1">
                              <span className="text-[10px] font-bold text-amber-950 bg-amber-200/90 border border-amber-300 px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-2xs">
                                ⚡ Reportado en Segundo Plano
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">
                            Esperando comprador...
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-3 text-right whitespace-nowrap space-x-1.5">
                        {!isWon && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleToggleActive(p.id)}
                              className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer transition ${
                                p.active
                                  ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                  : 'bg-green-100 text-green-800 hover:bg-green-200'
                              }`}
                              title={p.active ? 'Pausar este número' : 'Activar este número'}
                            >
                              {p.active ? 'Pausar' : 'Activar'}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setEditingPrize(p);
                                setEditTitle(p.prizeTitle);
                                setEditCategory(p.category || 'Premio de Hoy');
                              }}
                              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-[11px] font-semibold cursor-pointer"
                              title="Editar nombre del premio"
                            >
                              Editar
                            </button>
                          </>
                        )}

                        {isWon && onOpenPrizeReport && (
                          <button
                            type="button"
                            onClick={() => onOpenPrizeReport(p.ticketNumber)}
                            className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded text-[11px] font-black cursor-pointer transition shadow-2xs"
                            title="Ver acta de reporte generada en segundo plano"
                          >
                            🚨 Ver Reporte
                          </button>
                        )}

                        {isWon && p.wonInOrderNumber && onOpenOrderVoucher && (
                          <button
                            type="button"
                            onClick={() => onOpenOrderVoucher(p.wonInOrderNumber!)}
                            className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-[11px] font-bold cursor-pointer transition shadow-2xs"
                            title="Ver tiquete oficial del ganador"
                          >
                            🎟️ Ver Boleta
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDelete(p.id, p.ticketNumber)}
                          className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-[11px] font-bold cursor-pointer transition"
                          title="Eliminar número"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para Editar Premio */}
      {editingPrize && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-gray-200 shadow-2xl animate-in fade-in zoom-in duration-150">
            <h3 className="text-base font-bold text-gray-900 mb-1">
              Editar Premio para el Número #{editingPrize.ticketNumber}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Modifica la descripción del premio o la categoría de este boleto.
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nombre del Premio
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Categoría
                </label>
                <input
                  type="text"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPrize(null)}
                  className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg cursor-pointer shadow-sm"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
