import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Home, AlertTriangle } from "lucide-react";
import { useNavigate } from "wouter";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

function ErrorFallback({ error }: { error?: Error }) {
  const navigate = useNavigate();

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50">
      <div className="w-full max-w-2xl mx-4">
        <Card className="w-full shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="w-24 h-24 bg-gradient-to-br from-red-400 to-orange-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-12 w-12 text-white" />
            </div>
            <CardTitle className="text-4xl font-bold text-red-700 arabic-text mb-2">
              حدث خطأ غير متوقع
            </CardTitle>
            <CardTitle className="text-2xl font-semibold text-gray-600 mb-4">
              Unexpected Error Occurred
            </CardTitle>
          </CardHeader>
          
          <CardContent className="text-center space-y-6">
            {/* Error Message */}
            <div className="space-y-3">
              <p className="text-lg text-gray-700 arabic-text">
                عذراً، حدث خطأ غير متوقع في التطبيق
              </p>
              <p className="text-gray-600">
                Sorry, an unexpected error occurred in the application
              </p>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-left">
                  <p className="text-sm font-medium text-red-800 arabic-text mb-1">
                    تفاصيل الخطأ:
                  </p>
                  <p className="text-xs text-red-600 font-mono break-all">
                    {error.message || 'Unknown error'}
                  </p>
                </div>
              )}
            </div>

            {/* Helpful Actions */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-6">
              <h3 className="font-semibold text-red-700 mb-3 arabic-text text-center">
                ما يمكنك فعله
              </h3>
              <h3 className="font-semibold text-red-700 mb-3 text-center">
                What You Can Do
              </h3>
              
              <div className="space-y-3 text-left">
                <div className="flex items-start gap-3">
                  <RefreshCw className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 arabic-text">أعد تحميل الصفحة</p>
                    <p className="text-xs text-gray-500">Refresh the page</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Home className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 arabic-text">عد إلى الصفحة الرئيسية</p>
                    <p className="text-xs text-gray-500">Return to home page</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={handleRefresh}
                className="bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 shadow-lg"
              >
                <RefreshCw className="h-4 w-4 ml-2" />
                إعادة تحميل
              </Button>
              
              <Button
                onClick={handleGoHome}
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
              >
                <Home className="h-4 w-4 ml-2" />
                الصفحة الرئيسية
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
        <div className="absolute top-10 left-10 w-20 h-20 bg-red-200/20 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-orange-200/20 rounded-full blur-xl"></div>
      </div>
    </div>
  );
}

export default ErrorBoundary;
