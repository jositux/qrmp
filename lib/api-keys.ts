import { createHash, randomBytes } from "crypto"

export function generateApiKey() {
  const raw = randomBytes(24).toString("base64url")
  const key = `qrp_${raw}`
  return {
    key,
    hash: hashApiKey(key),
    prefix: key.slice(0, 12),
  }
}

export function hashApiKey(key: string) {
  return createHash("sha256").update(key).digest("hex")
}
