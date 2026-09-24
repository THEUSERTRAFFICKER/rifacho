import React from 'react';
import { siteConfig } from '../config/siteConfig';

interface FooterProps {
  onOpenAdminLogin?: () => void;
  isAdmin?: boolean;
}

export const Footer: React.FC<FooterProps> = () => {
  return (
    <footer id="colophon" role="contentinfo" className="w-full bg-[#020000] text-white pt-10 pb-8 mt-16 border-t border-gray-900">
      <div className="w-full max-w-[1140px] mx-auto px-4 flex flex-col items-center justify-center text-center">
        {/* Logo */}
        <div className="mb-6">
          <a href="/" className="inline-block">
            <img
              src={siteConfig.images.logo}
              alt={siteConfig.raffleName}
              className="h-14 sm:h-16 w-auto object-contain mx-auto"
            />
          </a>
        </div>

        {/* Links */}
        <ul className="flex flex-col items-center space-y-3 mb-6">
          <li>
            <a
              href={siteConfig.contact.telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-white hover:text-red-400 font-medium text-base transition-colors"
            >
              {/* Telegram SVG */}
              <svg className="w-5 h-5 fill-current text-[#229ED9]" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.77-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .34z" />
              </svg>
              <span>&gt;&gt; Telegram &lt;&lt;</span>
            </a>
          </li>

          {siteConfig.contact.whatsappUrl && (
            <li>
              <a
                href={siteConfig.contact.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 font-medium text-sm transition-colors"
              >
                <span>WhatsApp Soporte</span>
              </a>
            </li>
          )}

          <li>
            <a
              href={`mailto:${siteConfig.contact.supportEmail}`}
              className="text-gray-300 hover:text-white text-sm transition-colors"
            >
              {siteConfig.contact.supportEmail}
            </a>
          </li>
        </ul>

        <div className="text-xs text-gray-500 max-w-md space-y-1">
          <div>
            © {new Date().getFullYear()} {siteConfig.raffleName}. Todos los derechos reservados.
          </div>
          {siteConfig.creatorName && (
            <div className="text-[11px] text-gray-400">
              Creador / Organizador: <strong className="text-gray-300 font-semibold">{siteConfig.creatorName}</strong>
              {siteConfig.creatorTitle && <span className="text-gray-500"> ({siteConfig.creatorTitle})</span>}
            </div>
          )}
          <div className="pt-2 text-[11px] text-gray-400">
            Desarrollo y Sistema por:{' '}
            <a
              href="https://www.theusertrafficker.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-200 hover:text-red-400 font-bold underline transition-colors"
            >
              www.theusertrafficker.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
