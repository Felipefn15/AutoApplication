import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { guestSessionId } = await request.json();

    // Get the current user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get the guest session data
    const { data: guestData, error: guestError } = await supabase
      .from('guest_sessions')
      .select('*')
      .eq('session_id', guestSessionId)
      .single();

    if (guestError || !guestData) {
      return NextResponse.json(
        { error: 'Guest session not found' },
        { status: 404 }
      );
    }

    // Start a transaction to transfer data
    const { data: userData, error: transferError } = await supabase.rpc(
      'transfer_guest_data',
      {
        p_guest_session_id: guestSessionId,
        p_user_id: session.user.id
      }
    );

    if (transferError) {
      console.error('Error transferring guest data:', transferError);
      return NextResponse.json(
        { error: 'Failed to transfer guest data' },
        { status: 500 }
      );
    }

    // Delete the guest session
    await supabase
      .from('guest_sessions')
      .delete()
      .eq('session_id', guestSessionId);

    return NextResponse.json({
      message: 'Guest data transferred successfully',
      data: userData
    });
  } catch (error) {
    console.error('Error in transfer-guest-data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 