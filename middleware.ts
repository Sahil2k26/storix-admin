import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { ratelimit } from '@/lib/rateLimit'

const isPublicRoute = createRouteMatcher(['/signin(.*)', '/signup(.*)', '/api(.*)', '/'])

export default clerkMiddleware(async (auth, req) => {
  // const ip = req.headers.get('x-forwarded-for') || 'unknown';
  // // Rate limit the request
  // const { success } = await ratelimit.limit(ip);
  // if (!success) {
  //   return new Response('Too many requests', { status: 429, headers: { 'Content-Type': 'application/json' } })
  // }
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}