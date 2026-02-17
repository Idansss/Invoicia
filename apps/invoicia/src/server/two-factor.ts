import crypto from "node:crypto"

import { env } from "@/server/env"

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
const TWO_FACTOR_PERIOD_SECONDS = 30
const TWO_FACTOR_DIGITS = 6

function base32Encode(bytes: Uint8Array) {
  let bits = 0
  let value = 0
  let output = ""

  for (const byte of bytes) {
    value = (value << 8) | byte
    bits += 8

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31]
  }

  return output
}

function base32Decode(input: string) {
  const normalized = input.toUpperCase().replace(/[^A-Z2-7]/g, "")
  let bits = 0
  let value = 0
  const output: number[] = []

  for (const char of normalized) {
    const index = BASE32_ALPHABET.indexOf(char)
    if (index < 0) continue

    value = (value << 5) | index
    bits += 5

    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255)
      bits -= 8
    }
  }

  return Buffer.from(output)
}

function getTwoFactorCryptoKey() {
  return crypto.createHash("sha256").update(env.NEXTAUTH_SECRET).digest()
}

function hotp(secretBase32: string, counter: number) {
  const secret = base32Decode(secretBase32)
  const counterBuffer = Buffer.alloc(8)
  const bigCounter = BigInt(counter)
  counterBuffer.writeBigUInt64BE(bigCounter)

  const hmac = crypto.createHmac("sha1", secret).update(counterBuffer).digest()
  const offset = hmac[hmac.length - 1] & 0x0f
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)

  const otp = binary % 10 ** TWO_FACTOR_DIGITS
  return otp.toString().padStart(TWO_FACTOR_DIGITS, "0")
}

function sanitizeCode(code: string) {
  return code.replace(/\s+/g, "").replace(/-/g, "")
}

export function generateTwoFactorSecret() {
  return base32Encode(crypto.randomBytes(20))
}

export function formatTwoFactorSecret(secret: string) {
  return secret.match(/.{1,4}/g)?.join(" ") ?? secret
}

export function createOtpAuthUrl(params: { issuer: string; accountName: string; secret: string }) {
  const label = encodeURIComponent(`${params.issuer}:${params.accountName}`)
  const issuer = encodeURIComponent(params.issuer)
  return `otpauth://totp/${label}?secret=${params.secret}&issuer=${issuer}&algorithm=SHA1&digits=${TWO_FACTOR_DIGITS}&period=${TWO_FACTOR_PERIOD_SECONDS}`
}

export function verifyTwoFactorCode(secret: string, code: string, window = 1) {
  const normalizedCode = sanitizeCode(code)
  if (!/^\d{6}$/.test(normalizedCode)) return false

  const counter = Math.floor(Date.now() / 1000 / TWO_FACTOR_PERIOD_SECONDS)
  for (let offset = -window; offset <= window; offset += 1) {
    const testCounter = counter + offset
    if (testCounter < 0) continue
    if (hotp(secret, testCounter) === normalizedCode) return true
  }

  return false
}

export function encryptTwoFactorSecret(secret: string) {
  const key = getTwoFactorCryptoKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv)
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`
}

export function decryptTwoFactorSecret(payload: string) {
  const [ivEncoded, tagEncoded, encryptedEncoded] = payload.split(".")
  if (!ivEncoded || !tagEncoded || !encryptedEncoded) {
    throw new Error("Invalid encrypted secret format.")
  }

  const key = getTwoFactorCryptoKey()
  const iv = Buffer.from(ivEncoded, "base64url")
  const tag = Buffer.from(tagEncoded, "base64url")
  const encrypted = Buffer.from(encryptedEncoded, "base64url")

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv)
  decipher.setAuthTag(tag)
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
  return decrypted.toString("utf8")
}
