import React, { useState } from 'react';
import { siteConfig } from '../config/siteConfig';
import { formatCOP, saveNewOrder } from '../utils/orderStore';
import { processPaymentGateway } from '../services/paymentService';
import { sendOrderConfirmationEmail } from '../services/emailService';
import { PurchasedOrder } from '../types';

interface CheckoutViewProps {
  initialQuantity: number;
  onBackToHome: () => void;
  onOrderSuccess: (order: PurchasedOrder) => void;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  initialQuantity,
  onBackToHome,
  onOrderSuccess,
}) => {
  const [quantity, setQuantity] = useState(initialQuantity || siteConfig.minTicketQuantity);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [identification, setIdentification] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [paymentOption, setPaymentOption] = useState<'nequi' | 'pse' | 'card' | 'daviplata'>('nequi');
  const [bank, setBank] = useState('Bancolombia');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const totalCOP = quantity * siteConfig.pricePerTicketCOP;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!firstName.trim() || !lastName.trim() || !identification.trim() || !address.trim() || !phone.trim() || !email.trim()) {
      setErrorMsg('Por favor completa todos los campos requeridos con asterisco (*), incluyendo tu número de cédula.');
      return;
    }

    setIsProcessing(true);

    let paymentMethodLabel = 'TuCompra (Nequi)';
    if (siteConfig.payments.provider === 'wompi') {
      paymentMethodLabel = 'Wompi Bancolombia';
    } else if (siteConfig.payments.provider === 'epayco') {
      paymentMethodLabel = 'ePayco Colombia';
    } else if (paymentOption === 'pse') {
      paymentMethodLabel = `TuCompra (PSE - ${bank})`;
    } else if (paymentOption === 'card') {
      paymentMethodLabel = 'TuCompra (Tarjeta de Crédito)';
    } else if (paymentOption === 'daviplata') {
      paymentMethodLabel = 'TuCompra (Daviplata)';
    }

    const fullAddress = city.trim() ? `${address.trim()}, ${city.trim()}` : address.trim();
    const tempOrderNumber = `LT-${Math.floor(10000 + Math.random() * 90000)}`;

    try {
      // 1. Invocar la pasarela de pagos configurada en siteConfig.ts
      const result = await processPaymentGateway({
        orderId: `ord-${Date.now()}`,
        orderNumber: tempOrderNumber,
        customerName: firstName.trim(),
        customerLastName: lastName.trim(),
        identification: identification.trim(),
        address: fullAddress,
        phone: phone.trim(),
        email: email.trim(),
        amountCOP: totalCOP,
        quantity,
        productTitle: siteConfig.productTitle,
        paymentMethod: paymentMethodLabel,
      });

      if (!result.success) {
        setIsProcessing(false);
        setErrorMsg(result.message || 'Error procesando la transacción con la pasarela.');
        return;
      }

      // Si la pasarela requiere redirección externa (ej: link de TuCompra, ePayco o MercadoPago)
      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
        return;
      }

      // 2. Guardar orden emitida con sus números de la suerte y cédula del cliente
      const newOrder = saveNewOrder({
        customerName: firstName.trim(),
        customerLastName: lastName.trim(),
        identification: identification.trim(),
        address: fullAddress,
        phone: phone.trim(),
        email: email.trim(),
        productName: siteConfig.productTitle,
        quantity,
        totalCOP,
        paymentMethod: paymentMethodLabel,
      });

      // 3. Enviar automáticamente los números comprados al correo de la persona
      try {
        await sendOrderConfirmationEmail(newOrder);
      } catch (mailErr) {
        console.warn('Advertencia al enviar correo:', mailErr);
      }

      setIsProcessing(false);
      onOrderSuccess(newOrder);
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMsg(err?.message || 'Error al conectar con la pasarela de pagos.');
    }
  };

  return (
    <div className="w-full max-w-[1140px] mx-auto px-4 py-8">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <button
          onClick={onBackToHome}
          className="text-sm font-medium text-red-600 hover:text-red-700 flex items-center gap-1.5 transition"
        >
          ← Regresar al Inicio
        </button>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-xs text-gray-500 font-mono">
            Pasarela: <strong className="uppercase text-gray-800">{siteConfig.payments.provider}</strong> • 256-bit SSL
          </span>
        </div>
      </div>

      {/* Cart added notice */}
      <div className="bg-[#f7f6f7] border-l-4 border-[#1e85be] text-gray-800 p-4 mb-8 flex items-center justify-between rounded-r shadow-2xs">
        <div className="flex items-center gap-3">
          <span className="text-xl text-[#1e85be]">🛒</span>
          <span className="text-sm sm:text-base">
            <strong>{quantity}</strong> &times; &ldquo;{siteConfig.productTitle}&rdquo; han sido añadidos a tu carrito.
          </span>
        </div>
        <div className="text-xs text-gray-500 font-mono">
          {formatCOP(totalCOP)}
        </div>
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">
        Finalizar compra
      </h1>

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-600 text-red-700 text-sm rounded-r">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Billing details (Detalles de facturación) */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-100">
            Detalles de facturación
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Tu nombre"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none text-sm transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Tu apellido"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none text-sm transition"
                />
              </div>
            </div>

            {/* Cédula / Documento de Identidad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cédula / Documento de Identidad <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={identification}
                  onChange={(e) => setIdentification(e.target.value)}
                  placeholder="Número de cédula o documento (ej: 1032485912)"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none text-sm transition"
                />
                <span className="absolute right-3 top-2.5 text-xs text-gray-600 font-semibold bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                  🆔 Cédula C.C.
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Obligatorio para emitir tu tiquete digital oficial y registrar los números a tu nombre.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección y Ciudad <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Dirección completa y municipio / ciudad"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none text-sm transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono / Celular <span className="text-red-600">*</span>
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-xs sm:text-sm font-mono">
                    +57
                  </span>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="300 123 4567"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-r focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none text-sm transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo electrónico <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none text-sm transition"
                />
              </div>
            </div>

            {/* Quick quantity modifier inside checkout */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
              <span className="text-gray-600">Modificar cantidad de números:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.max(siteConfig.minTicketQuantity, prev - 5))}
                  className="w-8 h-8 rounded border border-gray-300 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold"
                >
                  -
                </button>
                <span className="font-bold text-gray-900 w-12 text-center text-base">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => prev + 5)}
                  className="w-8 h-8 rounded border border-gray-300 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Your order summary (Tu pedido) */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-100">
              Tu pedido
            </h2>

            <div className="border border-gray-200 rounded overflow-hidden mb-6">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 font-semibold text-gray-700">
                    <th className="py-3 px-4">Producto</th>
                    <th className="py-3 px-4 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-800">
                  <tr>
                    <td className="py-3.5 px-4 font-medium">
                      {siteConfig.productTitle} &nbsp;&times;&nbsp;{quantity}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold">
                      {formatCOP(totalCOP)}
                    </td>
                  </tr>
                  <tr className="bg-gray-50/50">
                    <td className="py-3 px-4 text-gray-600">Subtotal</td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-gray-700">
                      {formatCOP(totalCOP)}
                    </td>
                  </tr>
                  <tr className="bg-gray-100/70 text-base font-bold">
                    <td className="py-3.5 px-4 text-gray-900">Total</td>
                    <td className="py-3.5 px-4 text-right font-mono text-red-700">
                      {formatCOP(totalCOP)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Random ticket explanation box */}
            <div className="mb-6 p-3.5 bg-amber-50/80 border border-amber-300 rounded-lg text-xs text-amber-950">
              <div className="font-bold flex items-center gap-1.5 mb-1 text-amber-900">
                <span>🎲</span>
                <span>Generación Automática de Números Aleatorios</span>
              </div>
              <p className="leading-relaxed">
                Tú no tienes que seleccionar números manualmente. Al finalizar tu compra, el sistema generará y asignará al azar <strong>{quantity} números aleatorios únicos</strong> listos para el sorteo, los verás en pantalla y te llegarán a tu correo electrónico.
              </p>
            </div>

            {/* Payment Gateway Box */}
            <div className="mb-6 border border-gray-200 rounded p-4 bg-gray-50">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-3 h-3 rounded-full bg-red-600 ring-2 ring-red-200 inline-block"></span>
                <span className="font-bold text-gray-900 text-base uppercase">
                  {siteConfig.payments.provider === 'tucompra' ? 'TuCompra' : siteConfig.payments.provider}
                </span>
                <span className="text-xs bg-red-100 text-red-800 font-semibold px-2 py-0.5 rounded ml-auto">
                  Pasarela Configurada
                </span>
              </div>
              <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                Paga de forma rápida y segura en Colombia a través de <strong>{siteConfig.payments.provider.toUpperCase()}</strong>. Se emitirán tus boletos oficiales inmediatamente tras la confirmación.
              </p>

              {/* Payment sub-methods */}
              <div className="grid grid-cols-2 gap-2 text-xs font-medium text-gray-700 mb-4">
                <label className={`p-2.5 rounded border cursor-pointer flex items-center gap-2 transition ${paymentOption === 'nequi' ? 'border-red-600 bg-red-50 text-red-900 font-semibold' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                  <input
                    type="radio"
                    name="pay_method"
                    value="nequi"
                    checked={paymentOption === 'nequi'}
                    onChange={() => setPaymentOption('nequi')}
                    className="accent-red-600"
                  />
                  <span>Nequi</span>
                </label>

                <label className={`p-2.5 rounded border cursor-pointer flex items-center gap-2 transition ${paymentOption === 'pse' ? 'border-red-600 bg-red-50 text-red-900 font-semibold' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                  <input
                    type="radio"
                    name="pay_method"
                    value="pse"
                    checked={paymentOption === 'pse'}
                    onChange={() => setPaymentOption('pse')}
                    className="accent-red-600"
                  />
                  <span>PSE (Cuentas)</span>
                </label>

                <label className={`p-2.5 rounded border cursor-pointer flex items-center gap-2 transition ${paymentOption === 'daviplata' ? 'border-red-600 bg-red-50 text-red-900 font-semibold' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                  <input
                    type="radio"
                    name="pay_method"
                    value="daviplata"
                    checked={paymentOption === 'daviplata'}
                    onChange={() => setPaymentOption('daviplata')}
                    className="accent-red-600"
                  />
                  <span>Daviplata</span>
                </label>

                <label className={`p-2.5 rounded border cursor-pointer flex items-center gap-2 transition ${paymentOption === 'card' ? 'border-red-600 bg-red-50 text-red-900 font-semibold' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                  <input
                    type="radio"
                    name="pay_method"
                    value="card"
                    checked={paymentOption === 'card'}
                    onChange={() => setPaymentOption('card')}
                    className="accent-red-600"
                  />
                  <span>Tarjeta Débito/Crédito</span>
                </label>
              </div>

              {paymentOption === 'pse' && (
                <div className="mb-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Selecciona tu Banco:
                  </label>
                  <select
                    value={bank}
                    onChange={(e) => setBank(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 border border-gray-300 rounded bg-white outline-none focus:border-red-600"
                  >
                    <option value="Bancolombia">Bancolombia</option>
                    <option value="Davivienda">Davivienda</option>
                    <option value="BBVA Colombia">BBVA Colombia</option>
                    <option value="Banco de Bogotá">Banco de Bogotá</option>
                    <option value="Scotiabank Colpatria">Scotiabank Colpatria</option>
                    <option value="Banco Falabella">Banco Falabella</option>
                    <option value="Lulo Bank">Lulo Bank</option>
                    <option value="Nu Colombia">Nu Colombia</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-4 px-6 bg-[#CC0000] hover:bg-[#b00000] text-white font-bold text-lg rounded shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <span className="spinner_loader"></span>
                  <span>Conectando con {siteConfig.payments.provider.toUpperCase()}...</span>
                </>
              ) : (
                <span>Realizar el pedido ({formatCOP(totalCOP)})</span>
              )}
            </button>
            <p className="text-[11px] text-gray-500 text-center mt-3">
              Tus datos personales se utilizarán para procesar tu pedido, respaldar tu experiencia en {siteConfig.raffleName} y emitir tus números oficiales.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};
