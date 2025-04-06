import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  // If the request is for the root path, redirect to /eggspert
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/eggspert', request.url));
  }

  // Handle session updates for other routes
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/',
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
