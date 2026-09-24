import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { TicketSearch } from './components/TicketSearch';
import { CheckoutView } from './components/CheckoutView';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { AntiCopyOverlay } from './components/AntiCopyOverlay';
import { FloatingTelegram } from './components/FloatingTelegram';
import { AdminConfigDrawer } from './components/AdminConfigDrawer';
import { AdminDashboardView } from './components/AdminDashboardView';
import { LiveTicketStatus } from './components/LiveTicketStatus';
import { AccessLinksModal } from './components/AccessLinksModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminTopBar } from './components/AdminTopBar';
import { RaffleManagerModal } from './components/RaffleManagerModal';
import { PrizeNumbersWidget } from './components/PrizeNumbersWidget';
import { PrizeAuditReportModal } from './components/PrizeAuditReportModal';
import { siteConfig } from './config/siteConfig';
import { PurchasedOrder, AdminUser, PrizeWonReport } from './types';
import { getAdminSession, setAdminSession, getUnreadPrizeReportsCount } from './utils/orderStore';

// Ticket SVG icon from FontAwesome fas-ticket-alt used on Rifacho
const TicketIcon = () => (
  <svg
    aria-hidden="true"
    className="w-5 h-5 fill-current text-white shrink-0 inline-block mr-2"
    viewBox="0 0 576 512"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M128 160h320v192H128V160zm400 96c0 26.51 21.49 48 48 48v96c0 26.51-21.49 48-48 48H48c-26.51 0-48-21.49-48-48v-96c26.51 0 48-21.49 48-48s-21.49-48-48-48v-96c0-26.51 21.49-48 48-48h480c26.51 0 48 21.49 48 48v96c-26.51 0-48 21.49-48 48zm-48-144H96v288h384V112z" />
  </svg>
);

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'checkout' | 'admin_dashboard'>('home');
  const [selectedQuantity, setSelectedQuantity] = useState<number>(siteConfig.minTicketQuantity);
  const [customQty, setCustomQty] = useState<number>(siteConfig.minTicketQuantity);
  const [showMinAlert, setShowMinAlert] = useState<boolean>(false);
  const [completedOrder, setCompletedOrder] = useState<PurchasedOrder | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [, setRerenderKey] = useState<number>(0);

  // Estados de Administración & Enlaces
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => getAdminSession());
  const [viewMode, setViewMode] = useState<'admin' | 'public_preview'>('admin');
  const [isLinksModalOpen, setIsLinksModalOpen] = useState<boolean>(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState<boolean>(false);
  const [isRaffleManagerOpen, setIsRaffleManagerOpen] = useState<boolean>(false);
  const [raffleManagerMode, setRaffleManagerMode] = useState<'new_raffle' | 'finish_raffle' | 'history'>('new_raffle');
  const [adminInitialTab, setAdminInitialTab] = useState<'sales_report' | 'orders_table' | 'user_management' | 'access_links' | 'raffle_management' | 'prize_numbers' | 'prize_reports'>('sales_report');

  // Notificaciones en tiempo real en segundo plano
  const [unreadPrizeCount, setUnreadPrizeCount] = useState<number>(() => getUnreadPrizeReportsCount());
  const [liveToastReport, setLiveToastReport] = useState<PrizeWonReport | null>(null);
  const [globalReportModalItem, setGlobalReportModalItem] = useState<PrizeWonReport | null>(null);

  // Escuchar detecciones automáticas de tiques premiados en segundo plano
  useEffect(() => {
    const handlePrizeWon = (e: any) => {
      const report = e.detail as PrizeWonReport;
      if (report) {
        setLiveToastReport(report);
        setUnreadPrizeCount(getUnreadPrizeReportsCount());
      }
    };
    window.addEventListener('rifacho_prize_won_detected', handlePrizeWon);
    return () => {
      window.removeEventListener('rifacho_prize_won_detected', handlePrizeWon);
    };
  }, []);

  // Sincronizar título y metadata del documento según la configuración activa
  useEffect(() => {
    document.title = `${siteConfig.raffleName} - ${siteConfig.productTitle}`;
    if (siteConfig.images?.favicon) {
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
      if (link) {
        link.href = siteConfig.images.favicon;
      }
    }
  }, [siteConfig.raffleName, siteConfig.productTitle, siteConfig.images?.favicon]);

  // Detectar enlace especial privado de administrador:
  // 1. ?admin=true / ?admin=1 / ?admin / ?mode=admin / #admin / #/admin / /admin
  // 2. Eventos de navegación dinámica (hashchange, popstate)
  // 3. Atajo de teclado privado (Ctrl+Shift+A / Cmd+Shift+A)
  // 4. ?quantity=X -> Añadir al carrito
  useEffect(() => {
    const checkAdminIntent = () => {
      const params = new URLSearchParams(window.location.search);
      const hash = window.location.hash.toLowerCase();
      const pathname = window.location.pathname.toLowerCase();

      const hasAdminParam =
        params.has('admin') ||
        params.get('mode') === 'admin' ||
        params.get('panel') === 'admin';

      const hasAdminHash =
        hash === '#admin' ||
        hash === '#/admin' ||
        hash === '#administrador' ||
        hash.includes('admin');

      const hasAdminPath =
        pathname.startsWith('/admin') ||
        pathname.endsWith('/admin');

      if (hasAdminParam || hasAdminHash || hasAdminPath) {
        const currentSession = getAdminSession();
        if (currentSession) {
          setAdminUser(currentSession);
          setCurrentPage('admin_dashboard');
        } else {
          // Abrir modal de inicio de sesión de administrador
          setIsAdminLoginOpen(true);
        }
      }
    };

    // Revisar al montar
    checkAdminIntent();

    // Escuchar cambios de hash y navegación dinámica
    window.addEventListener('hashchange', checkAdminIntent);
    window.addEventListener('popstate', checkAdminIntent);

    // Atajo de teclado discreto para el dueño (Ctrl + Shift + A / Cmd + Shift + A)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        const currentSession = getAdminSession();
        if (currentSession) {
          setAdminUser(currentSession);
          setCurrentPage('admin_dashboard');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          setIsAdminLoginOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Detección de cantidad en URL (?quantity=X)
    const params = new URLSearchParams(window.location.search);
    const qtyParam = params.get('quantity');
    if (qtyParam) {
      const q = parseInt(qtyParam, 10);
      if (!isNaN(q) && q >= siteConfig.minTicketQuantity) {
        setSelectedQuantity(q);
        setCurrentPage('checkout');
      }
    }

    return () => {
      window.removeEventListener('hashchange', checkAdminIntent);
      window.removeEventListener('popstate', checkAdminIntent);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSelectPackage = (qty: number) => {
    setSelectedQuantity(qty);
    setCurrentPage('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCustomQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val)) {
      setCustomQty(0);
      setShowMinAlert(true);
    } else {
      setCustomQty(val);
      if (val < siteConfig.minTicketQuantity) {
        setShowMinAlert(true);
      } else {
        setShowMinAlert(false);
      }
    }
  };

  const handleBuyCustomNumbers = (e: React.FormEvent) => {
    e.preventDefault();
    if (customQty < siteConfig.minTicketQuantity) {
      setShowMinAlert(true);
      setCustomQty(siteConfig.minTicketQuantity);
      return;
    }
    setSelectedQuantity(customQty);
    setCurrentPage('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOrderSuccess = (order: PurchasedOrder) => {
    setCompletedOrder(order);
  };

  const handleViewInSearch = (_email: string) => {
    setCompletedOrder(null);
    setCurrentPage('home');
    setTimeout(() => {
      const searchEl = document.getElementById('buscar-numeros-section');
      if (searchEl) {
        searchEl.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleScrollTo = (id: string) => {
    if (currentPage !== 'home') {
      setCurrentPage('home');
    }
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  // Manejo de inicio y cierre de sesión admin
  const handleAdminLoginSuccess = (user: AdminUser) => {
    setAdminUser(user);
    setIsAdminLoginOpen(false);
    setCurrentPage('admin_dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdminLogout = () => {
    setAdminSession(null);
    setAdminUser(null);
    setCurrentPage('home');
    // Limpiar query param ?admin= si estaba en la URL para volver a la URL pública limpia
    if (window.location.search.includes('admin=')) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const isAdminAuthenticated = !!adminUser;
  const showAdminEditTools = isAdminAuthenticated && viewMode !== 'public_preview';

  return (
    <div id="page" className="min-h-screen flex flex-col bg-white text-gray-900 font-['Roboto',sans-serif]">
      {/* Skip to main content */}
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-white focus:text-blue-600 focus:p-2 focus:rounded focus:shadow"
      >
        Ir al contenido principal
      </a>

      {/* Barra de Herramientas Superior para el Administrador (Solo si está autenticado) */}
      {isAdminAuthenticated && (
        <AdminTopBar
          adminUser={adminUser}
          currentPage={currentPage}
          viewMode={viewMode}
          onToggleViewMode={() => setViewMode((v) => (v === 'admin' ? 'public_preview' : 'admin'))}
          onOpenDashboard={() => {
            setCurrentPage(currentPage === 'admin_dashboard' ? 'home' : 'admin_dashboard');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          unreadPrizeCount={unreadPrizeCount}
          onOpenPrizeReports={() => {
            setAdminInitialTab('prize_reports');
            setCurrentPage('admin_dashboard');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenSettings={() => setIsAdminOpen(true)}
          onOpenLinksModal={() => setIsLinksModalOpen(true)}
          onOpenRaffleManager={() => {
            setRaffleManagerMode('new_raffle');
            setIsRaffleManagerOpen(true);
          }}
          onLogout={handleAdminLogout}
        />
      )}

      {/* Header Oficial (Separado en Modo Público vs Modo Admin) */}
      <Header
        currentPage={currentPage}
        isAdmin={isAdminAuthenticated}
        isPublicPreview={viewMode === 'public_preview'}
        onGoHome={() => {
          setCurrentPage('home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAdminConfig={() => setIsAdminOpen(true)}
        onOpenDashboard={() => {
          setCurrentPage(currentPage === 'admin_dashboard' ? 'home' : 'admin_dashboard');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenLinksModal={() => setIsLinksModalOpen(true)}
        onSearchClick={() => handleScrollTo('buscar-numeros-section')}
        onBuyClick={() => handleScrollTo('comprar-boletos')}
      />

      <main id="content" className="flex-1">
        {currentPage === 'admin_dashboard' ? (
          <AdminDashboardView
            initialTab={adminInitialTab}
            onBackToSite={() => {
              setCurrentPage('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenSettings={() => setIsAdminOpen(true)}
            onOpenLinksModal={() => setIsLinksModalOpen(true)}
          />
        ) : currentPage === 'checkout' ? (
          <CheckoutView
            initialQuantity={selectedQuantity}
            onBackToHome={() => {
              setCurrentPage('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOrderSuccess={handleOrderSuccess}
          />
        ) : (
          <div className="w-full max-w-[1140px] mx-auto px-4 py-4 md:py-6">
            
            {/* Top Flyer Image con botón interactivo para cambiar la foto (solo para admin en modo edición) */}
            <section className="flex justify-center my-2 sm:my-4">
              <div className="w-full max-w-[768px] flex justify-center relative group">
                <img
                  src={siteConfig.images.flyer}
                  alt={siteConfig.raffleSubtitle}
                  className="w-full md:w-[62%] h-auto object-contain rounded-lg shadow-md transition-transform hover:scale-[1.005]"
                  loading="eager"
                />
                {showAdminEditTools && (
                  <button
                    type="button"
                    onClick={() => setIsAdminOpen(true)}
                    className="absolute bottom-4 bg-black/80 hover:bg-black text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 shadow cursor-pointer"
                    title="Cambiar la foto del flyer principal"
                  >
                    <span>📷</span>
                    <span>Cambiar esta foto</span>
                  </button>
                )}
              </div>
            </section>

            {/* Spacer */}
            <div className="h-2 sm:h-3"></div>

            {/* Visualización en Tiempo Real de Boletos Disponibles, Vendidos y Progreso */}
            <LiveTicketStatus
              isAdmin={isAdminAuthenticated}
              onBuyClick={() => handleScrollTo('comprar-boletos')}
              onStartNewRaffleClick={() => {
                if (isAdminAuthenticated) {
                  setRaffleManagerMode(siteConfig.raffleStatus === 'finalizado' ? 'new_raffle' : 'finish_raffle');
                  setIsRaffleManagerOpen(true);
                } else {
                  setIsAdminLoginOpen(true);
                }
              }}
            />

            {/* Spacer */}
            <div className="h-3 sm:h-5"></div>

            {/* Heading 1: Premios Destacados */}
            <section className="text-center my-2">
              <h2 className="text-[26px] sm:text-[35px] font-bold text-black tracking-tight uppercase">
                {siteConfig.awardHighlightText}
              </h2>
            </section>

            {/* 2M Banner Image con botón interactivo para cambiar la imagen (solo en modo admin) */}
            <section className="flex justify-center my-3 sm:my-4">
              <div className="w-full max-w-[800px] flex justify-center relative group">
                <img
                  src={siteConfig.images.bannerSecondary}
                  alt="Premios adicionales"
                  className="w-full md:w-[89%] h-auto object-contain rounded transition-transform hover:scale-[1.01]"
                  loading="lazy"
                />
                {showAdminEditTools && (
                  <button
                    type="button"
                    onClick={() => setIsAdminOpen(true)}
                    className="absolute bottom-3 bg-black/80 hover:bg-black text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 shadow cursor-pointer"
                    title="Cambiar este banner"
                  >
                    <span>📷</span>
                    <span>Cambiar este banner</span>
                  </button>
                )}
              </div>
            </section>

            {/* Widget Interactivo de Números Premiados de Hoy (Premios Anticipados para Futuros Compradores) */}
            <PrizeNumbersWidget
              isAdmin={showAdminEditTools}
              onOpenAdminPrizeManager={() => {
                setAdminInitialTab('prize_numbers');
                setCurrentPage('admin_dashboard');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onBuyTicketsClick={() => handleScrollTo('comprar-boletos')}
            />

            {/* Spacer */}
            <div className="h-2 sm:h-4"></div>

            {/* Heading 2: ADQUIERELOS O AVISO DE SORTEO FINALIZADO */}
            {siteConfig.raffleStatus === 'finalizado' ? (
              <section className="w-full max-w-[860px] mx-auto my-6 px-3">
                <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white p-6 sm:p-8 rounded-2xl shadow-xl text-center border-2 border-amber-300">
                  <span className="text-4xl sm:text-5xl block mb-2">🏆</span>
                  <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
                    ¡Sorteo Culminado con Éxito!
                  </h3>
                  <p className="text-sm sm:text-base text-amber-100 max-w-xl mx-auto mt-2 mb-2">
                    Las ventas de números para la <strong className="text-white">Edición #{siteConfig.editionNumber || 1}</strong> han finalizado.
                  </p>
                  {siteConfig.currentWinner && (
                    <div className="inline-block bg-black/30 border border-white/20 rounded-xl px-4 py-2 my-3 text-xs sm:text-sm font-medium">
                      🎉 Boleto Ganador: <strong className="text-white font-mono text-base">#{siteConfig.currentWinner.ticketNumber}</strong> — Ganador: <strong className="text-white">{siteConfig.currentWinner.winnerName}</strong>
                    </div>
                  )}
                  <p className="text-xs sm:text-sm text-amber-100 max-w-lg mx-auto mt-1 mb-4">
                    Para comenzar el siguiente sorteo en la plataforma con un nuevo premio o edición, presiona el botón a continuación:
                  </p>
                  <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (isAdminAuthenticated) {
                          setRaffleManagerMode('new_raffle');
                          setIsRaffleManagerOpen(true);
                        } else {
                          setIsAdminLoginOpen(true);
                        }
                      }}
                      className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-gray-100 text-gray-900 font-black text-base sm:text-lg rounded-xl shadow-2xl flex items-center justify-center gap-2 cursor-pointer transition transform active:scale-95"
                    >
                      <span>🎉</span>
                      <span>Comenzar Nuevo Sorteo</span>
                    </button>
                  </div>
                </div>
              </section>
            ) : (
              <>
                <section className="text-center my-2">
                  <h2 className="text-[24px] sm:text-[30px] font-bold text-black tracking-tight uppercase">
                    ADQUIERELOS
                  </h2>
                  {/* Badge explicativo de números aleatorios automáticos */}
                  <div className="max-w-[720px] mx-auto mt-2 px-3">
                    <div className="bg-amber-50 border border-amber-300/80 rounded-xl p-3 sm:p-3.5 flex items-center justify-center gap-2.5 text-xs sm:text-sm text-amber-950 text-center shadow-2xs">
                      <span className="text-lg sm:text-xl">🎲</span>
                      <p>
                        <strong>Asignación 100% Aleatoria:</strong> Solo seleccionas cuántos boletos deseas. Al pagar, el sistema <strong>genera automáticamente tus números aleatorios de la suerte</strong> y te los entrega al instante.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Ticket Packages Grid */}
                <section id="comprar-boletos" className="w-full max-w-[860px] mx-auto my-4 px-2 scroll-mt-20">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {siteConfig.ticketPackages.map((pkg) => (
                      <div key={pkg.id} className="w-full">
                        <button
                          type="button"
                          onClick={() => handleSelectPackage(pkg.quantity)}
                          className="rifacho-btn"
                        >
                          <TicketIcon />
                          <span className="font-semibold text-lg sm:text-[20px] whitespace-nowrap">
                            {pkg.label}
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Section: ¿DESEAS MAS? */}
                <section className="text-center my-8">
                  <h2 className="text-[22px] sm:text-[25px] font-bold text-black tracking-tight uppercase mb-4">
                    ¿DESEAS MAS?
                  </h2>

                  <div className="flex flex-col items-center justify-center">
                    <form
                      onSubmit={handleBuyCustomNumbers}
                      className="simple-ticket-buy"
                    >
                      <label htmlFor="ticket_qty" className="sr-only">
                        Cantidad de boletos
                      </label>
                      <input
                        type="number"
                        id="ticket_qty"
                        name="ticket_qty"
                        min={siteConfig.minTicketQuantity}
                        value={customQty}
                        onChange={handleCustomQtyChange}
                      />
                      <button type="submit" id="buyNumbersBtn">
                        Comprar números
                      </button>
                    </form>

                    <p className="text-xs text-gray-500 mt-2">
                      ✨ No necesitas escoger números: se generan de forma automática y aleatoria al procesar tu orden.
                    </p>

                    {showMinAlert && (
                      <div className="minimum-alert" id="minimumAlert">
                        La cantidad mínima es {siteConfig.minTicketQuantity}
                      </div>
                    )}
                  </div>
                </section>
              </>
            )}

            {/* Spacer */}
            <div className="h-6 sm:h-8"></div>

            {/* Section: Buscar Números */}
            <div id="buscar-numeros-section" className="scroll-mt-20">
              <TicketSearch
                onBuyClick={() => handleScrollTo('comprar-boletos')}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer público 100% limpio (sin enlaces ni botones de administración) */}
      <Footer />

      {/* Botón flotante Telegram */}
      <FloatingTelegram />

      {/* Mensaje protección anticopia */}
      <AntiCopyOverlay />

      {/* Modal de orden completada */}
      {completedOrder && (
        <OrderSuccessModal
          order={completedOrder}
          onClose={() => setCompletedOrder(null)}
          onViewInSearch={handleViewInSearch}
        />
      )}

      {/* Modal de Enlaces de Acceso (Público y Admin) */}
      <AccessLinksModal
        isOpen={isLinksModalOpen}
        onClose={() => setIsLinksModalOpen(false)}
        onOpenPublicPreview={() => {
          setViewMode('public_preview');
          setCurrentPage('home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenDashboard={() => {
          setCurrentPage('admin_dashboard');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Modal de Inicio de Sesión de Administrador */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={handleAdminLoginSuccess}
      />

      {/* Panel Administrador / Editor de Logo, Fotos, Dominio y Pasarela */}
      <AdminConfigDrawer
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onConfigSaved={() => setRerenderKey((prev) => prev + 1)}
      />

      {/* Modal de Ciclo de Vida: Comenzar Nuevo Sorteo y Finalizar Sorteo */}
      <RaffleManagerModal
        isOpen={isRaffleManagerOpen}
        onClose={() => setIsRaffleManagerOpen(false)}
        onRaffleUpdated={() => setRerenderKey((prev) => prev + 1)}
        initialMode={raffleManagerMode}
      />

      {/* Alerta flotante en tiempo real: Tique Premiado detectado en segundo plano */}
      {liveToastReport && (
        <aside aria-label="Alerta de tique premiado detectado" className="fixed bottom-5 right-5 z-50 max-w-md bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-slate-950 p-4 rounded-2xl shadow-2xl border-2 border-yellow-300 animate-in slide-in-from-bottom-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl animate-bounce">🚨</span>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase bg-slate-950 text-amber-300 px-2 py-0.5 rounded">
                  ¡Tique Premiado en Segundo Plano!
                </span>
                <button
                  type="button"
                  onClick={() => setLiveToastReport(null)}
                  className="text-slate-950 hover:text-black font-bold text-sm px-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm font-black text-slate-950 mt-1">
                ¡Ganó {liveToastReport.customerName} {liveToastReport.customerLastName}!
              </p>
              <p className="text-xs text-slate-900 mt-0.5">
                Boleto: <strong className="font-mono">#{liveToastReport.ticketNumber}</strong> • Premio: <strong>{liveToastReport.prizeTitle}</strong> (Cédula: {liveToastReport.identification})
              </p>
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setGlobalReportModalItem(liveToastReport);
                    setLiveToastReport(null);
                  }}
                  className="px-3 py-1.5 bg-slate-950 hover:bg-black text-amber-300 font-bold text-xs rounded-lg cursor-pointer transition shadow-xs"
                >
                  📜 Ver Acta Oficial
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdminInitialTab('prize_reports');
                    setCurrentPage('admin_dashboard');
                    setLiveToastReport(null);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-3 py-1.5 bg-white/40 hover:bg-white/60 text-slate-950 font-bold text-xs rounded-lg cursor-pointer transition"
                >
                  Ir a Reportes
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Modal global de acta de reporte de premio */}
      {globalReportModalItem && (
        <PrizeAuditReportModal
          report={globalReportModalItem}
          onClose={() => setGlobalReportModalItem(null)}
          onStatusUpdated={() => setUnreadPrizeCount(getUnreadPrizeReportsCount())}
        />
      )}
    </div>
  );
}
