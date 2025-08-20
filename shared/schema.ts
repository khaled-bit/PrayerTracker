import { sql } from "drizzle-orm";
import { pgTable, varchar, text, integer, date, timestamp, boolean, time, serial } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  age: integer("age").notNull(),
  email: varchar("email", { length: 150 }).notNull().unique(),
  password: text("password").notNull(),
  country: varchar("country", { length: 100 }),
  timezone: varchar("timezone", { length: 100 }),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
});

// Prayers Table
export const prayers = pgTable("prayers", {
  id: serial("id").primaryKey(),
  nameEn: varchar("name_en", { length: 50 }).notNull(),
  nameAr: varchar("name_ar", { length: 50 }).notNull(),
  scheduledTime: time("scheduled_time").notNull(),
});

// User Prayer Logs
export const userPrayers = pgTable("user_prayers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  prayerId: integer("prayer_id").references(() => prayers.id, { onDelete: "cascade" }).notNull(),
  prayerDate: date("prayer_date").notNull(),
  prayedAt: timestamp("prayed_at"),
  isOnTime: boolean("is_on_time"),
  pointsAwarded: integer("points_awarded").default(0),
});

// Notifications Table
export const prayerNotifications = pgTable("prayer_notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  prayerId: integer("prayer_id").references(() => prayers.id),
  prayerDate: date("prayer_date"),
  notifiedAt: timestamp("notified_at").default(sql`NOW()`),
  isAcknowledged: boolean("is_acknowledged").default(false),
});

// Daily Streaks Table
export const dailyStreaks = pgTable("daily_streaks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  streakDate: date("streak_date").notNull(),
  isQualified: boolean("is_qualified").default(false),
});

// Monthly Rewards Table
export const monthlyRewards = pgTable("monthly_rewards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  rewardMonth: date("reward_month").notNull(),
  suggestedReward: text("suggested_reward"),
  isWinner: boolean("is_winner").default(false),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  userPrayers: many(userPrayers),
  notifications: many(prayerNotifications),
  streaks: many(dailyStreaks),
  rewards: many(monthlyRewards),
}));

export const prayersRelations = relations(prayers, ({ many }) => ({
  userPrayers: many(userPrayers),
  notifications: many(prayerNotifications),
}));

export const userPrayersRelations = relations(userPrayers, ({ one }) => ({
  user: one(users, {
    fields: [userPrayers.userId],
    references: [users.id],
  }),
  prayer: one(prayers, {
    fields: [userPrayers.prayerId],
    references: [prayers.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserPrayerSchema = createInsertSchema(userPrayers).omit({
  id: true,
});

export const insertDailyStreakSchema = createInsertSchema(dailyStreaks).omit({
  id: true,
});

export const insertMonthlyRewardSchema = createInsertSchema(monthlyRewards).omit({
  id: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Prayer = typeof prayers.$inferSelect;
export type UserPrayer = typeof userPrayers.$inferSelect;
export type InsertUserPrayer = z.infer<typeof insertUserPrayerSchema>;
export type DailyStreak = typeof dailyStreaks.$inferSelect;
export type InsertDailyStreak = z.infer<typeof insertDailyStreakSchema>;
export type MonthlyReward = typeof monthlyRewards.$inferSelect;
export type InsertMonthlyReward = z.infer<typeof insertMonthlyRewardSchema>;
