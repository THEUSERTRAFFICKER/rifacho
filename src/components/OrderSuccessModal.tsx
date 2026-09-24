import React, { useState } from 'react';
import { PurchasedOrder } from '../types';
import { formatCOP } from '../utils/orderStore';
import { sendOrderConfirmationEmail } from '../services/emailService';
import { TicketVoucherModal } from './TicketVoucherModal';

interface OrderSuccessModalProps {
  order: PurchasedOrder;
  onClose: () => void;
  onViewInSearch: (email: string) => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  order,
  onClose,
  onViewInSearch,
}) => {
  const [copied, setCopied] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [showVoucher, setShowVoucher] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(order.ticketNumbers.join(', '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleResendEmail = async () => {
    setIsResending(true);
    setEmailStatus(null);
    try {
      const res = await sendOrderConfirmationEmail(order);
      setEmailStatus(`¡Enviado a ${order.email}! Revisa tu bandeja de entrada o spam.`);
    } catch {
      setEmailStatus('No se pudo reenviar. Por favor verifica tu conexión.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 sm:p-8 border border-gray-200 animate-in fade-in zoom-in duration-200">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl">
            ✓
          </div>
          <span className="text-xs uppercase tracking-widest text-green-700 font-bold bg-green-50 px-2.5 py-1 rounded-full">
            ¡Pago Aprobado con Éxito!
          </span>
          <h2 className="text-2xl font-bold text-gray-900 mt-2">
            ¡Felicidades, {order.customerName}!
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Tu pedido <strong className="text-gray-900">#{order.orderNumber}</strong> ha sido confirmado. Ya tienes tus números para participar por el <strong>Combo Tesla</strong>.
          </p>
        </div>

        {/* ALERTA ESPECIAL DE BOLETO PREMIADO GANADO AL INSTANTE */}
        {order.wonPrizes && order.wonPrizes.length > 0 && (
          <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-white rounded-xl p-4 sm:p-5 mb-5 shadow-lg border-2 border-yellow-300 animate-bounce-subtle text-center relative overflow-hidden">
            <div className="text-3xl sm:text-4xl mb-1">🎉 🏆 🥳</div>
            <span className="bg-black/30 text-yellow-200 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full inline-block mb-1">
              ¡Premio Anticipado de Hoy!
            </span>
            <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">
              ¡¡TE SALIÓ UN NÚMERO PREMIADO!!
            </h3>
            <p className="text-xs text-yellow-100 mt-1 max-w-sm mx-auto">
              El sistema ha incluido un <strong>número premiado oficial</strong> en tu orden:
            </p>

            <div className="mt-3 space-y-2">
              {order.wonPrizes.map((wp, idx) => (
                <div
                  key={idx}
                  className="bg-black/40 border border-white/30 rounded-xl p-2.5 flex items-center justify-between text-xs"
                >
                  <span className="font-mono font-black text-amber-300 text-base">
                    #{wp.ticketNumber}
                  </span>
                  <span className="font-extrabold text-white text-sm">
                    🏆 {wp.prizeTitle}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-yellow-100 mt-2.5">
              Ganador registrado: <strong className="text-white">{order.customerName} {order.customerLastName}</strong> (Cédula: <strong className="text-white font-mono">{order.identification}</strong>). Descarga tu tiquete oficial para reclamar tu premio.
            </p>
          </div>
        )}

        {/* Notificación de Correo Enviado */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3.5 mb-5 flex items-start gap-3">
          <span className="text-xl">📧</span>
          <div className="flex-1 text-xs">
            <p className="text-blue-900 font-bold mb-0.5">
              ¡Números enviados a tu correo!
            </p>
            <p className="text-blue-800">
              Hemos enviado tus <strong>{order.quantity} números</strong> y el comprobante oficial a: <strong className="underline">{order.email}</strong>.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={handleResendEmail}
                disabled={isResending}
                className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 underline cursor-pointer"
              >
                {isResending ? 'Enviando correo...' : '¿No lo recibiste? Reenviar correo'}
              </button>
              {emailStatus && (
                <span className="text-[11px] text-green-700 font-semibold">
                  ✓ {emailStatus}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-6 space-y-2 text-xs sm:text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Cantidad:</span>
            <span className="font-semibold text-gray-900">{order.quantity} Números Oficiales</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Total pagado:</span>
            <span className="font-semibold text-gray-900 font-mono">{formatCOP(order.totalCOP)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Titular y Cédula:</span>
            <span className="font-semibold text-gray-900 font-mono">
              {order.customerName} {order.customerLastName} (C.C: {order.identification || 'No registrada'})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Correo registrado:</span>
            <span className="font-semibold text-gray-900">{order.email}</span>
          </div>
          {order.phone && (
            <div className="flex justify-between">
              <span className="text-gray-500">Teléfono registrado:</span>
              <span className="font-semibold text-gray-900 font-mono">+57 {order.phone}</span>
            </div>
          )}
          {order.address && (
            <div className="flex justify-between">
              <span className="text-gray-500">Dirección de entrega:</span>
              <span className="font-semibold text-gray-900 text-right truncate max-w-[200px]" title={order.address}>{order.address}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Pasarela:</span>
            <span className="font-semibold text-gray-900">{order.paymentMethod}</span>
          </div>
        </div>

        {/* Botón Destacado: Descargar Tiquete Oficial */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => setShowVoucher(true)}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="text-lg">🎟️</span>
            <span>Descargar Mi Tiquete Oficial (PDF / JPG / PNG)</span>
          </button>
          <p className="text-[11px] text-gray-500 text-center mt-1.5">
            Genera tu boleta de lotería digital con tu nombre, cédula y números asignados.
          </p>
        </div>

        {/* Assigned ticket numbers list */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-1.5">
            <div>
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wider block">
                🎲 Números Asignados al Azar:
              </span>
              <span className="text-[11px] text-gray-500">
                Generados aleatoriamente por el sistema para tu pedido
              </span>
            </div>
            <button
              onClick={handleCopy}
              className="text-xs text-red-600 hover:text-red-700 font-semibold cursor-pointer shrink-0"
            >
              {copied ? '✓ ¡Copiados!' : '📋 Copiar números'}
            </button>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto p-2.5 bg-gray-50 border border-gray-200 rounded-lg">
            {order.ticketNumbers.map((num, idx) => {
              const wonPrize = order.wonPrizes?.find(p => p.ticketNumber === num);
              return (
                <div
                  key={idx}
                  className={`font-mono font-bold text-sm py-1.5 px-2 rounded text-center shadow-2xs transition ${
                    wonPrize
                      ? 'bg-amber-100 border-2 border-amber-500 text-amber-950 font-black shadow-md'
                      : 'bg-white border border-red-200 text-red-700'
                  }`}
                  title={wonPrize ? `🏆 Número Premiado: ${wonPrize.prizeTitle}` : undefined}
                >
                  {wonPrize && <span className="block text-[9px] text-amber-800 uppercase">🏆 PREMIADO</span>}
                  {num}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => onViewInSearch(order.email)}
            className="flex-1 py-3 px-4 bg-[#f4ebd0] border border-[#af9f6e] hover:bg-[#ffc107] text-gray-900 font-bold rounded text-sm transition text-center cursor-pointer"
          >
            Buscar en el sistema
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-[#CC0000] hover:bg-red-700 text-white font-bold rounded text-sm transition text-center cursor-pointer"
          >
            Volver al Inicio
          </button>
        </div>

        {/* Modal de la Boleta Digital para Descarga */}
        <TicketVoucherModal
          order={order}
          isOpen={showVoucher}
          onClose={() => setShowVoucher(false)}
        />
      </div>
    </div>
  );
};
