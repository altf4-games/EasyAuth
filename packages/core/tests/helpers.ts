import { createAuth } from "../src/core.js";
import { MemoryAdapter } from "../src/adapters/memory.js";
import type { AuthConfig } from "../src/types.js";

/**
 * A 32-char+ JWT secret safe for testing.
 * Do not use shorter strings — createAuth enforces the minimum.
 */
export const TEST_JWT_SECRET = "test-secret-value-that-is-long-enough-32chars";

/**
 * Creates an auth instance wired to a fresh in-memory adapter.
 * Email sending is handled by mocking sendOTPEmail in individual tests.
 *
 * @param overrides - Partial config merged over the test defaults.
 */
export function createTestAuth(overrides: Partial<AuthConfig> = {}) {
  const store = new MemoryAdapter();

  const config: AuthConfig = {
    smtp: {
      host: "localhost",
      port: 1025,
      secure: false,
      auth: { user: "test", pass: "test" },
      from: "Test App <noreply@test.example>",
    },
    jwt: {
      secret: TEST_JWT_SECRET,
      expiresIn: "1h",
    },
    store,
    ...overrides,
  };

  const auth = createAuth(config);
  return { auth, store };
}
