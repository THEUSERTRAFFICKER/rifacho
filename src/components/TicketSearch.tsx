import React, { useState } from 'react';
import { PurchasedOrder } from '../types';
import { searchOrdersByQuery, formatCOP } from '../utils/orderStore';
import { sendOrderConfirmationEmail } from '../services/emailService';
import { TicketVoucherModal } from './TicketVoucherModal';

interface TicketSearchProps {
  onBuyClick?: () => void;
}

export const TicketSearch: React.FC<TicketSearchProps> = ({ onBuyClick }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<PurchasedOrder[]>([]);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [emailSentNotice, setEmailSentNotice] = useState<string | null>(null);
  const [voucherOrder, setVoucherOrder] = useState<PurchasedOrder | null>(null);
  const [isVoucherOpen, setIsVoucherOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setHasSearched(false);

    // Simulate short verification delay
    setTimeout(() => {
      const found = searchOrdersByQuery(query);
      setResults(found);
      setIsSearching(false);
      setHasSearched(true);
    }, 500);
  };

  const handleCopyNumbers = (numbers: string[]) => {
    navigator.clipboard.writeText(numbers.join(', '));
    setCopySuccess('¡Números copiados al portapapeles!');
    setTimeout(() => setCopySuccess(null), 2500);
  };

  const handleResendToEmail = async (order: PurchasedOrder) => {
    setResendingId(order.id);
    setEmailSentNotice(null);
    try {
      await sendOrderConfirmationEmail(order);
      setEmailSentNotice(`¡Números reenviados con éxito al correo ${order.email}!`);
      setTimeout(() => setEmailSentNotice(null), 4000);
    } catch {
      setEmailSentNotice('Error al reenviar. Por favor intenta de nuevo.');
    } finally {
      setResendingId(null);
    }
  };

  return (
    <div className="w-full max-w-[760px] mx-auto my-10 px-4">
      <div className="text-center mb-6">
        <h2 className="text-[28px] sm:text-[35px] font-bold text-black tracking-tight">
          Buscar Números y Boleta
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Consulta los números comprados con tu número de cédula o correo electrónico y descarga tu tiquete oficial
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 md:p-8">
        <form id="form_raffle_search" onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
            <label
              htmlFor="raffle_search_query"
              className="font-medium text-gray-700 text-sm sm:text-base whitespace-nowrap"
            >
              Cédula o Correo <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="raffle_search_query"
              id="raffle_search_query"
              required
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ingresa tu cédula (ej: 1032485912) o correo"
              className="flex-1 w-full sm:max-w-[440px] px-3.5 py-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none text-base transition"
            />
          </div>

          <div className="flex justify-center sm:justify-end pt-2">
            <button
              type="submit"
              disabled={isSearching}
              className="btn_raffle_search_tickets inline-flex items-center justify-center px-6 py-2.5 rounded font-bold text-base text-gray-800 bg-[#f4ebd0] border border-[#af9f6e] hover:bg-[#ffc107] hover:border-[#ffc107] transition-colors cursor-pointer shadow-sm disabled:opacity-50"
            >
              <span>Buscar Boletos</span>
              {isSearching && <span className="spinner_loader ml-2"></span>}
            </button>
          </div>
        </form>

        {/* Demo Helper Prompt */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between text-xs text-gray-500 gap-2">
          <span>
            Búsqueda de prueba:
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setQuery('1032485912');
                const found = searchOrdersByQuery('1032485912');
                setResults(found);
                setHasSearched(true);
              }}
              className="text-red-600 hover:text-red-700 font-medium underline cursor-pointer"
            >
              Probar Cédula (1032485912)
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => {
                setQuery('betocovaledar@gmail.com');
                const found = searchOrdersByQuery('betocovaledar@gmail.com');
                setResults(found);
                setHasSearched(true);
              }}
              className="text-red-600 hover:text-red-700 font-medium underline cursor-pointer"
            >
              Probar Correo
            </button>
          </div>
        </div>

        {/* Search Results Display */}
        {hasSearched && (
          <div className="tickets_show_content mt-6 pt-6 border-t border-gray-200">
            {results.length > 0 ? (
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-md p-4 text-green-800 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎟️</span>
                    <div>
                      <p className="font-semibold text-sm">
                        Se encontraron {results.reduce((acc, r) => acc + r.ticketNumbers.length, 0)} boletos registrados para:
                      </p>
                      <p className="text-xs text-green-700 font-mono font-bold">{query}</p>
                    </div>
                  </div>
                  <span className="text-xs bg-green-200 text-green-800 font-semibold px-2.5 py-1 rounded-full uppercase">
                    Verificado Oficial
                  </span>
                </div>

                {results.map((order) => (
                  <div
                    key={order.id}
                    className="border border-gray-200 rounded-lg p-5 bg-gray-50/50 shadow-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 pb-3 mb-4 gap-2">
                      <div>
                        <h4 className="font-bold text-gray-900 text-base">
                          {order.productName}
                        </h4>
                        <p className="text-xs text-gray-500">
                          Orden #{order.orderNumber} • {order.createdAt}
                        </p>
                        <p className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block mt-1">
                          🆔 Cédula: {order.identification || 'No registrada'}
                        </p>
                        {order.wonPrizes && order.wonPrizes.length > 0 && (
                          <div className="mt-2 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-amber-950 p-2 rounded-lg border border-yellow-500 font-bold text-xs flex items-center gap-2 shadow-2xs">
                            <span className="text-lg">🏆</span>
                            <div>
                              <span className="block font-black uppercase text-[10px]">¡Boleto Premiado Detectado!</span>
                              <span>{order.wonPrizes.map((p) => `${p.prizeTitle} (#${p.ticketNumber})`).join(' • ')}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="text-left sm:text-right">
                        <div className="flex items-center gap-1.5 justify-end">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                            {order.quantity} Números
                          </span>
                          {order.status === 'Anulado' ? (
                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-100 text-red-700 border border-red-300">
                              ANULADO
                            </span>
                          ) : (
                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-green-100 text-green-700">
                              ACTIVO
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-gray-700 mt-1">
                          {formatCOP(order.totalCOP)}
                        </p>
                      </div>
                    </div>

                    {order.status === 'Anulado' && (
                      <div className="mb-3 p-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
                        ⚠️ <strong>Boleto Anulado:</strong> Esta orden fue anulada el {order.cancelledAt || 'recientemente'}. Motivo: {order.cancelledReason || 'Cancelado por administración'}. Estos números no participan en el sorteo.
                      </div>
                    )}

                    {/* Botón Descargar Boleta */}
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 bg-white p-2.5 rounded-lg border border-gray-200">
                      <button
                        type="button"
                        onClick={() => {
                          setVoucherOrder(order);
                          setIsVoucherOpen(true);
                        }}
                        className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                      >
                        <span>🎟️</span>
                        <span>Descargar Tiquete (PDF / JPG / PNG)</span>
                      </button>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleResendToEmail(order)}
                          disabled={resendingId === order.id}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer flex items-center gap-1"
                        >
                          <span>📧</span>
                          <span>{resendingId === order.id ? 'Enviando...' : 'Reenviar a mi correo'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyNumbers(order.ticketNumbers)}
                          className="text-xs text-red-600 hover:text-red-700 font-medium cursor-pointer"
                        >
                          Copiar todos
                        </button>
                      </div>
                    </div>

                    {emailSentNotice && (
                      <div className="text-xs text-blue-800 bg-blue-50 border border-blue-200 p-2 rounded mb-3 text-center animate-in fade-in">
                        ✓ {emailSentNotice}
                      </div>
                    )}

                    {copySuccess && (
                      <div className="text-xs text-green-700 bg-green-50 p-1.5 rounded mb-3 text-center">
                        {copySuccess}
                      </div>
                    )}

                    {/* Lucky Numbers Badges Grid */}
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-60 overflow-y-auto p-1 bg-white rounded border border-gray-100">
                      {order.ticketNumbers.map((num, i) => {
                        const wonPrize = order.wonPrizes?.find((p) => p.ticketNumber === num);
                        return (
                          <div
                            key={i}
                            className={`${
                              wonPrize
                                ? 'bg-amber-100 text-amber-950 font-black border-2 border-amber-500 shadow-md ring-1 ring-yellow-400'
                                : order.status === 'Anulado'
                                ? 'bg-red-50 text-red-400 line-through border border-red-200 opacity-60'
                                : 'bg-gray-100 hover:bg-red-50 text-gray-800 hover:text-red-700 border border-gray-200 hover:border-red-200'
                            } rounded py-1 px-1.5 text-center font-mono font-bold text-sm tracking-wider transition-colors shadow-2xs`}
                            title={wonPrize ? `🏆 ¡Número Premiado: ${wonPrize.prizeTitle}!` : undefined}
                          >
                            {wonPrize && <span className="block text-[8px] text-amber-800">🏆 PREMIADO</span>}
                            {num}
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500 flex flex-wrap justify-between items-center gap-2">
                      <div>
                        <span className="font-semibold text-gray-700">Titular:</span> {order.customerName} {order.customerLastName}
                        {order.identification && <span className="ml-2 font-mono font-bold text-amber-800">🆔 C.C: {order.identification}</span>}
                        {order.phone && <span className="ml-2 font-mono text-gray-500">📞 +57 {order.phone}</span>}
                        {order.address && <span className="ml-2 text-gray-500">📍 {order.address}</span>}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">Método:</span> {order.paymentMethod}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                  !
                </div>
                <h4 className="text-base font-medium text-gray-900 mb-1">
                  No se encontraron números
                </h4>
                <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">
                  No encontramos boletos registrados bajo el criterio <strong className="text-gray-800">{query}</strong>. Por favor verifica que el número de cédula o correo esté bien escrito o adquiere tus números ahora.
                </p>
                {onBuyClick && (
                  <button
                    type="button"
                    onClick={onBuyClick}
                    className="inline-flex items-center px-4 py-2 bg-[#CC0000] text-white rounded text-sm font-semibold hover:bg-red-700 transition cursor-pointer"
                  >
                    Adquirir números ahora
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal para Visualizar y Descargar Boleta */}
      <TicketVoucherModal
        order={voucherOrder}
        isOpen={isVoucherOpen}
        onClose={() => {
          setIsVoucherOpen(false);
          setVoucherOrder(null);
        }}
      />
    </div>
  );
};

