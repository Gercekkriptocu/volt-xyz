/**
 * Manual Telegram Test - Force share latest news immediately
 * Use this to test if the system works: /api/telegram/manual-test
 */

import { NextResponse } from 'next/server';

export async function GET(): Promise<NextResponse> {
  try {
    console.log('\n🧪 ========== MANUAL TELEGRAM TEST START ==========');
    console.log('⏰ Time:', new Date().toLocaleString('tr-TR'));
    
    // Call the auto-share endpoint directly
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : 'https://factory-occur-913.vercel.app';
    
    console.log(`🌐 Calling auto-share endpoint: ${baseUrl}/api/telegram/auto-share`);
    
    const response = await fetch(`${baseUrl}/api/telegram/auto-share`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'trigger' }),
      cache: 'no-store',
    });

    const result = await response.json();
    
    console.log('📊 Result:', JSON.stringify(result, null, 2));
    console.log('🧪 ========== MANUAL TELEGRAM TEST END ==========\n');

    return NextResponse.json({
      success: true,
      message: 'Manual test completed',
      result,
      instructions: [
        '✅ Test completed',
        '📱 Check your Telegram channel',
        '🔍 Check server logs for details',
      ],
    });
  } catch (error) {
    console.error('❌ Manual test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Manual test failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
