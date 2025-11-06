'use client';

import type React from 'react';
import { X, Copy } from 'lucide-react';
import type { CryptoNews } from '../lib/news-service';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  news: CryptoNews;
  summary?: string;
}

// Social Media Logo Components
const XLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const FarcasterLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 1000 1000" className={className} fill="currentColor">
    <path d="M257.778 155.556H742.222V844.444H671.111V528.889H670.414C662.554 441.677 589.258 373.333 500 373.333C410.742 373.333 337.446 441.677 329.586 528.889H328.889V844.444H257.778V155.556Z"/>
    <path d="M128.889 253.333L157.778 351.111H182.222V844.444H128.889V253.333Z"/>
    <path d="M871.111 253.333L842.222 351.111H817.778V844.444H871.111V253.333Z"/>
  </svg>
);

const TelegramLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.14.121.099.154.232.17.326.016.093.036.306.02.472z"/>
  </svg>
);

export function ShareDialog({ isOpen, onClose, news, summary }: ShareDialogProps): React.JSX.Element | null {
  if (!isOpen) return null;

  const shareText = encodeURIComponent(summary || news.title);
  // Create unique URL for this news item
  const newsUrl = `https://www.voltnews.xyz/news/${encodeURIComponent(news.id)}`;
  const shareUrl = encodeURIComponent(newsUrl);

  const platforms = [
    {
      name: 'X (Twitter)',
      icon: XLogo,
      iconColor: '#000000',
      url: `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`,
      action: 'share' as const
    },
    {
      name: 'Farcaster',
      icon: FarcasterLogo,
      iconColor: '#8A63D2',
      url: `https://warpcast.com/~/compose?text=${shareText}%20${shareUrl}`,
      action: 'share' as const
    },
    {
      name: 'Telegram',
      icon: TelegramLogo,
      iconColor: '#0088CC',
      url: `https://t.me/share/url?url=${shareUrl}&text=${shareText}`,
      action: 'share' as const
    },
    {
      name: 'Link Kopyala',
      icon: Copy,
      iconColor: '#666666',
      url: newsUrl,
      action: 'copy' as const
    },
  ];

  const handleShare = (url: string): void => {
    window.open(url, '_blank', 'width=600,height=400');
  };

  const handleCopy = (url: string): void => {
    navigator.clipboard.writeText(url);
    alert('Link kopyalandı! / Link copied!');
  };

  return (
    <div 
      className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="xp-window max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: 'scaleIn 0.2s ease-out'
        }}
      >
        {/* XP Title Bar */}
        <div className="xp-title-bar">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white rounded-sm flex items-center justify-center">
              <span className="text-xs">📤</span>
            </div>
            <span className="text-white text-sm font-bold">Paylaş / Share</span>
          </div>
          <button 
            className="xp-control-btn xp-close-btn"
            onClick={onClose}
          >
            <X className="w-3 h-3 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-900 p-6">
          <h3 
            className="text-gray-900 dark:text-white text-sm font-bold mb-4 line-clamp-2"
            style={{ fontFamily: 'Tahoma, sans-serif' }}
          >
            {summary || news.title}
          </h3>

          {/* Platform Grid */}
          <div className="grid grid-cols-2 gap-3">
            {platforms.map((platform) => {
              const IconComponent = platform.icon;
              return (
                <button
                  key={platform.name}
                  onClick={() => platform.action === 'copy' ? handleCopy(platform.url) : handleShare(platform.url)}
                  className="xp-button flex items-center gap-3 p-4 justify-start hover:scale-105 transition-transform bg-gray-50 dark:bg-gray-800"
                  style={{
                    border: '2px solid #ccc',
                    fontWeight: 'bold'
                  }}
                >
                  <IconComponent className="w-6 h-6" style={{ color: platform.iconColor }} />
                  <span className="text-sm font-bold text-black dark:text-white">{platform.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
