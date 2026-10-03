import "server-only";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

// Constructed lazily, not at module scope: creating the transporter
// doesn't itself fail on missing credentials, but we still want the same
// "don't touch secrets until something actually sends" shape as before.
let transporter: Transporter | null = null;
function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return transporter;
}

// Gmail SMTP has no sandbox restriction (unlike Resend's shared sender,
// which only delivers to the account owner) — fine for Mastered's current
// scale, but Gmail enforces a ~500/day sending limit and may flag higher
// volume as spam. Swap for a verified transactional domain if that's ever
// a real constraint.
const FROM = `Mastered <${process.env.GMAIL_USER}>`;

async function send(params: { to: string; subject: string; html: string }) {
  await getTransporter().sendMail({ from: FROM, ...params });
}

export async function sendLoginEmail(to: string, url: string) {
  await send({
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
    to,
    subject: `${veilleurName} ${actionText[action]}`,
    html: `
      <p>Ton Veilleur ${veilleurName} ${actionText[action]} pour « ${taskTitle} ».</p>
      ${note ? `<p>"${note}"</p>` : ""}
    `,
  });
}
