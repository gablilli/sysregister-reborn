// import { get } from '@/lib/api'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('token');
    const tokenExpiry = request.cookies.get('tokenExpiry');
    const tokenExpiryDate = tokenExpiry ? new Date(tokenExpiry.toString()) : null;

    if (request.nextUrl.pathname !== '/auth') {
        if (!token || !tokenExpiryDate || tokenExpiryDate <= new Date()) {
            return NextResponse.redirect(new URL('/auth', request.url));
        }
    } else {
        if (token && tokenExpiryDate && tokenExpiryDate > new Date()) {
            return NextResponse.redirect(new URL('/', request.url));
        }
    }
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|icons|manifest.*).*)',
    ],
}