import { users, prayers, userPrayers, dailyStreaks, monthlyRewards, type User, type InsertUser, type Prayer, type UserPrayer, type InsertUserPrayer } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;
  updateUserPassword(id: number, passwordHash: string): Promise<void>;
  
  // Prayer management
  getPrayers(): Promise<Prayer[]>;
  initializePrayers(): Promise<void>;
  
  // Prayer tracking
  logPrayer(prayer: InsertUserPrayer): Promise<UserPrayer>;
  getUserPrayersForDate(userId: number, date: string): Promise<UserPrayer[]>;
  getUserPrayersForMonth(userId: number, year: number, month: number): Promise<UserPrayer[]>;
  
  // Stats and leaderboard
  getUserStats(userId: number): Promise<{
    monthlyPoints: number;
    currentStreak: number;
    monthlyRank: number;
    totalUsers: number;
  }>;
  getLeaderboard(year: number, month: number, limit: number, offset: number, search?: string): Promise<{
    users: Array<{
      id: number;
      name: string;
      age: number;
      totalPoints: number;
      dailyStreaks: number;
      prayersCompleted: number;
      prayersMissed: number;
      rank: number;
    }>;
    total: number;
  }>;
  
  // Streaks and rewards
  updateDailyStreak(userId: number, date: string, isQualified: boolean): Promise<void>;
  submitRewardSuggestion(userId: number, month: string, suggestion: string): Promise<void>;
  
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  public sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.getUser(id);
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

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: sql`NOW()` })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async updateUserPassword(id: number, passwordHash: string): Promise<void> {
    await db
      .update(users)
      .set({ passwordHash, updatedAt: sql`NOW()` })
      .where(eq(users.id, id));
  }

  async getPrayers(): Promise<Prayer[]> {
    return await db.select().from(prayers).orderBy(prayers.id);
  }

  async initializePrayers(): Promise<void> {
    const existingPrayers = await db.select().from(prayers);
    if (existingPrayers.length === 0) {
      await db.insert(prayers).values([
        { nameEn: "Fajr", nameAr: "الفجر", scheduledTime: "05:30" },
        { nameEn: "Dhuhr", nameAr: "الظهر", scheduledTime: "12:45" },
        { nameEn: "Asr", nameAr: "العصر", scheduledTime: "16:15" },
        { nameEn: "Maghrib", nameAr: "المغرب", scheduledTime: "18:30" },
        { nameEn: "Isha", nameAr: "العشاء", scheduledTime: "20:00" },
      ]);
    }
  }

  async logPrayer(prayer: InsertUserPrayer): Promise<UserPrayer> {
    // Convert Date objects back to strings for database insertion
    const prayerData = {
      ...prayer,
      prayerDate: prayer.prayerDate instanceof Date ? prayer.prayerDate.toISOString().split('T')[0] : prayer.prayerDate,
      prayedAt: prayer.prayedAt instanceof Date ? prayer.prayedAt : prayer.prayedAt,
    };

    const [loggedPrayer] = await db
      .insert(userPrayers)
      .values(prayerData)
      .onConflictDoUpdate({
        target: [userPrayers.userId, userPrayers.prayerId, userPrayers.prayerDate],
        set: {
          prayedAt: prayerData.prayedAt,
          isOnTime: prayerData.isOnTime,
          pointsAwarded: prayerData.pointsAwarded,
        },
      })
      .returning();
    return loggedPrayer;
  }

  async getUserPrayersForDate(userId: number, date: string): Promise<UserPrayer[]> {
    return await db
      .select()
      .from(userPrayers)
      .where(and(eq(userPrayers.userId, userId), eq(userPrayers.prayerDate, date)));
  }

  async getUserPrayersForMonth(userId: number, year: number, month: number): Promise<UserPrayer[]> {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
    
    return await db
      .select()
      .from(userPrayers)
      .where(
        and(
          eq(userPrayers.userId, userId),
          sql`${userPrayers.prayerDate} >= ${startDate}`,
          sql`${userPrayers.prayerDate} <= ${endDate}`
        )
      );
  }

  async getUserStats(userId: number): Promise<{
    monthlyPoints: number;
    currentStreak: number;
    monthlyRank: number;
    totalUsers: number;
  }> {
    try {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      // Get monthly points
      const monthlyPrayers = await this.getUserPrayersForMonth(userId, currentYear, currentMonth);
      const monthlyPoints = monthlyPrayers.reduce((sum, prayer) => sum + (prayer.pointsAwarded || 0), 0);

      // Get current streak (simplified - count consecutive days with all prayers)
      const streakResult = await db
        .select({ count: count() })
        .from(dailyStreaks)
        .where(and(eq(dailyStreaks.userId, userId), eq(dailyStreaks.isQualified, true)));
      const currentStreak = streakResult[0]?.count || 0;

      // Get total users count
      const totalResult = await db.select({ count: count() }).from(users);
      const totalUsers = totalResult[0]?.count || 0;
      
      // Calculate monthly rank by getting leaderboard data
      const leaderboard = await this.getLeaderboard(currentYear, currentMonth, 1000, 0);
      const userRank = leaderboard.users.findIndex(u => u.id === userId) + 1;
      const monthlyRank = userRank > 0 ? userRank : totalUsers; // If not found, rank last
      
      const stats = {
        monthlyPoints,
        currentStreak,
        monthlyRank,
        totalUsers,
      };

      return stats;
    } catch (error) {
      console.error('❌ Error getting user stats:', error);
      throw error;
    }
  }

  async getLeaderboard(year: number, month: number, limit: number, offset: number, search?: string): Promise<{
    users: Array<{
      id: number;
      name: string;
      age: number;
      totalPoints: number;
      dailyStreaks: number;
      prayersCompleted: number;
      prayersMissed: number;
      rank: number;
    }>;
    total: number;
  }> {
    try {
      // Get all users first
      let allUsers = await db.select().from(users);
      
      if (search) {
        allUsers = allUsers.filter(user => 
          user.name.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      const total = allUsers.length;
      
      // Calculate stats for each user
      const usersWithStats = await Promise.all(
        allUsers.map(async (user) => {
          // Get user's prayers for the month
          const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
          const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
          
          const userPrayerData = await db
            .select()
            .from(userPrayers)
            .where(
              and(
                eq(userPrayers.userId, user.id),
                sql`${userPrayers.prayerDate} >= ${startDate}`,
                sql`${userPrayers.prayerDate} <= ${endDate}`
              )
            );
          
          // Calculate statistics
          let totalPoints = 0;
          let prayersCompleted = 0;
          let prayersMissed = 0;
          
          userPrayerData.forEach((prayer: any) => {
            if (prayer.pointsAwarded && prayer.pointsAwarded > 0) {
              totalPoints += prayer.pointsAwarded;
              prayersCompleted += 1;
            } else {
              prayersMissed += 1;
            }
          });
          
          // Calculate daily streaks (days where all 5 prayers were completed)
          const prayerDates = Array.from(new Set(userPrayerData.map((p: any) => 
            p.prayerDate instanceof Date ? p.prayerDate.toISOString().split('T')[0] : p.prayerDate
          )));
          let dailyStreaks = 0;
          
          for (let i = 0; i < prayerDates.length; i++) {
            const date = prayerDates[i];
            const prayersOnDate = userPrayerData.filter((p: any) => {
              const prayerDate = p.prayerDate instanceof Date ? p.prayerDate.toISOString().split('T')[0] : p.prayerDate;
              return prayerDate === date;
            });
            if (prayersOnDate.length === 5) { // All 5 prayers completed
              dailyStreaks += 1;
            }
          }
          
          return {
            id: user.id,
            name: user.name,
            age: user.age,
            totalPoints,
            prayersCompleted,
            prayersMissed,
            dailyStreaks,
          };
        })
      );
      
      // Sort by total points (descending) and add ranks
      const leaderboardData = usersWithStats
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .slice(offset, offset + limit)
        .map((user, index) => ({
          ...user,
          rank: offset + index + 1,
        }));

      return {
        users: leaderboardData,
        total,
      };
    } catch (error) {
      console.error('❌ Leaderboard query error:', error);
      throw error;
    }
  }

  async updateDailyStreak(userId: number, date: string, isQualified: boolean): Promise<void> {
    await db
      .insert(dailyStreaks)
      .values({ userId, streakDate: date, isQualified })
      .onConflictDoUpdate({
        target: [dailyStreaks.userId, dailyStreaks.streakDate],
        set: { isQualified },
      });
  }

  async submitRewardSuggestion(userId: number, month: string, suggestion: string): Promise<void> {
    await db
      .insert(monthlyRewards)
      .values({ userId, rewardMonth: month, suggestedReward: suggestion })
      .onConflictDoUpdate({
        target: [monthlyRewards.userId, monthlyRewards.rewardMonth],
        set: { suggestedReward: suggestion },
      });
  }
}

export const storage = new DatabaseStorage();
