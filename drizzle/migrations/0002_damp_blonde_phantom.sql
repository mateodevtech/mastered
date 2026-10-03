DROP INDEX "one_veilleur_per_goal";--> statement-breakpoint
CREATE UNIQUE INDEX "one_relationship_per_goal_email" ON "veilleur_relationships" USING btree ("goal_id","invited_email");