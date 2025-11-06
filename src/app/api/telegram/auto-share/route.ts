/**
 * Telegram Auto-Share API - Automatically shares Turkish news to Telegram channel
 */

import { NextRequest, NextResponse } from 'next/server';
import { summarizeAndTranslate } from '@/lib/translation-service';
import type { CryptoNews } from '@/lib/news-service';

// TELEGRAM BOT CONFIGURATION
const TELEGRAM_BOT_TOKEN = '8162772227:AAEThChJJe7LXW5cuOvkAjfDobSwK8WuqUs';
// Channel ID must be negative for channels, or @username format
const TELEGRAM_CHANNEL_ID = '-1003215421318'; // Added -100 prefix for channel

interface SharedNewsRecord {
  newsId: string;
  sharedAt: string;
  title: string;
}

// In-memory storage for shared news (in production, use a database)
// Using URL as unique identifier to prevent duplicates even after server restart
let sharedNewsUrls: Set<string> = new Set();
let sharedNewsHistory: SharedNewsRecord[] = [];
let lastSharedNewsId: string | null = null; // Track the very last news we shared

/**
 * Format news for Telegram
 */
function formatTelegramMessage(news: CryptoNews, turkishSummary: string, sentiment?: 'positive' | 'negative' | 'neutral'): string {
  // Sentiment emoji
  let sentimentEmoji = '⚖️';
  let sentimentText = 'Nötr';
  
  if (sentiment === 'positive') {
    sentimentEmoji = '📈';
    sentimentText = 'Yükseliş';
  } else if (sentiment === 'negative') {
    sentimentEmoji = '📉';
    sentimentText = 'Düşüş';
  }

  // Source formatting
  const source = news.source || 'VOLT News';

  // Build message
  let message = `${sentimentEmoji} *${turkishSummary}*\n\n`;
  
  // Add sentiment label
  message += `💭 _${sentimentText}_\n`;
  
  // Add link
  message += `\n🔗 [Haberi Oku](${news.url})`;

  return message;
}

/**
 * Send message to Telegram channel
 */
async function sendToTelegram(message: string, imageUrl?: string): Promise<boolean> {
  try {
    // Validate bot token and channel ID
    if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
      console.error('❌ Telegram bot token not configured');
      return false;
    }

    if (!TELEGRAM_CHANNEL_ID || TELEGRAM_CHANNEL_ID === 'YOUR_CHANNEL_ID_HERE') {
      console.error('❌ Telegram channel ID not configured');
      return false;
    }

    console.log('📤 Sending to Telegram channel:', TELEGRAM_CHANNEL_ID);
    const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

    // If image exists, send as photo with caption
    if (imageUrl) {
      const photoResponse = await fetch(`${telegramApiUrl}/sendPhoto`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHANNEL_ID,
          photo: imageUrl,
          caption: message,
          parse_mode: 'Markdown',
          disable_web_page_preview: false,
        }),
      });

      if (!photoResponse.ok) {
        const errorData = await photoResponse.json();
        console.error('❌ Telegram photo send error:', errorData);
        console.log('📝 Falling back to text-only message');
        
        // Fallback to text-only message if image fails
        const textResponse = await fetch(`${telegramApiUrl}/sendMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHANNEL_ID,
            text: message,
            parse_mode: 'Markdown',
            disable_web_page_preview: false,
          }),
        });

        return textResponse.ok;
      }

      return true;
    } else {
      // Send text-only message
      const response = await fetch(`${telegramApiUrl}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHANNEL_ID,
          text: message,
          parse_mode: 'Markdown',
          disable_web_page_preview: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Telegram send error:', errorData);
        return false;
      }

      console.log('✅ Message sent successfully to Telegram');
      return true;
    }
  } catch (error) {
    console.error('Error sending to Telegram:', error);
    return false;
  }
}

/**
 * Check for new news and share to Telegram
 */
async function checkAndShareNews(requestHost?: string): Promise<{ shared: number; errors: number; details: string }> {
  let sharedCount = 0;
  let errorCount = 0;
  let details = '';

  try {
    console.log('\n========== TELEGRAM AUTO-SHARE START ==========');
    console.log('🔍 Checking for new news to share...');
    console.log('⏰ Time:', new Date().toISOString());
    
    // Fetch latest news directly from the news service
    console.log('📡 Fetching news from CoinDesk...');
    
    const { fetchCryptoNews } = await import('@/lib/news-service');
    const allNews = await fetchCryptoNews();
    
    console.log(`📰 Fetched ${allNews.length} total news items`);

    // Sort by date (newest first)
    const sortedNews = allNews.sort((a, b) => {
      const dateA = new Date(a.publishedDate || 0).getTime();
      const dateB = new Date(b.publishedDate || 0).getTime();
      return dateB - dateA;
    });

    // CRITICAL: Only share the LATEST (TOP 1) news from the website
    const latestNews = sortedNews[0];
    
    if (!latestNews) {
      console.log('⚠️ No news found to share');
      details = 'No news available';
      console.log('========== TELEGRAM AUTO-SHARE END (NO NEWS) ==========\n');
      return { shared: 0, errors: 0, details };
    }

    console.log(`\n📌 LATEST NEWS:`);
    console.log(`   ID: ${latestNews.id}`);
    console.log(`   Title: ${latestNews.title.substring(0, 80)}...`);
    console.log(`   URL: ${latestNews.url}`);
    console.log(`   Image: ${latestNews.image ? 'YES' : 'NO'}`);
    console.log(`   Published: ${latestNews.publishedDate}`);

    // Check if this is the same news we shared last time
    if (lastSharedNewsId === latestNews.url) {
      console.log(`\n⏭️ ALREADY SHARED - Skipping`);
      console.log(`   Last shared URL: ${lastSharedNewsId}`);
      details = 'Already shared: ' + latestNews.title.substring(0, 50);
      console.log('========== TELEGRAM AUTO-SHARE END (DUPLICATE) ==========\n');
      return { shared: 0, errors: 0, details };
    }

    console.log(`\n🆕 NEW NEWS DETECTED!`);
    console.log(`   This news has NOT been shared before`);

    // Translate to Turkish
    console.log(`\n🔄 Starting Turkish translation...`);
    const translation = await summarizeAndTranslate(latestNews.title, latestNews.text || '');
    
    console.log(`\n📝 TRANSLATION RESULT:`);
    console.log(`   Original: ${latestNews.title.substring(0, 80)}...`);
    console.log(`   Turkish: ${translation.summary.substring(0, 80)}...`);
    console.log(`   Sentiment: ${translation.sentiment}`);
    
    // CRITICAL: Skip if translation failed or returned English
    if (!translation.summary || translation.summary.trim().length < 10) {
      console.warn(`\n⚠️ TRANSLATION TOO SHORT - SKIPPING`);
      console.warn(`   Length: ${translation.summary?.length || 0}`);
      details = 'Translation too short';
      console.log('========== TELEGRAM AUTO-SHARE END (BAD TRANSLATION) ==========\n');
      return { shared: 0, errors: 1, details };
    }
    
    // Check if translation is still in English
    const englishPattern = /\b(the|is|are|was|were|has|have|will|would|could|should|can|may|at|in|on|for|with|from|by|about|this|that|these|those)\b/gi;
    const englishMatches = translation.summary.match(englishPattern);
    if (englishMatches && englishMatches.length > 5) {
      console.warn(`\n⚠️ TRANSLATION STILL IN ENGLISH - SKIPPING`);
      console.warn(`   English word count: ${englishMatches.length}`);
      details = 'Translation contains too much English';
      console.log('========== TELEGRAM AUTO-SHARE END (ENGLISH DETECTED) ==========\n');
      return { shared: 0, errors: 1, details };
    }

    // Format message
    console.log(`\n📤 Formatting Telegram message...`);
    const message = formatTelegramMessage(latestNews, translation.summary, translation.sentiment);
    console.log(`\n📋 MESSAGE TO SEND:`);
    console.log(message);

    // Send to Telegram WITH IMAGE
    console.log(`\n📸 Sending to Telegram channel...`);
    console.log(`   Channel ID: ${TELEGRAM_CHANNEL_ID}`);
    console.log(`   With image: ${latestNews.image ? 'YES' : 'NO'}`);
    
    const success = await sendToTelegram(message, latestNews.image);

    if (success) {
      // Mark as shared
      sharedNewsUrls.add(latestNews.url);
      lastSharedNewsId = latestNews.url;
      sharedNewsHistory.push({
        newsId: latestNews.url,
        sharedAt: new Date().toISOString(),
        title: translation.summary,
      });
      sharedCount++;
      details = 'Successfully shared: ' + translation.summary.substring(0, 50);
      console.log(`\n✅ SUCCESS - News shared to Telegram!`);
      console.log(`   Shared count: ${sharedCount}`);
      console.log(`   Total shared in history: ${sharedNewsUrls.size}`);
    } else {
      errorCount++;
      details = 'Failed to send to Telegram';
      console.error(`\n❌ FAILED to send to Telegram`);
    }

    // Clean up old shared news (keep only last 1000)
    if (sharedNewsUrls.size > 1000) {
      const urlsToKeep = sharedNewsHistory.slice(-1000).map(record => record.newsId);
      sharedNewsUrls = new Set(urlsToKeep);
      sharedNewsHistory = sharedNewsHistory.slice(-1000);
    }
    
    console.log('========== TELEGRAM AUTO-SHARE END ==========\n');
  } catch (error) {
    console.error('\n❌ ERROR in checkAndShareNews:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    details = 'Exception: ' + (error instanceof Error ? error.message : 'Unknown error');
    errorCount++;
    console.log('========== TELEGRAM AUTO-SHARE END (ERROR) ==========\n');
  }

  return { shared: sharedCount, errors: errorCount, details };
}

/**
 * GET endpoint - Check and share new news
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('\n🌐 Telegram Auto-Share API Called');
    console.log('   Method: GET');
    console.log('   Time:', new Date().toLocaleString('tr-TR'));
    
    const host = request.headers.get('host') || undefined;
    const result = await checkAndShareNews(host);

    const response = {
      success: true,
      shared: result.shared,
      errors: result.errors,
      totalShared: sharedNewsUrls.size,
      details: result.details,
      message: `${result.shared} yeni haber Telegram'a paylaşıldı`,
      timestamp: new Date().toISOString(),
    };
    
    console.log('\n📊 API Response:', JSON.stringify(response, null, 2));
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Error in Telegram auto-share API:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to share news to Telegram',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint - Manual trigger or reset
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    // Reset shared news tracking
    if (body.action === 'reset') {
      sharedNewsUrls.clear();
      sharedNewsHistory = [];
      lastSharedNewsId = null; // Also reset last shared ID
      return NextResponse.json({
        success: true,
        message: 'Paylaşım geçmişi sıfırlandı',
      });
    }

    // Manual trigger
    if (body.action === 'trigger') {
      const result = await checkAndShareNews();
      return NextResponse.json({
        success: true,
        shared: result.shared,
        errors: result.errors,
        message: `${result.shared} yeni haber paylaşıldı`,
      });
    }

    // Get status
    if (body.action === 'status') {
      return NextResponse.json({
        success: true,
        totalShared: sharedNewsUrls.size,
        recentShares: sharedNewsHistory.slice(-20),
        botConfigured: TELEGRAM_BOT_TOKEN !== 'YOUR_BOT_TOKEN_HERE',
        channelConfigured: TELEGRAM_CHANNEL_ID !== 'YOUR_CHANNEL_ID_HERE',
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in Telegram auto-share POST:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
