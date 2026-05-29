import { NextRequest, NextResponse } from 'next/server';
import { getPreferenceStats } from '../../../../application/services/preferenceService';

const ADMIN_EMAILS = ['miraishop47@gmail.com', 'ariaacris73@gmail.com'];

/**
 * GET /api/admin/preferences
 *
 * Returns aggregated user-preference statistics.
 * Requires the caller to be authenticated as admin.
 */
export async function GET(req: NextRequest) {
  try {
    // Check admin token via Authorization header (Bearer <email> — simple guard
    // consistent with the rest of the app's server-side checks).
    const authHeader = req.headers.get('authorization') ?? '';
    const email = authHeader.replace('Bearer ', '').trim();

    if (!ADMIN_EMAILS.includes(email)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const stats = await getPreferenceStats();
    return NextResponse.json(stats, { status: 200 });
  } catch (err) {
    console.error('[GET /api/admin/preferences]', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
