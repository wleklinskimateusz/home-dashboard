// actions/auth.ts
"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { createSession, destroySession } from "@/lib/session";
import { User } from "@/lib/db";

// State types for useActionState
export type LoginState = {
    error?: string;
    needsPinSetup?: boolean;
    userId?: number;
    userName?: string;
};

export type SetupState = {
    error?: string;
};

export async function loginAction(
    prevState: LoginState,
    formData: FormData,
): Promise<LoginState> {
    const userId = Number(formData.get("userId"));
    const pin = formData.get("pin") as string;

    if (!userId || !pin) {
        return { error: "Please select a user and enter a PIN." };
    }

    const db = getDb();
    const user = db
        .prepare<number, User>(
            "SELECT id, name, pin_hash FROM users WHERE id = ?",
        )
        .get(userId);

    if (!user) {
        return { error: "User not found." };
    }

    // First login – no PIN set
    if (!user.pin_hash) {
        return { needsPinSetup: true, userId: user.id, userName: user.name };
    }

    // Verify PIN
    const isValid = await bcrypt.compare(pin, user.pin_hash);
    if (!isValid) {
        return { error: "Invalid PIN. Try again." };
    }

    // Success
    await createSession(user.id);
    redirect("/dashboard");
}

export async function setupPinAction(
    prevState: SetupState,
    formData: FormData,
): Promise<SetupState> {
    const userId = Number(formData.get("userId"));
    const pin = formData.get("pin") as string;

    if (!userId || !pin || pin.length < 4) {
        return { error: "PIN must be at least 4 characters." };
    }

    const db = getDb();
    const hashedPin = await bcrypt.hash(pin, 10);

    const result = db
        .prepare<[string, number]>(
            "UPDATE users SET pin_hash = ? WHERE id = ?",
        )
        .run(hashedPin, userId);

    if (result.changes === 0) {
        return { error: "User not found." };
    }

    // Auto-login after setting PIN
    await createSession(userId);
    redirect("/dashboard");
}

export async function logout(): Promise<void> {
    await destroySession();
    redirect("/login");
}
