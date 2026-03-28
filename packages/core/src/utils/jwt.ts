import jwt from "jsonwebtoken";
import crypto from "crypto";
import { AuthError } from "./errors.js";

/** JWT signing algorithm — HS256 is well-supported and appropriate for single-secret setups */
const JWT_ALGORITHM = "HS256" as const;

/** Default session duration */
const DEFAULT_EXPIRES_IN = "7d";

export interface TokenPayload {
  sub: string;
  iat: number;
  exp: number;
  jti: string;
}

/**
 * Issues a signed JWT for the given email address.
 * Each token gets a unique `jti` (JWT ID) to allow future per-token revocation patterns.
 *
 * @param email - The user's email address (becomes `sub`).
 * @param secret - The JWT signing secret (minimum 32 chars enforced at createAuth time).
 * @param expiresIn - Duration string accepted by jsonwebtoken (e.g. "7d", "1h").
 * @returns A signed JWT string.
 */
export function signToken(
  email: string,
  secret: string,
  expiresIn: string = DEFAULT_EXPIRES_IN
): string {
  const jti = crypto.randomUUID();
  return jwt.sign({ jti }, secret, {
    subject: email,
    algorithm: JWT_ALGORITHM,
    expiresIn: expiresIn as jwt.SignOptions["expiresIn"],
  });
}

/**
 * Verifies a JWT and returns the decoded payload.
 * Throws AuthError instead of returning null so callers can use try/catch uniformly.
 *
 * @param token - The raw JWT string from the Authorization header or cookie.
 * @param secret - The JWT signing secret.
 * @returns The decoded payload including `sub` (email) and `jti`.
 * @throws {AuthError} with code TOKEN_EXPIRED if the token has expired.
 * @throws {AuthError} with code TOKEN_INVALID for any other verification failure.
 */
export function verifyToken(token: string, secret: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: [JWT_ALGORITHM],
    }) as TokenPayload;
    return decoded;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AuthError("TOKEN_EXPIRED", "Session token has expired");
    }
    throw new AuthError("TOKEN_INVALID", "Session token is invalid");
  }
}
