import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  pauseDuration: integer("pause_duration").notNull().default(5),
  autoRepeat: boolean("auto_repeat").notNull().default(false),
  lastSurah: integer("last_surah").default(1),
  lastAyah: integer("last_ayah").default(1),
});

export const recitationSessions = pgTable("recitation_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  surahId: integer("surah_id").notNull(),
  startAyah: integer("start_ayah").notNull(),
  endAyah: integer("end_ayah").notNull(),
  completedAyahs: integer("completed_ayahs").notNull().default(0),
  sessionTime: integer("session_time").notNull().default(0), // in seconds
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const bookmarkedAyahs = pgTable("bookmarked_ayahs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  surahId: integer("surah_id").notNull(),
  ayahNumber: integer("ayah_number").notNull(),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
});

export const insertRecitationSessionSchema = createInsertSchema(recitationSessions).omit({
  id: true,
  createdAt: true,
});

export const insertBookmarkedAyahSchema = createInsertSchema(bookmarkedAyahs).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type RecitationSession = typeof recitationSessions.$inferSelect;
export type InsertRecitationSession = z.infer<typeof insertRecitationSessionSchema>;
export type BookmarkedAyah = typeof bookmarkedAyahs.$inferSelect;
export type InsertBookmarkedAyah = z.infer<typeof insertBookmarkedAyahSchema>;

// Quran data types
export interface Surah {
  id: number;
  name: string;
  nameArabic: string;
  nameTranslation: string;
  totalAyahs: number;
  revelation: 'Meccan' | 'Medinan';
}

export interface Ayah {
  number: number;
  text: string;
  translation: string;
  surahId: number;
}
