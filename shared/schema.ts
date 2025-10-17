import { pgTable, text, serial, integer, boolean, jsonb, timestamp, varchar, index } from "drizzle-orm/pg-core";
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
  language: varchar("language", { length: 2 }).notNull().default('en'), // 'en' or 'ar'
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

// Database table for storing all Quran surahs
export const surahs = pgTable("surahs", {
  id: integer("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  nameArabic: varchar("name_arabic", { length: 200 }).notNull(),
  nameTranslation: varchar("name_translation", { length: 200 }).notNull(),
  totalAyahs: integer("total_ayahs").notNull(),
  revelation: varchar("revelation", { length: 10 }).notNull(), // 'Meccan' or 'Medinan'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Database table for storing all ayahs (verses)
export const ayahs = pgTable("ayahs", {
  id: serial("id").primaryKey(),
  surahId: integer("surah_id").notNull().references(() => surahs.id),
  number: integer("number").notNull(), // ayah number within surah
  text: text("text").notNull(), // Arabic text
  translation: text("translation").notNull(), // English translation
  textUthmani: text("text_uthmani"), // Uthmani script Arabic text
  textSimple: text("text_simple"), // Simple Arabic text
  translationSahih: text("translation_sahih"), // Sahih International translation
  translationPickthall: text("translation_pickthall"), // Pickthall translation
  translationYusufali: text("translation_yusufali"), // Yusuf Ali translation
  juz: integer("juz"), // Juz/Para number
  manzil: integer("manzil"), // Manzil number
  page: integer("page"), // Mushaf page number
  ruku: integer("ruku"), // Ruku number
  hizbQuarter: integer("hizb_quarter"), // Hizb quarter
  sajda: boolean("sajda").default(false), // Contains sajda
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  surahAyahIdx: index("surah_ayah_idx").on(table.surahId, table.number),
  textSearchIdx: index("text_search_idx").on(table.text),
  translationSearchIdx: index("translation_search_idx").on(table.translation),
}));

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

export const insertSurahSchema = createInsertSchema(surahs).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertAyahSchema = createInsertSchema(ayahs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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
export type Surah = typeof surahs.$inferSelect;
export type InsertSurah = z.infer<typeof insertSurahSchema>;
export type Ayah = typeof ayahs.$inferSelect;
export type InsertAyah = z.infer<typeof insertAyahSchema>;

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

export const surahsRelations = relations(surahs, ({ many }) => ({
  ayahs: many(ayahs),
}));

export const ayahsRelations = relations(ayahs, ({ one }) => ({
  surah: one(surahs, {
    fields: [ayahs.surahId],
    references: [surahs.id],
  }),
}));
