export { createAuth } from "./core.js";
export type { AuthInstance, VerifyOTPResult, Enroll2FAResult } from "./core.js";
export type { AuthConfig, StorageAdapter, User, AuthErrorCode } from "./types.js";
export { AuthError } from "./utils/errors.js";
export { MemoryAdapter } from "./adapters/memory.js";
