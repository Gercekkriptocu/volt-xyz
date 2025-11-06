/**
 * Telegram Trigger API - Triggers the auto-share endpoint
 * This is called by the TelegramAutoShare component every minute
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get the base URL from request headers (most reliable method)
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;
    
    console.log(`🔗 Triggering auto-share from: ${baseUrl}`);
    
    // Call the auto-share endpoint
    const response = await fetch(`${baseUrl}/api/telegram/auto-share`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Telegram auto-share error:', errorData);
      
      return NextResponse.json({
        success: false,
        error: 'Failed to trigger auto-share',
        details: errorData,
      }, { status: response.status });
    }

    const result = await response.json();
    
    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Error in Telegram trigger API:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to trigger Telegram auto-share',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
