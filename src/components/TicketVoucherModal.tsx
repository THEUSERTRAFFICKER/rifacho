import React, { useRef, useState } from 'react';
import { PurchasedOrder } from '../types';
import { siteConfig } from '../config/siteConfig';
import { formatCOP } from '../utils/orderStore';
import {
  downloadElementAsPDF,
  downloadElementAsPNG,
  downloadElementAsJPG,
  getWhatsAppShareTicketUrl,
} from '../utils/ticketExporter';

interface TicketVoucherModalProps {
  order: PurchasedOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TicketVoucherModal: React.FC<TicketVoucherModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const fileNameBase = `boleta-${siteConfig.raffleName.toLowerCase().replace(/\s+/g, '-')}-orden-${order.orderNumber}`;

  const handleDownloadPNG = async () => {
    if (!ticketRef.current) return;
    setIsExporting('png');
    setExportNotice(null);
    try {
      const ok = await downloadElementAsPNG(ticketRef.current, `${fileNameBase}.png`, order);
      if (ok) {
        setExportNotice('✓ Imagen PNG descargada exitosamente en alta resolución.');
      } else {
        setExportNotice('Error al generar imagen PNG.');
      }
    } finally {
      setIsExporting(null);
    }
  };

  const handleDownloadJPG = async () => {
    if (!ticketRef.current) return;
    setIsExporting('jpg');
    setExportNotice(null);
    try {
      const ok = await downloadElementAsJPG(ticketRef.current, `${fileNameBase}.jpg`, order);
      if (ok) {
        setExportNotice('✓ Imagen JPG descargada exitosamente.');
      } else {
        setExportNotice('Error al generar imagen JPG.');
      }
    } finally {
      setIsExporting(null);
    }
  };

  const handleDownloadPDF = async () => {
    if (!ticketRef.current) return;
    setIsExporting('pdf');
    setExportNotice(null);
    try {
      const ok = await downloadElementAsPDF(
        ticketRef.current,
        `${fileNameBase}.pdf`,
        `Boleta Oficial #${order.orderNumber} - ${order.customerName} ${order.customerLastName}`,
        order
      );
      if (ok) {
        setExportNotice('✓ Documento PDF oficial generado y descargado.');
      } else {
        setExportNotice('Error al generar PDF.');
      }
    } finally {
      setIsExporting(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const fullName = `${order.customerName} ${order.customerLastName}`.trim();
  const whatsappUrl = getWhatsAppShareTicketUrl(order);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-gray-100 rounded-2xl shadow-2xl max-w-3xl w-full my-6 flex flex-col max-h-[92vh] border border-gray-300 animate-in fade-in zoom-in duration-150">
        
        {/* Top Control Bar */}
        <div className="bg-gray-900 text-white p-4 sm:px-6 rounded-t-2xl flex flex-wrap items-center justify-between gap-3 border-b border-gray-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🎟️</span>
              <h2 className="text-base sm:text-lg font-bold">
                Tiquete Digital Oficial
              </h2>
              <span className="font-mono text-xs bg-red-600/80 text-white px-2 py-0.5 rounded font-bold">
                #{order.orderNumber}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Cliente: <strong className="text-gray-200">{fullName}</strong> • Cédula: <strong className="text-amber-400 font-mono">{order.identification || 'No registrada'}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1 rounded-lg text-lg font-bold transition cursor-pointer"
              title="Cerrar ventana"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Quick Export Action Bar */}
        <div className="bg-white px-4 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-gray-700 uppercase tracking-wider text-[11px] mr-1">
              Descargar en formato:
            </span>

            {/* Botón PDF */}
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isExporting !== null}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              <span>📄</span>
              <span>{isExporting === 'pdf' ? 'Generando PDF...' : 'Descargar PDF'}</span>
            </button>

            {/* Botón JPG */}
            <button
              type="button"
              onClick={handleDownloadJPG}
              disabled={isExporting !== null}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              <span>🖼️</span>
              <span>{isExporting === 'jpg' ? 'Generando JPG...' : 'Descargar JPG'}</span>
            </button>

            {/* Botón PNG */}
            <button
              type="button"
              onClick={handleDownloadPNG}
              disabled={isExporting !== null}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              <span>🖼️</span>
              <span>{isExporting === 'png' ? 'Generando PNG...' : 'Descargar PNG'}</span>
            </button>

            {/* Botón WhatsApp */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              title="Enviar boleta al WhatsApp del cliente"
            >
              <span>💬</span>
              <span>Enviar por WhatsApp</span>
            </a>

            {/* Botón Imprimir */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 rounded font-semibold flex items-center gap-1 transition cursor-pointer"
            >
              <span>🖨️</span>
              <span>Imprimir</span>
            </button>
          </div>
        </div>

        {exportNotice && (
          <div className="bg-emerald-50 text-emerald-800 px-4 py-2 text-xs font-semibold border-b border-emerald-200 flex items-center justify-between">
            <span>{exportNotice}</span>
            <button type="button" onClick={() => setExportNotice(null)} className="text-emerald-700 text-sm font-bold">✕</button>
          </div>
        )}

        {/* Scrollable Preview Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex justify-center bg-gray-200/60">
          
          {/* THE OFFICIAL TICKET VOUCHER (This element is captured by html2canvas/jsPDF) */}
          <div
            ref={ticketRef}
            id="official-ticket-voucher"
            className="w-full max-w-[620px] bg-white rounded-xl shadow-xl border-2 border-gray-300 overflow-hidden text-gray-900 font-sans relative"
            style={{ minHeight: '600px' }}
          >
            {/* Top Red & Gold Ribbon */}
            <div className="bg-gradient-to-r from-[#990000] via-[#CC0000] to-[#b30000] text-white p-5 text-center relative overflow-hidden">
              <div className="absolute top-2 right-3 opacity-20 text-6xl select-none pointer-events-none">
                🎟️
              </div>
              <div className="inline-block bg-black/40 backdrop-blur-xs text-amber-300 border border-amber-300/40 text-[10px] font-bold tracking-widest uppercase px-3 py-0.5 rounded-full mb-2">
                ★ BOLETA DIGITAL OFICIAL Y REGISTRADA ★
              </div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white">
                {siteConfig.raffleName}
              </h1>
              <p className="text-amber-200 text-xs sm:text-sm font-bold mt-1 max-w-md mx-auto">
                {siteConfig.productTitle} • {siteConfig.awardHighlightText}
              </p>
              <div className="mt-2 text-[11px] text-white/80 font-mono flex items-center justify-center gap-3">
                <span>Edición N° {siteConfig.editionNumber || 1}</span>
                <span>•</span>
                <span>Sorteo Autorizado</span>
                <span>•</span>
                <span>Lotería de Medellín</span>
              </div>
            </div>

            {/* Ticket Notches & Perforation Line */}
            <div className="relative py-2 bg-gray-50 flex items-center justify-between px-3 border-y border-dashed border-gray-300">
              <div className="w-5 h-5 rounded-full bg-gray-200 -ml-5.5 border-r border-gray-300"></div>
              <div className="flex-1 flex justify-between items-center text-[10px] text-gray-500 font-mono px-3">
                <span>TALONARIO DIGITAL DE SEGURIDAD</span>
                <span className="font-bold text-red-600">FOLIO: #{order.orderNumber}</span>
                <span>{order.createdAt.split(' ')[0]}</span>
              </div>
              <div className="w-5 h-5 rounded-full bg-gray-200 -mr-5.5 border-l border-gray-300"></div>
            </div>

            {/* Customer & Order Data Section */}
            <div className="p-5 bg-white">
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/70 mb-5">
                <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3 pb-1 border-b border-gray-200 flex items-center justify-between">
                  <span>👤 DATOS DEL TITULAR (COMPRADOR)</span>
                  <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    ✓ PAGO APROBADO
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500 block text-[11px]">Nombre Completo:</span>
                    <strong className="text-gray-900 text-sm font-bold block">{fullName}</strong>
                  </div>

                  {/* CÉDULA DE CIUDADANÍA (DESTACADA) */}
                  <div className="bg-amber-50/80 p-2 rounded border border-amber-200">
                    <span className="text-amber-900 font-bold block text-[11px] flex items-center gap-1">
                      <span>🆔 CÉDULA / DOC. IDENTIDAD:</span>
                    </span>
                    <strong className="text-amber-950 font-mono text-sm font-extrabold block">
                      {order.identification || 'No registrada'}
                    </strong>
                  </div>

                  <div>
                    <span className="text-gray-500 block text-[11px]">Teléfono / Celular:</span>
                    <span className="font-mono text-gray-800 font-semibold">+57 {order.phone}</span>
                  </div>

                  <div>
                    <span className="text-gray-500 block text-[11px]">Correo Electrónico:</span>
                    <span className="text-gray-800 font-semibold break-all">{order.email}</span>
                  </div>

                  {order.address && (
                    <div className="sm:col-span-2">
                      <span className="text-gray-500 block text-[11px]">Dirección y Municipio:</span>
                      <span className="text-gray-800">{order.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Transaction Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5 text-center text-xs">
                <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                  <span className="text-[10px] text-gray-500 block uppercase">N° de Orden</span>
                  <strong className="font-mono text-gray-900 font-bold text-sm">#{order.orderNumber}</strong>
                </div>

                <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                  <span className="text-[10px] text-gray-500 block uppercase">Cantidad</span>
                  <strong className="text-red-700 font-bold text-sm">{order.quantity} Números</strong>
                </div>

                <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                  <span className="text-[10px] text-gray-500 block uppercase">Total Pagado</span>
                  <strong className="font-mono text-emerald-700 font-bold text-sm">{formatCOP(order.totalCOP)}</strong>
                </div>

                <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                  <span className="text-[10px] text-gray-500 block uppercase">Fecha de Emisión</span>
                  <strong className="text-gray-800 text-[11px] block">{order.createdAt}</strong>
                </div>
              </div>

              {/* Lucky Numbers Section */}
              <div className="border-2 border-red-500/40 rounded-xl p-4 bg-red-50/20 mb-5">
                
                {/* Certificado de Premio Ganado Oficial si aplica */}
                {order.wonPrizes && order.wonPrizes.length > 0 && (
                  <div className="mb-4 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 p-3 rounded-xl border-2 border-yellow-500 text-center shadow-sm">
                    <div className="text-xs uppercase font-black text-amber-950 tracking-wider flex items-center justify-center gap-1.5">
                      <span>🏆</span>
                      <span>CERTIFICADO OFICIAL DE BOLETO PREMIADO</span>
                      <span>🏆</span>
                    </div>
                    <div className="text-sm font-extrabold text-amber-950 mt-0.5">
                      {order.wonPrizes.map((p) => `${p.prizeTitle} en el Boleto #${p.ticketNumber}`).join(' • ')}
                    </div>
                    <div className="text-[10px] text-amber-900 mt-0.5">
                      Comprador Acreditado: <strong>{fullName}</strong> — Documento: <strong className="font-mono">{order.identification}</strong>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mb-3 pb-2 border-b border-red-200">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">🎲</span>
                    <span className="text-xs font-black uppercase tracking-wider text-red-900">
                      Tus Números de la Suerte ({order.ticketNumbers.length}):
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                    Oficiales para el Sorteo
                  </span>
                </div>

                {order.status === 'Anulado' && (
                  <div className="mb-3 p-2 bg-red-100 border border-red-300 text-red-800 text-xs rounded font-bold text-center">
                    ✕ BOLETOS ANULADOS - Esta orden ha sido cancelada y no participa en el sorteo.
                  </div>
                )}

                {/* Grid of Lucky Numbers */}
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 max-h-56 overflow-y-auto p-1">
                  {order.ticketNumbers.map((num, idx) => {
                    const wonPrize = order.wonPrizes?.find((p) => p.ticketNumber === num);
                    return (
                      <div
                        key={idx}
                        className={`py-1.5 px-1 text-center font-mono font-black text-sm rounded border transition ${
                          wonPrize
                            ? 'bg-amber-100 text-amber-950 border-2 border-amber-500 shadow-md ring-2 ring-yellow-400'
                            : order.status === 'Anulado'
                            ? 'bg-red-50 text-red-400 line-through border-red-200'
                            : 'bg-white text-red-700 border-red-300 shadow-2xs'
                        }`}
                        title={wonPrize ? `🏆 ¡Número Premiado: ${wonPrize.prizeTitle}!` : undefined}
                      >
                        {wonPrize && <span className="block text-[8px] text-amber-800 uppercase font-sans">🏆 PREMIO</span>}
                        {num}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Barcode and Security Verification */}
              <div className="pt-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                
                {/* Simulated Barcode */}
                <div className="text-center sm:text-left">
                  <div className="flex items-center gap-0.5 h-10 justify-center sm:justify-start">
                    {[2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 1, 2, 3, 1, 2, 4, 1, 3, 2].map((w, i) => (
                      <div
                        key={i}
                        className="bg-gray-900 h-full"
                        style={{ width: `${w}px` }}
                      ></div>
                    ))}
                  </div>
                  <div className="font-mono text-[10px] text-gray-600 mt-1 tracking-widest uppercase">
                    *TCK-{order.orderNumber}-{order.identification || 'CC'}*
                  </div>
                </div>

                {/* Official Stamp */}
                <div className="text-right flex items-center gap-3">
                  <div className="w-16 h-16 border-2 border-red-700 rounded-full flex flex-col items-center justify-center p-1 transform rotate-[-8deg] shadow-xs select-none">
                    <span className="text-[7px] font-black text-red-700 tracking-tighter uppercase">RIFACHO</span>
                    <span className="text-[6px] font-bold text-red-600">OFICIAL</span>
                    <span className="text-[8px] font-black text-red-700">✓ CERT</span>
                    <span className="text-[6px] text-red-600 font-mono">{order.createdAt.split(' ')[0]}</span>
                  </div>

                  <div className="text-left text-[10px] text-gray-500 max-w-[200px] leading-tight">
                    <p className="font-semibold text-gray-700">Validez y Garantía:</p>
                    <p>Comprobante válido únicamente presentando la cédula registrada del comprador.</p>
                  </div>
                </div>

              </div>

              {/* Legal Disclaimer & Creador del Sistema */}
              <div className="mt-4 pt-3 border-t border-gray-100 text-[9px] text-gray-400 text-center leading-tight">
                <p>
                  {siteConfig.raffleName} • Operado legalmente en Colombia. Consulta los resultados oficiales en nuestra plataforma web. 
                  Los números participantes son generados al azar y archivados con sello de tiempo.
                </p>
                <div className="mt-1.5 font-bold text-gray-600">
                  Creador y Desarrollo del Sistema:{' '}
                  <a
                    href="https://www.theusertrafficker.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-gray-800 hover:text-black font-black"
                  >
                    www.theusertrafficker.com
                  </a>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-white p-4 rounded-b-2xl border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-gray-500 text-[11px]">
            Tip: Puedes descargar este tiquete en <strong>PDF</strong>, <strong>JPG</strong> o <strong>PNG</strong> para imprimirlo o enviarlo al cliente por WhatsApp.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-gray-900 hover:bg-black text-white rounded-lg font-bold transition cursor-pointer ml-auto"
          >
            Cerrar Ventana
          </button>
        </div>

      </div>
    </div>
  );
};
