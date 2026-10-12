import Database from "better-sqlite3";

export abstract class Repository {
    protected readonly db: Database.Database;

    constructor(db: Database.Database) {
        this.db = db;
    }

    toIntegerId(id: string): number | null {
        if (!/^\d+$/.test(id)) return null;
        const value = Number(id);
        return Number.isSafeInteger(value) ? value : null;
    }
}
