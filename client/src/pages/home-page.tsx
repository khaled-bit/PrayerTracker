import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Church, 
  Sun, 
  Moon, 
  Star, 
  Trophy, 
  Flame, 
  Crown, 
  Bell,
  Globe,
  User,
  Settings,
  LogOut,
  Check,
  Clock,
  HourglassIcon,
  Search,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Prayer, UserPrayer } from "@shared/schema";

const prayerIcons = {
  1: Moon,      // Fajr
  2: Sun,       // Dhuhr
  3: Sun,       // Asr
  4: Sun,       // Maghrib
  5: Star,      // Isha
};

const prayerColors = {
  1: "text-islamic-green",    // Fajr
  2: "text-islamic-gold",     // Dhuhr
  3: "text-orange-500",       // Asr
  4: "text-red-500",          // Maghrib
  5: "text-indigo-500",       // Isha
};

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("prayers");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rewardSuggestion, setRewardSuggestion] = useState("");
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    age: user?.age || "",
    email: user?.email || "",
    gender: user?.gender || "male",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const today = new Date().toISOString().split('T')[0];
  
  // Achievement and contest logic
  const isMonthlyContestOpen = () => {
    const now = new Date();
    const isFirstDay = now.getDate() === 1;
    const isBefore6PM = now.getHours() < 18;
    return isFirstDay && isBefore6PM;
  };

  const calculateAchievements = () => {
    const achievements = [];
    
    // Weekly achievement: 5 points per prayer for 7 days
    if (userStats.currentStreak >= 7) {
      achievements.push({
        id: 'weekly',
        title: 'إنجاز أسبوعي',
        description: 'أكمل جميع الصلوات لمدة 7 أيام',
        icon: Star,
        color: 'bg-islamic-green',
        borderColor: 'border-islamic-green',
        completed: true,
        points: userStats.currentStreak * 5
      });
    } else {
      achievements.push({
        id: 'weekly',
        title: 'إنجاز أسبوعي',
        description: `أكمل جميع الصلوات لمدة 7 أيام (${userStats.currentStreak}/7)`,
        icon: Star,
        color: 'bg-gray-300',
        borderColor: 'border-gray-300',
        completed: false,
        progress: userStats.currentStreak,
        target: 7
      });
    }
    
    // Monthly achievement: King/Queen of the month
    const monthNames = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    const currentMonth = monthNames[new Date().getMonth()];
    
    // Determine title based on gender and rank
    const getGenderTitle = (rank: number) => {
      if (rank === 1) {
        return user?.gender === 'female' ? `ملكة ${currentMonth}` : `ملك ${currentMonth}`;
      } else if (rank <= 3) {
        return `أفضل 3 في ${currentMonth}`;
      } else {
        return `أفضل 3 في ${currentMonth}`;
      }
    };
    
    if (userStats.monthlyRank === 1) {
      achievements.push({
        id: 'monthly',
        title: getGenderTitle(userStats.monthlyRank),
        description: 'حقق أفضل نتائج هذا الشهر',
        icon: Crown,
        color: 'bg-islamic-gold',
        borderColor: 'border-islamic-gold',
        completed: true,
        rank: userStats.monthlyRank
      });
    } else if (userStats.monthlyRank <= 3) {
      achievements.push({
        id: 'monthly',
        title: getGenderTitle(userStats.monthlyRank),
        description: `حقق المركز ${userStats.monthlyRank} هذا الشهر`,
        icon: Trophy,
        color: 'bg-islamic-gold',
        borderColor: 'border-islamic-gold',
        completed: true,
        rank: userStats.monthlyRank
      });
    } else {
      achievements.push({
        id: 'monthly',
        title: getGenderTitle(userStats.monthlyRank),
        description: `حقق المركز ${userStats.monthlyRank} هذا الشهر`,
        icon: Trophy,
        color: 'bg-gray-300',
        borderColor: 'border-gray-300',
        completed: false,
        progress: userStats.monthlyRank,
        target: 3
      });
    }
    
    return achievements;
  };

  // Fetch user prayers for today
  const { data: todayPrayers = [] } = useQuery<UserPrayer[]>({
    queryKey: ["/api/prayers/date", today],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Fetch all prayers
  const { data: prayers = [] } = useQuery<Prayer[]>({
    queryKey: ["/api/prayers"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Fetch user stats
  const { data: userStats = { monthlyPoints: 0, currentStreak: 0, monthlyRank: 0, totalUsers: 0 } } = useQuery({
    queryKey: ["/api/user/stats"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Fetch leaderboard
  const { data: leaderboard = { users: [], total: 0 } } = useQuery({
    queryKey: ["/api/leaderboard", currentPage, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: '20',
        offset: ((currentPage - 1) * 20).toString(),
        ...(searchQuery && { search: searchQuery }),
      });
      const response = await fetch(`/api/leaderboard?${params}`);
      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      return response.json();
    },
    staleTime: 5000,
  });

  // Prayer logging mutation
  const logPrayerMutation = useMutation({
    mutationFn: async ({ prayerId, isOnTime, markAsNotPrayed }: { prayerId: number; isOnTime: boolean; markAsNotPrayed?: boolean }) => {
      const now = new Date();
      const prayer = prayers.find(p => p.id === prayerId);
      
      if (!prayer) throw new Error("Prayer not found");

      // Points based on prayer timing
      const pointsAwarded = markAsNotPrayed ? 0 : (isOnTime ? 5 : 1);
      
      return await apiRequest("POST", "/api/prayers/log", {
        prayerId,
        prayerDate: today, // String format "2024-01-20"
        ...(markAsNotPrayed ? {} : { prayedAt: new Date().toISOString() }), // Omit prayedAt if not prayed
        isOnTime: markAsNotPrayed ? false : isOnTime,
        pointsAwarded,
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/prayers/date"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      
      if (variables.markAsNotPrayed) {
        toast({
          title: "تم تسجيل الحالة",
          description: "تم تسجيل أنك لم تصلي هذه الصلاة",
        });
      } else {
        toast({
          title: "تم تسجيل الصلاة",
          description: "تم تسجيل صلاتك بنجاح",
        });
      }
    },
    onError: (error: any) => {
      console.error("Prayer logging error:", error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في تسجيل الصلاة",
        variant: "destructive",
      });
    },
  });

  // Reward suggestion mutation
  const submitRewardMutation = useMutation({
    mutationFn: async (suggestion: string) => {
      const now = new Date();
      const month = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-01`;
      return await apiRequest("POST", "/api/rewards/suggest", {
        month,
        suggestion,
      });
    },
    onSuccess: () => {
      setRewardSuggestion("");
      toast({
        title: "تم إرسال الاقتراح",
        description: "شكراً لك على اقتراح المكافأة",
      });
    },
  });

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name: string; age: number; gender: string }) => {
      return await apiRequest("PATCH", "/api/user/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "تم حفظ التغييرات",
        description: "تم تحديث ملفك الشخصي بنجاح",
      });
    },
  });

  // Password change mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      return await apiRequest("PATCH", "/api/user/password", data);
    },
    onSuccess: () => {
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast({
        title: "تم تغيير كلمة المرور",
        description: "تم تغيير كلمة المرور بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تغيير كلمة المرور",
        variant: "destructive",
      });
    },
  });

  const getPrayerStatus = (prayerId: number) => {
    const logged = todayPrayers.find(p => p.prayerId === prayerId);
    if (logged) {
      if (logged.pointsAwarded === 0) {
        return "marked-not-prayed";
      }
      return logged.isOnTime ? "prayed" : "prayed-late";
    }
    return "not-prayed";
  };

  const getStatusBadge = (status: string, prayerId: number) => {
    switch (status) {
      case "prayed":
        return <Badge className="bg-islamic-green text-white"><Check className="w-3 h-3 ml-1" />تمت الصلاة</Badge>;
      case "prayed-late":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 ml-1" />صليت متأخراً</Badge>;
      case "marked-not-prayed":
        return <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300"><X className="w-3 h-3 ml-1" />لم أصلي</Badge>;
      case "not-prayed":
        return (
          <div className="space-y-2">
            <Button 
              size="sm" 
              onClick={() => logPrayerMutation.mutate({ prayerId, isOnTime: true })}
              className="w-full bg-islamic-green hover:bg-green-700 text-white text-xs"
            >
              صلاة في الوقت (+5)
            </Button>
            <Button 
              size="sm" 
              onClick={() => logPrayerMutation.mutate({ prayerId, isOnTime: false })}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white text-xs"
            >
              صلاة متأخرة (+1)
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => logPrayerMutation.mutate({ prayerId, isOnTime: false, markAsNotPrayed: true })}
              className="w-full text-gray-600 border-gray-300 hover:bg-gray-50 text-xs"
            >
              لم أصلي
            </Button>
          </div>
        );
      default:
        return <Badge variant="outline" className="text-gray-600">لم تصلي بعد</Badge>;
    }
  };



  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      name: profileData.name,
      age: parseInt(profileData.age),
      gender: profileData.gender,
    });
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "خطأ",
        description: "كلمة المرور الجديدة وتأكيدها غير متطابقتين",
        variant: "destructive",
      });
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };

  return (
    <div className="min-h-screen bg-islamic-cream" dir="rtl">
      {/* Navigation Header */}
      <nav className="bg-white shadow-lg border-b-2 border-islamic-gold">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="w-10 h-10 bg-islamic-green rounded-full flex items-center justify-center">
                <Church className="text-white text-lg" />
              </div>
              <h1 className="text-xl font-bold text-islamic-navy arabic-text">تطبيق تتبع الصلاة</h1>
            </div>
            
            <div className="flex items-center space-x-6 space-x-reverse">

              
              <Button variant="ghost" size="sm" className="text-islamic-navy hover:text-islamic-green">
                <Bell className="w-4 h-4" />
              </Button>
              
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-8 h-8 bg-islamic-sage rounded-full flex items-center justify-center">
                  <User className="text-white text-sm" />
                </div>
                <span className="text-islamic-navy font-medium arabic-text">{user?.name}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => logoutMutation.mutate()}
                  className="text-islamic-navy hover:text-red-600"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-islamic-green border-2">
            <CardContent className="p-6" dir="rtl">
              <div className="flex items-center justify-between">
                <div className="text-right">
                  <h3 className="text-lg font-semibold text-islamic-navy arabic-text">نقاط هذا الشهر</h3>
                  <p className="text-3xl font-bold text-islamic-green">{userStats?.monthlyPoints || 0}</p>
                </div>
                <div className="w-12 h-12 bg-islamic-green bg-opacity-10 rounded-lg flex items-center justify-center">
                  <Star className="text-islamic-green text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-islamic-gold border-2">
            <CardContent className="p-6" dir="rtl">
              <div className="flex items-center justify-between">
                <div className="text-right">
                  <h3 className="text-lg font-semibold text-islamic-navy arabic-text">السلسلة الحالية</h3>
                  <p className="text-3xl font-bold text-islamic-gold">{userStats?.currentStreak || 0}</p>
                  <span className="text-sm text-gray-600 arabic-text">أيام متتالية</span>
                </div>
                <div className="w-12 h-12 bg-islamic-gold bg-opacity-10 rounded-lg flex items-center justify-center">
                  <Flame className="text-islamic-gold text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-islamic-navy border-2">
            <CardContent className="p-6" dir="rtl">
              <div className="flex items-center justify-between">
                <div className="text-right">
                  <h3 className="text-lg font-semibold text-islamic-navy arabic-text">الترتيب الشهري</h3>
                  <p className="text-3xl font-bold text-islamic-navy">#{userStats?.monthlyRank || 0}</p>
                  <span className="text-sm text-gray-600 arabic-text">من {userStats?.totalUsers || 0} مستخدم</span>
                </div>
                <div className="w-12 h-12 bg-islamic-gold bg-opacity-10 rounded-lg flex items-center justify-center">
                  <Trophy className="text-islamic-gold text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="prayers" className="arabic-text">الصلوات اليومية</TabsTrigger>
            <TabsTrigger value="leaderboard" className="arabic-text">لوحة المتصدرين</TabsTrigger>
            <TabsTrigger value="achievements" className="arabic-text">الإنجازات</TabsTrigger>
            <TabsTrigger value="profile" className="arabic-text">الملف الشخصي</TabsTrigger>
          </TabsList>

          {/* Daily Prayers Tab */}
          <TabsContent value="prayers">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-islamic-navy mb-2 arabic-text">صلوات اليوم</h2>
              <p className="text-gray-600 arabic-text">
                {new Date().toLocaleDateString('ar-SA', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {prayers.map((prayer) => {
                const status = getPrayerStatus(prayer.id);
                const Icon = prayerIcons[prayer.id as keyof typeof prayerIcons] || Church;
                const colorClass = prayerColors[prayer.id as keyof typeof prayerColors] || "text-islamic-green";
                const loggedPrayer = todayPrayers.find(p => p.prayerId === prayer.id);
                
                return (
                  <Card key={prayer.id} className="text-center hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="mb-4">
                        <div className={`w-16 h-16 mx-auto bg-opacity-10 rounded-full flex items-center justify-center mb-3 ${colorClass.replace('text-', 'bg-')}`}>
                          <Icon className={`${colorClass} text-2xl`} />
                        </div>
                        <h3 className="text-lg font-semibold text-islamic-navy arabic-text">{prayer.nameAr}</h3>
                        <p className="text-sm text-gray-600">{prayer.nameEn}</p>
                      </div>
                      
                      <div className="mb-4">
                        {getStatusBadge(status, prayer.id)}
                      </div>
                      

                      
                      {loggedPrayer && (
                        <div className="text-center">
                          <span className={`font-semibold ${loggedPrayer.isOnTime ? 'text-islamic-green' : 'text-yellow-600'}`}>
                            +{loggedPrayer.pointsAwarded} نقطة
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            {loggedPrayer.isOnTime ? 'في الوقت' : 'متأخراً'}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard">
            <Card>
              <CardHeader className="text-right">
                  <CardTitle className="arabic-text">لوحة المتصدرين</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end mb-6">
                  <div className="relative w-80">
                    <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="البحث بالاسم..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-10 text-right"
                      dir="rtl"
                    />
                  </div>
                </div>

                <div className="w-full bg-white rounded-lg border shadow-sm overflow-x-auto">
                  <table className="w-full border-collapse">
                                          <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="text-right p-4 font-semibold text-gray-900 arabic-text w-40">الصلوات المكتملة</th>
                          <th className="text-right p-4 font-semibold text-gray-900 arabic-text w-40">الصلوات</th>
                          <th className="text-right p-4 font-semibold text-gray-900 arabic-text w-40">السلاسل السنوية</th>
                          <th className="text-right p-4 font-semibold text-gray-900 arabic-text w-40">السلاسل الشهرية</th>
                          <th className="text-right p-4 font-semibold text-gray-900 arabic-text w-32">النقاط</th>
                          <th className="text-right p-4 font-semibold text-gray-900 arabic-text w-24">العمر</th>
                          <th className="text-right p-4 font-semibold text-gray-900 arabic-text w-48">الاسم</th>
                          <th className="text-right p-4 font-semibold text-gray-900 arabic-text w-32">الترتيب</th>
                        </tr>
                      </thead>
                    <tbody>
                      {leaderboard.users.map((user: any, index: number) => (
                        <tr key={user.id} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="text-right p-4">
                            <span className="text-sm text-gray-900">{user.prayersCompleted}</span>
                          </td>
                          <td className="text-right p-4">
                            <span className="text-sm text-gray-900">{user.totalPrayersPrayed}</span>
                          </td>
                          <td className="text-right p-4">
                            <div className="flex items-center gap-2 justify-end">
                              <span className="text-sm font-semibold text-islamic-green">{user.yearlyStreaks}</span>
                              <Flame className="w-4 h-4 text-islamic-green" />
                            </div>
                          </td>
                          <td className="text-right p-4">
                            <div className="flex items-center gap-2 justify-end">
                              <span className="text-sm font-semibold text-islamic-gold">{user.dailyStreaks}</span>
                              <Flame className="w-4 h-4 text-islamic-gold" />
                            </div>
                          </td>
                          <td className="text-right p-4">
                            <span className="text-lg font-semibold text-islamic-green">{user.totalPoints}</span>
                          </td>
                          <td className="text-right p-4">
                            <span className="text-sm text-gray-900">{user.age}</span>
                          </td>
                          <td className="text-right p-4">
                            <span className="text-sm font-medium text-gray-900 arabic-text">{user.name}</span>
                          </td>
                          <td className="text-right p-4">
                            <div className="flex items-center gap-2 justify-end">
                              <span className={`text-lg font-bold ${index === 0 ? 'text-islamic-gold' : 'text-gray-900'}`}>
                                #{user.rank}
                              </span>
                              {index === 0 && <Crown className="text-islamic-gold h-4 w-4" />}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-600 arabic-text text-right">
                    عرض {(currentPage - 1) * 20 + 1}-{Math.min(currentPage * 20, leaderboard.total)} من {leaderboard.total} مستخدم
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <span className="px-3 py-2 text-sm font-medium bg-islamic-green text-white rounded-lg">
                      {currentPage}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => p + 1)}
                      disabled={leaderboard.users.length < 20}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="arabic-text flex items-center">
                    <Flame className="text-islamic-gold ml-2" />
                    الإنجازات
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {calculateAchievements().map((achievement) => {
                    const IconComponent = achievement.icon;
                    return (
                      <div 
                        key={achievement.id}
                        className={`flex items-center p-4 ${achievement.color} bg-opacity-10 rounded-lg border ${achievement.borderColor} border-opacity-20`}
                      >
                        <div className={`w-12 h-12 ${achievement.color} rounded-full flex items-center justify-center ml-4`}>
                          <IconComponent className="text-white h-6 w-6" />
                    </div>
                    <div className="flex-1">
                          <p className="font-semibold text-islamic-navy arabic-text text-lg">{achievement.title}</p>
                          <p className="text-sm text-gray-600 arabic-text">{achievement.description}</p>
                          {achievement.completed && achievement.points && (
                            <p className="text-sm font-semibold text-islamic-green mt-1">
                              +{achievement.points} نقطة
                            </p>
                          )}
                          {achievement.completed && achievement.rank && (
                            <p className="text-sm font-semibold text-islamic-gold mt-1">
                              المركز {achievement.rank}
                            </p>
                          )}
                          {!achievement.completed && achievement.progress !== undefined && (
                            <div className="mt-2">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-islamic-green h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                                ></div>
                    </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {achievement.progress}/{achievement.target}
                              </p>
                  </div>
                          )}
                    </div>
                  </div>
                    );
                  })}
                </CardContent>
              </Card>
              
              {isMonthlyContestOpen() ? (
              <Card className="bg-gradient-to-br from-islamic-gold via-islamic-green to-islamic-sage text-white overflow-hidden relative">
                <div className="absolute inset-0 bg-black/10"></div>
                <CardHeader className="relative z-10">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                      <Trophy className="h-10 w-10 text-white" />
                    </div>
                  </div>
                  <CardTitle className="arabic-text text-center text-xl">مسابقة الشهر</CardTitle>
                  <CardDescription className="text-white/90 arabic-text text-center">
                    اقترح مكافأة للفائز
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                    <Textarea
                      placeholder="اقترح مكافأة مميزة للفائز..."
                      value={rewardSuggestion}
                      onChange={(e) => setRewardSuggestion(e.target.value)}
                      className="text-islamic-navy placeholder-gray-500 bg-white/90 resize-none text-right border-0 focus:ring-2 focus:ring-white"
                      rows={3}
                    />
                    <Button
                      onClick={() => submitRewardMutation.mutate(rewardSuggestion)}
                      disabled={!rewardSuggestion.trim() || submitRewardMutation.isPending}
                      className="w-full mt-4 bg-white text-islamic-green font-semibold hover:bg-white/90 shadow-lg"
                    >
                      {submitRewardMutation.isPending ? "جاري الإرسال..." : "إرسال الاقتراح"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              ) : (
                <Card className="bg-gradient-to-br from-gray-400 to-gray-500 text-white overflow-hidden relative">
                  <div className="absolute inset-0 bg-black/20"></div>
                  <CardHeader className="relative z-10">
                    <div className="flex items-center justify-center mb-4">
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                        <Clock className="h-10 w-10 text-white" />
                      </div>
                    </div>
                    <CardTitle className="arabic-text text-center text-xl">مسابقة الشهر</CardTitle>
                    <CardDescription className="text-white/90 arabic-text text-center">
                      المسابقة مغلقة حالياً
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                      <p className="text-white/90 arabic-text mb-2">
                        المسابقة متاحة فقط في اليوم الأول من كل شهر حتى الساعة 6 مساءً
                      </p>
                      <div className="flex items-center justify-center gap-2 text-white/80">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">افتح التطبيق في اليوم الأول من الشهر للمشاركة</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
              <Card>
                <CardHeader>
                <CardTitle className="arabic-text text-right">الملف الشخصي</CardTitle>
                </CardHeader>
                <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Profile Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-islamic-navy arabic-text text-right mb-4">المعلومات الشخصية</h3>
                    <div className="space-y-2">
                      <Label className="arabic-text text-right block">الاسم</Label>
                      <Input 
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        className="text-right" 
                        dir="rtl" 
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="arabic-text text-right block">العمر</Label>
                      <Input 
                        type="number" 
                        value={profileData.age}
                        onChange={(e) => setProfileData({ ...profileData, age: e.target.value })}
                        className="text-right" 
                        dir="rtl" 
                        required
                        min="1"
                        max="120"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="arabic-text text-right block">البريد الإلكتروني</Label>
                      <Input 
                        type="email" 
                        value={profileData.email}
                        className="text-right bg-gray-100" 
                        dir="rtl" 
                        disabled
                        title="لا يمكن تغيير البريد الإلكتروني"
                      />
                    </div>
                    </div>
                    
                  {/* Password Change */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-islamic-navy arabic-text text-right mb-4">تغيير كلمة المرور</h3>
                    <div className="space-y-2">
                      <Label className="arabic-text text-right block">كلمة المرور الحالية</Label>
                      <Input 
                        type="password" 
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="text-right" 
                        dir="rtl" 
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="arabic-text text-right block">كلمة المرور الجديدة</Label>
                      <Input 
                        type="password" 
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="text-right" 
                        dir="rtl" 
                        required
                        minLength="6"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="arabic-text text-right block">تأكيد كلمة المرور</Label>
                      <Input 
                        type="password" 
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="text-right" 
                        dir="rtl" 
                        required
                        minLength="6"
                      />
                    </div>
                  </div>
                    </div>
                    
                {/* Buttons on same level */}
                <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
                    <Button 
                      type="submit"
                    onClick={handleProfileUpdate}
                    className="flex-1 bg-islamic-green hover:bg-green-700 arabic-text"
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
                  </Button>
                  
                  <Button 
                    type="button"
                    onClick={() => {
                      if (passwordData.newPassword !== passwordData.confirmPassword) {
                        toast({
                          title: "خطأ",
                          description: "كلمة المرور الجديدة وتأكيدها غير متطابقتين",
                          variant: "destructive",
                        });
                        return;
                      }
                      
                      // Add validation for empty fields
                      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
                        toast({
                          title: "خطأ",
                          description: "يرجى ملء جميع حقول كلمة المرور",
                          variant: "destructive",
                        });
                        return;
                      }
                      
                      changePasswordMutation.mutate({
                        currentPassword: passwordData.currentPassword,
                        newPassword: passwordData.newPassword,
                      });
                    }}
                    className="flex-1 bg-islamic-gold hover:bg-yellow-600 arabic-text"
                      disabled={changePasswordMutation.isPending}
                    >
                      {changePasswordMutation.isPending ? "جاري التغيير..." : "تغيير كلمة المرور"}
                    </Button>
                </div>
                </CardContent>
              </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
