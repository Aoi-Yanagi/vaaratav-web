import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// 1. Define our VIP Public Routes (including our webhook!)
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)', 
  '/sign-up(.*)', 
  '/api/webhooks/clerk(.*)',
  '/guest-chat(.*)', 
  '/meeting-ended'
]);

// 2. The Proxy logic
export default clerkMiddleware(async (auth, req) => {
  // If the route is NOT public, force them to log in.
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

// 3. The Next.js 16 Matcher (Do not touch this part!)
export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};