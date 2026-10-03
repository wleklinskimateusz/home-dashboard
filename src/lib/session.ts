// lib/session.ts
import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";

const secret = new TextEncoder().encode(
    process.env.JWT_SECRET || "change-this-very-long-secret-key",
);

export async function createSession(userId: number): Promise<void> {
    const token = await new SignJWT({ userId })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("7d")
        .sign(secret);

    (await cookies()).set("session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
    });
}

export async function getSession(): Promise<number | null> {
    const cookie = (await cookies()).get("session")?.value;
    if (!cookie) return null;
    try {
        const { payload } = await jwtVerify(cookie, secret);
        return payload.userId as number;
    } catch {
        return null;
    }
}

export async function destroySession(): Promise<void> {
    (await cookies()).delete("session");
}
