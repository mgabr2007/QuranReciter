import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserPreferencesSchema, insertRecitationSessionSchema, insertBookmarkedAyahSchema } from "@shared/schema";

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

  app.delete("/api/bookmarks/:id", async (req, res) => {
    try {
      const bookmarkId = parseInt(req.params.id);
      await storage.deleteBookmark(bookmarkId);
      res.json({ message: "Bookmark deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete bookmark" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
