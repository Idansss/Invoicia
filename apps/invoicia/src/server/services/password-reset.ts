import { createHmac, timingSafeEqual } from "node:crypto"
import { env } from "@/server/env"

const EXPIRY_MS = 60 * 60 * 1000 // 1 hour

function sign(payload: string): string {
  return createHmac("sha256", env.NEXTAUTH_SECRET).update(payload).digest("hex")
}

/**
 * Creates a signed, versioned, time-limited reset token.
 * Token format (base64url): `${userId}.${version}.${expiry}.${hmac}`
 * The version is incremented in the DB after each successful reset,
 * which invalidates all previously issued tokens for that user.
 */
export function createPasswordResetToken(userId: string, version: number): string {
  const expiry = Date.now() + EXPIRY_MS
  const payload = `${userId}.${version}.${expiry}`
  const sig = sign(payload)
  return Buffer.from(`${payload}.${sig}`).toString("base64url")
}

export function verifyPasswordResetToken(
  token: string,
): { userId: string; version: number } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8")
    const lastDot = decoded.lastIndexOf(".")
    if (lastDot === -1) return null
    const payload = decoded.slice(0, lastDot)
    const sig = decoded.slice(lastDot + 1)
    const expected = sign(payload)
    if (sig.length !== expected.length) return null
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
    // payload = userId.version.expiry  (userId may contain dots from cuid)
    const parts = payload.split(".")
    if (parts.length < 3) return null
    const expiry = Number(parts[parts.length - 1])
    const version = Number(parts[parts.length - 2])
    if (!Number.isFinite(expiry) || !Number.isFinite(version)) return null
    if (Date.now() > expiry) return null
    const userId = parts.slice(0, -2).join(".")
    return { userId, version }
  } catch {
    return null
  }
}
