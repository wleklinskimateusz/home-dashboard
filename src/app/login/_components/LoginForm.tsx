// components/LoginForm.tsx
'use client';

import { useActionState } from 'react';
import { loginAction, setupPinAction, LoginState, SetupState } from '@/actions/auth';
import { User } from '@/lib/db';

type LoginFormProps = {
    users: Pick<User, 'id' | 'name'>[];
};

export function LoginForm({ users }: LoginFormProps) {
    // Login form state
    const [loginState, loginFormAction, loginPending] = useActionState<
        LoginState,
        FormData
    >(loginAction, { error: undefined, needsPinSetup: false });

    // If we need to set up a PIN, show the setup form
    if (loginState?.needsPinSetup && loginState.userId) {
        return <PinSetupForm userId={loginState.userId} />;
    }

    return (
        <form action={loginFormAction}>
            <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="userId" style={{ display: 'block', marginBottom: '0.25rem' }}>
                    Select your name:
                </label>
                <select
                    id="userId"
                    name="userId"
                    required
                    style={{ width: '100%', padding: '0.5rem' }}
                >
                    <option value="">-- Choose --</option>
                    {users.map((u) => (
                        <option key={u.id} value={u.id}>
                            {u.name}
                        </option>
                    ))}
                </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="pin" style={{ display: 'block', marginBottom: '0.25rem' }}>
                    Enter your PIN:
                </label>
                <input
                    id="pin"
                    name="pin"
                    type="password"
                    required
                    minLength={4}
                    style={{ width: '100%', padding: '0.5rem' }}
                />
            </div>

            <button
                type="submit"
                disabled={loginPending}
                style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#0070f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    cursor: loginPending ? 'not-allowed' : 'pointer',
                }}
            >
                {loginPending ? 'Logging in...' : 'Login'}
            </button>

            {loginState?.error && (
                <p style={{ color: 'red', marginTop: '1rem' }}>{loginState.error}</p>
            )}
        </form>
    );
}

// ------------------------------------------------------------
// PIN Setup Sub-component
// ------------------------------------------------------------
function PinSetupForm({ userId }: { userId: number }) {
    const [setupState, setupFormAction, setupPending] = useActionState<
        SetupState,
        FormData
    >(setupPinAction, { error: undefined });

    return (
        <div>
            <h2>🔐 Set up your PIN</h2>
            <p>Welcome! This is your first login. Please set a PIN.</p>

            <form action={setupFormAction}>
                <input type="hidden" name="userId" value={userId} />

                <div style={{ marginBottom: '1rem' }}>
                    <label htmlFor="newPin" style={{ display: 'block', marginBottom: '0.25rem' }}>
                        New PIN (at least 4 digits):
                    </label>
                    <input
                        id="newPin"
                        name="pin"
                        type="password"
                        required
                        minLength={4}
                        style={{ width: '100%', padding: '0.5rem' }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={setupPending}
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '1rem',
                        cursor: setupPending ? 'not-allowed' : 'pointer',
                    }}
                >
                    {setupPending ? 'Setting PIN...' : 'Set PIN & Continue'}
                </button>

                {setupState?.error && (
                    <p style={{ color: 'red', marginTop: '1rem' }}>{setupState.error}</p>
                )}
            </form>
        </div>
    );
}