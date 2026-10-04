// app/login/page.tsx
import { getDb } from '@/lib/db';
import { LoginForm } from './_components/LoginForm';
import { User } from '@/lib/db';

export default async function LoginPage() {
    const db = getDb();
    const users = db.prepare<[], Pick<User, 'id' | 'name'>>(
        'SELECT id, name FROM users ORDER BY name'
    ).all();

    console.log(users)

    return (
        <div style={{ maxWidth: 400, margin: '50px auto', padding: '0 1rem' }}>
            <h1>🏠 Kanban Dashboard</h1>
            <LoginForm users={users} />
        </div>
    );
}