import crypto from "crypto";

export function unguessableToken(bytes = 24) {
  return crypto.randomBytes(bytes).toString("base64url");
}

