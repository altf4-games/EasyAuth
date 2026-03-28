import { StorageAdapter } from 'easy-auth';

/** Extended adapter with lifecycle methods for resource cleanup */
interface SQLiteAdapter extends StorageAdapter {
    /** Close the underlying database connection. Call this on process exit or in test teardown. */
    close(): void;
}
/**
 * Creates a SQLite-backed StorageAdapter for easy-auth.
 * Uses better-sqlite3 (synchronous, no connection pool needed).
 * WAL mode is enabled for better concurrent read performance.
 *
 * @param dbPath - Path to the SQLite database file (e.g. "./auth.db").
 * @returns A StorageAdapter ready to pass to createAuth().
 */
declare function sqliteAdapter(dbPath: string): SQLiteAdapter;

export { type SQLiteAdapter, sqliteAdapter };
