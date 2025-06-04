import { 
  users, 
  userPreferences, 
  recitationSessions, 
  bookmarkedAyahs,
  type User, 
  type InsertUser,
  type UserPreferences,
  type InsertUserPreferences,
  type RecitationSession,
  type InsertRecitationSession,
  type BookmarkedAyah,
  type InsertBookmarkedAyah,
  type Surah,
  type Ayah
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getUserPreferences(userId: number): Promise<UserPreferences | undefined>;
  createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences>;
  updateUserPreferences(userId: number, preferences: Partial<InsertUserPreferences>): Promise<UserPreferences>;
  
  createRecitationSession(session: InsertRecitationSession): Promise<RecitationSession>;
  updateRecitationSession(id: number, updates: Partial<InsertRecitationSession>): Promise<RecitationSession>;
  getUserSessions(userId: number): Promise<RecitationSession[]>;
  
  createBookmark(bookmark: InsertBookmarkedAyah): Promise<BookmarkedAyah>;
  getUserBookmarks(userId: number): Promise<BookmarkedAyah[]>;
  deleteBookmark(id: number): Promise<void>;
  
  getSurahs(): Promise<Surah[]>;
  getSurah(id: number): Promise<Surah | undefined>;
  getAyahs(surahId: number): Promise<Ayah[]>;
  getAyah(surahId: number, ayahNumber: number): Promise<Ayah | undefined>;
}

export class DatabaseStorage implements IStorage {
  private quranData: any;

  constructor() {
    // Load Quran data
    try {
      const dataPath = path.resolve(import.meta.dirname, "data", "surahs.json");
      const data = fs.readFileSync(dataPath, "utf-8");
      this.quranData = JSON.parse(data);
    } catch (error) {
      console.error("Failed to load Quran data:", error);
      this.quranData = { surahs: [], ayahs: {} };
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    const [preferences] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    return preferences || undefined;
  }

  async createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    const [userPrefs] = await db
      .insert(userPreferences)
      .values(preferences)
      .returning();
    return userPrefs;
  }

  async updateUserPreferences(userId: number, updates: Partial<InsertUserPreferences>): Promise<UserPreferences> {
    const [updated] = await db
      .update(userPreferences)
      .set(updates)
      .where(eq(userPreferences.userId, userId))
      .returning();
    
    if (!updated) {
      throw new Error("User preferences not found");
    }
    
    return updated;
  }

  async createRecitationSession(session: InsertRecitationSession): Promise<RecitationSession> {
    const [newSession] = await db
      .insert(recitationSessions)
      .values({
        ...session,
        createdAt: new Date().toISOString()
      })
      .returning();
    return newSession;
  }

  async updateRecitationSession(id: number, updates: Partial<InsertRecitationSession>): Promise<RecitationSession> {
    const [updated] = await db
      .update(recitationSessions)
      .set(updates)
      .where(eq(recitationSessions.id, id))
      .returning();
    
    if (!updated) {
      throw new Error("Session not found");
    }
    
    return updated;
  }

  async getUserSessions(userId: number): Promise<RecitationSession[]> {
    return await db
      .select()
      .from(recitationSessions)
      .where(eq(recitationSessions.userId, userId));
  }

  async createBookmark(bookmark: InsertBookmarkedAyah): Promise<BookmarkedAyah> {
    const [newBookmark] = await db
      .insert(bookmarkedAyahs)
      .values({
        ...bookmark,
        createdAt: new Date().toISOString()
      })
      .returning();
    return newBookmark;
  }

  async getUserBookmarks(userId: number): Promise<BookmarkedAyah[]> {
    return await db
      .select()
      .from(bookmarkedAyahs)
      .where(eq(bookmarkedAyahs.userId, userId));
  }

  async deleteBookmark(id: number): Promise<void> {
    await db.delete(bookmarkedAyahs).where(eq(bookmarkedAyahs.id, id));
  }

  async getSurahs(): Promise<Surah[]> {
    return this.quranData.surahs || [];
  }

  async getSurah(id: number): Promise<Surah | undefined> {
    return this.quranData.surahs.find((surah: Surah) => surah.id === id);
  }

  async getAyahs(surahId: number): Promise<Ayah[]> {
    return this.quranData.ayahs[surahId.toString()] || [];
  }

  async getAyah(surahId: number, ayahNumber: number): Promise<Ayah | undefined> {
    const ayahs = await this.getAyahs(surahId);
    return ayahs.find((ayah: Ayah) => ayah.number === ayahNumber);
  }
}

export const storage = new DatabaseStorage();
