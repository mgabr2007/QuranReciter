import { 
  users, 
  userPreferences, 
  recitationSessions, 
  bookmarkedAyahs,
  cachedAudioFiles,
  surahs,
  ayahs,
  type User, 
  type InsertUser,
  type UserPreferences,
  type InsertUserPreferences,
  type RecitationSession,
  type InsertRecitationSession,
  type BookmarkedAyah,
  type InsertBookmarkedAyah,
  type CachedAudioFile,
  type InsertCachedAudioFile,
  type Surah,
  type Ayah
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
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
  getSessionStats(userId: number): Promise<{
    totalSessions: number;
    totalTime: number;
    totalAyahs: number;
    completedSessions: number;
    averageSessionTime: number;
    mostListenedSurah: string;
    weeklyProgress: number[];
  }>;
  
  createBookmark(bookmark: InsertBookmarkedAyah): Promise<BookmarkedAyah>;
  getUserBookmarks(userId: number): Promise<BookmarkedAyah[]>;
  updateBookmark(id: number, updates: Partial<InsertBookmarkedAyah>): Promise<BookmarkedAyah>;
  deleteBookmark(id: number): Promise<void>;
  
  getSurahs(): Promise<Surah[]>;
  getSurah(id: number): Promise<Surah | undefined>;
  getAyahs(surahId: number): Promise<Ayah[]>;
  getAyah(surahId: number, ayahNumber: number): Promise<Ayah | undefined>;
  
  getCachedAudioFile(surahId: number, ayahNumber: number, reciterName?: string): Promise<CachedAudioFile | undefined>;
  createCachedAudioFile(audioFile: InsertCachedAudioFile): Promise<CachedAudioFile>;
  updateCachedAudioFile(id: number, updates: Partial<InsertCachedAudioFile>): Promise<CachedAudioFile>;
  preloadAudioFiles(surahId: number): Promise<void>;
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
      .where(eq(recitationSessions.userId, userId))
      .orderBy(recitationSessions.id);
  }

  async getSessionStats(userId: number): Promise<{
    totalSessions: number;
    totalTime: number;
    totalAyahs: number;
    completedSessions: number;
    averageSessionTime: number;
    mostListenedSurah: string;
    weeklyProgress: number[];
  }> {
    const sessions = await db.select().from(recitationSessions).where(eq(recitationSessions.userId, userId));
    
    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        totalTime: 0,
        totalAyahs: 0,
        completedSessions: 0,
        averageSessionTime: 0,
        mostListenedSurah: "None",
        weeklyProgress: [0, 0, 0, 0, 0, 0, 0]
      };
    }

    const totalSessions = sessions.length;
    const totalTime = sessions.reduce((sum, session) => sum + session.sessionTime, 0);
    const totalAyahs = sessions.reduce((sum, session) => sum + session.completedAyahs, 0);
    const completedSessions = sessions.filter(session => session.isCompleted).length;
    const averageSessionTime = totalSessions > 0 ? Math.round(totalTime / totalSessions) : 0;

    // Find most listened surah
    const surahCounts: Record<string, number> = {};
    sessions.forEach(session => {
      surahCounts[session.surahName] = (surahCounts[session.surahName] || 0) + 1;
    });
    
    const mostListenedSurah = Object.keys(surahCounts).reduce((a, b) => 
      surahCounts[a] > surahCounts[b] ? a : b, "None"
    );

    // Calculate weekly progress (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weeklyProgress = Array(7).fill(0);
    sessions.forEach(session => {
      const sessionDate = new Date(session.createdAt);
      if (sessionDate >= oneWeekAgo) {
        const dayIndex = Math.floor((Date.now() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
        if (dayIndex >= 0 && dayIndex < 7) {
          weeklyProgress[6 - dayIndex] += session.sessionTime;
        }
      }
    });

    return {
      totalSessions,
      totalTime,
      totalAyahs,
      completedSessions,
      averageSessionTime,
      mostListenedSurah,
      weeklyProgress
    };
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

  async updateBookmark(id: number, updates: Partial<InsertBookmarkedAyah>): Promise<BookmarkedAyah> {
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    const [bookmark] = await db
      .update(bookmarkedAyahs)
      .set(updateData)
      .where(eq(bookmarkedAyahs.id, id))
      .returning();
    return bookmark;
  }

  async deleteBookmark(id: number): Promise<void> {
    await db.delete(bookmarkedAyahs).where(eq(bookmarkedAyahs.id, id));
  }

  async getSurahs(): Promise<Surah[]> {
    try {
      return await db.select().from(surahs).orderBy(surahs.id);
    } catch (error) {
      console.error('Failed to fetch surahs from database:', error);
      return [];
    }
  }

  async getSurah(id: number): Promise<Surah | undefined> {
    try {
      const [surah] = await db.select().from(surahs).where(eq(surahs.id, id));
      return surah;
    } catch (error) {
      console.error('Failed to fetch surah from database:', error);
      return undefined;
    }
  }

  async getAyahs(surahId: number): Promise<Ayah[]> {
    try {
      return await db.select().from(ayahs).where(eq(ayahs.surahId, surahId)).orderBy(ayahs.number);
    } catch (error) {
      console.error('Failed to fetch ayahs from database:', error);
      return [];
    }
  }

  async getAyah(surahId: number, ayahNumber: number): Promise<Ayah | undefined> {
    try {
      const [ayah] = await db.select().from(ayahs).where(
        and(eq(ayahs.surahId, surahId), eq(ayahs.number, ayahNumber))
      );
      return ayah;
    } catch (error) {
      console.error('Failed to fetch ayah from database:', error);
      return undefined;
    }
  }

  async getCachedAudioFile(surahId: number, ayahNumber: number, reciterName: string = "al-afasy"): Promise<CachedAudioFile | undefined> {
    const [cachedFile] = await db
      .select()
      .from(cachedAudioFiles)
      .where(
        and(
          eq(cachedAudioFiles.surahId, surahId),
          eq(cachedAudioFiles.ayahNumber, ayahNumber),
          eq(cachedAudioFiles.reciterName, reciterName)
        )
      );
    return cachedFile;
  }

  async createCachedAudioFile(audioFile: InsertCachedAudioFile): Promise<CachedAudioFile> {
    const [cached] = await db
      .insert(cachedAudioFiles)
      .values(audioFile)
      .returning();
    return cached;
  }

  async updateCachedAudioFile(id: number, updates: Partial<InsertCachedAudioFile>): Promise<CachedAudioFile> {
    const [updated] = await db
      .update(cachedAudioFiles)
      .set(updates)
      .where(eq(cachedAudioFiles.id, id))
      .returning();
    return updated;
  }

  async preloadAudioFiles(surahId: number): Promise<void> {
    const surah = await this.getSurah(surahId);
    if (!surah) return;

    console.log(`Preloading audio files for Surah ${surahId} (${surah.name}) with ${surah.totalAyahs} ayahs`);

    // Check which ayahs are already cached
    const existingCached = await db
      .select()
      .from(cachedAudioFiles)
      .where(eq(cachedAudioFiles.surahId, surahId));

    const cachedAyahs = new Set(existingCached.map(c => c.ayahNumber));

    // Preload missing ayahs
    for (let ayahNumber = 1; ayahNumber <= surah.totalAyahs; ayahNumber++) {
      if (cachedAyahs.has(ayahNumber)) {
        continue; // Already cached
      }

      try {
        // Primary: Direct MP3 files from Islamic Network
        const primaryUrl = `https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/${surahId.toString().padStart(3, '0')}${ayahNumber.toString().padStart(3, '0')}.mp3`;
        // Alternative: Standard Islamic Network format  
        const alternativeUrl = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${surahId}${ayahNumber.toString().padStart(3, '0')}.mp3`;
        // Backup: EveryAyah format
        const backupUrl = `https://everyayah.com/data/Alafasy_128kbps/${surahId.toString().padStart(3, '0')}${ayahNumber.toString().padStart(3, '0')}.mp3`;

        // Test if URLs are accessible
        const primaryResponse = await fetch(primaryUrl, { method: 'HEAD' });
        const isVerified = primaryResponse.ok;

        // Try alternative URL if primary fails
        let finalUrl = primaryUrl;
        let finalVerified = isVerified;
        
        if (!isVerified) {
          try {
            const altResponse = await fetch(alternativeUrl, { method: 'HEAD' });
            if (altResponse.ok) {
              finalUrl = alternativeUrl;
              finalVerified = true;
            }
          } catch (error) {
            console.warn(`Alternative URL also failed for Surah ${surahId}, Ayah ${ayahNumber}`);
          }
        }

        await this.createCachedAudioFile({
          surahId,
          ayahNumber,
          reciterName: "al-afasy",
          audioUrl: finalUrl,
          alternativeUrl: finalVerified ? alternativeUrl : backupUrl,
          isVerified: finalVerified,
          duration: null,
          fileSize: finalVerified ? parseInt((await fetch(finalUrl, { method: 'HEAD' })).headers.get('content-length') || '0') : null
        });

        console.log(`Cached audio for Surah ${surahId}, Ayah ${ayahNumber}`);
      } catch (error) {
        console.warn(`Failed to cache audio for Surah ${surahId}, Ayah ${ayahNumber}:`, error);
      }
    }

    console.log(`Completed preloading audio files for Surah ${surahId}`);
  }
}

export const storage = new DatabaseStorage();
