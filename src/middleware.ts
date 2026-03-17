import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/pricing',
  '/docs',
  '/privacy',
  '/terms',
  '/api/auth',
  '/api/webhooks',
  '/api/health',
];

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/search',
  '/storage',
  '/voice',
  '/api-keys',
  '/billing',
  '/settings',
];

interface CookieItem {
  name: string;
  value: string;
  options?: any;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some((route) => pathname === route || pathname.startsWith(route + '/'))) {
    // For auth pages, check if user is already logged in
    if (pathname === '/login' || pathname === '/register') {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(cookiesToSet: CookieItem[]) {
              cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            },
          },
        }
      );

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
    return NextResponse.next();
  }

  // Create Supabase client
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieItem[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Get session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Check for API key authentication
  const apiKey = request.headers.get('x-api-key') || 
                 request.headers.get('authorization')?.replace('Bearer ', '');

  // API routes can use API key authentication
  if (pathname.startsWith('/api/v1/')) {
    if (!session && !apiKey) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // If using API key, validate it
    if (apiKey && !session) {
      const keyValidation = await validateApiKey(apiKey);
      if (!keyValidation.valid) {
        return NextResponse.json(
          { error: 'Unauthorized', message: keyValidation.error },
          { status: 401 }
        );
      }
      // Add user info to headers for API routes
      supabaseResponse.headers.set('x-user-id', keyValidation.userId!);
    }

    return supabaseResponse;
  }

  // Protected routes require session
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!session) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Add user info to headers
  if (session) {
    supabaseResponse.headers.set('x-user-id', session.user.id);
    supabaseResponse.headers.set('x-user-email', session.user.email || '');
  }

  return supabaseResponse;
}

// API Key validation function
async function validateApiKey(apiKey: string): Promise<{ valid: boolean; userId?: string; error?: string }> {
  // API key format: yyd_xxxxxxxxxxxx
  if (!apiKey.startsWith('yyd_')) {
    return { valid: false, error: 'Invalid API key format' };
  }

  // In production, this would query the database
  // For now, return a placeholder response
  // TODO: Implement actual API key validation with database lookup
  
  return { valid: true, userId: 'placeholder' };
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};