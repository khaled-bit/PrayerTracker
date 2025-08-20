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
  ChevronRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rewardSuggestion, setRewardSuggestion] = useState("");

  const today = new Date().toISOString().split('T')[0];

  // Fetch user prayers for today
  const { data: todayPrayers = [] } = useQuery({
    queryKey: ["/api/prayers/date", today],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Fetch all prayers
  const { data: prayers = [] } = useQuery({
    queryKey: ["/api/prayers"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Fetch user stats
  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Fetch leaderboard
  const { data: leaderboard } = useQuery({
    queryKey: ["/api/leaderboard", selectedYear, selectedMonth, currentPage],
    queryFn: getQueryFn({ on401: "throw" }),
    queryKey: [`/api/leaderboard?year=${selectedYear}&month=${selectedMonth}&limit=20&offset=${(currentPage - 1) * 20}`],
  });

  // Prayer logging mutation
  const logPrayerMutation = useMutation({
    mutationFn: async ({ prayerId }: { prayerId: number }) => {
      const now = new Date();
      const prayer = prayers.find(p => p.id === prayerId);
      
      if (!prayer) throw new Error("Prayer not found");

      // Calculate if prayer is on time (simplified logic)
      const scheduledTime = new Date(`${today}T${prayer.scheduledTime}`);
      const isOnTime = now <= new Date(scheduledTime.getTime() + 30 * 60 * 1000); // 30 minutes grace period
      
      return await apiRequest("POST", "/api/prayers/log", {
        prayerId,
        prayerDate: today,
        prayedAt: now.toISOString(),
        isOnTime,
        pointsAwarded: isOnTime ? 5 : 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prayers/date"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      toast({
        title: "تم تسجيل الصلاة",
        description: "تم تسجيل صلاتك بنجاح",
      });
    },
  });

  // Reward suggestion mutation
  const submitRewardMutation = useMutation({
    mutationFn: async (suggestion: string) => {
      const month = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-01`;
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

  const getPrayerStatus = (prayerId: number) => {
    const logged = todayPrayers.find(p => p.prayerId === prayerId);
    if (logged) {
      return logged.isOnTime ? "on-time" : "late";
    }
    
    const prayer = prayers.find(p => p.id === prayerId);
    if (!prayer) return "upcoming";
    
    const now = new Date();
    const scheduledTime = new Date(`${today}T${prayer.scheduledTime}`);
    
    if (now > scheduledTime) {
      return "missed";
    }
    return "upcoming";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "on-time":
        return <Badge className="bg-islamic-green text-white"><Check className="w-3 h-3 ml-1" />في الوقت</Badge>;
      case "late":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 ml-1" />متأخر</Badge>;
      case "missed":
        return <Button 
          size="sm" 
          onClick={() => logPrayerMutation.mutate({ prayerId: prayers.find(p => p.nameAr === status)?.id || 0 })}
          className="bg-islamic-green hover:bg-green-700 text-white"
        >
          تسجيل الصلاة
        </Button>;
      default:
        return <Badge variant="outline" className="text-gray-600"><HourglassIcon className="w-3 h-3 ml-1" />قادمة</Badge>;
    }
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
                <Globe className="w-4 h-4 ml-2" />
                <span className="arabic-text">العربية</span>
              </Button>
              
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
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
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
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
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
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
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
                        <p className="text-xl font-bold text-islamic-navy">{prayer.scheduledTime}</p>
                      </div>
                      
                      <div className="mb-4">
                        {getStatusBadge(status)}
                      </div>
                      
                      {loggedPrayer && (
                        <div className="text-center">
                          <span className="text-islamic-gold font-semibold">
                            +{loggedPrayer.pointsAwarded} نقطة
                          </span>
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
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="arabic-text">لوحة المتصدرين</CardTitle>
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <Select value={`${selectedYear}-${selectedMonth}`} onValueChange={(value) => {
                      const [year, month] = value.split('-');
                      setSelectedYear(parseInt(year));
                      setSelectedMonth(parseInt(month));
                    }}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2024-1">يناير 2024</SelectItem>
                        <SelectItem value="2024-2">فبراير 2024</SelectItem>
                        <SelectItem value="2024-3">مارس 2024</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 space-x-reverse mb-6">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="البحث بالاسم أو البريد الإلكتروني..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-10 text-right"
                    />
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right arabic-text">الترتيب</TableHead>
                      <TableHead className="text-right arabic-text">الاسم</TableHead>
                      <TableHead className="text-right arabic-text">العمر</TableHead>
                      <TableHead className="text-right arabic-text">النقاط</TableHead>
                      <TableHead className="text-right arabic-text">السلاسل</TableHead>
                      <TableHead className="text-right arabic-text">الصلوات المكتملة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboard?.users?.map((user, index) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <span className={`text-lg font-bold ${index === 0 ? 'text-islamic-gold' : 'text-gray-600'}`}>
                              #{user.rank}
                            </span>
                            {index === 0 && <Crown className="text-islamic-gold mr-2 h-4 w-4" />}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-islamic-green rounded-full flex items-center justify-center ml-3">
                              <span className="text-white text-sm font-medium">
                                {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-gray-900 arabic-text">{user.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{user.age}</TableCell>
                        <TableCell>
                          <span className="text-lg font-semibold text-islamic-green">{user.totalPoints}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-islamic-gold bg-opacity-10 text-islamic-gold">
                            <Flame className="w-3 h-3 ml-1" />
                            {user.dailyStreaks}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.prayersCompleted}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-600 arabic-text">
                    عرض {(currentPage - 1) * 20 + 1}-{Math.min(currentPage * 20, leaderboard?.total || 0)} من {leaderboard?.total || 0} مستخدم
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
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
                      disabled={!leaderboard?.users || leaderboard.users.length < 20}
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
                  <CardTitle className="arabic-text">الإنجازات الأخيرة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center p-3 bg-islamic-green bg-opacity-5 rounded-lg">
                    <div className="w-10 h-10 bg-islamic-green rounded-full flex items-center justify-center ml-3">
                      <Flame className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-islamic-navy arabic-text">سلسلة 7 أيام</p>
                      <p className="text-sm text-gray-600 arabic-text">أكملت جميع الصلوات لمدة 7 أيام متتالية</p>
                    </div>
                    <span className="text-islamic-gold font-semibold">+50 نقطة</span>
                  </div>
                  
                  <div className="flex items-center p-3 bg-islamic-gold bg-opacity-5 rounded-lg">
                    <div className="w-10 h-10 bg-islamic-gold rounded-full flex items-center justify-center ml-3">
                      <Star className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-islamic-navy arabic-text">متسابق شهري</p>
                      <p className="text-sm text-gray-600 arabic-text">وصلت للمراكز العشرة الأولى هذا الشهر</p>
                    </div>
                    <span className="text-islamic-gold font-semibold">+25 نقطة</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-islamic-gold to-islamic-green text-white">
                <CardHeader>
                  <CardTitle className="arabic-text">المكافأة الشهرية</CardTitle>
                  <CardDescription className="text-white/80 arabic-text">
                    اقترح مكافأة للفائز بمسابقة هذا الشهر
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <Trophy className="h-12 w-12 mx-auto mb-2" />
                    <h4 className="text-xl font-bold mb-2 arabic-text">
                      مكافأة {new Date().toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })}
                    </h4>
                  </div>
                  
                  <div className="bg-white/20 rounded-lg p-4">
                    <Textarea
                      placeholder="اكتب اقتراحك للمكافأة هنا..."
                      value={rewardSuggestion}
                      onChange={(e) => setRewardSuggestion(e.target.value)}
                      className="text-islamic-navy placeholder-gray-400 bg-white resize-none text-right"
                      rows={3}
                    />
                    <Button
                      onClick={() => submitRewardMutation.mutate(rewardSuggestion)}
                      disabled={!rewardSuggestion.trim() || submitRewardMutation.isPending}
                      className="w-full mt-3 bg-white text-islamic-green font-semibold hover:bg-gray-100"
                    >
                      {submitRewardMutation.isPending ? "جاري الإرسال..." : "إرسال الاقتراح"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="arabic-text">المعلومات الشخصية</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="arabic-text">الاسم</Label>
                    <Input defaultValue={user?.name} className="text-right" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="arabic-text">العمر</Label>
                    <Input type="number" defaultValue={user?.age} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="arabic-text">البريد الإلكتروني</Label>
                    <Input type="email" defaultValue={user?.email} className="text-right" />
                  </div>
                  
                  <Button className="w-full bg-islamic-green hover:bg-green-700 arabic-text">
                    حفظ التغييرات
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="arabic-text">تغيير كلمة المرور</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="arabic-text">كلمة المرور الحالية</Label>
                    <Input type="password" className="text-right" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="arabic-text">كلمة المرور الجديدة</Label>
                    <Input type="password" className="text-right" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="arabic-text">تأكيد كلمة المرور</Label>
                    <Input type="password" className="text-right" />
                  </div>
                  
                  <Button className="w-full bg-islamic-gold hover:bg-yellow-600 arabic-text">
                    تغيير كلمة المرور
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
