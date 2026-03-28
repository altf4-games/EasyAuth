# ADAPTERS.md

## Storage Adapters

easy-auth ships with three storage adapters. Choose the one that fits your infrastructure.

---

### SQLite (`easy-auth-sqlite`)

Best for: single-process apps, development, small-scale deployments.

```bash
npm install easy-auth-sqlite
```

```ts
import { sqliteAdapter } from "easy-auth-sqlite";
const store = sqliteAdapter("./auth.db");
```

Uses `better-sqlite3`. The schema is created on first run and migrated idempotently.
WAL mode is enabled by default for better concurrent read performance.

---

### Redis (`easy-auth-redis`)

Best for: multi-process / multi-server deployments.

```bash
npm install easy-auth-redis
```

```ts
import { redisAdapter } from "easy-auth-redis";
const store = redisAdapter({ url: "redis://localhost:6379" });
// Or pass an existing ioredis client:
const store2 = redisAdapter({ client: existingRedisClient });
```

Uses `ioredis`. OTP TTLs are handled with native Redis `EXPIRE`. All keys are namespaced
under `easy-auth:*`.

---

### MongoDB (`easy-auth-mongo`)

Best for: teams already running MongoDB.

```bash
npm install easy-auth-mongo
```

```ts
import { mongoAdapter } from "easy-auth-mongo";
const store = mongoAdapter({
  uri: "mongodb://localhost:27017",
  dbName: "easy-auth",
});
```

Uses the official `mongodb` driver (not Mongoose). All indexes are created on first
connect, idempotently. OTP TTL is handled via a MongoDB TTL index on `expiresAt`.

---

### Custom adapters

Implement the `StorageAdapter` interface from `easy-auth`:

```ts
import type { StorageAdapter } from "easy-auth";

class MyCustomAdapter implements StorageAdapter {
  // ... implement all methods
}
```

Pass it as `store` in the `createAuth` config.
