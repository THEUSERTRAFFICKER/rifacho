import React, { useState } from 'react';
import { verifyAdminLogin, setAdminSession } from '../utils/orderStore';
import { AdminUser } from '../types';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AdminUser) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [remember, setRemember] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const result = verifyAdminLogin(username, password);
    if (!result.success || !result.user) {
      setErrorMsg(result.error || 'Credenciales inválidas');
      return;
    }

    if (remember) {
      setAdminSession(result.user);
    }
    onSuccess(result.user);
    onClose();
  };

  const handleQuickLogin = () => {
    setErrorMsg(null);
    const result = verifyAdminLogin('admin', 'admin123');
    if (result.success && result.user) {
      if (remember) {
        setAdminSession(result.user);
      }
      onSuccess(result.user);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
      <div
        className="bg-white text-gray-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-[#020000] text-white p-5 text-center relative border-b border-gray-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded transition text-lg font-bold"
            aria-label="Cerrar"
          >
            ✕
          </button>
          <div className="w-12 h-12 rounded-full bg-red-600/20 text-red-500 flex items-center justify-center text-2xl mx-auto mb-2 border border-red-500/30">
            🔐
          </div>
          <h2 className="text-lg font-bold">Acceso de Administrador</h2>
          <p className="text-xs text-gray-400 mt-1">
            Ingresa para gestionar ventas, clientes, boletos y ajustes
          </p>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium">
              ⚠️ {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">
              Usuario o Correo:
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ej: admin"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">
              Contraseña:
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-gray-600">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="rounded text-red-600 focus:ring-red-500"
              />
              <span>Recordar sesión en este equipo</span>
            </label>
          </div>

          <div className="pt-2 space-y-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-lg shadow-sm transition cursor-pointer"
            >
              Iniciar Sesión
            </button>

            <button
              type="button"
              onClick={handleQuickLogin}
              className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>⚡</span>
              <span>Acceso Rápido como Superadmin (1 Clic)</span>
            </button>
          </div>

          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-[11px] text-gray-500 text-center">
            💡 Credenciales predeterminadas: Usuario <strong>admin</strong> | Clave <strong>admin123</strong>
          </div>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-gray-500 hover:text-gray-800 underline cursor-pointer"
            >
              ← Volver a la página pública de compras
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
