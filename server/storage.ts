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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private userPreferences: Map<number, UserPreferences>;
  private recitationSessions: Map<number, RecitationSession>;
  private bookmarkedAyahs: Map<number, BookmarkedAyah>;
  private currentUserId: number;
  private currentPreferencesId: number;
  private currentSessionId: number;
  private currentBookmarkId: number;
  private quranData: any;

  constructor() {
    this.users = new Map();
    this.userPreferences = new Map();
    this.recitationSessions = new Map();
    this.bookmarkedAyahs = new Map();
    this.currentUserId = 1;
    this.currentPreferencesId = 1;
    this.currentSessionId = 1;
    this.currentBookmarkId = 1;
    
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
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    return Array.from(this.userPreferences.values()).find(
      (pref) => pref.userId === userId,
    );
  }

  async createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    const id = this.currentPreferencesId++;
    const userPrefs: UserPreferences = { ...preferences, id };
    this.userPreferences.set(id, userPrefs);
    return userPrefs;
  }

  async updateUserPreferences(userId: number, updates: Partial<InsertUserPreferences>): Promise<UserPreferences> {
    const existing = await this.getUserPreferences(userId);
    if (!existing) {
      throw new Error("User preferences not found");
    }
    
    const updated: UserPreferences = { ...existing, ...updates };
    this.userPreferences.set(existing.id, updated);
    return updated;
  }

  async createRecitationSession(session: InsertRecitationSession): Promise<RecitationSession> {
    const id = this.currentSessionId++;
    const newSession: RecitationSession = { 
      ...session, 
      id,
      createdAt: new Date().toISOString()
    };
    this.recitationSessions.set(id, newSession);
    return newSession;
  }

  async updateRecitationSession(id: number, updates: Partial<InsertRecitationSession>): Promise<RecitationSession> {
    const existing = this.recitationSessions.get(id);
    if (!existing) {
      throw new Error("Session not found");
    }
    
    const updated: RecitationSession = { ...existing, ...updates };
    this.recitationSessions.set(id, updated);
    return updated;
  }

  async getUserSessions(userId: number): Promise<RecitationSession[]> {
    return Array.from(this.recitationSessions.values()).filter(
      (session) => session.userId === userId,
    );
  }

  async createBookmark(bookmark: InsertBookmarkedAyah): Promise<BookmarkedAyah> {
    const id = this.currentBookmarkId++;
    const newBookmark: BookmarkedAyah = { 
      ...bookmark, 
      id,
      createdAt: new Date().toISOString()
    };
    this.bookmarkedAyahs.set(id, newBookmark);
    return newBookmark;
  }

  async getUserBookmarks(userId: number): Promise<BookmarkedAyah[]> {
    return Array.from(this.bookmarkedAyahs.values()).filter(
      (bookmark) => bookmark.userId === userId,
    );
  }

  async deleteBookmark(id: number): Promise<void> {
    this.bookmarkedAyahs.delete(id);
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

export const storage = new MemStorage();
