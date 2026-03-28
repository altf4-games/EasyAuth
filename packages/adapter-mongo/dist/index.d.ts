import { StorageAdapter } from '@altf4-auth/core';

interface MongoAdapterOptions {
    uri: string;
    dbName: string;
}
/**
 * Creates a MongoDB-backed StorageAdapter for easy-auth.
 * Uses the official mongodb driver (not Mongoose).
 * All indexes are created on first connect, idempotently.
 * OTP TTL is handled via a MongoDB TTL index on the expiresAt field.
 *
 * @param options - Connection uri and database name.
 * @returns A StorageAdapter ready to pass to createAuth().
 */
declare function mongoAdapter(options: MongoAdapterOptions): StorageAdapter;

export { mongoAdapter };
