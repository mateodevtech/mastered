import {
  pgTable,
  pgEnum,
  uuid,
  text,
  boolean,
  integer,
  date,
  timestamp,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// -----------------------------------------------------------------------
// Users & auth
// -----------------------------------------------------------------------

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  timezone: text("timezone").notNull().default("UTC"),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const magicLinkPurposeEnum = pgEnum("magic_link_purpose", [
  "login",
  "veilleur_invite",
]);

export const magicLinkTokens = pgTable("magic_link_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  tokenHash: text("token_hash").notNull(),
  purpose: magicLinkPurposeEnum("purpose").notNull(),
  relatedGoalId: uuid("related_goal_id").references(() => goals.id, {
    onDelete: "cascade",
  }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// -----------------------------------------------------------------------
// Goals & tasks
// -----------------------------------------------------------------------

export const goalTypeEnum = pgEnum("goal_type", [
  "one_off",
  "recurring",
  // "long_term" reserved for V2 (phased goals) — not offered in MVP UI.
  "long_term",
]);

export const goalStatusEnum = pgEnum("goal_status", [
  "active",
  "completed",
  "abandoned",
]);

export const goals = pgTable("goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  type: goalTypeEnum("type").notNull(),
  status: goalStatusEnum("status").notNull().default("active"),
  deadline: timestamp("deadline", { withTimezone: true }),
  recurrenceRule: jsonb("recurrence_rule"),
  customRewardText: text("custom_reward_text"),
  // V2 extension point: nullable, no FK yet. A future `goal_phases` table
  // will add the FK constraint — additive migration, no MVP data risk.
  parentPhaseId: uuid("parent_phase_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notificationModeEnum = pgEnum("notification_mode", [
  "normal",
  "blocking",
]);

export const proofTypeEnum = pgEnum("proof_type", ["text", "photo", "checkbox"]);

export const taskStatusEnum = pgEnum("task_status", [
  "pending",
  "done",
  "missed",
  "snoozed",
]);

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  goalId: uuid("goal_id")
    .notNull()
    .references(() => goals.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  deadline: timestamp("deadline", { withTimezone: true }).notNull(),
  notificationMode: notificationModeEnum("notification_mode")
    .notNull()
    .default("normal"),
  // Only tasks flagged as a critical commitment may use notificationMode = 'blocking'.
  isCriticalCommitment: boolean("is_critical_commitment").notNull().default(false),
  requiresProof: boolean("requires_proof").notNull().default(false),
  proofType: proofTypeEnum("proof_type"),
  status: taskStatusEnum("status").notNull().default("pending"),
  snoozedToDeadline: timestamp("snoozed_to_deadline", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const proofs = pgTable("proofs", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  submittedBy: uuid("submitted_by")
    .notNull()
    .references(() => users.id),
  type: proofTypeEnum("type").notNull(),
  textContent: text("text_content"),
  photoUrl: text("photo_url"),
  checked: boolean("checked"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
});

// -----------------------------------------------------------------------
// Veilleur (accountability witness)
// -----------------------------------------------------------------------

export const veilleurRelationshipStatusEnum = pgEnum("veilleur_relationship_status", [
  "pending",
  "active",
  "revoked",
]);

export const veilleurRelationships = pgTable(
  "veilleur_relationships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    goalId: uuid("goal_id")
      .notNull()
      .references(() => goals.id, { onDelete: "cascade" }),
    veilleurUserId: uuid("veilleur_user_id").references(() => users.id),
    invitedEmail: text("invited_email").notNull(),
    status: veilleurRelationshipStatusEnum("status").notNull().default("pending"),
    invitedAt: timestamp("invited_at", { withTimezone: true }).notNull().defaultNow(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  },
  (t) => ({
    // MVP constraint: one Veilleur per goal.
    oneVeilleurPerGoal: uniqueIndex("one_veilleur_per_goal").on(t.goalId),
  }),
);

export const veilleurResponseActionEnum = pgEnum("veilleur_response_action", [
  "validate",
  "nudge",
  "extend",
  "encourage",
]);

export const veilleurResponses = pgTable("veilleur_responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  proofId: uuid("proof_id")
    .notNull()
    .references(() => proofs.id, { onDelete: "cascade" }),
  veilleurUserId: uuid("veilleur_user_id")
    .notNull()
    .references(() => users.id),
  action: veilleurResponseActionEnum("action").notNull(),
  note: text("note"),
  newDeadline: timestamp("new_deadline", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// -----------------------------------------------------------------------
// Streaks, grace & badges
// -----------------------------------------------------------------------

export const streaks = pgTable("streaks", {
  id: uuid("id").primaryKey().defaultRandom(),
  goalId: uuid("goal_id")
    .notNull()
    .unique()
    .references(() => goals.id, { onDelete: "cascade" }),
  currentCount: integer("current_count").notNull().default(0),
  longestCount: integer("longest_count").notNull().default(0),
  freezesUsedThisMonth: integer("freezes_used_this_month").notNull().default(0),
  freezeMonthAnchor: date("freeze_month_anchor"),
  lastCompletedAt: timestamp("last_completed_at", { withTimezone: true }),
  repairWindowExpiresAt: timestamp("repair_window_expires_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const badgeTypeEnum = pgEnum("badge_type", [
  "streak_milestone",
  "goal_completed",
  "comeback",
  "consistency",
]);

export const badges = pgTable(
  "badges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    goalId: uuid("goal_id").references(() => goals.id, { onDelete: "set null" }),
    type: badgeTypeEnum("type").notNull(),
    label: text("label").notNull(),
    awardedAt: timestamp("awarded_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    // Dedupe: a given goal shouldn't earn the same labeled badge twice.
    dedupe: uniqueIndex("badge_dedupe").on(t.goalId, t.type, t.label),
  }),
);

// -----------------------------------------------------------------------
// Public API: API keys & webhooks
// -----------------------------------------------------------------------

export const apiKeys = pgTable("api_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  // Only the hash is stored (same pattern as sessions/magic links) — the
  // raw key is shown once at creation and cannot be recovered afterwards.
  keyHash: text("key_hash").notNull().unique(),
  // First chars of the raw key (e.g. "mk_live_ab12") kept in the clear so
  // the user can recognize which key is which in the list UI.
  keyPrefix: text("key_prefix").notNull(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const webhookEventEnum = pgEnum("webhook_event", [
  "task.completed",
  "goal.completed",
  "streak.broken",
  "streak.milestone",
]);

export const webhookEndpoints = pgTable("webhook_endpoints", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  // Shown once at creation, like the API key — needed again on every
  // delivery to sign the payload, so (unlike keyHash) it is stored in the
  // clear, same as Stripe/GitHub webhook secrets.
  secret: text("secret").notNull(),
  events: jsonb("events").notNull().$type<string[]>(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const webhookDeliveryStatusEnum = pgEnum("webhook_delivery_status", [
  "success",
  "failed",
]);

export const webhookDeliveries = pgTable("webhook_deliveries", {
  id: uuid("id").primaryKey().defaultRandom(),
  webhookEndpointId: uuid("webhook_endpoint_id")
    .notNull()
    .references(() => webhookEndpoints.id, { onDelete: "cascade" }),
  event: webhookEventEnum("event").notNull(),
  payload: jsonb("payload").notNull(),
  status: webhookDeliveryStatusEnum("status").notNull(),
  responseStatus: integer("response_status"),
  attempt: integer("attempt").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// -----------------------------------------------------------------------
// Push notifications
// -----------------------------------------------------------------------

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notificationTypeEnum = pgEnum("notification_type", [
  "normal_reminder",
  "blocking_alarm",
  "veilleur_missed_deadline",
  "veilleur_proof_submitted",
]);

export const notificationDeliveryStatusEnum = pgEnum("notification_delivery_status", [
  "sent",
  "failed",
]);

export const notificationLog = pgTable("notification_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
  deliveryStatus: notificationDeliveryStatusEnum("delivery_status")
    .notNull()
    .default("sent"),
});
