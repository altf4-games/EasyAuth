# ADAPTERS.md

## Storage Adapters

easy-auth ships with three storage adapters. Choose the one that fits your infrastructure.

---

### SQLite (`@altf4-auth/sqlite`)

Best for: single-process apps, development, small-scale deployments.

```bash
npm install easy-auth-sqlite
```

```ts
import { sqliteAdapter } from "@altf4-auth/sqlite";
const store = sqliteAdapter("./auth.db");
```

Uses `better-sqlite3`. The schema is created on first run and migrated idempotently.
WAL mode is enabled by default for better concurrent read performance.

---

### Redis (`@altf4-auth/redis`)

Best for: multi-process / multi-server deployments.

```bash
npm install easy-auth-redis
```

```ts
import { redisAdapter } from "@altf4-auth/redis";
const store = redisAdapter({ url: "redis://localhost:6379" });
// Or pass an existing ioredis client:
const store2 = redisAdapter({ client: existingRedisClient });
```

Uses `ioredis`. OTP TTLs are handled with native Redis `EXPIRE`. All keys are namespaced
under `easy-auth:*`.

---

### MongoDB (`@altf4-auth/mongo`)

Best for: teams already running MongoDB.

```bash
npm install easy-auth-mongo
```

```ts
import { mongoAdapter } from "@altf4-auth/mongo";
const store = mongoAdapter({
  uri: "mongodb://localhost:27017",
  dbName: "@altf4-auth/core",
});
```

Uses the official `mongodb` driver (not Mongoose). All indexes are created on first
connect, idempotently. OTP TTL is handled via a MongoDB TTL index on `expiresAt`.

---

### Custom adapters

Implement the `StorageAdapter` interface from `@altf4-auth/core`:

```ts
import type { StorageAdapter } from "@altf4-auth/core";

class MyCustomAdapter implements StorageAdapter {
  // ... implement all methods
}
```

Pass it as `store` in the `createAuth` config.
