import "server-only";
import { Resend } from "resend";

// Constructed lazily, not at module scope: the Resend SDK throws
// immediately if the API key is missing, which would otherwise crash
// Next.js's build-time route analysis in environments with no secrets
// configured (e.g. CI running only lint/typecheck/test, no real .env).
let resend: Resend | null = null;
function getResendClient(): Resend {
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

// resend.dev's shared sender works without a verified domain, but Resend
// only delivers it to the account owner's own address — fine for solo MVP
// testing, swap for a verified "from" domain before inviting real users.
const FROM = "Mastered <onboarding@resend.dev>";

// The Resend SDK does NOT throw on a failed send — it resolves with
// { data: null, error }. Callers awaiting .send() directly would silently
// swallow real failures (invalid key, sandbox restrictions, quota) and
// report success to the user. Route every send through this so failures
// surface as thrown errors instead.
async function send(params: Parameters<Resend["emails"]["send"]>[0]) {
  const { error } = await getResendClient().emails.send(params);
  if (error) {
    throw new Error(`Resend: ${error.name} — ${error.message}`);
  }
}

export async function sendLoginEmail(to: string, url: string) {
  await send({
    from: FROM,
    to,
    subject: "Ton lien de connexion Mastered",
    html: `
      <p>Clique sur le lien ci-dessous pour te connecter à Mastered. Il expire dans 15 minutes.</p>
      <p><a href="${url}">${url}</a></p>
      <p>Si tu n'es pas à l'origine de cette demande, ignore cet email.</p>
    `,
  });
}

export async function sendVeilleurInviteEmail(
  to: string,
  url: string,
  inviterName: string,
  goalTitle: string,
) {
  await send({
    from: FROM,
    to,
    subject: `${inviterName} t'invite à devenir son Veilleur`,
    html: `
      <p>${inviterName} t'invite à soutenir son objectif « ${goalTitle} » en tant que Veilleur.</p>
      <p>Tu pourras voir sa progression, l'encourager, et être notifié·e si une échéance est ratée.</p>
      <p><a href="${url}">${url}</a></p>
    `,
  });
}

export async function sendVeilleurMissedDeadlineEmail(
  to: string,
  ownerName: string,
  goalTitle: string,
  taskTitle: string,
) {
  await send({
    from: FROM,
    to,
    subject: `${ownerName} a besoin de ton soutien`,
    html: `
      <p>${ownerName} n'a pas encore répondu à l'échéance de « ${taskTitle} » (objectif « ${goalTitle} »).</p>
      <p>Un petit mot d'encouragement peut faire la différence — va voir sa progression dans Mastered.</p>
    `,
  });
}

export async function sendVeilleurResponseEmail(
  to: string,
  veilleurName: string,
  action: "nudge" | "encourage" | "extend",
  taskTitle: string,
  note?: string,
) {
  const actionText: Record<"nudge" | "encourage" | "extend", string> = {
    nudge: "t'a envoyé une relance",
    encourage: "t'a envoyé un encouragement",
    extend: "a prolongé ton échéance",
  };

  await send({
    from: FROM,
    to,
    subject: `${veilleurName} ${actionText[action]}`,
    html: `
      <p>Ton Veilleur ${veilleurName} ${actionText[action]} pour « ${taskTitle} ».</p>
      ${note ? `<p>"${note}"</p>` : ""}
    `,
  });
}
