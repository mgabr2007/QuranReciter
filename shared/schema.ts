import { pgTable, text, serial, integer, boolean, jsonb, timestamp, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").unique(),
  displayName: text("display_name"),
  role: varchar("role", { length: 20 }).notNull().default('member'), // 'member' or 'admin'
  createdAt: timestamp("created_at").defaultNow(),
});

export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  pauseDuration: integer("pause_duration").notNull().default(5),
  noPause: boolean("no_pause").notNull().default(false),
  autoRepeat: boolean("auto_repeat").notNull().default(false),
  autoRepeatAyah: boolean("auto_repeat_ayah").notNull().default(false),
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

// Ayah practice/listening log for memorization tracking
export const ayahPracticeLog = pgTable("ayah_practice_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  surahId: integer("surah_id").notNull().references(() => surahs.id),
  ayahNumber: integer("ayah_number").notNull(),
  practiceDate: text("practice_date").notNull(), // YYYY-MM-DD format
  listenCount: integer("listen_count").notNull().default(1),
  totalDuration: integer("total_duration").notNull().default(0), // Total time spent in seconds
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userSurahAyahIdx: index("user_surah_ayah_idx").on(table.userId, table.surahId, table.ayahNumber),
  userDateIdx: index("user_date_idx").on(table.userId, table.practiceDate),
}));

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

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
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

export const insertAyahPracticeLogSchema = createInsertSchema(ayahPracticeLog).omit({
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
export type AyahPracticeLog = typeof ayahPracticeLog.$inferSelect;
export type InsertAyahPracticeLog = z.infer<typeof insertAyahPracticeLogSchema>;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  preferences: many(userPreferences),
  sessions: many(recitationSessions),
  bookmarks: many(bookmarkedAyahs),
  practiceLogs: many(ayahPracticeLog),
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

export const ayahPracticeLogRelations = relations(ayahPracticeLog, ({ one }) => ({
  user: one(users, {
    fields: [ayahPracticeLog.userId],
    references: [users.id],
  }),
  surah: one(surahs, {
    fields: [ayahPracticeLog.surahId],
    references: [surahs.id],
  }),
}));

// Communities table
export const communities = pgTable("communities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  adminId: integer("admin_id").notNull().references(() => users.id),
  maxMembers: integer("max_members").notNull().default(30),
  weekStartDay: integer("week_start_day").notNull().default(5), // 0=Sunday, 5=Friday
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Community members table
export const communityMembers = pgTable("community_members", {
  id: serial("id").primaryKey(),
  communityId: integer("community_id").notNull().references(() => communities.id, { onDelete: 'cascade' }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => ({
  uniqueMembership: index("unique_membership_idx").on(table.communityId, table.userId),
}));

// Juz assignments table
export const juzAssignments = pgTable("juz_assignments", {
  id: serial("id").primaryKey(),
  communityMemberId: integer("community_member_id").notNull().references(() => communityMembers.id, { onDelete: 'cascade' }),
  juzNumber: integer("juz_number").notNull(), // 1-30
  assignedAt: timestamp("assigned_at").defaultNow(),
  canModifyUntil: timestamp("can_modify_until").notNull(), // 2 days from assignment
}, (table) => ({
  communityMemberIdx: index("community_member_idx").on(table.communityMemberId),
}));

// Weekly tracking table
export const weeklyProgress = pgTable("weekly_progress", {
  id: serial("id").primaryKey(),
  communityMemberId: integer("community_member_id").notNull().references(() => communityMembers.id, { onDelete: 'cascade' }),
  juzNumber: integer("juz_number").notNull(), // 1-30
  weekStartDate: text("week_start_date").notNull(), // YYYY-MM-DD format (Friday)
  completedAyahs: integer("completed_ayahs").notNull().default(0),
  totalAyahsInJuz: integer("total_ayahs_in_juz").notNull(),
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  memberWeekIdx: index("member_week_idx").on(table.communityMemberId, table.weekStartDate),
  weekJuzIdx: index("week_juz_idx").on(table.weekStartDate, table.juzNumber),
}));

// Insert schemas for community tables
export const insertCommunitySchema = createInsertSchema(communities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommunityMemberSchema = createInsertSchema(communityMembers).omit({
  id: true,
  joinedAt: true,
});

export const insertJuzAssignmentSchema = createInsertSchema(juzAssignments).omit({
  id: true,
  assignedAt: true,
});

export const insertWeeklyProgressSchema = createInsertSchema(weeklyProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for community tables
export type Community = typeof communities.$inferSelect;
export type InsertCommunity = z.infer<typeof insertCommunitySchema>;
export type CommunityMember = typeof communityMembers.$inferSelect;
export type InsertCommunityMember = z.infer<typeof insertCommunityMemberSchema>;
export type JuzAssignment = typeof juzAssignments.$inferSelect;
export type InsertJuzAssignment = z.infer<typeof insertJuzAssignmentSchema>;
export type WeeklyProgress = typeof weeklyProgress.$inferSelect;
export type InsertWeeklyProgress = z.infer<typeof insertWeeklyProgressSchema>;

// Relations for community tables
export const communitiesRelations = relations(communities, ({ one, many }) => ({
  admin: one(users, {
    fields: [communities.adminId],
    references: [users.id],
  }),
  members: many(communityMembers),
}));

export const communityMembersRelations = relations(communityMembers, ({ one, many }) => ({
  community: one(communities, {
    fields: [communityMembers.communityId],
    references: [communities.id],
  }),
  user: one(users, {
    fields: [communityMembers.userId],
    references: [users.id],
  }),
  juzAssignments: many(juzAssignments),
  weeklyProgress: many(weeklyProgress),
}));

export const juzAssignmentsRelations = relations(juzAssignments, ({ one }) => ({
  communityMember: one(communityMembers, {
    fields: [juzAssignments.communityMemberId],
    references: [communityMembers.id],
  }),
}));

export const weeklyProgressRelations = relations(weeklyProgress, ({ one }) => ({
  communityMember: one(communityMembers, {
    fields: [weeklyProgress.communityMemberId],
    references: [communityMembers.id],
  }),
}));
