import React, { useState, useMemo, useEffect } from 'react';
import { PurchasedOrder, AdminUser, PrizeWonReport } from '../types';
import { siteConfig } from '../config/siteConfig';
import {
  getStoredOrders,
  cancelOrder,
  reactivateOrder,
  getAdminUsers,
  saveAdminUser,
  updateAdminUser,
  changeAdminUserPassword,
  deleteAdminUser,
  toggleAdminUserStatus,
  formatCOP,
  getRaffleTicketStats,
  getRaffleHistory,
  reopenCurrentRaffle,
  getPrizeWonReports,
  getUnreadPrizeReportsCount,
  markAllReportsAsViewed,
  recordPrizeWonReport,
} from '../utils/orderStore';
import { getSpecialPrizeNumbers } from '../utils/prizeNumbersStore';
import { RaffleManagerModal } from './RaffleManagerModal';
import { TicketVoucherModal } from './TicketVoucherModal';
import { AdminPrizeNumbersPanel } from './AdminPrizeNumbersPanel';
import { PrizeAuditReportModal } from './PrizeAuditReportModal';

interface AdminDashboardViewProps {
  onBackToSite: () => void;
  onOpenSettings: () => void;
  onOpenLinksModal?: () => void;
  onOpenRaffleManager?: () => void;
  initialTab?: 'sales_report' | 'orders_table' | 'user_management' | 'access_links' | 'raffle_management' | 'prize_numbers' | 'prize_reports';
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  onBackToSite,
  onOpenSettings,
  onOpenLinksModal,
  onOpenRaffleManager,
  initialTab = 'sales_report',
}) => {
  const [orders, setOrders] = useState<PurchasedOrder[]>(() => getStoredOrders());
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(() => getAdminUsers());
  const [prizeNumbers, setPrizeNumbers] = useState(() => getSpecialPrizeNumbers());
  const [prizeReports, setPrizeReports] = useState<PrizeWonReport[]>(() => getPrizeWonReports());
  
  // Modal de Comenzar Nuevo Sorteo y Finalizar Sorteo
  const [isRaffleManagerOpen, setIsRaffleManagerOpen] = useState<boolean>(false);
  const [raffleManagerMode, setRaffleManagerMode] = useState<'new_raffle' | 'finish_raffle' | 'history'>('new_raffle');

  // Navigation tabs within Dashboard
  const [currentTab, setCurrentTab] = useState<'sales_report' | 'orders_table' | 'user_management' | 'access_links' | 'raffle_management' | 'prize_numbers' | 'prize_reports'>(initialTab);
  const [copiedLinkType, setCopiedLinkType] = useState<'public' | 'admin' | null>(null);
  const [activeDomainSource, setActiveDomainSource] = useState<'current' | 'custom'>('current');

  // Filters for orders & reports
  const [datePeriod, setDatePeriod] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Completado' | 'Anulado'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyWonOrders, setShowOnlyWonOrders] = useState<boolean>(false);

  // Filtros específicos para la pestaña de Reportes en Segundo Plano
  const [reportStatusFilter, setReportStatusFilter] = useState<'all' | 'detectado' | 'verificado' | 'entregado'>('all');
  const [reportSearchQuery, setReportSearchQuery] = useState('');

  // Cancellation modal state
  const [cancelModalOrder, setCancelModalOrder] = useState<PurchasedOrder | null>(null);
  const [cancelReason, setCancelReason] = useState('Cancelado por petición del cliente');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Modal para ver todos los números comprados por el cliente
  const [viewTicketsOrder, setViewTicketsOrder] = useState<PurchasedOrder | null>(null);

  // Modal para visualizar y descargar el Tiquete / Boleta Oficial en PDF, JPG o PNG
  const [voucherModalOrder, setVoucherModalOrder] = useState<PurchasedOrder | null>(null);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);

  // Modal de Auditoría y Reporte en Segundo Plano de Tique Premiado
  const [selectedPrizeReport, setSelectedPrizeReport] = useState<PrizeWonReport | null>(null);
  const [showPrizeReportModal, setShowPrizeReportModal] = useState<boolean>(false);
  const [liveAlertReport, setLiveAlertReport] = useState<PrizeWonReport | null>(null);

  // New admin user form & credentials
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPasswordText, setShowNewPasswordText] = useState(false);
  const [newRole, setNewRole] = useState<'superadmin' | 'operador' | 'auditor'>('operador');
  const [showUserForm, setShowUserForm] = useState(false);

  // Modal para cambiar clave de usuario existente
  const [changePasswordUser, setChangePasswordUser] = useState<AdminUser | null>(null);
  const [editUserNewPassword, setEditUserNewPassword] = useState('');
  const [showEditPasswordText, setShowEditPasswordText] = useState(false);
  const [copiedUserCredentialsId, setCopiedUserCredentialsId] = useState<string | null>(null);
  const [visiblePasswordUserId, setVisiblePasswordUserId] = useState<string | null>(null);

  const refreshData = () => {
    setOrders(getStoredOrders());
    setAdminUsers(getAdminUsers());
    setPrizeNumbers(getSpecialPrizeNumbers());
    setPrizeReports(getPrizeWonReports());
  };

  // Escuchar eventos en tiempo real cuando el sistema en segundo plano detecta un tique premiado
  useEffect(() => {
    const handlePrizeWonEvent = (e: any) => {
      const rep = e.detail as PrizeWonReport;
      if (rep) {
        setLiveAlertReport(rep);
        refreshData();
      }
    };
    window.addEventListener('rifacho_prize_won_detected', handlePrizeWonEvent);
    return () => {
      window.removeEventListener('rifacho_prize_won_detected', handlePrizeWonEvent);
    };
  }, []);

  const openPrizeReportForOrder = (order: PurchasedOrder) => {
    const reports = getPrizeWonReports();
    let found = reports.find(
      (r) =>
        r.orderId === order.id ||
        r.orderNumber === order.orderNumber ||
        (order.wonPrizes && order.wonPrizes.some((wp) => wp.ticketNumber === r.ticketNumber))
    );

    if (!found && order.wonPrizes && order.wonPrizes.length > 0) {
      const first = order.wonPrizes[0];
      found = recordPrizeWonReport({
        order,
        ticketNumber: first.ticketNumber,
        prizeTitle: first.prizeTitle,
      });
      refreshData();
    }

    if (found) {
      setSelectedPrizeReport(found);
      setShowPrizeReportModal(true);
    } else {
      showNotification('⚠️ No se encontró un reporte de premio para esta orden.');
    }
  };

  const openPrizeReportByTicket = (ticketNumber: string) => {
    const reports = getPrizeWonReports();
    const found = reports.find((r) => r.ticketNumber === ticketNumber);
    if (found) {
      setSelectedPrizeReport(found);
      setShowPrizeReportModal(true);
    } else {
      // Buscar orden con ese ticket
      const order = orders.find((o) => o.wonPrizes?.some((wp) => wp.ticketNumber === ticketNumber));
      if (order) {
        openPrizeReportForOrder(order);
      } else {
        showNotification(`No se halló reporte para el boleto #${ticketNumber}`);
      }
    }
  };

  const unreadPrizeReportsCount = useMemo(() => {
    return prizeReports.filter((r) => !r.viewedByAdmin).length;
  }, [prizeReports]);

  const showNotification = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Helper date checking
  const isOrderInPeriod = (orderDateStr: string, period: 'all' | 'today' | 'week' | 'month') => {
    if (period === 'all') return true;
    const orderDate = new Date(orderDateStr.replace(' ', 'T'));
    const now = new Date();

    if (period === 'today') {
      return (
        orderDate.getFullYear() === now.getFullYear() &&
        orderDate.getMonth() === now.getMonth() &&
        orderDate.getDate() === now.getDate()
      );
    }

    if (period === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return orderDate >= oneWeekAgo;
    }

    if (period === 'month') {
      return (
        orderDate.getFullYear() === now.getFullYear() &&
        orderDate.getMonth() === now.getMonth()
      );
    }

    return true;
  };

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Date filter
      if (!isOrderInPeriod(o.createdAt, datePeriod)) return false;

      // Status filter
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;

      // Payment method filter
      if (paymentFilter !== 'all' && !o.paymentMethod.toLowerCase().includes(paymentFilter.toLowerCase())) {
        return false;
      }

      // Search query filter (Order, name, cédula/identification, email, phone, ticket)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesOrder = o.orderNumber.toLowerCase().includes(q);
        const matchesName = `${o.customerName} ${o.customerLastName}`.toLowerCase().includes(q);
        const matchesId = o.identification ? o.identification.toLowerCase().includes(q) : false;
        const matchesEmail = o.email.toLowerCase().includes(q);
        const matchesPhone = o.phone.toLowerCase().includes(q);
        const matchesTicket = o.ticketNumbers.some((t) => t.includes(q));
        if (!matchesOrder && !matchesName && !matchesId && !matchesEmail && !matchesPhone && !matchesTicket) {
          return false;
        }
      }

      // Filtro de solo órdenes con tiques premiados
      if (showOnlyWonOrders && !o.hasWonPrize && (!o.wonPrizes || o.wonPrizes.length === 0)) {
        return false;
      }

      return true;
    });
  }, [orders, datePeriod, statusFilter, paymentFilter, searchQuery, showOnlyWonOrders]);

  // Listado filtrado de Reportes de Premios en Segundo Plano
  const filteredPrizeReports = useMemo(() => {
    return prizeReports.filter((r) => {
      if (reportStatusFilter !== 'all' && r.status !== reportStatusFilter) {
        return false;
      }
      if (reportSearchQuery.trim()) {
        const q = reportSearchQuery.toLowerCase().trim();
        const matchesRep = r.reportNumber.toLowerCase().includes(q);
        const matchesTicket = r.ticketNumber.includes(q);
        const matchesName = `${r.customerName} ${r.customerLastName}`.toLowerCase().includes(q);
        const matchesId = r.identification.toLowerCase().includes(q);
        const matchesPhone = r.phone.toLowerCase().includes(q);
        const matchesOrder = r.orderNumber.toLowerCase().includes(q);
        const matchesPrize = r.prizeTitle.toLowerCase().includes(q);
        if (!matchesRep && !matchesTicket && !matchesName && !matchesId && !matchesPhone && !matchesOrder && !matchesPrize) {
          return false;
        }
      }
      return true;
    });
  }, [prizeReports, reportStatusFilter, reportSearchQuery]);

  // Aggregated Report Metrics
  const metrics = useMemo(() => {
    const activeOrders = filteredOrders.filter((o) => o.status === 'Completado');
    const cancelledOrders = filteredOrders.filter((o) => o.status === 'Anulado');

    const totalSalesCOP = activeOrders.reduce((sum, o) => sum + o.totalCOP, 0);
    const totalTicketsSold = activeOrders.reduce((sum, o) => sum + o.quantity, 0);
    const totalTransactions = activeOrders.length;
    const totalCancelledCount = cancelledOrders.length;
    const totalCancelledCOP = cancelledOrders.reduce((sum, o) => sum + o.totalCOP, 0);

    // Sales by Payment Gateway breakdown
    const paymentBreakdown: Record<string, { count: number; totalCOP: number }> = {};
    activeOrders.forEach((o) => {
      const pm = o.paymentMethod || 'Otro';
      if (!paymentBreakdown[pm]) {
        paymentBreakdown[pm] = { count: 0, totalCOP: 0 };
      }
      paymentBreakdown[pm].count += 1;
      paymentBreakdown[pm].totalCOP += o.totalCOP;
    });

    return {
      totalSalesCOP,
      totalTicketsSold,
      totalTransactions,
      totalCancelledCount,
      totalCancelledCOP,
      paymentBreakdown,
    };
  }, [filteredOrders]);

  // Cancel order execution
  const handleConfirmCancel = () => {
    if (!cancelModalOrder) return;
    const ok = cancelOrder(cancelModalOrder.id, cancelReason, 'Super Administrador');
    if (ok) {
      showNotification(`Orden #${cancelModalOrder.orderNumber} anulada con éxito.`);
      setCancelModalOrder(null);
      setCancelReason('Cancelado por petición del cliente');
      refreshData();
    }
  };

  // Reactivate order execution
  const handleReactivate = (order: PurchasedOrder) => {
    if (confirm(`¿Reactivar la orden #${order.orderNumber} y rehabilitar sus boletos?`)) {
      reactivateOrder(order.id);
      showNotification(`Orden #${order.orderNumber} reactivada.`);
      refreshData();
    }
  };

  // Generador de clave segura aleatoria
  const generateRandomPassword = () => {
    const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';
    let pwd = '';
    for (let i = 0; i < 8; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
  };

  // Create new Admin User with password
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newName.trim() || !newEmail.trim()) {
      alert('Por favor completa todos los campos del nuevo administrador.');
      return;
    }

    const cleanPassword = newPassword.trim();
    if (!cleanPassword) {
      alert('Por favor ingresa o genera una contraseña para este usuario.');
      return;
    }

    if (cleanPassword.length < 4) {
      alert('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    const cleanUsername = newUsername.trim().toLowerCase().replace(/\s+/g, '');
    const existingUsers = getAdminUsers();
    if (existingUsers.some((u) => u.username.toLowerCase() === cleanUsername)) {
      alert(`El nombre de usuario "@${cleanUsername}" ya existe. Elige otro usuario.`);
      return;
    }

    saveAdminUser({
      username: cleanUsername,
      name: newName.trim(),
      email: newEmail.trim(),
      role: newRole,
      passwordHash: cleanPassword,
      password: cleanPassword,
      active: true,
    });

    setNewUsername('');
    setNewName('');
    setNewEmail('');
    setNewPassword('');
    setShowUserForm(false);
    showNotification(`¡Usuario @${cleanUsername} creado exitosamente con su clave de acceso!`);
    refreshData();
  };

  // Guardar nueva clave de usuario existente
  const handleSaveChangedPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!changePasswordUser) return;
    const cleanPwd = editUserNewPassword.trim();
    if (!cleanPwd) {
      alert('Por favor escribe la nueva contraseña.');
      return;
    }
    if (cleanPwd.length < 4) {
      alert('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    const ok = changeAdminUserPassword(changePasswordUser.id, cleanPwd);
    if (ok) {
      showNotification(`✓ Contraseña de @${changePasswordUser.username} actualizada con éxito.`);
      setChangePasswordUser(null);
      setEditUserNewPassword('');
      refreshData();
    } else {
      alert('Error al actualizar la contraseña.');
    }
  };

  // Copiar credenciales de acceso para compartir
  const handleCopyUserCredentials = (user: AdminUser, pwd?: string) => {
    const passwordToShare = pwd || user.passwordHash || user.password || 'admin123';
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://rifacho.com';
    const text = `🔐 CREDENCIALES DE ACCESO AL SISTEMA:\n🌐 Enlace Privado: ${origin}/?admin=true\n👤 Usuario: ${user.username}\n🔑 Contraseña: ${passwordToShare}\n🛡️ Rol: ${user.role.toUpperCase()}`;
    navigator.clipboard.writeText(text);
    setCopiedUserCredentialsId(user.id);
    showNotification(`✓ Credenciales de @${user.username} copiadas al portapapeles.`);
    setTimeout(() => setCopiedUserCredentialsId(null), 2500);
  };

  // Toggle user active status
  const handleToggleUser = (user: AdminUser) => {
    if (user.id === 'adm-1') {
      alert('No puedes desactivar la cuenta del Administrador principal.');
      return;
    }
    toggleAdminUserStatus(user.id);
    refreshData();
  };

  // Delete user
  const handleDeleteUser = (user: AdminUser) => {
    if (user.id === 'adm-1') {
      alert('No puedes eliminar al Administrador principal.');
      return;
    }
    if (confirm(`¿Seguro que deseas eliminar el usuario admin "${user.username}"?`)) {
      deleteAdminUser(user.id);
      showNotification('Usuario eliminado.');
      refreshData();
    }
  };

  // Export CSV of filtered orders
  const exportOrdersCSV = () => {
    if (filteredOrders.length === 0) {
      alert('No hay órdenes para exportar con los filtros actuales.');
      return;
    }

    const headers = [
      'Orden',
      'Fecha',
      'Estado',
      'Cliente',
      'Cedula_Identificacion',
      'Correo',
      'Telefono',
      'Direccion',
      'Cantidad_Boletos',
      'Total_COP',
      'Metodo_Pago',
      'Numeros_Boletos',
    ];

    const rows = filteredOrders.map((o) => [
      o.orderNumber,
      o.createdAt,
      o.status,
      `"${o.customerName} ${o.customerLastName}"`,
      `"${o.identification || 'N/A'}"`,
      o.email,
      `"${o.phone}"`,
      `"${o.address}"`,
      o.quantity,
      o.totalCOP,
      `"${o.paymentMethod}"`,
      `"${o.ticketNumbers.join(';')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_ventas_${datePeriod}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-gray-900">
      {/* Top Navbar */}
      <nav className="bg-[#020000] text-white border-b border-gray-800 px-4 sm:px-8 py-3.5 sticky top-0 z-40 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center font-bold text-lg text-white">
            ⚙️
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight">
              Panel Administrativo de Sorteos
            </h1>
            <p className="text-[11px] text-gray-400">
              Control de Ventas, Compradores, Boletos y Usuarios
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => {
              if (onOpenLinksModal) {
                onOpenLinksModal();
              } else {
                setCurrentTab('access_links');
              }
            }}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-md flex items-center gap-1.5 cursor-pointer transition shadow-xs"
            title="Ver link público para clientes y link privado para administrador"
          >
            <span>🔗</span>
            <span className="hidden sm:inline">Enlaces del Sitio</span>
            <span className="sm:hidden">Links</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setRaffleManagerMode('new_raffle');
              setIsRaffleManagerOpen(true);
            }}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-md flex items-center gap-1.5 cursor-pointer transition shadow-xs"
            title="Comenzar un nuevo sorteo o finalizar el actual con ganador"
          >
            <span>🎲</span>
            <span>Nuevo Sorteo</span>
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold rounded-md border border-gray-700 flex items-center gap-1.5 cursor-pointer transition"
          >
            <span>🎨</span>
            <span className="hidden sm:inline">Logo, Favicon & Pasarela</span>
          </button>
          <button
            type="button"
            onClick={onBackToSite}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-md flex items-center gap-1.5 cursor-pointer transition shadow-sm"
          >
            <span>🌐</span>
            <span>Ver Sorteo en Vivo</span>
          </button>
        </div>
      </nav>

      {/* Floating Action Notice */}
      {actionNotice && (
        <div className="bg-green-600 text-white text-xs py-2 px-4 text-center font-semibold animate-in fade-in sticky top-14 z-30 shadow-md">
          ✓ {actionNotice}
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        
        {/* Banner de Alerta en Vivo si se detecta un Tique Premiado en Segundo Plano */}
        {liveAlertReport && (
          <div className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-slate-950 rounded-2xl p-4 sm:p-5 border-2 border-yellow-300 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-slate-950 text-amber-300 flex items-center justify-center text-2xl shadow-inner shrink-0 animate-bounce">
                🚨
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-slate-950 text-amber-300 text-[10px] font-black uppercase px-2 py-0.5 rounded">
                    ¡Alerta en Vivo - 2° Plano!
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-900 bg-white/40 px-2 py-0.5 rounded">
                    Boleto #{liveAlertReport.ticketNumber}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-950 mt-0.5 leading-tight">
                  ¡Acaba de salir un tique premiado para {liveAlertReport.customerName} {liveAlertReport.customerLastName}!
                </h3>
                <p className="text-xs text-slate-900 font-medium">
                  Premio: <strong>{liveAlertReport.prizeTitle}</strong> • Cédula: <strong>{liveAlertReport.identification}</strong> • Orden #{liveAlertReport.orderNumber}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
              <button
                type="button"
                onClick={() => {
                  setSelectedPrizeReport(liveAlertReport);
                  setShowPrizeReportModal(true);
                }}
                className="px-4 py-2 bg-slate-950 hover:bg-black text-amber-300 font-black rounded-lg text-xs cursor-pointer shadow-md transition"
              >
                📜 Ver Acta y Notificar
              </button>
              <button
                type="button"
                onClick={() => setLiveAlertReport(null)}
                className="px-3 py-2 bg-white/30 hover:bg-white/50 text-slate-950 font-bold rounded-lg text-xs cursor-pointer transition"
                title="Descartar banner"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Navigation Tabs Header */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCurrentTab('access_links')}
            className={`flex-1 min-w-[160px] py-2.5 px-4 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition ${
              currentTab === 'access_links'
                ? 'bg-green-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <span>🔗</span>
            <span>Enlaces de Acceso (Público & Admin)</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('sales_report')}
            className={`flex-1 min-w-[160px] py-2.5 px-4 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition ${
              currentTab === 'sales_report'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <span>📊</span>
            <span>Reporte de Ventas</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('orders_table')}
            className={`flex-1 min-w-[160px] py-2.5 px-4 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition ${
              currentTab === 'orders_table'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <span>🎟️</span>
            <span>Boletos & Clientes ({orders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('prize_numbers')}
            className={`flex-1 min-w-[160px] py-2.5 px-4 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition ${
              currentTab === 'prize_numbers'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <span>🎁</span>
            <span>Números Premiados ({prizeNumbers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCurrentTab('prize_reports');
              markAllReportsAsViewed();
              setPrizeReports(getPrizeWonReports());
            }}
            className={`flex-1 min-w-[170px] py-2.5 px-4 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition ${
              currentTab === 'prize_reports'
                ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-slate-950 shadow-md ring-2 ring-amber-400'
                : unreadPrizeReportsCount > 0
                ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 animate-pulse'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <span>🚨</span>
            <span>Reportes en 2° Plano</span>
            {unreadPrizeReportsCount > 0 ? (
              <span className="bg-red-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full animate-bounce">
                {unreadPrizeReportsCount} NUEVO
              </span>
            ) : (
              <span className="bg-amber-200 text-amber-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {prizeReports.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('user_management')}
            className={`flex-1 min-w-[160px] py-2.5 px-4 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition ${
              currentTab === 'user_management'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <span>👥</span>
            <span>Super Usuario & Creador de Cuentas ({adminUsers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('raffle_management')}
            className={`flex-1 min-w-[160px] py-2.5 px-4 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition ${
              currentTab === 'raffle_management'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <span>🎲</span>
            <span>Gestión del Sorteo (Edición #{siteConfig.editionNumber || 1})</span>
          </button>
        </div>

        {/* Barra Superior Informativa del Sorteo Activo con Botón Directo para Nuevo Sorteo */}
        <div className="bg-gradient-to-r from-gray-900 via-neutral-900 to-black text-white rounded-xl p-4 border border-gray-800 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-xl shrink-0">
              {siteConfig.raffleStatus === 'finalizado' ? '🏆' : '🟢'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base text-white">
                  {siteConfig.raffleSubtitle}
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  siteConfig.raffleStatus === 'finalizado'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  {siteConfig.raffleStatus === 'finalizado' ? 'Sorteo Finalizado' : 'Sorteo Activo'}
                </span>
                <span className="text-[11px] font-mono bg-gray-800 text-gray-300 px-2 py-0.5 rounded">
                  Edición #{siteConfig.editionNumber || 1}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {siteConfig.raffleStatus === 'finalizado' && siteConfig.currentWinner
                  ? `Boleto Ganador: #${siteConfig.currentWinner.ticketNumber} - ${siteConfig.currentWinner.winnerName}`
                  : `Emisión de ${siteConfig.totalAvailableTickets?.toLocaleString('es-CO') || '100.000'} números a $ ${(siteConfig.pricePerTicketCOP || 1000).toLocaleString('es-CO')} COP`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {siteConfig.raffleStatus !== 'finalizado' && (
              <button
                type="button"
                onClick={() => {
                  setRaffleManagerMode('finish_raffle');
                  setIsRaffleManagerOpen(true);
                }}
                className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
              >
                <span>🏆</span>
                <span>Finalizar Sorteo</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setRaffleManagerMode('new_raffle');
                setIsRaffleManagerOpen(true);
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-md hover:shadow-red-600/30 active:scale-95"
            >
              <span>🚀</span>
              <span>Comenzar Nuevo Sorteo</span>
            </button>
          </div>
        </div>

        {/* Global Filter Bar (Period, Payment, Status, Search) */}
        {(currentTab === 'sales_report' || currentTab === 'orders_table') && (
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4 sm:p-5">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              
              {/* Date Filter Quick Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-gray-500 uppercase mr-1">
                  Período:
                </span>
                {[
                  { id: 'all', label: 'Histórico Completo' },
                  { id: 'today', label: '📅 Diario (Hoy)' },
                  { id: 'week', label: '🗓️ Esta Semana' },
                  { id: 'month', label: '📆 Este Mes' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setDatePeriod(p.id as any)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition ${
                      datePeriod === p.id
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Status & Payment Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Botón Filtro Rápido: Solo con Tiques Premiados */}
                <button
                  type="button"
                  onClick={() => setShowOnlyWonOrders(!showOnlyWonOrders)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold cursor-pointer transition flex items-center gap-1.5 shadow-2xs ${
                    showOnlyWonOrders
                      ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300'
                      : 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
                  }`}
                  title="Filtrar y ver únicamente las órdenes que tienen tiques premiados ganados"
                >
                  <span>🏆</span>
                  <span>Solo Premiados ({orders.filter(o => o.hasWonPrize || (o.wonPrizes && o.wonPrizes.length > 0)).length})</span>
                </button>

                {/* Status select */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="text-xs border border-gray-300 rounded-md px-2.5 py-1.5 bg-white text-gray-700 outline-none focus:border-red-600"
                >
                  <option value="all">Todos los Estados</option>
                  <option value="Completado">✓ Solo Completados</option>
                  <option value="Anulado">⚠️ Solo Anulados</option>
                </select>

                {/* Payment gateway select */}
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="text-xs border border-gray-300 rounded-md px-2.5 py-1.5 bg-white text-gray-700 outline-none focus:border-red-600"
                >
                  <option value="all">Todas las Pasarelas</option>
                  <option value="TuCompra">TuCompra</option>
                  <option value="Wompi">Wompi</option>
                  <option value="ePayco">ePayco</option>
                  <option value="Nequi">Nequi</option>
                  <option value="Bancolombia">Bancolombia</option>
                  <option value="PSE">PSE</option>
                </select>

                {/* Export CSV button */}
                <button
                  type="button"
                  onClick={exportOrdersCSV}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
                  title="Descargar reporte en formato Excel / CSV"
                >
                  <span>📥</span>
                  <span>Exportar CSV</span>
                </button>
              </div>
            </div>

            {/* Live Search Input */}
            <div className="mt-3.5 pt-3.5 border-t border-gray-100 flex items-center gap-2">
              <span className="text-gray-400 text-sm">🔍</span>
              <input
                type="text"
                placeholder="Buscar por N° Cédula, Orden (ej: LT-84920), Nombre, Correo, Teléfono o Número de boleto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs sm:text-sm bg-transparent outline-none placeholder:text-gray-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-gray-400 hover:text-gray-600 px-1"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {/* TAB 1: REPORTE DE VENTAS & ANALÍTICAS */}
        {currentTab === 'sales_report' && (
          <div className="space-y-6">

            {/* Disponibilidad de Boletos en Tiempo Real (Live Tracker) */}
            {(() => {
              const liveStats = getRaffleTicketStats();
              return (
                <div className="bg-gradient-to-r from-gray-900 via-neutral-900 to-gray-950 text-white rounded-xl p-5 sm:p-6 shadow-md border border-gray-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                        <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wide">
                          Monitor de Boletos en Tiempo Real
                        </h3>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Emisión oficial de {liveStats.totalTickets.toLocaleString('es-CO')} números para el Combo Tesla
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold px-3 py-1 rounded-full">
                        {liveStats.percentage}% Vendido
                      </span>
                    </div>
                  </div>

                  {/* 3 Bloques principales de tickets */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                        🎟️ Boletos Disponibles Restantes
                      </span>
                      <span className="text-2xl sm:text-3xl font-black font-mono text-white mt-1 block">
                        {liveStats.availableTickets.toLocaleString('es-CO')}
                      </span>
                      <span className="text-[11px] text-gray-400 mt-1 block">
                        Listos para asignación a nuevos compradores
                      </span>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block">
                        ✓ Boletos Vendidos (Activos)
                      </span>
                      <span className="text-2xl sm:text-3xl font-black font-mono text-white mt-1 block">
                        {liveStats.soldTickets.toLocaleString('es-CO')}
                      </span>
                      <span className="text-[11px] text-gray-400 mt-1 block">
                        Asignados en {liveStats.activeOrdersCount} compras exitosas
                      </span>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider block">
                        ✕ Boletos Anulados
                      </span>
                      <span className="text-2xl sm:text-3xl font-black font-mono text-white mt-1 block">
                        {liveStats.cancelledTickets.toLocaleString('es-CO')}
                      </span>
                      <span className="text-[11px] text-gray-400 mt-1 block">
                        Órdenes canceladas que no participan
                      </span>
                    </div>
                  </div>

                  {/* Barra de progreso visual */}
                  <div className="mt-5">
                    <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                      <span>Progreso de colocación de números</span>
                      <span className="font-mono text-white font-bold">{liveStats.percentage}% completado</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-red-600 to-amber-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, liveStats.percentage)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Ventas Totales */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Recaudación Total (Efectiva)
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1 font-mono">
                    {formatCOP(metrics.totalSalesCOP)}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span>Período seleccionado</span>
                  <span className="font-semibold text-gray-700 capitalize">{datePeriod}</span>
                </p>
              </div>

              {/* Card 2: Boletos Vendidos */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Boletos Vendidos
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1 font-mono">
                    {metrics.totalTicketsSold.toLocaleString('es-CO')}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span>Órdenes completadas</span>
                  <span className="font-semibold text-gray-700">{metrics.totalTransactions} transacciones</span>
                </p>
              </div>

              {/* Card 3: Ticket Promedio */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Ticket Promedio de Compra
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 mt-1 font-mono">
                    {metrics.totalTransactions > 0
                      ? formatCOP(Math.round(metrics.totalSalesCOP / metrics.totalTransactions))
                      : '$ 0 COP'}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span>Boletos por cliente</span>
                  <span className="font-semibold text-gray-700">
                    {metrics.totalTransactions > 0
                      ? Math.round(metrics.totalTicketsSold / metrics.totalTransactions)
                      : 0}{' '}
                    nums
                  </span>
                </p>
              </div>

              {/* Card 4: Boletos Anulados */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Órdenes Anuladas
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-red-600 mt-1 font-mono">
                    {metrics.totalCancelledCount}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span>Monto no liquidado</span>
                  <span className="font-semibold text-red-700 font-mono">
                    {formatCOP(metrics.totalCancelledCOP)}
                  </span>
                </p>
              </div>
            </div>

            {/* Breakdown by Payment Gateway */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base flex items-center gap-2">
                    <span>💳</span>
                    <span>Ventas por Medio de Pago</span>
                  </h3>
                  <span className="text-xs text-gray-500">Total recaudado</span>
                </div>

                {Object.keys(metrics.paymentBreakdown).length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-500">
                    No hay ventas registradas en el período seleccionado.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(metrics.paymentBreakdown).map(([gateway, data]) => {
                      const percentage = metrics.totalSalesCOP > 0
                        ? Math.round((data.totalCOP / metrics.totalSalesCOP) * 100)
                        : 0;

                      return (
                        <div key={gateway} className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs sm:text-sm">
                            <span className="font-bold text-gray-800">{gateway}</span>
                            <div className="flex items-center gap-2 font-mono">
                              <span className="text-gray-500 text-xs">({data.count} ventas)</span>
                              <strong className="text-emerald-700">{formatCOP(data.totalCOP)}</strong>
                              <span className="text-xs font-semibold text-gray-600 w-10 text-right">
                                {percentage}%
                              </span>
                            </div>
                          </div>
                          {/* Progress bar */}
                          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                            <div
                              className="bg-red-600 h-2.5 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quick Summary of Recent Activity */}
              <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-3 flex items-center gap-2">
                    <span>📈</span>
                    <span>Resumen Operativo</span>
                  </h3>
                  <div className="space-y-3 text-xs sm:text-sm text-gray-600">
                    <div className="flex justify-between pb-2 border-b border-gray-100">
                      <span>Total de transacciones:</span>
                      <strong className="text-gray-900 font-mono">{filteredOrders.length}</strong>
                    </div>
                    <div className="flex justify-between pb-2 border-b border-gray-100">
                      <span>Tasa de éxito:</span>
                      <strong className="text-emerald-600 font-mono">
                        {filteredOrders.length > 0
                          ? Math.round((metrics.totalTransactions / filteredOrders.length) * 100)
                          : 100}%
                      </strong>
                    </div>
                    <div className="flex justify-between pb-2 border-b border-gray-100">
                      <span>Boletos anulados:</span>
                      <strong className="text-red-600 font-mono">{metrics.totalCancelledCount} órdenes</strong>
                    </div>
                    <div className="flex justify-between pb-2 border-b border-gray-100">
                      <span>Filtro de fecha aplicado:</span>
                      <strong className="text-gray-800 capitalize">{datePeriod}</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-5 p-3.5 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-600">
                  💡 <strong>Tip de Auditoría:</strong> Puedes cambiar el período (Diario, Semanal, Mensual) en la barra superior o exportar a Excel / CSV para conciliar con tu banco.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GESTIÓN DE BOLETOS, ÓRDENES Y ANULACIONES */}
        {currentTab === 'orders_table' && (
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-gray-900 text-base">
                  Registro de Boletos y Clientes ({filteredOrders.length})
                </h3>
                <p className="text-xs text-gray-500">
                  Consulta de datos personales de compradores, números generados y anulación de tickets
                </p>
              </div>
              <button
                type="button"
                onClick={exportOrdersCSV}
                className="self-start sm:self-auto px-3.5 py-1.5 bg-gray-900 hover:bg-black text-white rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <span>📥 Descargar Listado</span>
              </button>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="p-12 text-center text-gray-500 text-sm">
                No se encontraron órdenes con los filtros seleccionados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-gray-50 text-gray-600 text-[11px] uppercase tracking-wider border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-4">Orden</th>
                      <th className="py-3 px-4">Fecha</th>
                      <th className="py-3 px-4">Cliente / Contacto</th>
                      <th className="py-3 px-4">Medio de Pago</th>
                      <th className="py-3 px-4">Cantidad</th>
                      <th className="py-3 px-4">Números Asignados</th>
                      <th className="py-3 px-4">Total COP</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredOrders.map((o) => {
                      const isWinningOrder = Boolean(o.hasWonPrize || (o.wonPrizes && o.wonPrizes.length > 0));

                      return (
                      <tr
                        key={o.id}
                        className={`transition ${
                          o.status === 'Anulado'
                            ? 'bg-red-50/30 hover:bg-red-50/50'
                            : isWinningOrder
                            ? 'bg-gradient-to-r from-amber-500/15 via-yellow-500/5 to-transparent border-l-4 border-l-amber-500 hover:bg-amber-50/80 shadow-2xs'
                            : 'hover:bg-gray-50/80'
                        }`}
                      >
                        {/* Orden & ID */}
                        <td className="py-3.5 px-4 font-mono font-bold text-gray-900 whitespace-nowrap">
                          <div className="flex flex-col gap-1 items-start">
                            <span>#{o.orderNumber}</span>
                            {isWinningOrder && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 px-2 py-0.5 rounded-full border border-amber-500 shadow-2xs animate-pulse">
                                <span>🏆</span>
                                <span>TIQUE PREMIADO</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Fecha */}
                        <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap text-xs">
                          {o.createdAt}
                        </td>

                        {/* Cliente */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-gray-900">
                            {o.customerName} {o.customerLastName}
                          </div>
                          <div className="text-xs font-mono font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-300 inline-flex items-center gap-1 my-1">
                            <span>🆔 C.C.</span>
                            <span>{o.identification || 'Sin registrar'}</span>
                          </div>
                          {isWinningOrder && o.wonPrizes && o.wonPrizes.length > 0 && (
                            <div className="text-[11px] font-bold text-amber-950 bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-200 border border-amber-400 p-2 rounded-lg flex flex-col gap-1.5 my-1.5 shadow-2xs">
                              <div className="flex items-center gap-1.5">
                                <span className="text-base">🏆</span>
                                <span className="font-black">
                                  ¡Ganó: {o.wonPrizes.map((p) => `${p.prizeTitle} (Boleto #${p.ticketNumber})`).join(', ')}!
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold bg-amber-900 text-amber-100 px-1.5 py-0.5 rounded">
                                  ⚡ Reportado en Segundo Plano
                                </span>
                                <button
                                  type="button"
                                  onClick={() => openPrizeReportForOrder(o)}
                                  className="text-[10px] font-black bg-slate-950 hover:bg-black text-amber-300 px-2 py-0.5 rounded cursor-pointer transition flex items-center gap-1 shadow-2xs"
                                >
                                  <span>📜</span>
                                  <span>Ver Acta de Reporte</span>
                                </button>
                              </div>
                            </div>
                          )}
                          <div className="text-xs text-gray-500 font-mono">{o.email}</div>
                          <div className="text-[11px] text-gray-400">📞 +57 {o.phone}</div>
                          {o.address && (
                            <div className="text-[11px] text-gray-400 truncate max-w-[200px]" title={o.address}>
                              📍 {o.address}
                            </div>
                          )}
                        </td>

                        {/* Medio de Pago */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-xs text-gray-700">
                          <span className="font-medium bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                            {o.paymentMethod}
                          </span>
                        </td>

                        {/* Cantidad */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-semibold text-gray-900">{o.quantity} boletos</span>
                        </td>

                        {/* Números Asignados / Comprados */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap items-center gap-1.5 max-w-[240px]">
                            {o.ticketNumbers.slice(0, 3).map((ticket) => {
                              const isWonTicket = o.wonPrizes?.some((wp) => wp.ticketNumber === ticket);
                              return (
                                <span
                                  key={ticket}
                                  className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded ${
                                    isWonTicket
                                      ? 'bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-950 font-black border border-amber-500 shadow-xs ring-1 ring-amber-400 inline-flex items-center gap-0.5'
                                      : o.status === 'Anulado'
                                      ? 'bg-red-100 text-red-700 line-through'
                                      : 'bg-gray-100 text-gray-800 border border-gray-300'
                                  }`}
                                >
                                  {isWonTicket ? `👑 #${ticket}` : ticket}
                                </span>
                              );
                            })}
                            {o.ticketNumbers.length > 3 && (
                              <button
                                type="button"
                                onClick={() => setViewTicketsOrder(o)}
                                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200"
                                title="Ver todos los números comprados"
                              >
                                +{o.ticketNumbers.length - 3} más
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Total COP */}
                        <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-emerald-700">
                          {formatCOP(o.totalCOP)}
                        </td>

                        {/* Estado */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {o.status === 'Anulado' ? (
                            <div>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-700 border border-red-200">
                                ✕ Anulado
                              </span>
                              {o.cancelledReason && (
                                <p className="text-[10px] text-red-500 max-w-[120px] truncate" title={o.cancelledReason}>
                                  {o.cancelledReason}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-green-100 text-green-700">
                              ✓ Completado
                            </span>
                          )}
                        </td>

                        {/* Acciones */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex flex-col gap-1.5 items-center">
                            {/* Botón Ver Acta y Reporte de Premio si la orden tiene premio */}
                            {isWinningOrder && (
                              <button
                                type="button"
                                onClick={() => openPrizeReportForOrder(o)}
                                className="px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black rounded text-xs flex items-center justify-center gap-1 cursor-pointer transition shadow-xs w-full"
                                title="Ver acta y reporte generado en segundo plano para este premio"
                              >
                                <span>🚨</span>
                                <span>Reporte Premio</span>
                              </button>
                            )}

                            {/* Botón Descargar Tiquete / Boleta Oficial en PDF / JPG / PNG */}
                            <button
                              type="button"
                              onClick={() => {
                                setVoucherModalOrder(o);
                                setIsVoucherModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition shadow-xs w-full"
                              title="Ver y descargar tiquete de boleta en PDF, JPG o PNG"
                            >
                              <span>🎟️</span>
                              <span>Boleta (PDF/JPG/PNG)</span>
                            </button>

                            {o.status === 'Anulado' ? (
                              <button
                                type="button"
                                onClick={() => handleReactivate(o)}
                                className="px-2 py-0.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded text-[11px] font-semibold cursor-pointer transition w-full"
                                title="Reactivar boletos"
                              >
                                Reactivar
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setCancelModalOrder(o)}
                                className="px-2 py-0.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 rounded text-[11px] font-semibold cursor-pointer transition w-full"
                                title="Anular ticket y deshabilitar boletos"
                              >
                                Anular
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: GESTIÓN DE USUARIOS ADMINISTRADORES & CLAVES */}
        {currentTab === 'user_management' && (
          <div className="space-y-6">
            {/* Header del Modo Super Usuario */}
            <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">👥</span>
                  <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                    Modo Super Usuario & Creador de Cuentas
                  </h3>
                  <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-red-200">
                    {adminUsers.length} Administradores
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Crea y administra cuentas con sus respectivas <strong>claves de acceso</strong> y roles para consultar pagos, anular boletos y auditar movimientos.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const superAdmin = adminUsers.find(u => u.role === 'superadmin') || adminUsers[0];
                    if (superAdmin) {
                      setChangePasswordUser(superAdmin);
                      setEditUserNewPassword(superAdmin.passwordHash || superAdmin.password || 'admin123');
                      setShowEditPasswordText(true);
                    }
                  }}
                  className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-gray-300 transition shadow-2xs"
                  title="Cambiar la clave del Super Administrador principal"
                >
                  <span>🔑</span>
                  <span>Cambiar Clave Superadmin</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!showUserForm) {
                      setNewPassword(generateRandomPassword());
                      setShowNewPasswordText(true);
                    }
                    setShowUserForm(!showUserForm);
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                >
                  <span>{showUserForm ? '✕ Cancelar' : '+ Crear Nuevo Administrador'}</span>
                </button>
              </div>
            </div>

            {/* Formulario para Crear Nuevo Administrador con Clave */}
            {showUserForm && (
              <form
                onSubmit={handleCreateUser}
                className="bg-white rounded-xl shadow-xs border-2 border-red-500/50 p-5 sm:p-6 space-y-5 animate-in fade-in"
              >
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <h4 className="font-bold text-sm sm:text-base text-gray-900 flex items-center gap-2">
                    <span>👤</span>
                    <span>Crear Nuevo Usuario Administrador</span>
                  </h4>
                  <span className="text-xs text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded border border-red-200">
                    Campos con (*) son obligatorios
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Usuario Login */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Usuario (Login) <span className="text-red-600">*</span>:
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-gray-400 font-mono text-xs">
                        @
                      </span>
                      <input
                        type="text"
                        required
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                        placeholder="ej: operador1"
                        className="w-full text-xs pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 font-mono font-bold text-gray-800"
                      />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">Identificador para iniciar sesión (sin espacios).</p>
                  </div>

                  {/* Contraseña / Clave */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-gray-700">
                        Contraseña / Clave <span className="text-red-600">*</span>:
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const pwd = generateRandomPassword();
                          setNewPassword(pwd);
                          setShowNewPasswordText(true);
                        }}
                        className="text-[10px] font-bold text-red-600 hover:text-red-800 underline cursor-pointer"
                        title="Generar clave aleatoria"
                      >
                        ⚡ Generar Clave
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showNewPasswordText ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full text-xs pl-3 pr-10 py-2.5 border border-gray-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 font-mono font-bold text-gray-800"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPasswordText(!showNewPasswordText)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-gray-500 hover:text-gray-800 cursor-pointer"
                        title={showNewPasswordText ? 'Ocultar clave' : 'Ver clave'}
                      >
                        {showNewPasswordText ? '🙈' : '👁️'}
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">
                      Mínimo 4 caracteres. Con esta clave ingresará al panel.
                    </p>
                  </div>

                  {/* Rol / Permisos */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Rol / Permisos <span className="text-red-600">*</span>:
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as any)}
                      className="w-full text-xs px-3 py-2.5 border border-gray-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-red-500 font-semibold text-gray-800"
                    >
                      <option value="superadmin">👑 Super Administrador (Control Total)</option>
                      <option value="operador">⚡ Operador (Pagos, Boletos y Anulaciones)</option>
                      <option value="auditor">🔍 Auditor (Solo Lectura y Reportes)</option>
                    </select>
                    <p className="text-[10px] text-gray-500 mt-1">Define qué funciones puede ver y modificar.</p>
                  </div>

                  {/* Nombre Completo */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Nombre Completo <span className="text-red-600">*</span>:
                    </label>
                    <input
                      type="text"
                      required
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="ej: Carlos Pérez"
                      className="w-full text-xs px-3 py-2.5 border border-gray-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  {/* Correo Electrónico */}
                  <div className="sm:col-span-2 lg:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Correo Electrónico <span className="text-red-600">*</span>:
                    </label>
                    <input
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="carlos@rifacho.com"
                      className="w-full text-xs px-3 py-2.5 border border-gray-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                {/* Nota informativa de seguridad */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                  <span className="text-base">💡</span>
                  <div>
                    <strong>Instrucciones para el nuevo usuario:</strong>
                    <span className="block mt-0.5 text-amber-800">
                      Podrá ingresar al panel abriendo el enlace privado con <code className="font-mono font-bold bg-amber-200/60 px-1 py-0.5 rounded">?admin=true</code> usando su usuario y la contraseña asignada.
                    </span>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex justify-end items-center gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserForm(false);
                      setNewPassword('');
                    }}
                    className="px-4 py-2 text-xs text-gray-600 hover:text-gray-900 cursor-pointer font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold cursor-pointer shadow-xs transition flex items-center gap-1.5"
                  >
                    <span>✓</span>
                    <span>Crear Usuario con Clave</span>
                  </button>
                </div>
              </form>
            )}

            {/* Tabla de Usuarios Administradores con Gestión de Claves */}
            <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
              <div className="p-4 bg-gray-50/70 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
                  Cuentas Registradas en el Sistema
                </span>
                <span className="text-xs text-gray-500">
                  Haz clic en <strong>🔑 Cambiar Clave</strong> para modificar la contraseña de cualquier usuario en cualquier momento.
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-gray-50 text-gray-600 text-[11px] uppercase tracking-wider border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-4">Usuario</th>
                      <th className="py-3 px-4">Nombre</th>
                      <th className="py-3 px-4">Correo</th>
                      <th className="py-3 px-4">Rol</th>
                      <th className="py-3 px-4">Contraseña / Clave</th>
                      <th className="py-3 px-4">Fecha Creación</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {adminUsers.map((u) => {
                      const userPwd = u.passwordHash || u.password || 'admin123';
                      const isPwdVisible = visiblePasswordUserId === u.id;
                      const isCopied = copiedUserCredentialsId === u.id;

                      return (
                        <tr key={u.id} className="hover:bg-gray-50/80 transition">
                          <td className="py-3 px-4 font-mono font-bold text-gray-900 whitespace-nowrap">
                            <span className="text-red-600 mr-0.5">@</span>{u.username}
                          </td>

                          <td className="py-3 px-4 font-medium text-gray-800 whitespace-nowrap">
                            {u.name}
                          </td>

                          <td className="py-3 px-4 text-gray-600 font-mono text-xs whitespace-nowrap">
                            {u.email}
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase inline-flex items-center gap-1 ${
                                u.role === 'superadmin'
                                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                  : u.role === 'operador'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : 'bg-gray-100 text-gray-800 border border-gray-200'
                              }`}
                            >
                              <span>{u.role === 'superadmin' ? '👑' : u.role === 'operador' ? '⚡' : '🔍'}</span>
                              <span>{u.role}</span>
                            </span>
                          </td>

                          {/* Contraseña / Clave con Cambiar y Ver */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs bg-gray-100 border border-gray-200 px-2 py-1 rounded text-gray-800 font-bold min-w-[70px] text-center">
                                {isPwdVisible ? userPwd : '••••••••'}
                              </span>

                              <button
                                type="button"
                                onClick={() => setVisiblePasswordUserId(isPwdVisible ? null : u.id)}
                                className="p-1 text-gray-500 hover:text-gray-800 rounded transition cursor-pointer text-xs"
                                title={isPwdVisible ? 'Ocultar clave' : 'Ver clave'}
                              >
                                {isPwdVisible ? '🙈' : '👁️'}
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setChangePasswordUser(u);
                                  setEditUserNewPassword(userPwd);
                                  setShowEditPasswordText(true);
                                }}
                                className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded text-[11px] font-bold transition cursor-pointer flex items-center gap-1"
                                title="Cambiar clave de este usuario"
                              >
                                <span>🔑</span>
                                <span>Cambiar</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleCopyUserCredentials(u)}
                                className={`px-2 py-1 rounded text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                                  isCopied
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
                                }`}
                                title="Copiar credenciales completas para enviar al usuario"
                              >
                                <span>{isCopied ? '✓' : '📋'}</span>
                                <span>{isCopied ? '¡Copiado!' : 'Copiar'}</span>
                              </button>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-gray-500 text-xs whitespace-nowrap">
                            {u.createdAt}
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                u.active
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {u.active ? '✓ Activo' : '✕ Inactivo'}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-center whitespace-nowrap space-x-2">
                            {u.id !== 'adm-1' ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleToggleUser(u)}
                                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline cursor-pointer"
                                >
                                  {u.active ? 'Desactivar' : 'Activar'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(u)}
                                  className="text-xs text-red-600 hover:text-red-800 font-semibold underline cursor-pointer"
                                >
                                  Eliminar
                                </button>
                              </>
                            ) : (
                              <span className="text-[11px] text-gray-400 italic">Cuenta Principal</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal para Cambiar Clave de un Usuario */}
            {changePasswordUser && (
              <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
                <div
                  className="bg-white text-gray-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-200 animate-in zoom-in-95 duration-150"
                  role="dialog"
                  aria-modal="true"
                >
                  <div className="bg-gray-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-gray-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🔑</span>
                      <div>
                        <h4 className="text-sm sm:text-base font-bold">
                          Cambiar Contraseña de Acceso
                        </h4>
                        <p className="text-xs text-gray-400">
                          Usuario: <strong className="text-amber-400 font-mono">@{changePasswordUser.username}</strong> ({changePasswordUser.name})
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setChangePasswordUser(null)}
                      className="text-gray-400 hover:text-white p-1 rounded font-bold transition text-lg"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleSaveChangedPassword} className="p-5 space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-gray-700">
                          Nueva Contraseña:
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const pwd = generateRandomPassword();
                            setEditUserNewPassword(pwd);
                            setShowEditPasswordText(true);
                          }}
                          className="text-[11px] font-bold text-red-600 hover:text-red-800 underline cursor-pointer"
                        >
                          ⚡ Generar Aleatoria
                        </button>
                      </div>

                      <div className="relative">
                        <input
                          type={showEditPasswordText ? 'text' : 'password'}
                          required
                          value={editUserNewPassword}
                          onChange={(e) => setEditUserNewPassword(e.target.value)}
                          placeholder="Nueva contraseña..."
                          className="w-full text-sm pl-3 pr-10 py-2.5 border border-gray-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-red-500 font-mono font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => setShowEditPasswordText(!showEditPasswordText)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-gray-500 hover:text-gray-800 cursor-pointer"
                        >
                          {showEditPasswordText ? '🙈' : '👁️'}
                        </button>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1">
                        Esta contraseña reemplazará inmediatamente la clave anterior del usuario.
                      </p>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-600 space-y-1">
                      <div>
                        <strong>Rol del usuario:</strong> <span className="uppercase font-bold text-gray-800">{changePasswordUser.role}</span>
                      </div>
                      <div>
                        <strong>Correo:</strong> <span className="font-mono text-gray-800">{changePasswordUser.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => handleCopyUserCredentials(changePasswordUser, editUserNewPassword)}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold cursor-pointer transition border border-gray-300 flex items-center gap-1"
                      >
                        <span>📋</span>
                        <span>Copiar Credenciales</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setChangePasswordUser(null)}
                          className="px-3 py-2 text-xs text-gray-600 hover:text-gray-800 cursor-pointer font-semibold"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold cursor-pointer transition shadow-xs"
                        >
                          Guardar Contraseña
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA: ENLACES DE ACCESO (PÚBLICO Y ADMINISTRADOR) */}
        {currentTab === 'access_links' && (() => {
          const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://rifacho.com';
          const customOrigin = `${siteConfig.domain.protocol}://${siteConfig.domain.customDomain}`;
          const base = activeDomainSource === 'custom' && siteConfig.domain.customDomain ? customOrigin : currentOrigin;
          const publicUrl = `${base}/`;
          const adminUrl = `${base}/?admin=true`;

          const handleCopy = (text: string, type: 'public' | 'admin') => {
            navigator.clipboard.writeText(text);
            setCopiedLinkType(type);
            setTimeout(() => setCopiedLinkType(null), 2500);
          };

          const whatsappText = encodeURIComponent(
            `🎟️ ¡Participa ya en el sorteo de ${siteConfig.raffleName}! 🔥 ${siteConfig.awardHighlightText} - ${siteConfig.productTitle}.\n\n👇 Compra tus boletos aquí:\n${publicUrl}`
          );

          return (
            <div className="space-y-6">
              {/* Header Selector de Dominio */}
              <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span>🔗</span>
                    <span>Enlaces de Acceso al Sistema</span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Aquí tienes el link oficial para tus clientes y tu link privado para administrar la página.
                  </p>
                </div>

                <div className="inline-flex rounded-lg bg-gray-100 p-1 border border-gray-200 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveDomainSource('current')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                      activeDomainSource === 'current'
                        ? 'bg-white text-gray-900 shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    🌐 Servidor Actual
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveDomainSource('custom')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                      activeDomainSource === 'custom'
                        ? 'bg-white text-gray-900 shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    ⚡ Dominio ({siteConfig.domain.customDomain || 'rifacho.com'})
                  </button>
                </div>
              </div>

              {/* Grid con los dos enlaces */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 1. ENLACE PÚBLICO */}
                <div className="bg-white rounded-xl shadow-xs border-2 border-green-500/40 p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-green-600 text-white text-[11px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider flex items-center gap-1">
                    <span>✓</span>
                    <span>Para Clientes</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">🌐</span>
                      <div>
                        <h3 className="text-base font-bold text-gray-900">
                          1. Enlace para el Público (Clientes)
                        </h3>
                        <p className="text-xs text-green-700 font-semibold">
                          El link que ve el público y tus compradores
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                      Comparte este enlace en tus estados de <strong>WhatsApp</strong>, historias de <strong>Instagram</strong>, grupos de <strong>Telegram</strong> y publicidad. Tus clientes verán la página de compra limpia, <strong>sin botones de administración ni edición</strong>.
                    </p>

                    {/* Input Link Público */}
                    <div className="bg-gray-50 border border-green-300 rounded-lg p-2 flex items-center gap-2 mb-3">
                      <input
                        type="text"
                        readOnly
                        value={publicUrl}
                        className="bg-transparent font-mono text-xs sm:text-sm text-gray-800 flex-1 outline-none select-all px-1"
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                      />
                      <button
                        type="button"
                        onClick={() => handleCopy(publicUrl, 'public')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition shadow-xs shrink-0 cursor-pointer ${
                          copiedLinkType === 'public'
                            ? 'bg-green-700 text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        {copiedLinkType === 'public' ? '✓ ¡Copiado!' : '📋 Copiar Link'}
                      </button>
                    </div>

                    {/* Acciones para el enlace público */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 mb-4">
                      <a
                        href={`https://api.whatsapp.com/send?text=${whatsappText}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#25D366] hover:bg-[#20bd5a] text-white px-3 py-1.5 rounded-md transition shadow-xs"
                      >
                        <span>💬</span>
                        <span>Compartir por WhatsApp</span>
                      </a>
                      <button
                        type="button"
                        onClick={onBackToSite}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded-md transition cursor-pointer"
                      >
                        <span>👁️</span>
                        <span>Ver Vista de Cliente</span>
                      </button>
                    </div>
                  </div>

                  {/* QR Code preview */}
                  <div className="bg-green-50/50 border border-green-200 rounded-lg p-3 flex items-center gap-3">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(publicUrl)}`}
                      alt="QR Enlace Público"
                      className="w-20 h-20 rounded border border-green-200 bg-white p-1"
                    />
                    <div className="text-xs text-gray-600">
                      <span className="font-bold text-gray-900 block">Código QR para Volantes</span>
                      Tus clientes pueden escanearlo con la cámara del celular para comprar boletos al instante.
                    </div>
                  </div>
                </div>

                {/* 2. ENLACE ADMINISTRADOR */}
                <div className="bg-white rounded-xl shadow-xs border-2 border-red-500/40 p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-red-600 text-white text-[11px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider flex items-center gap-1">
                    <span>🔒</span>
                    <span>Privado / Administrador</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">🔐</span>
                      <div>
                        <h3 className="text-base font-bold text-gray-900">
                          2. Enlace para Entrar al Administrador
                        </h3>
                        <p className="text-xs text-red-700 font-semibold">
                          Acceso exclusivo para dueños y operadores
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                      Usa este enlace para ingresar directamente a este panel. Podrás ver <strong>todas las ventas</strong>, el <strong>listado de clientes con sus números comprados</strong>, anular boletos, cambiar pasarelas y fotos.
                    </p>

                    {/* Input Link Admin */}
                    <div className="bg-gray-50 border border-red-300 rounded-lg p-2 flex items-center gap-2 mb-3">
                      <input
                        type="text"
                        readOnly
                        value={adminUrl}
                        className="bg-transparent font-mono text-xs sm:text-sm text-gray-800 flex-1 outline-none select-all px-1"
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                      />
                      <button
                        type="button"
                        onClick={() => handleCopy(adminUrl, 'admin')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition shadow-xs shrink-0 cursor-pointer ${
                          copiedLinkType === 'admin'
                            ? 'bg-red-700 text-white'
                            : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                      >
                        {copiedLinkType === 'admin' ? '✓ ¡Copiado!' : '📋 Copiar Link Admin'}
                      </button>
                    </div>

                    {/* Credenciales de Acceso */}
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-gray-700 space-y-1 mb-4">
                      <div className="font-bold text-gray-900 flex items-center gap-1.5">
                        <span>🔑</span>
                        <span>Credenciales por defecto:</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
                        <span className="bg-white px-2 py-0.5 rounded border border-red-200">
                          Usuario: <strong>admin</strong>
                        </span>
                        <span className="bg-white px-2 py-0.5 rounded border border-red-200">
                          Contraseña: <strong>admin123</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* QR Code admin mobile */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center gap-3">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(adminUrl)}`}
                      alt="QR Enlace Admin"
                      className="w-20 h-20 rounded border border-gray-200 bg-white p-1"
                    />
                    <div className="text-xs text-gray-600">
                      <span className="font-bold text-gray-900 block">Acceso Móvil para el Administrador</span>
                      Escanéalo con tu celular para administrar el sorteo y monitorear ventas en cualquier lugar.
                    </div>
                  </div>
                </div>

              </div>

              {/* Guía rápida */}
              <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4 sm:p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <span>💡</span>
                  <span>Preguntas Frecuentes sobre los Enlaces</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <strong className="text-gray-900 block mb-1">¿Qué pasa si un cliente entra al link público?</strong>
                    Ve únicamente el diseño del sorteo, las fotos de los premios, la barra de progreso, el buscador de boletos y el botón de pago. No hay botones de editar ni acceso a las ventas.
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <strong className="text-gray-900 block mb-1">¿Cómo abro el panel si estoy en el celular o navegador?</strong>
                    Guarda en tus marcadores tu enlace privado con <code className="bg-gray-200 px-1 py-0.5 rounded font-mono font-bold text-red-600">?admin=true</code> o escribe <code className="bg-gray-200 px-1 py-0.5 rounded font-mono font-bold text-red-600">#admin</code> al final de tu dirección web. La página principal no muestra ningún botón público abajo para máxima privacidad y seguridad.
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* TAB 5: GESTIÓN DEL CICLO DE VIDA DEL SORTEO & HISTORIAL */}
        {currentTab === 'raffle_management' && (() => {
          const liveStats = getRaffleTicketStats();
          const history = getRaffleHistory();
          const isFinished = siteConfig.raffleStatus === 'finalizado';

          return (
            <div className="space-y-6">
              {/* Tarjeta de Estado del Sorteo Actual */}
              <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-extrabold text-gray-900">
                        Sorteo Actual: {siteConfig.raffleSubtitle}
                      </span>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        isFinished
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}>
                        {isFinished ? '🏁 Finalizado' : '🟢 Activo para Compras'}
                      </span>
                      <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                        Edición #{siteConfig.editionNumber || 1}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Controla cuándo termina la edición actual y lanza nuevos sorteos con nuevos premios de forma ilimitada.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRaffleManagerMode('new_raffle');
                        setIsRaffleManagerOpen(true);
                      }}
                      className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer transition"
                    >
                      <span>🚀</span>
                      <span>Comenzar Nuevo Sorteo</span>
                    </button>
                  </div>
                </div>

                {/* Métricas clave de la edición activa */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Boletos Vendidos</span>
                    <span className="text-xl font-mono font-black text-gray-900 mt-0.5 block">
                      {liveStats.soldTickets.toLocaleString('es-CO')}
                    </span>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Boletos Disponibles</span>
                    <span className="text-xl font-mono font-black text-emerald-700 mt-0.5 block">
                      {liveStats.availableTickets.toLocaleString('es-CO')}
                    </span>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Precio por Boleto</span>
                    <span className="text-xl font-mono font-black text-gray-900 mt-0.5 block">
                      {formatCOP(siteConfig.pricePerTicketCOP || 1000)}
                    </span>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Total Recaudado</span>
                    <span className="text-xl font-mono font-black text-emerald-700 mt-0.5 block">
                      {formatCOP(liveStats.soldTickets * (siteConfig.pricePerTicketCOP || 1000))}
                    </span>
                  </div>
                </div>

                {/* Acciones de finalización */}
                {isFinished ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div>
                      <strong className="text-amber-950 font-bold block">
                        Este sorteo está marcado como finalizado.
                      </strong>
                      {siteConfig.currentWinner && (
                        <span className="text-amber-800">
                          Boleto Ganador: <strong>#{siteConfig.currentWinner.ticketNumber}</strong> — {siteConfig.currentWinner.winnerName} ({siteConfig.currentWinner.lotteryOrSource || 'Sorteo oficial'})
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          reopenCurrentRaffle();
                          refreshData();
                          showNotification('Sorteo reactivado.');
                        }}
                        className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-lg cursor-pointer transition"
                      >
                        ↺ Reabrir Sorteo
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRaffleManagerMode('new_raffle');
                          setIsRaffleManagerOpen(true);
                        }}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg cursor-pointer transition shadow-xs"
                      >
                        🚀 Comenzar Nuevo Sorteo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div>
                      <strong className="text-gray-900 block font-bold">
                        ¿Llegó el día del sorteo o se vendieron todos los boletos?
                      </strong>
                      <span className="text-gray-500">
                        Declara el boleto y cliente ganador oficial, o inicia un nuevo sorteo inmediatamente para tu comunidad.
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setRaffleManagerMode('finish_raffle');
                          setIsRaffleManagerOpen(true);
                        }}
                        className="px-3 py-1.5 bg-gray-900 hover:bg-black text-white font-bold rounded-lg cursor-pointer transition"
                      >
                        🏆 Declarar Ganador & Finalizar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRaffleManagerMode('new_raffle');
                          setIsRaffleManagerOpen(true);
                        }}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg cursor-pointer transition shadow-xs"
                      >
                        🚀 Comenzar Nuevo Sorteo
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Historial de Sorteos Anteriores */}
              <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2">
                    <span>📚</span>
                    <span>Historial de Sorteos Anteriores Archivados ({history.length})</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setRaffleManagerMode('new_raffle');
                      setIsRaffleManagerOpen(true);
                    }}
                    className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                  >
                    <span>➕</span>
                    <span>Comenzar Nuevo Sorteo</span>
                  </button>
                </div>

                {history.length === 0 ? (
                  <div className="p-8 text-center bg-gray-50 rounded-xl border border-gray-200">
                    <div className="text-3xl mb-2">📦</div>
                    <p className="text-xs text-gray-500">
                      Aún no hay sorteos archivados. Cuando finalices un sorteo o comiences uno nuevo, el anterior se guardará aquí automáticamente con sus ventas, ganadores y números emitidos.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.map((ed) => (
                      <div
                        key={ed.id}
                        className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 hover:bg-white hover:border-gray-300 transition space-y-2"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-gray-200/60 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold bg-gray-900 text-white px-2 py-0.5 rounded">
                              Edición #{ed.editionNumber}
                            </span>
                            <span className="font-extrabold text-sm text-gray-900">
                              {ed.subtitle}
                            </span>
                          </div>
                          <span className="text-[11px] text-gray-500 font-mono">
                            Finalizado: {ed.endDate || 'Archivo'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div>
                            <span className="text-gray-400 block text-[10px] uppercase font-bold">Total Recaudado</span>
                            <span className="font-mono font-bold text-gray-800">
                              {formatCOP(ed.totalSalesCOP || 0)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-[10px] uppercase font-bold">Boletos Vendidos</span>
                            <span className="font-mono font-bold text-gray-800">
                              {(ed.totalTicketsSold || 0).toLocaleString('es-CO')}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-[10px] uppercase font-bold">Transacciones</span>
                            <span className="font-mono font-bold text-gray-800">
                              {ed.totalOrdersCount || 0}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-[10px] uppercase font-bold">Ganador</span>
                            <span className="font-mono font-bold text-red-600">
                              {ed.winner?.ticketNumber ? `#${ed.winner.ticketNumber}` : 'Sin registrar'}
                            </span>
                          </div>
                        </div>

                        {ed.winner && (
                          <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-2 text-xs text-amber-950 flex items-center justify-between">
                            <span>
                              🏆 <strong>Ganador:</strong> {ed.winner.winnerName} ({ed.winner.lotteryOrSource || 'Sorteo oficial'})
                            </span>
                            <span className="font-mono font-bold text-amber-800">
                              Boleto #{ed.winner.ticketNumber}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* TAB 6: GENERADOR Y GESTIÓN DE NÚMEROS PREMIADOS (FUTUROS NO VENDIDOS) */}
        {currentTab === 'prize_numbers' && (
          <AdminPrizeNumbersPanel
            orders={orders}
            onOpenOrderVoucher={(orderNumber) => {
              const found = orders.find(o => o.orderNumber === orderNumber);
              if (found) {
                setVoucherModalOrder(found);
                setIsVoucherModalOpen(true);
              }
            }}
            onOpenPrizeReport={(ticketNumber) => openPrizeReportByTicket(ticketNumber)}
          />
        )}

        {/* TAB 7: REPORTES Y AUDITORÍA DE TIQUES PREMIADOS EN SEGUNDO PLANO */}
        {currentTab === 'prize_reports' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Header del Panel */}
            <div className="bg-gradient-to-r from-neutral-900 via-gray-900 to-black text-white rounded-2xl p-5 sm:p-6 border border-amber-500/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-2xl text-amber-300 shrink-0">
                  🚨
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider bg-amber-500 text-slate-950 px-2 py-0.5 rounded">
                      Auditoría Automática en 2° Plano
                    </span>
                    <span className="text-xs font-mono text-gray-400">
                      {prizeReports.length} reportes registrados
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white mt-1">
                    Reportes de Tiques Premiados Entregados Detrás de Plataforma
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Cada vez que un cliente compra y el sistema le entrega un número premiado, se genera un acta oficial con su cédula, fecha, medio de pago y premio asignado.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    markAllReportsAsViewed();
                    setPrizeReports(getPrizeWonReports());
                    showNotification('✓ Todos los reportes fueron marcados como revisados.');
                  }}
                  className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>👁️</span>
                  <span>Marcar Todos Vistos</span>
                </button>
              </div>
            </div>

            {/* Métricas de Premios en Segundo Plano */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Total Premios Detectados</span>
                <span className="text-2xl font-mono font-black text-gray-900 mt-1 block">
                  {prizeReports.length}
                </span>
                <span className="text-[10px] text-gray-500 mt-0.5 block">Reportados en segundo plano</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Premios Entregados</span>
                <span className="text-2xl font-mono font-black text-emerald-600 mt-1 block">
                  {prizeReports.filter(r => r.status === 'entregado').length}
                </span>
                <span className="text-[10px] text-emerald-600 mt-0.5 block">Verificados con el ganador</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Pendientes de Entrega</span>
                <span className="text-2xl font-mono font-black text-amber-600 mt-1 block">
                  {prizeReports.filter(r => r.status === 'detectado').length}
                </span>
                <span className="text-[10px] text-amber-600 mt-0.5 block">Requieren contactar cliente</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">No Leídos por Admin</span>
                <span className={`text-2xl font-mono font-black mt-1 block ${unreadPrizeReportsCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {unreadPrizeReportsCount}
                </span>
                <span className="text-[10px] text-gray-500 mt-0.5 block">Nuevas alertas</span>
              </div>
            </div>

            {/* Barra de Filtros y Búsqueda de Reportes */}
            <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-gray-500 uppercase mr-1">Filtrar:</span>
                {[
                  { id: 'all', label: `Todos (${prizeReports.length})` },
                  { id: 'detectado', label: `⚡ Detectados (${prizeReports.filter(r => r.status === 'detectado').length})` },
                  { id: 'verificado', label: `✓ Verificados (${prizeReports.filter(r => r.status === 'verificado').length})` },
                  { id: 'entregado', label: `🏆 Entregados (${prizeReports.filter(r => r.status === 'entregado').length})` },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setReportStatusFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold cursor-pointer transition ${
                      reportStatusFilter === f.id
                        ? 'bg-gray-900 text-white shadow-2xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                <span className="text-gray-400 text-xs">🔍</span>
                <input
                  type="text"
                  placeholder="Buscar por Cédula, N° Boleto (#74120), Ganador, Orden o Premio..."
                  value={reportSearchQuery}
                  onChange={(e) => setReportSearchQuery(e.target.value)}
                  className="text-xs bg-transparent outline-none w-full sm:w-64 text-gray-800 placeholder:text-gray-400"
                />
                {reportSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setReportSearchQuery('')}
                    className="text-gray-400 hover:text-gray-600 text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Tabla de Reportes */}
            <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
              {filteredPrizeReports.length === 0 ? (
                <div className="p-12 text-center text-gray-500 space-y-2">
                  <div className="text-3xl">📭</div>
                  <p className="text-sm font-bold text-gray-700">No se encontraron reportes con los filtros seleccionados.</p>
                  <p className="text-xs text-gray-400">Cuando los clientes compren boletos premiados, aquí se registrarán automáticamente con toda su auditoría.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-gray-50 text-gray-600 text-[11px] uppercase tracking-wider border-b border-gray-200">
                      <tr>
                        <th className="py-3 px-4">N° Reporte / Fecha</th>
                        <th className="py-3 px-4">Boleto Ganador</th>
                        <th className="py-3 px-4">Premio Asignado</th>
                        <th className="py-3 px-4">Cliente Ganador / Cédula</th>
                        <th className="py-3 px-4">Orden / Compra</th>
                        <th className="py-3 px-4">Estado</th>
                        <th className="py-3 px-4 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredPrizeReports.map((r) => {
                        const isUnread = !r.viewedByAdmin;
                        return (
                          <tr
                            key={r.id}
                            className={`transition ${
                              isUnread ? 'bg-amber-50/60 font-medium' : 'hover:bg-gray-50/80'
                            }`}
                          >
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-black text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                                  {r.reportNumber}
                                </span>
                                {isUnread && (
                                  <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" title="Nuevo reporte no leído" />
                                )}
                              </div>
                              <span className="text-[11px] text-gray-500 block mt-1">
                                {r.detectedAt}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className="font-mono text-base font-black px-2.5 py-1 rounded-md bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-950 border border-amber-500 shadow-2xs inline-flex items-center gap-1">
                                <span>👑</span>
                                <span>#{r.ticketNumber}</span>
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="font-black text-gray-900 text-xs sm:text-sm">
                                {r.prizeTitle}
                              </div>
                              <span className="text-[10px] text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded font-bold uppercase inline-block mt-0.5">
                                {r.category || 'Premio de Hoy'}
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="font-bold text-gray-900">
                                {r.customerName} {r.customerLastName}
                              </div>
                              <div className="text-xs font-mono font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-300 inline-flex items-center gap-1 my-0.5">
                                <span>🆔 C.C.</span>
                                <span>{r.identification}</span>
                              </div>
                              <div className="text-xs text-gray-500 font-mono">
                                📞 +57 {r.phone}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                              <span className="font-mono font-bold text-gray-900 block">
                                #{r.orderNumber}
                              </span>
                              <span className="font-mono font-bold text-emerald-700 block mt-0.5">
                                ${r.totalPaidCOP.toLocaleString('es-CO')} COP
                              </span>
                              <span className="text-[10px] text-gray-500 block">
                                {r.paymentMethod}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                                r.status === 'entregado'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : r.status === 'verificado'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                  : 'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}>
                                <span>{r.status === 'entregado' ? '🏆' : r.status === 'verificado' ? '✓' : '⚡'}</span>
                                <span className="capitalize">{r.status}</span>
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedPrizeReport(r);
                                    setShowPrizeReportModal(true);
                                  }}
                                  className="px-2.5 py-1.5 bg-slate-950 hover:bg-black text-amber-300 rounded text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
                                  title="Ver acta oficial de reporte"
                                >
                                  <span>📜</span>
                                  <span>Ver Acta</span>
                                </button>

                                <a
                                  href={`https://wa.me/57${r.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`¡Hola ${r.customerName}! 🥳 Te informamos de parte del Sorteo que en tu compra reciente te ha salido el Tique Premiado #${r.ticketNumber} (${r.prizeTitle}).`)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold cursor-pointer transition shadow-2xs"
                                  title="Contactar ganador por WhatsApp"
                                >
                                  <span>📲</span>
                                </a>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* MODAL DE VISUALIZACIÓN DE NÚMEROS COMPRADOS */}
      {viewTicketsOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-gray-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-200">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <span>🎟️ Números Comprados</span>
                  <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded border text-gray-700">
                    Orden #{viewTicketsOrder.orderNumber}
                  </span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Cliente: <strong className="text-gray-900">{viewTicketsOrder.customerName} {viewTicketsOrder.customerLastName}</strong> • C.C: <strong className="text-amber-800 font-mono">{viewTicketsOrder.identification || 'Sin registrar'}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewTicketsOrder(null)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* Estado de los boletos */}
            <div className="mb-3 flex items-center justify-between text-xs">
              <span className="text-gray-600">
                Total de boletos: <strong className="text-gray-900 font-mono">{viewTicketsOrder.ticketNumbers.length}</strong>
              </span>
              <span className={`font-bold px-2 py-0.5 rounded ${
                viewTicketsOrder.status === 'Anulado'
                  ? 'bg-red-100 text-red-700 border border-red-200'
                  : 'bg-green-100 text-green-700'
              }`}>
                {viewTicketsOrder.status === 'Anulado' ? '✕ Boletos Anulados' : '✓ Boletos Activos en Sorteo'}
              </span>
            </div>

            {/* Grid de números */}
            <div className="max-h-64 overflow-y-auto p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {viewTicketsOrder.ticketNumbers.map((num, idx) => {
                  const wonPrize = viewTicketsOrder.wonPrizes?.find(p => p.ticketNumber === num);
                  return (
                    <div
                      key={idx}
                      className={`py-1.5 px-2 text-center font-mono font-bold text-xs rounded border transition ${
                        wonPrize
                          ? 'bg-amber-100 text-amber-950 border-amber-400 ring-2 ring-amber-400 font-black shadow-xs'
                          : viewTicketsOrder.status === 'Anulado'
                          ? 'bg-red-50 text-red-500 border-red-200 line-through'
                          : 'bg-white text-gray-900 border-gray-300 shadow-2xs hover:border-red-500'
                      }`}
                      title={wonPrize ? `¡Número Premiado: ${wonPrize.prizeTitle}!` : undefined}
                    >
                      {wonPrize && <span className="block text-[10px]">🏆 PREMIADO</span>}
                      {num}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-200">
              <span className="text-xs text-gray-500 font-mono">
                Total pagado: <strong className="text-emerald-700 font-bold">{formatCOP(viewTicketsOrder.totalCOP)}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setVoucherModalOrder(viewTicketsOrder);
                    setIsVoucherModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg cursor-pointer transition flex items-center gap-1 shadow-xs"
                  title="Ver y descargar tiquete en PDF, JPG o PNG"
                >
                  <span>🎟️</span>
                  <span>Descargar Boleta (PDF/JPG/PNG)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewTicketsOrder(null)}
                  className="px-4 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-lg cursor-pointer transition"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ANULACIÓN DE TICKET */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-200 animate-in fade-in zoom-in duration-150">
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-2 text-2xl font-bold">
                ⚠️
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                ¿Anular Orden #{cancelModalOrder.orderNumber}?
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Cliente: <strong className="text-gray-800">{cancelModalOrder.customerName} {cancelModalOrder.customerLastName}</strong> ({cancelModalOrder.quantity} boletos por {formatCOP(cancelModalOrder.totalCOP)})
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded p-3 text-xs text-red-800 mb-4">
              Al anular esta orden, los <strong>{cancelModalOrder.quantity} números</strong> quedarán marcados como cancelados en el sistema y aparecerán tachados en el buscador.
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Motivo de la anulación:
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={2}
                className="w-full text-xs p-2 border border-gray-300 rounded outline-none focus:border-red-600"
                placeholder="Ej: Pago rechazado en banco, solicitud del usuario, duplicado..."
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCancelModalOrder(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded text-xs cursor-pointer"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded text-xs cursor-pointer shadow-sm"
              >
                Confirmar Anulación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Comenzar Nuevo Sorteo y Finalizar Sorteo */}
      <RaffleManagerModal
        isOpen={isRaffleManagerOpen}
        onClose={() => setIsRaffleManagerOpen(false)}
        onRaffleUpdated={refreshData}
        initialMode={raffleManagerMode}
      />

      {/* Modal para Visualizar y Descargar Boleta Oficial en PDF, JPG o PNG */}
      <TicketVoucherModal
        order={voucherModalOrder}
        isOpen={isVoucherModalOpen}
        onClose={() => {
          setIsVoucherModalOpen(false);
          setVoucherModalOrder(null);
        }}
      />

      {/* Modal de Auditoría y Reporte en Segundo Plano de Tique Premiado */}
      {showPrizeReportModal && (
        <PrizeAuditReportModal
          report={selectedPrizeReport}
          onClose={() => {
            setShowPrizeReportModal(false);
            setSelectedPrizeReport(null);
          }}
          onStatusUpdated={refreshData}
        />
      )}

    </div>
  );
};
