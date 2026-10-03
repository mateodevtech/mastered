import { createHmac, timingSafeEqual } from "node:crypto";

// Signs the raw JSON body, not a re-serialized object — the receiver must
// verify against the exact bytes it received, or whitespace differences
// would make a valid signature look forged.
export function signWebhookPayload(secret: string, rawBody: string): string {
  return createHmac("sha256", secret).update(rawBody).digest("hex");
}

export function verifyWebhookSignature(secret: string, rawBody: string, signature: string): boolean {
  const expected = signWebhookPayload(secret, rawBody);
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(signature);
  if (expectedBuf.length !== actualBuf.length) return false;
  return timingSafeEqual(expectedBuf, actualBuf);
}
