import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserPreferencesSchema, insertRecitationSessionSchema, insertBookmarkedAyahSchema } from "@shared/schema";
import { promises as fs } from 'fs';
import { join } from 'path';

export async function registerRoutes(app: Express): Promise<Server> {
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
  app.get("/api/preferences", async (req, res) => {
    try {
      // For demo purposes, using a default user ID of 1
      const userId = 1;
      let preferences = await storage.getUserPreferences(userId);
      
      if (!preferences) {
        // Create default preferences if none exist
        preferences = await storage.createUserPreferences({
          userId,
          pauseDuration: 5,
          autoRepeat: false,
          lastSurah: 1,
          lastAyah: 1,
        });
      }
      
      res.json(preferences);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch preferences" });
    }
  });

  app.put("/api/preferences", async (req, res) => {
    try {
      const userId = 1; // Demo user ID
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
  app.post("/api/sessions", async (req, res) => {
    try {
      const userId = 1; // Demo user ID
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

  app.put("/api/sessions/:id", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const session = await storage.updateRecitationSession(sessionId, req.body);
      res.json(session);
    } catch (error) {
      res.status(400).json({ message: "Failed to update session" });
    }
  });

  app.get("/api/sessions", async (req, res) => {
    try {
      const userId = 1; // Demo user ID
      const sessions = await storage.getUserSessions(userId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  app.get("/api/sessions/stats/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const stats = await storage.getSessionStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch session stats" });
    }
  });

  // Bookmark routes
  app.post("/api/bookmarks", async (req, res) => {
    try {
      const userId = 1; // Demo user ID
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

  app.get("/api/bookmarks", async (req, res) => {
    try {
      const userId = 1; // Demo user ID
      const bookmarks = await storage.getUserBookmarks(userId);
      res.json(bookmarks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookmarks" });
    }
  });

  app.patch("/api/bookmarks/:id", async (req, res) => {
    try {
      const bookmarkId = parseInt(req.params.id);
      const { notes } = req.body;
      const bookmark = await storage.updateBookmark(bookmarkId, { notes });
      res.json(bookmark);
    } catch (error) {
      res.status(500).json({ message: "Failed to update bookmark" });
    }
  });

  app.delete("/api/bookmarks/:id", async (req, res) => {
    try {
      const bookmarkId = parseInt(req.params.id);
      await storage.deleteBookmark(bookmarkId);
      res.json({ message: "Bookmark deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete bookmark" });
    }
  });

  // Audio file checking route
  app.get("/api/audio/check/:reciter/:filename", async (req, res) => {
    try {
      const { reciter, filename } = req.params;
      const audioPath = join(process.cwd(), 'public', 'audio', reciter, filename);
      
      try {
        await fs.access(audioPath);
        res.json({ exists: true, path: `/audio/${reciter}/${filename}` });
      } catch {
        res.json({ exists: false });
      }
    } catch (error) {
      res.status(500).json({ exists: false, error: "Server error" });
    }
  });

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

  const httpServer = createServer(app);
  return httpServer;
}
