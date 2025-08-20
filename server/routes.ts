import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertUserPrayerSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";

function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize database with default prayers
  await storage.initializePrayers();

  // Setup authentication routes
  setupAuth(app);

  // Prayer management routes
  app.get("/api/prayers", requireAuth, async (req, res) => {
    try {
      const prayers = await storage.getPrayers();
      res.json(prayers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch prayers" });
    }
  });

  // Log a prayer
  app.post("/api/prayers/log", requireAuth, async (req, res) => {
    try {
      const validatedData = insertUserPrayerSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });

      const loggedPrayer = await storage.logPrayer(validatedData);

      // Update daily streak if all prayers for the day are completed
      const todayPrayers = await storage.getUserPrayersForDate(
        req.user!.id,
        validatedData.prayerDate
      );

      const allPrayersCompleted = todayPrayers.length === 5;
      const allOnTime = todayPrayers.every(p => p.isOnTime);

      if (allPrayersCompleted) {
        await storage.updateDailyStreak(req.user!.id, validatedData.prayerDate, allOnTime);
      }

      res.json(loggedPrayer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to log prayer" });
    }
  });

  // Get user prayers for a specific date
  app.get("/api/prayers/date/:date", requireAuth, async (req, res) => {
    try {
      const prayers = await storage.getUserPrayersForDate(req.user!.id, req.params.date);
      res.json(prayers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch prayers for date" });
    }
  });

  // Get user stats
  app.get("/api/user/stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getUserStats(req.user!.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // Get leaderboard
  app.get("/api/leaderboard", requireAuth, async (req, res) => {
    try {
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const search = req.query.search as string;

      const leaderboard = await storage.getLeaderboard(year, month, limit, offset, search);
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // Submit reward suggestion
  app.post("/api/rewards/suggest", requireAuth, async (req, res) => {
    try {
      const { month, suggestion } = req.body;
      if (!month || !suggestion) {
        return res.status(400).json({ message: "Month and suggestion are required" });
      }

      await storage.submitRewardSuggestion(req.user!.id, month, suggestion);
      res.json({ message: "Reward suggestion submitted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to submit reward suggestion" });
    }
  });

  // Update user profile
  app.patch("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const { name, age } = req.body;
      const updates: any = {};

      if (name) updates.name = name;
      if (age) updates.age = parseInt(age);

      const updatedUser = await storage.updateUser(req.user!.id, updates);
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Change password route
  app.patch("/api/user/password", requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user!.id;

      const user = await storage.getUserById(userId); // Assuming a getUserById method exists

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash); // Assuming passwordHash is stored

      if (!isMatch) {
        return res.status(400).json({ message: "Incorrect current password" });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(newPassword, salt);

      await storage.updateUserPassword(userId, passwordHash); // Assuming an updateUserPassword method exists

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Password change error:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}