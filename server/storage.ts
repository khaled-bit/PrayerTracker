import { users, prayers, userPrayers, dailyStreaks, monthlyRewards, type User, type InsertUser, type Prayer, type UserPrayer, type InsertUserPrayer } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;
  
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
  getLeaderboard(year: number, month: number, limit: number, offset: number): Promise<{
    users: Array<{
      id: number;
      name: string;
      age: number;
      totalPoints: number;
      dailyStreaks: number;
      prayersCompleted: number;
      rank: number;
    }>;
    total: number;
  }>;
  
  // Streaks and rewards
  updateDailyStreak(userId: number, date: string, isQualified: boolean): Promise<void>;
  submitRewardSuggestion(userId: number, month: string, suggestion: string): Promise<void>;
  
  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  public sessionStore: session.SessionStore;

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
    const [loggedPrayer] = await db
      .insert(userPrayers)
      .values(prayer)
      .onConflictDoUpdate({
        target: [userPrayers.userId, userPrayers.prayerId, userPrayers.prayerDate],
        set: {
          prayedAt: prayer.prayedAt,
          isOnTime: prayer.isOnTime,
          pointsAwarded: prayer.pointsAwarded,
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

    // Get monthly rank and total users
    const leaderboard = await this.getLeaderboard(currentYear, currentMonth, 1000, 0);
    const userRank = leaderboard.users.findIndex(u => u.id === userId) + 1;
    
    return {
      monthlyPoints,
      currentStreak,
      monthlyRank: userRank || 0,
      totalUsers: leaderboard.total,
    };
  }

  async getLeaderboard(year: number, month: number, limit: number, offset: number): Promise<{
    users: Array<{
      id: number;
      name: string;
      age: number;
      totalPoints: number;
      dailyStreaks: number;
      prayersCompleted: number;
      rank: number;
    }>;
    total: number;
  }> {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;

    const leaderboardQuery = db
      .select({
        id: users.id,
        name: users.name,
        age: users.age,
        totalPoints: sql<number>`COALESCE(SUM(${userPrayers.pointsAwarded}), 0)`,
        prayersCompleted: sql<number>`COUNT(${userPrayers.id})`,
        dailyStreaks: sql<number>`COALESCE((SELECT COUNT(*) FROM ${dailyStreaks} WHERE ${dailyStreaks.userId} = ${users.id} AND ${dailyStreaks.isQualified} = true), 0)`,
      })
      .from(users)
      .leftJoin(
        userPrayers,
        and(
          eq(userPrayers.userId, users.id),
          sql`${userPrayers.prayerDate} >= ${startDate}`,
          sql`${userPrayers.prayerDate} <= ${endDate}`
        )
      )
      .groupBy(users.id, users.name, users.age)
      .orderBy(desc(sql`COALESCE(SUM(${userPrayers.pointsAwarded}), 0)`))
      .limit(limit)
      .offset(offset);

    const results = await leaderboardQuery;
    
    // Add rank numbers
    const usersWithRank = results.map((user, index) => ({
      ...user,
      rank: offset + index + 1,
    }));

    // Get total count
    const totalResult = await db.select({ count: count() }).from(users);
    const total = totalResult[0]?.count || 0;

    return {
      users: usersWithRank,
      total,
    };
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
