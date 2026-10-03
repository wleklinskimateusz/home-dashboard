// proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "@/lib/session";

// The function name is now 'proxy' instead of 'middleware'[reference:4]
export async function proxy(request: NextRequest) {
    // Use the same getSession() logic from your lib/session.ts
    const session = await getSession();
    const { pathname } = request.nextUrl;

    // Public paths (no auth required)
    const publicPaths = ["/login"];
    if (publicPaths.includes(pathname)) {
        // If user is already logged in, redirect to dashboard
        if (session) {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }
        return NextResponse.next();
    }

    // Protected paths (require auth)
    if (!session) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

// The matcher configuration remains the same[reference:5]
export const config = {
    matcher: ["/:path*", "/login"],
};
