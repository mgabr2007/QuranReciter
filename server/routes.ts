import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { storage } from "./storage";
import { insertUserPreferencesSchema, insertRecitationSessionSchema, insertBookmarkedAyahSchema, insertCommunitySchema } from "@shared/schema";
import { promises as fs } from 'fs';
import { join } from 'path';
import { signup, login, logout, getCurrentUser, requireAuth, type AuthenticatedRequest } from "./auth";
import { db, pool } from "./db";

const PgSession = connectPgSimple(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.use(
    session({
      store: new PgSession({
        pool: pool,
        tableName: 'session',
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || 'quran-recitation-secret-change-this-in-production',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      },
    })
  );

  // Authentication routes
  app.post("/api/auth/signup", signup);
  app.post("/api/auth/login", login);
  app.post("/api/auth/logout", logout);
  app.get("/api/auth/me", getCurrentUser);

  // Quran data routes
  app.get("/api/surahs", async (req, res) => {
    try {
      const surahs = await storage.getSurahs();
      res.json(surahs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch surahs" });
    }
  });

  app.get("/api/surahs/:id", async (req, res) => {
    try {
      const surahId = parseInt(req.params.id);
      const surah = await storage.getSurah(surahId);
      if (!surah) {
        return res.status(404).json({ message: "Surah not found" });
      }
      res.json(surah);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch surah" });
    }
  });

  app.get("/api/surahs/:id/ayahs", async (req, res) => {
    try {
      const surahId = parseInt(req.params.id);
      const ayahs = await storage.getAyahs(surahId);
      res.json(ayahs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ayahs" });
    }
  });

  app.get("/api/surahs/:surahId/ayahs/:ayahNumber", async (req, res) => {
    try {
      const surahId = parseInt(req.params.surahId);
      const ayahNumber = parseInt(req.params.ayahNumber);
      const ayah = await storage.getAyah(surahId, ayahNumber);
      if (!ayah) {
        return res.status(404).json({ message: "Ayah not found" });
      }
      res.json(ayah);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ayah" });
    }
  });

  // User preferences routes
  app.get("/api/preferences", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.id;
      let preferences = await storage.getUserPreferences(userId);
      
      if (!preferences) {
        // Create default preferences if none exist
        preferences = await storage.createUserPreferences({
          userId,
          pauseDuration: 5,
          noPause: false,
          autoRepeat: false,
          autoRepeatAyah: false,
          lastSurah: 1,
          lastAyah: 1,
        });
      }
      
      res.json(preferences);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch preferences" });
    }
  });

  app.put("/api/preferences", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.id;
      const validatedData = insertUserPreferencesSchema.parse({
        ...req.body,
        userId,
      });
      
      const preferences = await storage.updateUserPreferences(userId, validatedData);
      res.json(preferences);
    } catch (error) {
      res.status(400).json({ message: "Invalid preferences data" });
    }
  });

  // Recitation session routes
  app.post("/api/sessions", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.id;
      const validatedData = insertRecitationSessionSchema.parse({
        ...req.body,
        userId,
      });
      
      const session = await storage.createRecitationSession(validatedData);
      res.json(session);
    } catch (error) {
      res.status(400).json({ message: "Invalid session data" });
    }
  });

  app.put("/api/sessions/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.id;
      const sessionId = parseInt(req.params.id);
      const session = await storage.updateRecitationSession(sessionId, req.body);
      res.json(session);
    } catch (error) {
      res.status(400).json({ message: "Failed to update session" });
    }
  });

  app.get("/api/sessions", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.id;
      const sessions = await storage.getUserSessions(userId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  app.get("/api/sessions/stats", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.id;
      const stats = await storage.getSessionStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch session stats" });
    }
  });

  // Bookmark routes
  app.post("/api/bookmarks", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.id;
      const validatedData = insertBookmarkedAyahSchema.parse({
        ...req.body,
        userId,
      });
      
      const bookmark = await storage.createBookmark(validatedData);
      res.json(bookmark);
    } catch (error) {
      res.status(400).json({ message: "Invalid bookmark data" });
    }
  });

  app.get("/api/bookmarks", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.id;
      const bookmarks = await storage.getUserBookmarks(userId);
      res.json(bookmarks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookmarks" });
    }
  });

  app.patch("/api/bookmarks/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.id;
      const bookmarkId = parseInt(req.params.id);
      const { notes } = req.body;
      const bookmark = await storage.updateBookmark(bookmarkId, { notes });
      res.json(bookmark);
    } catch (error) {
      res.status(500).json({ message: "Failed to update bookmark" });
    }
  });

  app.delete("/api/bookmarks/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.id;
      const bookmarkId = parseInt(req.params.id);
      await storage.deleteBookmark(bookmarkId);
      res.json({ message: "Bookmark deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete bookmark" });
    }
  });

  // Audio file checking route removed to eliminate infinite loop

  // Audio caching routes
  app.post("/api/audio/preload/:surahId", async (req, res) => {
    try {
      const surahId = parseInt(req.params.surahId);
      await storage.preloadAudioFiles(surahId);
      res.json({ message: `Audio files preloaded for Surah ${surahId}` });
    } catch (error) {
      res.status(500).json({ message: "Failed to preload audio files" });
    }
  });

  app.get("/api/audio/:surahId/:ayahNumber", async (req, res) => {
    try {
      const surahId = parseInt(req.params.surahId);
      const ayahNumber = parseInt(req.params.ayahNumber);
      
      const cachedAudio = await storage.getCachedAudioFile(surahId, ayahNumber);
      if (cachedAudio) {
        res.json({
          audioUrl: cachedAudio.audioUrl,
          alternativeUrl: cachedAudio.alternativeUrl,
          duration: cachedAudio.duration,
          isVerified: cachedAudio.isVerified
        });
      } else {
        // Cache the audio file if not already cached
        await storage.preloadAudioFiles(surahId);
        const newCachedAudio = await storage.getCachedAudioFile(surahId, ayahNumber);
        if (newCachedAudio) {
          res.json({
            audioUrl: newCachedAudio.audioUrl,
            alternativeUrl: newCachedAudio.alternativeUrl,
            duration: newCachedAudio.duration,
            isVerified: newCachedAudio.isVerified
          });
        } else {
          res.status(404).json({ message: "Audio file not found" });
        }
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch audio file" });
    }
  });

  // Practice tracking routes for memorization heatmap
  app.post("/api/practice/log", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.id;
      const { surahId, ayahNumber, duration } = req.body;
      
      await storage.logAyahPractice(userId, surahId, ayahNumber, duration || 0);
      res.json({ message: "Practice logged successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to log practice" });
    }
  });

  app.get("/api/practice/heatmap", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.id;
      const heatmapData = await storage.getAyahHeatmapData(userId);
      res.json(heatmapData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch heatmap data" });
    }
  });

  app.get("/api/practice/surah/:surahId", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.id;
      const surahId = parseInt(req.params.surahId);
      const progress = await storage.getSurahProgress(userId, surahId);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch surah progress" });
    }
  });

  app.get("/api/practice/calendar/:year/:month", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.id;
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month);
      const calendarData = await storage.getCalendarData(userId, year, month);
      res.json(calendarData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch calendar data" });
    }
  });

  app.get("/api/practice/top/:limit", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.id;
      const limit = parseInt(req.params.limit);
      const topAyahs = await storage.getMostPracticedAyahs(userId, limit);
      res.json(topAyahs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch most practiced ayahs" });
    }
  });

  // Community routes
  app.post("/api/communities", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.id;
      const validatedData = insertCommunitySchema.parse({ ...req.body, adminId: userId });
      const community = await storage.createCommunity(validatedData);
      res.status(201).json(community);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create community" });
    }
  });

  app.get("/api/communities", async (req, res) => {
    try {
      const communities = await storage.getCommunities();
      res.json(communities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch communities" });
    }
  });

  app.get("/api/my-communities", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.id;
      const communities = await storage.getUserCommunities(userId);
      res.json(communities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user communities" });
    }
  });

  app.get("/api/communities/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const community = await storage.getCommunity(id);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }
      res.json(community);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch community" });
    }
  });

  app.post("/api/communities/:id/join", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.id;
      const communityId = parseInt(req.params.id);
      const result = await storage.joinCommunity(userId, communityId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to join community" });
    }
  });

  app.get("/api/communities/:id/members", async (req, res) => {
    try {
      const communityId = parseInt(req.params.id);
      const members = await storage.getCommunityMembers(communityId);
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch community members" });
    }
  });

  app.get("/api/communities/:id/available-juz", async (req, res) => {
    try {
      const communityId = parseInt(req.params.id);
      const availableJuz = await storage.getAvailableJuz(communityId);
      res.json(availableJuz);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch available juz" });
    }
  });

  app.patch("/api/communities/:id/juz-assignment", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.id;
      const communityId = parseInt(req.params.id);
      const { juzNumber } = req.body;
      
      if (!juzNumber || juzNumber < 1 || juzNumber > 30) {
        return res.status(400).json({ message: "Invalid juz number" });
      }

      const updated = await storage.updateJuzAssignment(userId, communityId, juzNumber);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update juz assignment" });
    }
  });

  app.get("/api/communities/:id/can-modify-juz", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.id;
      const communityId = parseInt(req.params.id);
      const canModify = await storage.canModifyJuzAssignment(userId, communityId);
      res.json({ canModify });
    } catch (error) {
      res.status(500).json({ message: "Failed to check modification permission" });
    }
  });

  app.get("/api/communities/:id/details", async (req, res) => {
    try {
      const communityId = parseInt(req.params.id);
      const details = await storage.getCommunityDetails(communityId);
      res.json(details);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch community details" });
    }
  });

  app.post("/api/communities/:id/juz-transfer-request", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.id;
      const communityId = parseInt(req.params.id);
      const { juzNumber, fromMemberId } = req.body;

      if (!juzNumber || juzNumber < 1 || juzNumber > 30) {
        return res.status(400).json({ message: "Invalid juz number" });
      }

      const [member] = await storage.getUserCommunities(userId);
      if (!member) {
        return res.status(400).json({ message: "User not a member of community" });
      }

      const request = await storage.createJuzTransferRequest(
        communityId,
        juzNumber,
        fromMemberId || null,
        member.id
      );

      res.json(request);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create transfer request" });
    }
  });

  app.patch("/api/juz-transfer-requests/:id/respond", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.id;
      const requestId = parseInt(req.params.id);
      const { accept } = req.body;

      if (typeof accept !== 'boolean') {
        return res.status(400).json({ message: "Accept parameter must be a boolean" });
      }

      await storage.respondToJuzTransferRequest(requestId, userId, accept);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to respond to transfer request" });
    }
  });

  app.post("/api/communities/:id/claim-juz", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.id;
      const communityId = parseInt(req.params.id);
      const { juzNumber } = req.body;

      if (!juzNumber || juzNumber < 1 || juzNumber > 30) {
        return res.status(400).json({ message: "Invalid juz number" });
      }

      const assignment = await storage.claimAvailableJuz(userId, communityId, juzNumber);
      res.json(assignment);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to claim juz" });
    }
  });

  app.get("/api/user/juz-transfer-requests", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.id;
      const requests = await storage.getUserJuzTransferRequests(userId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transfer requests" });
    }
  });

  app.get("/api/user/juz-assignments/:communityId", requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.id;
      const communityId = parseInt(req.params.communityId);
      const assignments = await storage.getUserJuzAssignments(userId, communityId);
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user juz assignments" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
