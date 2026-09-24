import React from 'react';
import { PrizeWonReport } from '../types';
import { updateReportStatus, markReportAsViewed } from '../utils/prizeReportStore';

interface PrizeAuditReportModalProps {
  report: PrizeWonReport | null;
  onClose: () => void;
  onStatusUpdated?: () => void;
}

export const PrizeAuditReportModal: React.FC<PrizeAuditReportModalProps> = ({
  report,
  onClose,
  onStatusUpdated,
}) => {
  if (!report) return null;

  // Marcar como visto al abrir
  React.useEffect(() => {
    if (report && !report.viewedByAdmin) {
      markReportAsViewed(report.id);
    }
  }, [report]);

  const handleUpdateStatus = (newStatus: 'detectado' | 'verificado' | 'entregado') => {
    updateReportStatus(report.id, newStatus);
    if (onStatusUpdated) onStatusUpdated();
  };

  const handlePrint = () => {
    window.print();
  };

  // WhatsApp link con mensaje oficial redactado
  const cleanPhone = report.phone.replace(/\D/g, '');
  const waPhone = cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone}`;
  const waMessage = encodeURIComponent(
    `¡Hola ${report.customerName}! 🥳🎉\n\nTe contactamos oficialmente de la administración del Sorteo.\n\n` +
    `Te informamos que en tu compra reciente (Orden #${report.orderNumber}) te ha salido el **TIQUE PREMIADO #${report.ticketNumber}** con el premio: **${report.prizeTitle}**.\n\n` +
    `Tu número fue registrado y reportado automáticamente en nuestro sistema de auditoría.\n` +
    `Por favor confírmanos tu documento de identidad (${report.identification}) para coordinar la entrega o acreditación de tu premio.\n\n` +
    `¡Muchísimas felicidades!`
  );
  const waUrl = `https://wa.me/${waPhone}?text=${waMessage}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border-2 border-amber-400 overflow-hidden my-6">
        
        {/* Encabezado Dorado de Auditoría */}
        <div className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-slate-950 p-4 sm:p-5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-950 text-amber-400 border border-amber-300 flex items-center justify-center text-2xl shadow-inner shrink-0">
              🚨
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider bg-slate-950 text-amber-300 px-2 py-0.5 rounded">
                  Reporte en Segundo Plano
                </span>
                <span className="text-xs font-mono font-bold bg-white/40 px-2 py-0.5 rounded text-slate-900">
                  {report.reportNumber}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-950 leading-tight mt-0.5">
                Detección Automática de Tique Premiado
              </h2>
            </div>
          </div>
          
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-950/20 hover:bg-slate-950/40 text-slate-950 flex items-center justify-center font-bold text-lg cursor-pointer transition"
            title="Cerrar modal"
          >
            ✕
          </button>
        </div>

        {/* Cuerpo del Reporte */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Alerta de Detección */}
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex items-start gap-3">
            <span className="text-xl">⚡</span>
            <div className="text-xs text-amber-900 leading-relaxed">
              <strong className="font-bold">Notificación del Sistema en Segundo Plano:</strong> Al generarse la orden <strong className="font-mono">#{report.orderNumber}</strong>, el motor de sorteos verificó los boletos y detectó la coincidencia con un número premiado activo. Este reporte se generó y guardó automáticamente para su auditoría y entrega.
            </div>
          </div>

          {/* Tarjeta de Tique Premiado */}
          <div className="bg-gradient-to-br from-neutral-900 via-gray-900 to-black rounded-xl p-4 sm:p-5 text-white border border-amber-500/50 shadow-lg text-center relative overflow-hidden">
            <div className="absolute top-2 right-2 text-3xl opacity-10">🏆</div>
            <span className="text-xs uppercase font-extrabold tracking-wider text-amber-400">
              {report.category || 'Premio de Hoy'}
            </span>
            <div className="my-2">
              <span className="text-xs text-gray-400 font-semibold block">NÚMERO DE BOLETO GANADOR:</span>
              <span className="font-mono text-3xl sm:text-4xl font-black tracking-widest text-amber-300 drop-shadow-md">
                #{report.ticketNumber}
              </span>
            </div>
            <div className="inline-block bg-amber-400/20 border border-amber-400 text-amber-200 px-4 py-1.5 rounded-lg text-sm sm:text-base font-black">
              🎁 {report.prizeTitle}
            </div>
          </div>

          {/* Datos del Cliente Ganador */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
            <h3 className="text-xs font-black uppercase text-gray-500 tracking-wider flex items-center gap-1.5">
              <span>👤</span>
              <span>Datos del Comprador Ganador</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                <span className="text-gray-400 block text-[10px] font-bold uppercase">Nombre Completo:</span>
                <span className="font-bold text-gray-900 text-sm">
                  {report.customerName} {report.customerLastName}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                <span className="text-gray-400 block text-[10px] font-bold uppercase">Documento / Cédula:</span>
                <span className="font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 inline-block mt-0.5">
                  🆔 {report.identification || 'Sin registrar'}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                <span className="text-gray-400 block text-[10px] font-bold uppercase">Teléfono / WhatsApp:</span>
                <span className="font-mono font-semibold text-gray-800">
                  📞 +57 {report.phone}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                <span className="text-gray-400 block text-[10px] font-bold uppercase">Correo Electrónico:</span>
                <span className="font-mono font-semibold text-gray-800 break-all">
                  ✉️ {report.email}
                </span>
              </div>

              {report.address && (
                <div className="bg-white p-2.5 rounded-lg border border-gray-200 sm:col-span-2">
                  <span className="text-gray-400 block text-[10px] font-bold uppercase">Dirección de Entrega:</span>
                  <span className="font-medium text-gray-800">
                    📍 {report.address}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Datos de la Orden y Trazabilidad */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
            <h3 className="text-xs font-black uppercase text-gray-500 tracking-wider flex items-center gap-1.5">
              <span>📋</span>
              <span>Trazabilidad de la Orden y Auditoría</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                <span className="text-gray-400 block text-[10px] font-bold uppercase">N° Orden:</span>
                <span className="font-mono font-bold text-gray-900">
                  #{report.orderNumber}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                <span className="text-gray-400 block text-[10px] font-bold uppercase">Fecha y Hora Detección:</span>
                <span className="font-medium text-gray-800">
                  {report.detectedAt}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                <span className="text-gray-400 block text-[10px] font-bold uppercase">Medio de Pago:</span>
                <span className="font-semibold text-gray-800">
                  {report.paymentMethod}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                <span className="text-gray-400 block text-[10px] font-bold uppercase">Valor Compra:</span>
                <span className="font-mono font-bold text-emerald-700">
                  ${report.totalPaidCOP.toLocaleString('es-CO')} COP
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-gray-200 sm:col-span-2">
                <span className="text-gray-400 block text-[10px] font-bold uppercase">Estado de Entrega:</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    report.status === 'entregado'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : report.status === 'verificado'
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                  }`}>
                    {report.status === 'entregado'
                      ? '🏆 Premio Entregado'
                      : report.status === 'verificado'
                      ? '✓ Verificado por Admin'
                      : '⚡ Detectado en Segundo Plano (Pendiente)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Cambio de Estado Administrativo */}
          <div className="border-t border-gray-200 pt-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-gray-600">
              Cambiar Estado del Premio:
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleUpdateStatus('verificado')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition ${
                  report.status === 'verificado'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                ✓ Marcar Verificado
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus('entregado')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition ${
                  report.status === 'entregado'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                🏆 Marcar Entregado
              </button>
            </div>
          </div>
        </div>

        {/* Acciones del Pie */}
        <div className="bg-gray-100 p-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
          >
            <span>🖨️</span>
            <span>Imprimir / PDF</span>
          </button>

          <div className="flex items-center gap-2">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-black flex items-center gap-2 cursor-pointer shadow-md hover:shadow-green-600/30 transition"
            >
              <span>📲</span>
              <span>Contactar Ganador por WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-lg text-xs font-bold cursor-pointer transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
