import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertUserPrayerSchema } from "@shared/schema";
import { z } from "zod";
import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

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
      console.log("Received prayer log request:", req.body);
      
      const validatedData = insertUserPrayerSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });
      
      console.log("Validated data:", validatedData);

      const loggedPrayer = await storage.logPrayer(validatedData);

      // Update daily streak if all prayers for the day are completed
      const prayerDateString = validatedData.prayerDate instanceof Date 
        ? validatedData.prayerDate.toISOString().split('T')[0] 
        : validatedData.prayerDate;
        
      const todayPrayers = await storage.getUserPrayersForDate(
        req.user!.id,
        prayerDateString
      );

      const allPrayersCompleted = todayPrayers.length === 5;
      const allOnTime = todayPrayers.every(p => p.isOnTime);

      if (allPrayersCompleted) {
        await storage.updateDailyStreak(req.user!.id, prayerDateString, allOnTime);
      }

      res.json(loggedPrayer);
    } catch (error) {
      console.error("Prayer logging error:", error);
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
      console.error("User stats error:", error);
      res.status(500).json({ 
        message: "Failed to fetch user stats",
        error: error instanceof Error ? error.message : "Unknown error"
      });
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
      console.error("Leaderboard error:", error);
      res.status(500).json({ 
        message: "Failed to fetch leaderboard",
        error: error instanceof Error ? error.message : "Unknown error"
      });
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
      const { name, age, gender } = req.body;
      const updates: any = {};

      if (name) updates.name = name;
      if (age) updates.age = parseInt(age);
      if (gender) updates.gender = gender;

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

      const user = await storage.getUserById(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isMatch = await comparePasswords(currentPassword, user.passwordHash);

      if (!isMatch) {
        return res.status(400).json({ message: "Incorrect current password" });
      }

      const passwordHash = await hashPassword(newPassword);

      await storage.updateUserPassword(userId, passwordHash);

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Password change error:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}