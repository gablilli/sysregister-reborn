// import { get } from '@/lib/api'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    const internal_token = request.cookies.get('internal_token')?.value;
    const tokenExpiry = request.cookies.get('tokenExpiry')?.value;
    const tokenExpiryDate = tokenExpiry ? new Date(tokenExpiry) : null;

    // Check if the request is for the app routes (protected area)
    const isAppRoute = request.nextUrl.pathname.startsWith('/app');
    
    if (isAppRoute) {
        // Protect app routes - require authentication
        if (!token || !tokenExpiryDate || tokenExpiryDate <= new Date() || !internal_token) {
            return NextResponse.redirect(new URL('/', request.url));
        }
        return NextResponse.next();
    } else if (request.nextUrl.pathname === '/') {
        // If user is already authenticated and tries to access login page, redirect to app
        if (token && tokenExpiryDate && tokenExpiryDate > new Date() && internal_token) {
            return NextResponse.redirect(new URL('/app', request.url));
        }
        return NextResponse.next();
    }
    
    // Allow all other routes
    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next|favicon.ico|icons|manifest).*)',
    ],
}