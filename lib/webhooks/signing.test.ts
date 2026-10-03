import { describe, expect, it } from "vitest";
import { signWebhookPayload, verifyWebhookSignature } from "./signing";

describe("signWebhookPayload / verifyWebhookSignature", () => {
  it("produces a deterministic hex HMAC-SHA256", () => {
    const sig = signWebhookPayload("secret", '{"event":"task.completed"}');
    expect(sig).toMatch(/^[0-9a-f]{64}$/);
    expect(signWebhookPayload("secret", '{"event":"task.completed"}')).toBe(sig);
  });

  it("verifies a matching signature", () => {
    const body = '{"event":"goal.completed"}';
    const sig = signWebhookPayload("my-secret", body);
    expect(verifyWebhookSignature("my-secret", body, sig)).toBe(true);
  });

  it("rejects a tampered body", () => {
    const sig = signWebhookPayload("my-secret", '{"event":"goal.completed"}');
    expect(verifyWebhookSignature("my-secret", '{"event":"goal.tampered"}', sig)).toBe(false);
  });

  it("rejects a wrong secret", () => {
    const body = '{"event":"streak.broken"}';
    const sig = signWebhookPayload("secret-a", body);
    expect(verifyWebhookSignature("secret-b", body, sig)).toBe(false);
  });

  it("rejects a signature of the wrong length without throwing", () => {
    expect(verifyWebhookSignature("secret", "{}", "not-a-real-signature")).toBe(false);
  });
});
