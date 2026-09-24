import React, { useState, useRef } from 'react';
import {
  siteConfig,
  DEFAULT_SITE_CONFIG,
  persistSiteConfig,
  resetSiteConfig,
  PaymentGatewayConfig,
  SiteConfig,
} from '../config/siteConfig';

interface AdminConfigDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved?: () => void;
}

export const AdminConfigDrawer: React.FC<AdminConfigDrawerProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
}) => {
  const [activeTab, setActiveTab] = useState<'images' | 'domain' | 'payments' | 'emails' | 'general' | 'contact' | 'backup'>('images');
  
  // Dominio
  const [customDomain, setCustomDomain] = useState(siteConfig.domain.customDomain);
  const [protocol, setProtocol] = useState(siteConfig.domain.protocol);
  const [dnsGuideProvider, setDnsGuideProvider] = useState(siteConfig.domain.dnsProviderGuide);
  const [copiedDns, setCopiedDns] = useState<string | null>(null);

  // Imágenes (Logo, Favicon, Flyer, Banner)
  const [logoImg, setLogoImg] = useState(siteConfig.images.logo);
  const [faviconImg, setFaviconImg] = useState(siteConfig.images.favicon || '/images/favicon.png');
  const [flyerImg, setFlyerImg] = useState(siteConfig.images.flyer);
  const [bannerImg, setBannerImg] = useState(siteConfig.images.bannerSecondary);

  // Creador / Organizador
  const [creatorName, setCreatorName] = useState(siteConfig.creatorName || 'Rifacho Oficial');
  const [creatorTitle, setCreatorTitle] = useState(siteConfig.creatorTitle || 'Organizador Principal');

  // Pasarelas
  const [provider, setProvider] = useState<PaymentGatewayConfig['provider']>(siteConfig.payments.provider);
  const [tcUser, setTcUser] = useState(siteConfig.payments.tucompra.usuario);
  const [tcKey, setTcKey] = useState(siteConfig.payments.tucompra.llave);
  const [tcEndpoint, setTcEndpoint] = useState(siteConfig.payments.tucompra.endpointUrl);
  const [tcSandbox, setTcSandbox] = useState(siteConfig.payments.tucompra.sandbox);
  const [wompiKey, setWompiKey] = useState(siteConfig.payments.wompi.publicKey);
  const [epaycoKey, setEpaycoKey] = useState(siteConfig.payments.epayco.publicKey);
  const [epaycoTest, setEpaycoTest] = useState(siteConfig.payments.epayco.testMode);
  const [webhookUrl, setWebhookUrl] = useState(siteConfig.payments.customWebhookUrl);

  // Notificaciones por Correo
  const [emailEnabled, setEmailEnabled] = useState(siteConfig.emailNotifications?.enabled ?? true);
  const [emailProvider, setEmailProvider] = useState(siteConfig.emailNotifications?.provider || 'browser_auto');
  const [senderName, setSenderName] = useState(siteConfig.emailNotifications?.senderName || 'Rifacho Oficial');
  const [senderEmail, setSenderEmail] = useState(siteConfig.emailNotifications?.senderEmail || 'boletos@rifacho.com');
  const [emailjsServiceId, setEmailjsServiceId] = useState(siteConfig.emailNotifications?.emailjsServiceId || '');
  const [emailjsTemplateId, setEmailjsTemplateId] = useState(siteConfig.emailNotifications?.emailjsTemplateId || '');
  const [emailjsPublicKey, setEmailjsPublicKey] = useState(siteConfig.emailNotifications?.emailjsPublicKey || '');
  const [resendApiKey, setResendApiKey] = useState(siteConfig.emailNotifications?.resendApiKey || '');
  const [emailWebhookEndpoint, setEmailWebhookEndpoint] = useState(siteConfig.emailNotifications?.webhookEndpoint || '');

  // General Sorteo
  const [totalTickets, setTotalTickets] = useState(siteConfig.totalAvailableTickets || 100000);
  const [pricePerTicket, setPricePerTicket] = useState(siteConfig.pricePerTicketCOP);
  const [minQty, setMinQty] = useState(siteConfig.minTicketQuantity);
  const [progress, setProgress] = useState(siteConfig.progressPercentage);
  const [productTitle, setProductTitle] = useState(siteConfig.productTitle);
  const [awardHighlight, setAwardHighlight] = useState(siteConfig.awardHighlightText);
  const [raffleSubtitle, setRaffleSubtitle] = useState(siteConfig.raffleSubtitle);

  // Contacto
  const [telegramUrl, setTelegramUrl] = useState(siteConfig.contact.telegramUrl);
  const [whatsappUrl, setWhatsappUrl] = useState(siteConfig.contact.whatsappUrl);
  const [emailSupport, setEmailSupport] = useState(siteConfig.contact.supportEmail);

  // Feedback states
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  // Hidden file input refs
  const logoFileRef = useRef<HTMLInputElement>(null);
  const faviconFileRef = useRef<HTMLInputElement>(null);
  const flyerFileRef = useRef<HTMLInputElement>(null);
  const bannerFileRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Manejador para leer archivos de imagen localmente y convertirlos a base64
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void,
    label: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido (JPG, PNG, WEBP, etc.)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen es mayor a 5MB. Te recomendamos usar una imagen optimizada para que cargue rápido.');
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setter(reader.result);
        setUploadNotice(`¡${label} actualizada exitosamente!`);
        setTimeout(() => setUploadNotice(null), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDns(id);
    setTimeout(() => setCopiedDns(null), 2000);
  };

  const handleSave = () => {
    const cleanDomain = customDomain.replace(/^https?:\/\//, '').replace(/\/+$/, '').trim();
    const updatedConfig: SiteConfig = {
      ...siteConfig,
      creatorName,
      creatorTitle,
      domain: {
        customDomain: cleanDomain || 'rifacho.com',
        protocol,
        canonicalUrl: `${protocol}://${cleanDomain || 'rifacho.com'}`,
        dnsProviderGuide: dnsGuideProvider,
      },
      images: {
        logo: logoImg,
        favicon: faviconImg,
        flyer: flyerImg,
        bannerSecondary: bannerImg,
      },
      payments: {
        ...siteConfig.payments,
        provider,
        tucompra: {
          ...siteConfig.payments.tucompra,
          usuario: tcUser,
          llave: tcKey,
          endpointUrl: tcEndpoint,
          sandbox: tcSandbox,
        },
        wompi: {
          ...siteConfig.payments.wompi,
          publicKey: wompiKey,
        },
        epayco: {
          ...siteConfig.payments.epayco,
          publicKey: epaycoKey,
          testMode: epaycoTest,
        },
        customWebhookUrl: webhookUrl,
      },
      emailNotifications: {
        enabled: emailEnabled,
        provider: emailProvider as any,
        senderName,
        senderEmail,
        emailjsServiceId,
        emailjsTemplateId,
        emailjsPublicKey,
        resendApiKey,
        webhookEndpoint: emailWebhookEndpoint,
      },
      pricePerTicketCOP: Number(pricePerTicket),
      minTicketQuantity: Number(minQty),
      totalAvailableTickets: Number(totalTickets),
      progressPercentage: Number(progress),
      productTitle,
      awardHighlightText: awardHighlight,
      raffleSubtitle,
      contact: {
        ...siteConfig.contact,
        telegramUrl,
        whatsappUrl,
        supportEmail: emailSupport,
      },
    };

    persistSiteConfig(updatedConfig);

    setSavedFeedback(true);
    if (onConfigSaved) onConfigSaved();
    setTimeout(() => {
      setSavedFeedback(false);
      onClose();
    }, 900);
  };

  const handleResetDefaults = () => {
    if (confirm('¿Deseas restablecer todas las fotos, logo, precios y configuración a los valores originales de fábrica?')) {
      const reset = resetSiteConfig();
      setLogoImg(reset.images.logo);
      setFlyerImg(reset.images.flyer);
      setBannerImg(reset.images.bannerSecondary);
      setCustomDomain(reset.domain.customDomain);
      setPricePerTicket(reset.pricePerTicketCOP);
      setMinQty(reset.minTicketQuantity);
      setProgress(reset.progressPercentage);
      setProductTitle(reset.productTitle);
      setAwardHighlight(reset.awardHighlightText);
      setRaffleSubtitle(reset.raffleSubtitle);
      setTelegramUrl(reset.contact.telegramUrl);
      setWhatsappUrl(reset.contact.whatsappUrl);
      setEmailSupport(reset.contact.supportEmail);
      setProvider(reset.payments.provider);
      if (onConfigSaved) onConfigSaved();
      alert('Configuración restablecida por defecto.');
    }
  };

  const exportConfigJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(siteConfig, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `config_rifacho_${customDomain || 'sorteo'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
        
        {/* Header Drawer */}
        <div className="p-5 border-b border-gray-800 bg-[#020000] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-red-600 rounded-lg text-lg">⚙️</span>
            <div>
              <h2 className="text-lg font-bold">Panel de Control & Edición</h2>
              <p className="text-xs text-gray-400">Edita Logo, Fotos, Dominio Nuevo, Pasarelas y Sorteo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-md text-xl cursor-pointer"
            title="Cerrar panel"
          >
            ✕
          </button>
        </div>

        {/* Floating Upload Notification */}
        {uploadNotice && (
          <div className="bg-green-600 text-white text-xs py-2 px-4 text-center font-semibold shadow-inner animate-pulse">
            ✓ {uploadNotice}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-gray-50 text-xs sm:text-sm font-semibold overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('images')}
            className={`py-3 px-3 whitespace-nowrap border-b-2 transition cursor-pointer ${
              activeTab === 'images'
                ? 'border-red-600 text-red-600 bg-white'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            🖼️ Logo & Fotos
          </button>
          <button
            onClick={() => setActiveTab('domain')}
            className={`py-3 px-3 whitespace-nowrap border-b-2 transition cursor-pointer ${
              activeTab === 'domain'
                ? 'border-red-600 text-red-600 bg-white'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            🌐 Conectar Dominio
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`py-3 px-3 whitespace-nowrap border-b-2 transition cursor-pointer ${
              activeTab === 'payments'
                ? 'border-red-600 text-red-600 bg-white'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            💳 Pasarela de Pagos
          </button>
          <button
            onClick={() => setActiveTab('emails')}
            className={`py-3 px-3 whitespace-nowrap border-b-2 transition cursor-pointer ${
              activeTab === 'emails'
                ? 'border-red-600 text-red-600 bg-white'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            ✉️ Correo Automático
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={`py-3 px-3 whitespace-nowrap border-b-2 transition cursor-pointer ${
              activeTab === 'general'
                ? 'border-red-600 text-red-600 bg-white'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            🎟️ Precios & Textos
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            className={`py-3 px-3 whitespace-nowrap border-b-2 transition cursor-pointer ${
              activeTab === 'contact'
                ? 'border-red-600 text-red-600 bg-white'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            📱 Contacto
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`py-3 px-3 whitespace-nowrap border-b-2 transition cursor-pointer ${
              activeTab === 'backup'
                ? 'border-red-600 text-red-600 bg-white'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            💾 Respaldo
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 flex-1 space-y-6 overflow-y-auto">
          
          {/* TAB 1: IMÁGENES Y LOGO */}
          {activeTab === 'images' && (
            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3.5 text-xs text-red-950">
                📸 <strong>Cambia tus imágenes fácilmente:</strong> Puedes subir fotos directamente desde tu computadora/celular o pegar la URL de cualquier imagen web.
              </div>

              {/* 1. Logo */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                    <span>1. Logotipo Principal</span>
                    <span className="text-[11px] font-normal text-gray-500">(Aparece en la cabecera negra y en el pie)</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setLogoImg(DEFAULT_SITE_CONFIG.images.logo)}
                    className="text-xs text-gray-500 hover:text-red-600 underline"
                  >
                    Restablecer original
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 bg-black p-3 rounded-md">
                  <div className="w-28 h-20 bg-gray-900 border border-gray-800 rounded flex items-center justify-center p-1 overflow-hidden shrink-0">
                    <img src={logoImg} alt="Preview Logo" className="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="flex-1 w-full space-y-2">
                    <input
                      type="file"
                      ref={logoFileRef}
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, setLogoImg, 'Logotipo')}
                      className="hidden"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => logoFileRef.current?.click()}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold cursor-pointer shadow-xs"
                      >
                        📁 Subir Logo desde tu equipo
                      </button>
                    </div>
                    <div className="text-[11px] text-gray-400">O ingresa la URL de la imagen:</div>
                    <input
                      type="text"
                      value={logoImg}
                      onChange={(e) => setLogoImg(e.target.value)}
                      placeholder="https://tu-sitio.com/logo.png"
                      className="w-full text-xs px-2.5 py-1.5 border border-gray-700 rounded bg-gray-900 text-white outline-none focus:border-red-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 1.5. Favicon (Icono de la Pestaña del Navegador) */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                    <span>⭐ Favicon (Icono de la Pestaña del Navegador)</span>
                    <span className="text-[11px] font-normal text-gray-500">(Icono pequeño que aparece junto al título de la web)</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setFaviconImg('/images/favicon.png')}
                    className="text-xs text-gray-500 hover:text-red-600 underline"
                  >
                    Restablecer original
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3 rounded-md border border-gray-200">
                  <div className="w-16 h-16 bg-gray-100 border border-gray-300 rounded flex items-center justify-center p-2 overflow-hidden shrink-0 shadow-2xs">
                    <img src={faviconImg} alt="Preview Favicon" className="w-8 h-8 object-contain" />
                  </div>
                  <div className="flex-1 w-full space-y-2">
                    <input
                      type="file"
                      ref={faviconFileRef}
                      accept="image/*,.ico"
                      onChange={(e) => handleFileUpload(e, setFaviconImg, 'Favicon')}
                      className="hidden"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => faviconFileRef.current?.click()}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold cursor-pointer shadow-xs"
                      >
                        📁 Subir Favicon desde tu equipo (.png, .ico, .jpg)
                      </button>
                    </div>
                    <div className="text-[11px] text-gray-500">O pega la URL del favicon:</div>
                    <input
                      type="text"
                      value={faviconImg}
                      onChange={(e) => setFaviconImg(e.target.value)}
                      placeholder="/images/favicon.png o https://..."
                      className="w-full text-xs px-2.5 py-1.5 border border-gray-300 rounded bg-white text-gray-800 outline-none focus:border-red-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Flyer Principal */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                    <span>2. Flyer / Foto Principal del Sorteo</span>
                    <span className="text-[11px] font-normal text-gray-500">(Banner superior del Combo Tesla)</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setFlyerImg(DEFAULT_SITE_CONFIG.images.flyer)}
                    className="text-xs text-gray-500 hover:text-red-600 underline"
                  >
                    Restablecer original
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3 rounded-md border border-gray-200">
                  <div className="w-28 h-32 bg-gray-100 border border-gray-200 rounded flex items-center justify-center p-1 overflow-hidden shrink-0 shadow-2xs">
                    <img src={flyerImg} alt="Preview Flyer" className="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="flex-1 w-full space-y-2">
                    <input
                      type="file"
                      ref={flyerFileRef}
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, setFlyerImg, 'Foto Principal')}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => flyerFileRef.current?.click()}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold cursor-pointer shadow-xs"
                    >
                      📁 Subir Flyer desde tu equipo
                    </button>
                    <div className="text-[11px] text-gray-500">O ingresa la URL del banner:</div>
                    <input
                      type="text"
                      value={flyerImg}
                      onChange={(e) => setFlyerImg(e.target.value)}
                      placeholder="https://tu-sitio.com/flyer.jpeg"
                      className="w-full text-xs px-2.5 py-1.5 border border-gray-300 rounded bg-white text-gray-800 outline-none focus:border-red-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Banner Secundario */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                    <span>3. Banner Secundario (Premios 2 Millones)</span>
                    <span className="text-[11px] font-normal text-gray-500">(Franja intermedia)</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setBannerImg(DEFAULT_SITE_CONFIG.images.bannerSecondary)}
                    className="text-xs text-gray-500 hover:text-red-600 underline"
                  >
                    Restablecer original
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3 rounded-md border border-gray-200">
                  <div className="w-28 h-20 bg-gray-100 border border-gray-200 rounded flex items-center justify-center p-1 overflow-hidden shrink-0 shadow-2xs">
                    <img src={bannerImg} alt="Preview Banner Secundario" className="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="flex-1 w-full space-y-2">
                    <input
                      type="file"
                      ref={bannerFileRef}
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, setBannerImg, 'Banner Secundario')}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => bannerFileRef.current?.click()}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold cursor-pointer shadow-xs"
                    >
                      📁 Subir Banner desde tu equipo
                    </button>
                    <div className="text-[11px] text-gray-500">O ingresa la URL:</div>
                    <input
                      type="text"
                      value={bannerImg}
                      onChange={(e) => setBannerImg(e.target.value)}
                      placeholder="https://tu-sitio.com/banner-2m.png"
                      className="w-full text-xs px-2.5 py-1.5 border border-gray-300 rounded bg-white text-gray-800 outline-none focus:border-red-500 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONECTAR DOMINIO NUEVO */}
          {activeTab === 'domain' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-xs text-blue-900 leading-relaxed">
                🌐 <strong>¿Cómo conectar tu nuevo dominio? (Guía Paso a Paso)</strong>
                <p className="mt-1">
                  Escribe tu dominio abajo. El sistema te genera automáticamente los registros DNS exactos que debes agregar en tu registrador (GoDaddy, Namecheap, Hostinger, Cloudflare o cPanel) para que tu página abra con tu dirección propia.
                </p>
              </div>

              {/* Input de Dominio */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                <label className="block text-xs font-bold text-gray-800">
                  Ingresa tu Dominio Nuevo:
                </label>
                <div className="flex">
                  <select
                    value={protocol}
                    onChange={(e) => setProtocol(e.target.value as any)}
                    className="px-2.5 py-2 border border-r-0 border-gray-300 rounded-l bg-gray-100 text-xs font-bold"
                  >
                    <option value="https">https://</option>
                    <option value="http">http://</option>
                  </select>
                  <input
                    type="text"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    placeholder="misorteo.com o rifacho.com"
                    className="flex-1 text-sm px-3 py-2 border border-gray-300 rounded-r bg-white font-mono outline-none focus:border-red-600"
                  />
                </div>
                <p className="text-[11px] text-gray-500">
                  Tu sitio responderá en: <strong className="text-gray-900">{protocol}://{customDomain || 'tudominio.com'}</strong>
                </p>
              </div>

              {/* Proveedor de DNS Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  Selecciona dónde compraste tu dominio:
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { id: 'cloudflare', label: 'Cloudflare' },
                    { id: 'hostinger', label: 'Hostinger' },
                    { id: 'godaddy', label: 'GoDaddy' },
                    { id: 'cpanel', label: 'cPanel / Hosting' },
                    { id: 'vercel', label: 'Vercel' },
                    { id: 'general', label: 'Otro Registrador' },
                  ].map((prov) => (
                    <button
                      key={prov.id}
                      type="button"
                      onClick={() => setDnsGuideProvider(prov.id as any)}
                      className={`p-2 rounded border text-center font-medium transition cursor-pointer ${
                        dnsGuideProvider === prov.id
                          ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                          : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      {prov.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Registros DNS a Configurar */}
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-xs">
                <div className="bg-gray-900 text-white p-3 text-xs font-bold flex justify-between items-center">
                  <span>Registros DNS a añadir en tu proveedor ({dnsGuideProvider.toUpperCase()}):</span>
                  <span className="text-[11px] text-green-400 font-mono">2 Registros requeridos</span>
                </div>
                <div className="divide-y divide-gray-200 text-xs">
                  {/* Registro A */}
                  <div className="p-3 flex items-center justify-between gap-2">
                    <div>
                      <span className="font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[11px]">Tipo A</span>
                      <div className="mt-1 font-mono text-gray-800">
                        Host: <strong>@</strong> (o {customDomain || 'tudominio.com'})
                      </div>
                      <div className="font-mono text-gray-600">
                        Apunta a: <strong>IP de tu Servidor</strong> (ej: 76.76.21.21 o IP de tu hosting)
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('@', 'rec-a')}
                      className="px-2.5 py-1.5 border border-gray-300 rounded hover:bg-gray-50 font-medium text-xs text-gray-700"
                    >
                      {copiedDns === 'rec-a' ? '¡Copiado!' : 'Copiar'}
                    </button>
                  </div>

                  {/* Registro CNAME */}
                  <div className="p-3 flex items-center justify-between gap-2">
                    <div>
                      <span className="font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-[11px]">CNAME</span>
                      <div className="mt-1 font-mono text-gray-800">
                        Host: <strong>www</strong>
                      </div>
                      <div className="font-mono text-gray-600">
                        Apunta a: <strong>{customDomain || 'tudominio.com'}</strong>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(customDomain || 'tudominio.com', 'rec-cname')}
                      className="px-2.5 py-1.5 border border-gray-300 rounded hover:bg-gray-50 font-medium text-xs text-gray-700"
                    >
                      {copiedDns === 'rec-cname' ? '¡Copiado!' : 'Copiar'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Guía de despliegue */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-2 text-xs text-gray-700">
                <h5 className="font-bold text-gray-900">Pasos para publicar tu página con tu dominio:</h5>
                <ol className="list-decimal list-inside space-y-1 text-gray-600">
                  <li>Inicia sesión en tu proveedor de dominio ({dnsGuideProvider}).</li>
                  <li>Ve a la sección <strong>Administración de DNS</strong> (Zona DNS).</li>
                  <li>Crea el registro <strong>A</strong> con Host <code className="bg-gray-200 px-1 rounded">@</code> y el <strong>CNAME</strong> para <code className="bg-gray-200 px-1 rounded">www</code>.</li>
                  <li>Activa el <strong>Certificado SSL gratuito (HTTPS)</strong> en tu panel de control para que aparezca el candado de seguridad.</li>
                </ol>
                <div className="pt-2 text-[11px] text-gray-500">
                  * La propagación de DNS suele tardar entre 5 minutos y 2 horas.
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PASARELAS DE PAGO */}
          {activeTab === 'payments' && (
            <div className="space-y-5">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3.5 text-xs text-blue-900">
                💡 <strong>¿Cómo conectar tu pasarela?</strong>
                <br />
                Selecciona tu proveedor preferido e ingresa tus credenciales. Los pagos se procesarán automáticamente a tu cuenta bancaria.
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Selecciona la Pasarela Activa:
                </label>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    { id: 'tucompra', label: 'TuCompra (Pasarela Oficial)' },
                    { id: 'wompi', label: 'Wompi Bancolombia' },
                    { id: 'epayco', label: 'ePayco Colombia' },
                    { id: 'custom_webhook', label: 'Webhook / Backend Propio' },
                    { id: 'demo_local', label: 'Modo Pruebas / Simulado' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setProvider(p.id as any)}
                      className={`p-3 rounded-lg border text-left font-medium transition cursor-pointer ${
                        provider === p.id
                          ? 'border-red-600 bg-red-50 text-red-900 ring-2 ring-red-300'
                          : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* TuCompra Config */}
              {provider === 'tucompra' && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                  <h4 className="font-bold text-sm text-gray-900">Configuración TuCompra</h4>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Usuario / Merchant ID TuCompra:
                    </label>
                    <input
                      type="text"
                      value={tcUser}
                      onChange={(e) => setTcUser(e.target.value)}
                      placeholder="Ej: micomercio_123"
                      className="w-full text-sm px-3 py-2 border rounded bg-white outline-none focus:border-red-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Llave / Token Secreto:
                    </label>
                    <input
                      type="password"
                      value={tcKey}
                      onChange={(e) => setTcKey(e.target.value)}
                      placeholder="••••••••••••••••••••••••"
                      className="w-full text-sm px-3 py-2 border rounded bg-white outline-none focus:border-red-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      URL Endpoint TuCompra:
                    </label>
                    <input
                      type="text"
                      value={tcEndpoint}
                      onChange={(e) => setTcEndpoint(e.target.value)}
                      className="w-full text-sm px-3 py-2 border rounded bg-white outline-none focus:border-red-600 text-xs font-mono"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tcSandbox}
                      onChange={(e) => setTcSandbox(e.target.checked)}
                      className="accent-red-600"
                    />
                    <span>Modo Pruebas (Sandbox activado)</span>
                  </label>
                </div>
              )}

              {/* Wompi Config */}
              {provider === 'wompi' && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                  <h4 className="font-bold text-sm text-gray-900">Configuración Wompi</h4>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Public Key Wompi (pub_prod_... o pub_test_...):
                    </label>
                    <input
                      type="text"
                      value={wompiKey}
                      onChange={(e) => setWompiKey(e.target.value)}
                      placeholder="pub_prod_xxxxxxxxxxxxxx"
                      className="w-full text-sm px-3 py-2 border rounded bg-white outline-none focus:border-red-600 font-mono text-xs"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Al usar Wompi, tus clientes podrán pagar automáticamente con Nequi, Bancolombia Botón, PSE y Tarjetas.
                  </p>
                </div>
              )}

              {/* ePayco Config */}
              {provider === 'epayco' && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                  <h4 className="font-bold text-sm text-gray-900">Configuración ePayco</h4>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Public Key ePayco:
                    </label>
                    <input
                      type="text"
                      value={epaycoKey}
                      onChange={(e) => setEpaycoKey(e.target.value)}
                      placeholder="Llave pública de ePayco"
                      className="w-full text-sm px-3 py-2 border rounded bg-white outline-none focus:border-red-600 font-mono text-xs"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={epaycoTest}
                      onChange={(e) => setEpaycoTest(e.target.checked)}
                      className="accent-red-600"
                    />
                    <span>Modo Test ePayco</span>
                  </label>
                </div>
              )}

              {/* Custom Webhook */}
              {provider === 'custom_webhook' && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                  <h4 className="font-bold text-sm text-gray-900">Webhook o Servidor Backend</h4>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      URL del Webhook (POST):
                    </label>
                    <input
                      type="text"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://tu-dominio.com/api/pagos"
                      className="w-full text-sm px-3 py-2 border rounded bg-white outline-none focus:border-red-600 font-mono text-xs"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Cada vez que un cliente realice un pedido, se enviará un POST en JSON con el monto, nombre, teléfono, correo y cantidad de boletos.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB: NOTIFICACIONES POR CORREO */}
          {activeTab === 'emails' && (
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3.5 text-xs text-emerald-950">
                📩 <strong>Envío Automático de Números al Correo del Comprador:</strong>
                <p className="mt-1">
                  Tan pronto como el cliente paga sus boletos, el sistema le despacha un correo profesional con sus números de la suerte, el número de orden y la confirmación de su compra.
                </p>
              </div>

              {/* Activar / Desactivar */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                <label className="flex items-center gap-2.5 text-sm font-bold text-gray-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailEnabled}
                    onChange={(e) => setEmailEnabled(e.target.checked)}
                    className="w-4 h-4 accent-red-600 rounded"
                  />
                  <span>Activar envío de boletos al correo electrónico</span>
                </label>
                <p className="text-xs text-gray-500">
                  Si está marcado, cada comprador recibirá de inmediato el email con todos los números asignados.
                </p>
              </div>

              {/* Nombre y Correo del Remitente */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Nombre del Remitente:
                  </label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Rifacho Oficial"
                    className="w-full text-sm px-3 py-2 border rounded bg-white outline-none focus:border-red-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Correo del Remitente / Soporte:
                  </label>
                  <input
                    type="email"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder="boletos@tudominio.com"
                    className="w-full text-sm px-3 py-2 border rounded bg-white outline-none focus:border-red-600 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Selector de Método de Envío */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-800">
                  Selecciona cómo enviar los correos:
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'browser_auto', label: '⚡ Automático Integrado (Recomendado)' },
                    { id: 'emailjs', label: '📧 EmailJS (Directo sin Backend)' },
                    { id: 'webhook', label: '🔗 Webhook / Backend Propio' },
                    { id: 'resend', label: '🚀 Resend API' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setEmailProvider(m.id as any)}
                      className={`p-3 rounded-lg border text-left font-medium transition cursor-pointer ${
                        emailProvider === m.id
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-300 font-bold'
                          : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Configuración según método */}
              {emailProvider === 'browser_auto' && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 space-y-1.5">
                  <p className="font-bold">✓ Modo Automático Activo</p>
                  <p>
                    El sistema despacha la confirmación en el navegador, genera el comprobante con los números y le permite al cliente reenviarlo o copiarlo con un clic. No necesitas configurar claves adicionales.
                  </p>
                </div>
              )}

              {emailProvider === 'emailjs' && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3 text-xs">
                  <h5 className="font-bold text-gray-900 text-sm">Credenciales de EmailJS (emailjs.com):</h5>
                  <p className="text-gray-500">
                    Permite enviar correos reales directamente desde el navegador con tu cuenta de Gmail, Outlook o SMTP.
                  </p>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Service ID:</label>
                    <input
                      type="text"
                      value={emailjsServiceId}
                      onChange={(e) => setEmailjsServiceId(e.target.value)}
                      placeholder="service_xxxxxxx"
                      className="w-full px-3 py-1.5 border rounded bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Template ID:</label>
                    <input
                      type="text"
                      value={emailjsTemplateId}
                      onChange={(e) => setEmailjsTemplateId(e.target.value)}
                      placeholder="template_xxxxxxx"
                      className="w-full px-3 py-1.5 border rounded bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Public Key:</label>
                    <input
                      type="text"
                      value={emailjsPublicKey}
                      onChange={(e) => setEmailjsPublicKey(e.target.value)}
                      placeholder="user_xxxxxxxxxxxxxx"
                      className="w-full px-3 py-1.5 border rounded bg-white font-mono"
                    />
                  </div>
                </div>
              )}

              {emailProvider === 'webhook' && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3 text-xs">
                  <h5 className="font-bold text-gray-900 text-sm">Webhook de Correo (POST JSON):</h5>
                  <p className="text-gray-500">
                    Se enviará un POST a tu URL con el correo del cliente, la lista de números y la plantilla HTML para que tu servidor (PHP, Node, Python, Zapier o Make) lo despache por SMTP o SendGrid.
                  </p>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">URL del Webhook:</label>
                    <input
                      type="text"
                      value={emailWebhookEndpoint}
                      onChange={(e) => setEmailWebhookEndpoint(e.target.value)}
                      placeholder="https://tu-api.com/enviar-correo"
                      className="w-full px-3 py-1.5 border rounded bg-white font-mono"
                    />
                  </div>
                </div>
              )}

              {emailProvider === 'resend' && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3 text-xs">
                  <h5 className="font-bold text-gray-900 text-sm">API Key de Resend (resend.com):</h5>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">API Key:</label>
                    <input
                      type="password"
                      value={resendApiKey}
                      onChange={(e) => setResendApiKey(e.target.value)}
                      placeholder="re_123456789..."
                      className="w-full px-3 py-1.5 border rounded bg-white font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Vista previa del correo */}
              <div className="p-3 bg-gray-100 rounded-lg text-xs text-gray-600 border border-gray-200 flex items-center justify-between">
                <span>¿Quieres ver cómo recibe el correo el comprador?</span>
                <button
                  type="button"
                  onClick={() => {
                    const previewWin = window.open('', '_blank');
                    if (previewWin) {
                      previewWin.document.write(`
                        <h3 style="font-family: sans-serif; text-align: center; color: #666; margin: 10px;">
                          Vista Previa del Correo que Recibe el Cliente
                        </h3>
                        <div style="max-width: 620px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
                          <div style="background: #000; color: #fff; padding: 20px; text-align: center;">
                            <h2 style="margin: 0;">${siteConfig.raffleName}</h2>
                            <p style="color: #ff4444; margin: 5px 0 0 0;">${siteConfig.productTitle}</p>
                          </div>
                          <div style="padding: 20px; background: #fff; font-family: sans-serif;">
                            <p>Hola <strong>Juan Pérez</strong>,</p>
                            <p>¡Tu pago de <strong>$ 20.000 COP</strong> por <strong>20 Números</strong> ha sido confirmado!</p>
                            <p><strong>Tus números asignados son:</strong></p>
                            <div style="background: #f8fafc; padding: 15px; border-radius: 6px; font-family: monospace; font-size: 14px; color: #cc0000; line-height: 1.8;">
                              10293, 14920, 20391, 28401, 31029, 39401, 41029, 49201, 52910, 58391, 62910, 67401, 71294, 75819, 80194, 83910, 87291, 89401, 91204, 95012
                            </div>
                          </div>
                        </div>
                      `);
                    }
                  }}
                  className="px-2.5 py-1 bg-gray-800 hover:bg-black text-white rounded text-[11px] font-semibold cursor-pointer"
                >
                  👁️ Ver plantilla de correo
                </button>
              </div>

            </div>
          )}

          {/* TAB 4: PRECIOS Y TEXTOS */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-950">
                ✏️ <strong>Nombre del Creador y Textos:</strong> Modifica la identidad del organizador y los datos del sorteo que se muestran al público y en el pie de página.
              </div>

              {/* Nombre y Cargo del Creador */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Nombre del Creador / Organizador:
                  </label>
                  <input
                    type="text"
                    value={creatorName}
                    onChange={(e) => setCreatorName(e.target.value)}
                    placeholder="ej: Rifacho Oficial o Tu Nombre"
                    className="w-full text-xs sm:text-sm px-3 py-2 border rounded bg-white outline-none focus:border-red-600 font-semibold"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">Aparece en los derechos de autor y pie de página</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Título o Cargo del Creador:
                  </label>
                  <input
                    type="text"
                    value={creatorTitle}
                    onChange={(e) => setCreatorTitle(e.target.value)}
                    placeholder="ej: Organizador Principal o Team Rifacho"
                    className="w-full text-xs sm:text-sm px-3 py-2 border rounded bg-white outline-none focus:border-red-600"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">Cargo visible junto al nombre</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Título del Producto / Sorteo:
                </label>
                <input
                  type="text"
                  value={productTitle}
                  onChange={(e) => setProductTitle(e.target.value)}
                  className="w-full text-sm px-3 py-2 border rounded bg-white outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Subtítulo / Nombre de la Campaña:
                </label>
                <input
                  type="text"
                  value={raffleSubtitle}
                  onChange={(e) => setRaffleSubtitle(e.target.value)}
                  className="w-full text-sm px-3 py-2 border rounded bg-white outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Texto Destacado de Premios:
                </label>
                <input
                  type="text"
                  value={awardHighlight}
                  onChange={(e) => setAwardHighlight(e.target.value)}
                  className="w-full text-sm px-3 py-2 border rounded bg-white outline-none focus:border-red-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Precio por Boleto (COP):
                  </label>
                  <input
                    type="number"
                    value={pricePerTicket}
                    onChange={(e) => setPricePerTicket(Number(e.target.value))}
                    className="w-full text-sm px-3 py-2 border rounded bg-white outline-none focus:border-red-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Cantidad Mínima de Boletos:
                  </label>
                  <input
                    type="number"
                    value={minQty}
                    onChange={(e) => setMinQty(Number(e.target.value))}
                    className="w-full text-sm px-3 py-2 border rounded bg-white outline-none focus:border-red-600 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Emisión Total de Boletos del Sorteo:
                  </label>
                  <input
                    type="number"
                    value={totalTickets}
                    onChange={(e) => setTotalTickets(Number(e.target.value))}
                    placeholder="100000"
                    className="w-full text-sm px-3 py-2 border rounded bg-white outline-none focus:border-red-600 font-mono font-bold"
                  />
                  <p className="text-[10px] text-gray-500 mt-0.5">Ej: 100.000 para números del 00000 al 99999</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Porcentaje Base en Barra de Progreso (%):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={progress}
                    onChange={(e) => setProgress(Number(e.target.value))}
                    className="w-full text-sm px-3 py-2 border rounded bg-white outline-none focus:border-red-600 font-mono"
                  />
                  <p className="text-[10px] text-gray-500 mt-0.5">Calculado en tiempo real con las ventas</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CONTACTO */}
          {activeTab === 'contact' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Enlace de Telegram:
                </label>
                <input
                  type="text"
                  value={telegramUrl}
                  onChange={(e) => setTelegramUrl(e.target.value)}
                  placeholder="https://t.me/tu_canal"
                  className="w-full text-sm px-3 py-2 border rounded bg-white outline-none focus:border-red-600 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Enlace directo de WhatsApp:
                </label>
                <input
                  type="text"
                  value={whatsappUrl}
                  onChange={(e) => setWhatsappUrl(e.target.value)}
                  placeholder="https://wa.me/573000000000"
                  className="w-full text-sm px-3 py-2 border rounded bg-white outline-none focus:border-red-600 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Correo de Soporte / Ventas:
                </label>
                <input
                  type="email"
                  value={emailSupport}
                  onChange={(e) => setEmailSupport(e.target.value)}
                  placeholder="ventas@tudominio.com"
                  className="w-full text-sm px-3 py-2 border rounded bg-white outline-none focus:border-red-600 text-xs"
                />
              </div>
            </div>
          )}

          {/* TAB 6: RESPALDO Y EXPORTACIÓN */}
          {activeTab === 'backup' && (
            <div className="space-y-5">
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
                <h4 className="font-bold text-sm text-gray-900">Descargar Copia de Seguridad</h4>
                <p className="text-xs text-gray-600">
                  Descarga un archivo JSON con toda tu configuración (imágenes, textos, dominio y pasarelas) para transferirla a cualquier otro servidor.
                </p>
                <button
                  type="button"
                  onClick={exportConfigJSON}
                  className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded text-xs font-semibold cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <span>📥 Descargar Configuración (.JSON)</span>
                </button>
              </div>

              <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-3">
                <h4 className="font-bold text-sm text-red-900">Restablecer a Valores de Fábrica</h4>
                <p className="text-xs text-red-700">
                  Restaura las fotos originales de Rifacho (Combo Tesla), el logotipo original y los precios iniciales.
                </p>
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold cursor-pointer shadow-xs"
                >
                  ⚠️ Restablecer todo por defecto
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Los cambios se guardan permanentemente en tu navegador.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer"
            >
              Cerrar
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-md shadow-sm transition cursor-pointer flex items-center gap-1.5"
            >
              {savedFeedback ? (
                <>
                  <span>✓</span>
                  <span>¡Cambios Guardados!</span>
                </>
              ) : (
                <span>Guardar Cambios</span>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
