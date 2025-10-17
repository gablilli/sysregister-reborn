// import { get } from '@/lib/api'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('token');
    const internal_token = request.cookies.get('internal_token');
    const tokenExpiry = request.cookies.get('tokenExpiry');
    const tokenExpiryDate = tokenExpiry ? new Date(tokenExpiry.toString()) : null;

    if (request.nextUrl.pathname !== '/auth') {
        if (!token || !tokenExpiryDate || tokenExpiryDate <= new Date() || !internal_token) {
            return NextResponse.redirect(new URL('/auth', request.url));
        }
        return NextResponse.next();
    } else {
        if (token && tokenExpiryDate && tokenExpiryDate > new Date() && internal_token) {
            return NextResponse.redirect(new URL('/', request.url));
        }
        return NextResponse.next();
    }
}

export const config = {
    matcher: [
        '/((?!api|_next|favicon.ico|icons|manifest).*)',
    ],
}