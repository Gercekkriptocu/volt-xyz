/**
 * Telegram Test API - Manual test endpoint to verify Telegram integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { summarizeAndTranslate } from '@/lib/translation-service';

// TELEGRAM BOT CONFIGURATION (same as auto-share)
const TELEGRAM_BOT_TOKEN = '8162772227:AAEThChJJe7LXW5cuOvkAjfDobSwK8WuqUs';
const TELEGRAM_CHANNEL_ID = '-1003215421318';

/**
 * Send a test message to Telegram
 */
async function sendTestMessage(): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    // Validate configuration
    if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
      return {
        success: false,
        message: 'Bot token not configured',
      };
    }

    if (!TELEGRAM_CHANNEL_ID || TELEGRAM_CHANNEL_ID === 'YOUR_CHANNEL_ID_HERE') {
      return {
        success: false,
        message: 'Channel ID not configured',
      };
    }

    const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
    
    // Test translation first
    console.log('🔍 Testing Turkish translation...');
    const testNewsTitle = 'Bitcoin surges past $100,000 breaking all-time high records';
    const translation = await summarizeAndTranslate(testNewsTitle, 'Bitcoin has reached a new milestone today');
    console.log('✅ Translation test:', translation);

    // Test message with translation result
    const testMessage = `🧪 *Test Mesajı*\n\n✅ VOLT News Telegram entegrasyonu çalışıyor!\n\n📝 Çeviri Testi:\nİngilizce: "${testNewsTitle.substring(0, 40)}..."\nTürkçe: "${translation.summary.substring(0, 60)}..."\n\n⚡️ Bot Token: ${TELEGRAM_BOT_TOKEN.substring(0, 10)}...\n📱 Kanal ID: ${TELEGRAM_CHANNEL_ID}\n\n🕐 Tarih: ${new Date().toLocaleString('tr-TR')}`;

    console.log('📤 Sending test message to Telegram...');
    console.log('Bot Token:', TELEGRAM_BOT_TOKEN.substring(0, 10) + '...');
    console.log('Channel ID:', TELEGRAM_CHANNEL_ID);

    // Send message
    const response = await fetch(`${telegramApiUrl}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHANNEL_ID,
        text: testMessage,
        parse_mode: 'Markdown',
        disable_web_page_preview: false,
      }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('❌ Telegram API error:', responseData);
      return {
        success: false,
        message: 'Failed to send test message',
        error: JSON.stringify(responseData, null, 2),
      };
    }

    console.log('✅ Test message sent successfully:', responseData);

    return {
      success: true,
      message: 'Test message sent successfully to Telegram!',
    };
  } catch (error) {
    console.error('❌ Error sending test message:', error);
    return {
      success: false,
      message: 'Exception occurred',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * GET endpoint - Send test message
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const result = await sendTestMessage();

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
          error: result.error,
          instructions: [
            '1. Bot token doğru mu kontrol edin',
            '2. Kanal ID doğru mu kontrol edin (-100 ile başlamalı)',
            '3. Bot kanalda admin mi kontrol edin',
            '4. Bot kanal yazma izni var mı kontrol edin',
          ],
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      channelId: TELEGRAM_CHANNEL_ID,
      botTokenPreview: TELEGRAM_BOT_TOKEN.substring(0, 10) + '...',
    });
  } catch (error) {
    console.error('Error in Telegram test API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send test message',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint - Reset shared news history
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    if (body.action === 'reset') {
      // Call the auto-share endpoint to reset
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/telegram/auto-share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reset' }),
      });

      const result = await response.json();

      return NextResponse.json({
        success: true,
        message: 'Shared news history reset successfully',
        result,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in Telegram test POST:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process request',
      },
      { status: 500 }
    );
  }
}
