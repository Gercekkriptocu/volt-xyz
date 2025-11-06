'use client'

/**
 * Telegram Auto-Share Component
 * Automatically triggers news sharing to Telegram every minute
 */

import { useEffect, useState } from 'react';

interface ShareStatus {
  enabled: boolean;
  lastCheck: string;
  totalShared: number;
  recentShares: Array<{
    newsId: string;
    sharedAt: string;
    title: string;
  }>;
}

export function TelegramAutoShare(): React.JSX.Element {
  const [status, setStatus] = useState<ShareStatus>({
    enabled: true,
    lastCheck: new Date().toISOString(),
    totalShared: 0,
    recentShares: [],
  });

  useEffect(() => {
    // Function to trigger Telegram sharing
    const triggerShare = async (): Promise<void> => {
      try {
        console.log('🔔 Telegram Auto-Share: Checking for new news...');
        const response = await fetch('/api/telegram/trigger', {
          cache: 'no-store',
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Telegram trigger response:', data);
          setStatus(prev => ({
            ...prev,
            lastCheck: new Date().toISOString(),
            totalShared: data.result?.totalShared || prev.totalShared,
          }));
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('❌ Telegram trigger failed:', response.status, errorData);
        }
      } catch (error) {
        console.error('❌ Failed to trigger Telegram share:', error);
      }
    };

    // Initial trigger
    triggerShare();

    // Set up interval - check every 1 minute
    const interval = setInterval(() => {
      triggerShare();
    }, 1 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // This component is invisible - it just runs in the background
  return <></>;
}
