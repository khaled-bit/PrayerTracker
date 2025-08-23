import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, Search, ArrowLeft, Building2 } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-islamic-sage via-white to-islamic-gold">
      <div className="w-full max-w-2xl mx-4">
        {/* Main Error Card */}
        <Card className="w-full shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="w-24 h-24 bg-gradient-to-br from-islamic-gold to-islamic-green rounded-full flex items-center justify-center mx-auto mb-6">
              <Building2 className="h-12 w-12 text-white" />
            </div>
            <CardTitle className="text-4xl font-bold text-islamic-navy arabic-text mb-2">
              الصفحة غير موجودة
            </CardTitle>
            <CardTitle className="text-2xl font-semibold text-gray-600 mb-4">
              Page Not Found
            </CardTitle>
          </CardHeader>
          
          <CardContent className="text-center space-y-6">
            {/* Error Message */}
            <div className="space-y-3">
              <p className="text-lg text-gray-700 arabic-text">
                عذراً، الصفحة التي تبحث عنها غير موجودة
              </p>
              <p className="text-gray-600">
                Sorry, the page you're looking for doesn't exist
              </p>
            </div>

            {/* Helpful Suggestions */}
            <div className="bg-gradient-to-r from-islamic-sage/20 to-islamic-gold/20 rounded-xl p-6 text-left">
              <h3 className="font-semibold text-islamic-navy mb-3 arabic-text text-center">
                اقتراحات مفيدة
              </h3>
              <h3 className="font-semibold text-islamic-navy mb-3 text-center">
                Helpful Suggestions
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Search className="h-5 w-5 text-islamic-green mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 arabic-text">تأكد من صحة الرابط</p>
                    <p className="text-xs text-gray-500">Check if the URL is correct</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Home className="h-5 w-5 text-islamic-gold mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 arabic-text">عد إلى الصفحة الرئيسية</p>
                    <p className="text-xs text-gray-500">Return to the home page</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => navigate("/")}
                className="bg-gradient-to-r from-islamic-green to-islamic-gold text-white hover:from-islamic-green/90 hover:to-islamic-gold/90 shadow-lg"
              >
                <Home className="h-4 w-4 ml-2" />
                الصفحة الرئيسية
              </Button>
              
              <Button
                onClick={() => window.history.back()}
                variant="outline"
                className="border-islamic-navy text-islamic-navy hover:bg-islamic-navy hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 ml-2" />
                رجوع
              </Button>
            </div>

            {/* Additional Help */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500 arabic-text">
                إذا استمرت المشكلة، يرجى التواصل مع الدعم الفني
              </p>
              <p className="text-xs text-gray-400 mt-1">
                If the problem persists, please contact technical support
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-islamic-gold/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-islamic-green/10 rounded-full blur-xl"></div>
      </div>
    </div>
  );
}
