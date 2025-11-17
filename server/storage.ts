import { 
  users, 
  userPreferences, 
  recitationSessions, 
  bookmarkedAyahs,
  cachedAudioFiles,
  surahs,
  ayahs,
  ayahPracticeLog,
  communities,
  communityMembers,
  juzAssignments,
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
  type Ayah,
  type AyahPracticeLog,
  type InsertAyahPracticeLog,
  type Community,
  type InsertCommunity,
  type CommunityMember,
  type InsertCommunityMember,
  type JuzAssignment,
  type InsertJuzAssignment
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, notInArray } from "drizzle-orm";

export interface IStorage {
  getUserById(id: number): Promise<User | undefined>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
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
  
  logAyahPractice(userId: number, surahId: number, ayahNumber: number, duration: number): Promise<void>;
  getAyahHeatmapData(userId: number): Promise<{ surahId: number; ayahNumber: number; count: number; lastPracticed: string }[]>;
  getSurahProgress(userId: number, surahId: number): Promise<{ ayahNumber: number; count: number; lastPracticed: string }[]>;
  getCalendarData(userId: number, year: number, month: number): Promise<{ date: string; count: number; duration: number }[]>;
  getMostPracticedAyahs(userId: number, limit: number): Promise<{ surahId: number; surahName: string; ayahNumber: number; count: number }[]>;
  
  createCommunity(community: InsertCommunity): Promise<Community>;
  getCommunities(): Promise<Community[]>;
  getCommunity(id: number): Promise<Community | undefined>;
  getUserCommunities(userId: number): Promise<Array<Community & { memberCount: number; juzNumber: number | null }>>;
  joinCommunity(userId: number, communityId: number): Promise<{ member: CommunityMember; assignment: JuzAssignment }>;
  getAvailableJuz(communityId: number): Promise<number[]>;
  getCommunityMembers(communityId: number): Promise<Array<CommunityMember & { user: User; juzNumber: number | null }>>;
  getUserJuzAssignment(userId: number, communityId: number): Promise<JuzAssignment | undefined>;
  updateJuzAssignment(userId: number, communityId: number, newJuzNumber: number): Promise<JuzAssignment>;
  canModifyJuzAssignment(userId: number, communityId: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.getUserById(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
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

  async logAyahPractice(userId: number, surahId: number, ayahNumber: number, duration: number): Promise<void> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Check if there's already a log for this user, surah, ayah, and date
    const [existing] = await db
      .select()
      .from(ayahPracticeLog)
      .where(
        and(
          eq(ayahPracticeLog.userId, userId),
          eq(ayahPracticeLog.surahId, surahId),
          eq(ayahPracticeLog.ayahNumber, ayahNumber),
          eq(ayahPracticeLog.practiceDate, today)
        )
      );

    if (existing) {
      // Update existing log
      await db
        .update(ayahPracticeLog)
        .set({
          listenCount: existing.listenCount + 1,
          totalDuration: existing.totalDuration + duration,
          updatedAt: new Date()
        })
        .where(eq(ayahPracticeLog.id, existing.id));
    } else {
      // Create new log
      await db.insert(ayahPracticeLog).values({
        userId,
        surahId,
        ayahNumber,
        practiceDate: today,
        listenCount: 1,
        totalDuration: duration
      });
    }
  }

  async getAyahHeatmapData(userId: number): Promise<{ surahId: number; ayahNumber: number; count: number; lastPracticed: string }[]> {
    const logs = await db
      .select({
        surahId: ayahPracticeLog.surahId,
        ayahNumber: ayahPracticeLog.ayahNumber,
        count: ayahPracticeLog.listenCount,
        lastPracticed: ayahPracticeLog.practiceDate
      })
      .from(ayahPracticeLog)
      .where(eq(ayahPracticeLog.userId, userId))
      .orderBy(desc(ayahPracticeLog.updatedAt));

    // Aggregate by surah and ayah
    const aggregated = new Map<string, { surahId: number; ayahNumber: number; count: number; lastPracticed: string }>();
    
    for (const log of logs) {
      const key = `${log.surahId}-${log.ayahNumber}`;
      const existing = aggregated.get(key);
      
      if (!existing || log.lastPracticed > existing.lastPracticed) {
        aggregated.set(key, {
          surahId: log.surahId,
          ayahNumber: log.ayahNumber,
          count: (existing?.count || 0) + log.count,
          lastPracticed: log.lastPracticed
        });
      }
    }

    return Array.from(aggregated.values());
  }

  async getSurahProgress(userId: number, surahId: number): Promise<{ ayahNumber: number; count: number; lastPracticed: string }[]> {
    const logs = await db
      .select({
        ayahNumber: ayahPracticeLog.ayahNumber,
        count: ayahPracticeLog.listenCount,
        lastPracticed: ayahPracticeLog.practiceDate
      })
      .from(ayahPracticeLog)
      .where(
        and(
          eq(ayahPracticeLog.userId, userId),
          eq(ayahPracticeLog.surahId, surahId)
        )
      )
      .orderBy(desc(ayahPracticeLog.updatedAt));

    // Aggregate by ayah
    const aggregated = new Map<number, { ayahNumber: number; count: number; lastPracticed: string }>();
    
    for (const log of logs) {
      const existing = aggregated.get(log.ayahNumber);
      
      if (!existing || log.lastPracticed > existing.lastPracticed) {
        aggregated.set(log.ayahNumber, {
          ayahNumber: log.ayahNumber,
          count: (existing?.count || 0) + log.count,
          lastPracticed: log.lastPracticed
        });
      }
    }

    return Array.from(aggregated.values()).sort((a, b) => a.ayahNumber - b.ayahNumber);
  }

  async getCalendarData(userId: number, year: number, month: number): Promise<{ date: string; count: number; duration: number }[]> {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
    
    const logs = await db
      .select({
        date: ayahPracticeLog.practiceDate,
        count: ayahPracticeLog.listenCount,
        duration: ayahPracticeLog.totalDuration
      })
      .from(ayahPracticeLog)
      .where(
        and(
          eq(ayahPracticeLog.userId, userId)
        )
      );

    // Aggregate by date
    const aggregated = new Map<string, { date: string; count: number; duration: number }>();
    
    for (const log of logs) {
      if (log.date >= startDate && log.date <= endDate) {
        const existing = aggregated.get(log.date);
        aggregated.set(log.date, {
          date: log.date,
          count: (existing?.count || 0) + log.count,
          duration: (existing?.duration || 0) + log.duration
        });
      }
    }

    return Array.from(aggregated.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  async getMostPracticedAyahs(userId: number, limit: number): Promise<{ surahId: number; surahName: string; ayahNumber: number; count: number }[]> {
    const logs = await db
      .select({
        surahId: ayahPracticeLog.surahId,
        surahName: surahs.name,
        ayahNumber: ayahPracticeLog.ayahNumber,
        count: ayahPracticeLog.listenCount
      })
      .from(ayahPracticeLog)
      .innerJoin(surahs, eq(ayahPracticeLog.surahId, surahs.id))
      .where(eq(ayahPracticeLog.userId, userId));

    // Aggregate by surah and ayah
    const aggregated = new Map<string, { surahId: number; surahName: string; ayahNumber: number; count: number }>();
    
    for (const log of logs) {
      const key = `${log.surahId}-${log.ayahNumber}`;
      const existing = aggregated.get(key);
      
      aggregated.set(key, {
        surahId: log.surahId,
        surahName: log.surahName,
        ayahNumber: log.ayahNumber,
        count: (existing?.count || 0) + log.count
      });
    }

    return Array.from(aggregated.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  async createCommunity(community: InsertCommunity): Promise<Community> {
    const [created] = await db
      .insert(communities)
      .values(community)
      .returning();
    return created;
  }

  async getCommunities(): Promise<Community[]> {
    return await db.select().from(communities);
  }

  async getCommunity(id: number): Promise<Community | undefined> {
    const [community] = await db
      .select()
      .from(communities)
      .where(eq(communities.id, id));
    return community || undefined;
  }

  async getUserCommunities(userId: number): Promise<Array<Community & { memberCount: number; juzNumber: number | null }>> {
    const userMemberships = await db
      .select({
        community: communities,
        memberId: communityMembers.id,
        juzNumber: juzAssignments.juzNumber
      })
      .from(communityMembers)
      .innerJoin(communities, eq(communityMembers.communityId, communities.id))
      .leftJoin(juzAssignments, eq(juzAssignments.communityMemberId, communityMembers.id))
      .where(eq(communityMembers.userId, userId));

    const result = [];
    for (const membership of userMemberships) {
      const memberCount = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(communityMembers)
        .where(eq(communityMembers.communityId, membership.community.id));

      result.push({
        ...membership.community,
        memberCount: memberCount[0]?.count || 0,
        juzNumber: membership.juzNumber
      });
    }

    return result;
  }

  async joinCommunity(userId: number, communityId: number): Promise<{ member: CommunityMember; assignment: JuzAssignment }> {
    return await db.transaction(async (tx) => {
      // Check existing membership
      const existingMember = await tx
        .select()
        .from(communityMembers)
        .where(and(eq(communityMembers.userId, userId), eq(communityMembers.communityId, communityId)));

      if (existingMember.length > 0) {
        throw new Error("User is already a member of this community");
      }

      // Get community with lock to prevent race conditions
      const [community] = await tx
        .select()
        .from(communities)
        .where(eq(communities.id, communityId))
        .for('update');

      if (!community) {
        throw new Error("Community not found");
      }

      // Count members with lock
      const memberCount = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(communityMembers)
        .where(eq(communityMembers.communityId, communityId))
        .for('update');

      if (memberCount[0]?.count >= community.maxMembers) {
        throw new Error("Community is full");
      }

      // Insert member
      const [member] = await tx
        .insert(communityMembers)
        .values({ userId, communityId })
        .returning();

      // Get assigned juz with lock to prevent duplicates
      const assignedJuz = await tx
        .select({ juzNumber: juzAssignments.juzNumber })
        .from(juzAssignments)
        .where(eq(juzAssignments.communityId, communityId))
        .for('update');

      const assigned = new Set(assignedJuz.map(j => j.juzNumber));
      const allJuz = Array.from({ length: 30 }, (_, i) => i + 1);
      const availableJuz = allJuz.filter(j => !assigned.has(j));

      if (availableJuz.length === 0) {
        throw new Error("No available juz in this community");
      }

      const selectedJuz = availableJuz[0];
      const canModifyUntil = new Date();
      canModifyUntil.setDate(canModifyUntil.getDate() + 2);

      // Insert juz assignment
      const [assignment] = await tx
        .insert(juzAssignments)
        .values({
          communityMemberId: member.id,
          communityId: communityId,
          juzNumber: selectedJuz,
          canModifyUntil
        })
        .returning();

      return { member, assignment };
    });
  }

  async getAvailableJuz(communityId: number): Promise<number[]> {
    const assignedJuz = await db
      .select({ juzNumber: juzAssignments.juzNumber })
      .from(juzAssignments)
      .innerJoin(communityMembers, eq(juzAssignments.communityMemberId, communityMembers.id))
      .where(eq(communityMembers.communityId, communityId));

    const assigned = new Set(assignedJuz.map(j => j.juzNumber));
    const allJuz = Array.from({ length: 30 }, (_, i) => i + 1);
    return allJuz.filter(j => !assigned.has(j));
  }

  async getCommunityMembers(communityId: number): Promise<Array<CommunityMember & { user: User; juzNumber: number | null }>> {
    const members = await db
      .select({
        member: communityMembers,
        user: users,
        juzNumber: juzAssignments.juzNumber
      })
      .from(communityMembers)
      .innerJoin(users, eq(communityMembers.userId, users.id))
      .leftJoin(juzAssignments, eq(juzAssignments.communityMemberId, communityMembers.id))
      .where(eq(communityMembers.communityId, communityId));

    return members.map(m => ({
      ...m.member,
      user: m.user,
      juzNumber: m.juzNumber
    }));
  }

  async getUserJuzAssignment(userId: number, communityId: number): Promise<JuzAssignment | undefined> {
    const [result] = await db
      .select({ assignment: juzAssignments })
      .from(juzAssignments)
      .innerJoin(communityMembers, eq(juzAssignments.communityMemberId, communityMembers.id))
      .where(
        and(
          eq(communityMembers.userId, userId),
          eq(communityMembers.communityId, communityId)
        )
      );

    return result?.assignment;
  }

  async updateJuzAssignment(userId: number, communityId: number, newJuzNumber: number): Promise<JuzAssignment> {
    const canModify = await this.canModifyJuzAssignment(userId, communityId);
    if (!canModify) {
      throw new Error("Cannot modify juz assignment - 2-day window has expired");
    }

    const availableJuz = await this.getAvailableJuz(communityId);
    if (!availableJuz.includes(newJuzNumber)) {
      throw new Error("Juz is already assigned to another member");
    }

    const [member] = await db
      .select()
      .from(communityMembers)
      .where(
        and(
          eq(communityMembers.userId, userId),
          eq(communityMembers.communityId, communityId)
        )
      );

    if (!member) {
      throw new Error("User is not a member of this community");
    }

    const [updated] = await db
      .update(juzAssignments)
      .set({ juzNumber: newJuzNumber })
      .where(eq(juzAssignments.communityMemberId, member.id))
      .returning();

    return updated;
  }

  async canModifyJuzAssignment(userId: number, communityId: number): Promise<boolean> {
    const assignment = await this.getUserJuzAssignment(userId, communityId);
    if (!assignment) {
      return false;
    }

    const now = new Date();
    return now <= new Date(assignment.canModifyUntil);
  }
}

export const storage = new DatabaseStorage();
