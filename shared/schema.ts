import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
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
  surahName: text("surah_name").notNull(),
  startAyah: integer("start_ayah").notNull(),
  endAyah: integer("end_ayah").notNull(),
  completedAyahs: integer("completed_ayahs").notNull().default(0),
  sessionTime: integer("session_time").notNull().default(0), // in seconds
  pauseDuration: integer("pause_duration").notNull().default(5),
  isCompleted: boolean("is_completed").notNull().default(false),
  reciterName: text("reciter_name").default("Al-Afasy"),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const bookmarkedAyahs = pgTable("bookmarked_ayahs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  surahId: integer("surah_id").notNull(),
  ayahNumber: integer("ayah_number").notNull(),
  notes: text("notes"),
  tags: text("tags"), // Comma-separated tags
  isFavorite: boolean("is_favorite").default(false),
  rating: integer("rating"), // 1-5 star rating
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const cachedAudioFiles = pgTable("cached_audio_files", {
  id: serial("id").primaryKey(),
  surahId: integer("surah_id").notNull(),
  ayahNumber: integer("ayah_number").notNull(),
  reciterName: text("reciter_name").notNull().default("al-afasy"),
  audioUrl: text("audio_url").notNull(),
  alternativeUrl: text("alternative_url"),
  duration: integer("duration"), // in seconds
  fileSize: integer("file_size"), // in bytes
  isVerified: boolean("is_verified").notNull().default(false),
  lastChecked: text("last_checked").notNull().default("CURRENT_TIMESTAMP"),
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
  updatedAt: true,
});

export const insertCachedAudioFileSchema = createInsertSchema(cachedAudioFiles).omit({
  id: true,
  createdAt: true,
  lastChecked: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type RecitationSession = typeof recitationSessions.$inferSelect;
export type InsertRecitationSession = z.infer<typeof insertRecitationSessionSchema>;
export type BookmarkedAyah = typeof bookmarkedAyahs.$inferSelect;
export type InsertBookmarkedAyah = z.infer<typeof insertBookmarkedAyahSchema>;
export type CachedAudioFile = typeof cachedAudioFiles.$inferSelect;
export type InsertCachedAudioFile = z.infer<typeof insertCachedAudioFileSchema>;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  preferences: many(userPreferences),
  sessions: many(recitationSessions),
  bookmarks: many(bookmarkedAyahs),
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}));

export const recitationSessionsRelations = relations(recitationSessions, ({ one }) => ({
  user: one(users, {
    fields: [recitationSessions.userId],
    references: [users.id],
  }),
}));

export const bookmarkedAyahsRelations = relations(bookmarkedAyahs, ({ one }) => ({
  user: one(users, {
    fields: [bookmarkedAyahs.userId],
    references: [users.id],
  }),
}));

export const cachedAudioFilesRelations = relations(cachedAudioFiles, ({ one }) => ({
  // No direct relation to users since audio files are shared across all users
}));

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
  arabicText?: string;
  englishTranslation?: string;
}
