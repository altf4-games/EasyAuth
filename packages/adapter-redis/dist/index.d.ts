import Redis from 'ioredis';
import { StorageAdapter } from '@altf4-auth/core';

interface RedisAdapterOptions {
    /** Redis connection URL, e.g. "redis://localhost:6379" */
    url?: string;
    /** Or pass an existing ioredis client */
    client?: Redis;
}
/**
 * Creates a Redis-backed StorageAdapter for easy-auth.
 * OTP TTLs use native Redis EXPIRE — no timestamp columns needed.
 * All keys are namespaced under `easy-auth:*`.
 *
 * @param options - Either a connection `url` or an existing ioredis `client`.
 * @returns A StorageAdapter ready to pass to createAuth().
 */
declare function redisAdapter(options: RedisAdapterOptions): StorageAdapter;

export { redisAdapter };
