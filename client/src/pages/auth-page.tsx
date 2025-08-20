import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Church, Star, Trophy, Heart } from "lucide-react";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, navigate] = useLocation();
  
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({ 
    name: "", 
    email: "", 
    password: "", 
    age: "" 
  });

  // Redirect if already logged in
  if (user) {
    navigate("/");
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginData);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate({
      ...registerData,
      age: parseInt(registerData.age),
    });
  };

  return (
    <div className="min-h-screen bg-islamic-cream" dir="rtl">
      <div className="grid lg:grid-cols-2 min-h-screen">
        {/* Left Column - Forms */}
        <div className="flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-islamic-green rounded-full flex items-center justify-center mx-auto mb-4">
                <Church className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-islamic-navy arabic-text">تطبيق تتبع الصلاة</h1>
              <p className="text-gray-600 mt-2 arabic-text">تتبع صلواتك واحصل على النقاط</p>
            </div>

            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" className="arabic-text">تسجيل الدخول</TabsTrigger>
                <TabsTrigger value="register" className="arabic-text">إنشاء حساب</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <Card>
                  <CardHeader>
                    <CardTitle className="arabic-text">تسجيل الدخول</CardTitle>
                    <CardDescription className="arabic-text">
                      أدخل بياناتك للدخول إلى حسابك
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email" className="arabic-text">البريد الإلكتروني</Label>
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="أدخل بريدك الإلكتروني"
                          value={loginData.email}
                          onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                          required
                          className="text-right"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-password" className="arabic-text">كلمة المرور</Label>
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="أدخل كلمة المرور"
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          required
                          className="text-right"
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full bg-islamic-green hover:bg-green-700 arabic-text"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="register">
                <Card>
                  <CardHeader>
                    <CardTitle className="arabic-text">إنشاء حساب جديد</CardTitle>
                    <CardDescription className="arabic-text">
                      أنشئ حساباً جديداً لبدء تتبع صلواتك
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-name" className="arabic-text">الاسم الكامل</Label>
                        <Input
                          id="register-name"
                          type="text"
                          placeholder="أدخل اسمك الكامل"
                          value={registerData.name}
                          onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                          required
                          className="text-right"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-age" className="arabic-text">العمر</Label>
                        <Input
                          id="register-age"
                          type="number"
                          placeholder="أدخل عمرك"
                          value={registerData.age}
                          onChange={(e) => setRegisterData({ ...registerData, age: e.target.value })}
                          required
                          min="1"
                          max="120"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-email" className="arabic-text">البريد الإلكتروني</Label>
                        <Input
                          id="register-email"
                          type="email"
                          placeholder="أدخل بريدك الإلكتروني"
                          value={registerData.email}
                          onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                          required
                          className="text-right"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-password" className="arabic-text">كلمة المرور</Label>
                        <Input
                          id="register-password"
                          type="password"
                          placeholder="أدخل كلمة المرور"
                          value={registerData.password}
                          onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                          required
                          minLength="6"
                          className="text-right"
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full bg-islamic-gold hover:bg-yellow-600 arabic-text"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? "جاري إنشاء الحساب..." : "إنشاء الحساب"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Right Column - Hero Section */}
        <div className="hidden lg:flex items-center justify-center bg-gradient-to-br from-islamic-green via-islamic-sage to-islamic-gold p-8">
          <div className="text-center text-white max-w-md">
            <div className="mb-8">
              <Church className="h-24 w-24 mx-auto mb-6 text-white/90" />
              <h2 className="text-4xl font-bold mb-4 arabic-text">تتبع صلواتك بسهولة</h2>
              <p className="text-lg text-white/90 mb-8 arabic-text">
                سجل صلواتك اليومية واحصل على النقاط وتنافس مع الآخرين في لوحة المتصدرين
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6 text-center">
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <Star className="h-8 w-8 mx-auto mb-2" />
                <h3 className="font-semibold arabic-text">اكسب النقاط</h3>
                <p className="text-sm text-white/80 arabic-text">5 نقاط للصلاة في الوقت</p>
              </div>
              
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <Trophy className="h-8 w-8 mx-auto mb-2" />
                <h3 className="font-semibold arabic-text">لوحة المتصدرين</h3>
                <p className="text-sm text-white/80 arabic-text">تنافس مع الآخرين</p>
              </div>
              
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <Heart className="h-8 w-8 mx-auto mb-2" />
                <h3 className="font-semibold arabic-text">السلاسل اليومية</h3>
                <p className="text-sm text-white/80 arabic-text">حافظ على سلسلتك</p>
              </div>
              
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <Church className="h-8 w-8 mx-auto mb-2" />
                <h3 className="font-semibold arabic-text">مكافآت شهرية</h3>
                <p className="text-sm text-white/80 arabic-text">جوائز للفائزين</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
