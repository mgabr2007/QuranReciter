import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/i18n/LanguageContext";
import { Settings, Lock, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function SettingsPage() {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      return apiRequest("POST", "/api/auth/reset-password", data);
    },
    onSuccess: () => {
      toast({
        title: isArabic ? "تم تحديث كلمة المرور" : "Password Updated",
        description: isArabic 
          ? "تم تحديث كلمة المرور بنجاح" 
          : "Your password has been updated successfully",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: any) => {
      toast({
        title: isArabic ? "خطأ" : "Error",
        description: error.message || (isArabic ? "فشل تحديث كلمة المرور" : "Failed to update password"),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        title: isArabic ? "خطأ" : "Error",
        description: isArabic ? "كلمات المرور غير متطابقة" : "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: isArabic ? "خطأ" : "Error",
        description: isArabic ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل" : "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    resetPasswordMutation.mutate({ currentPassword, newPassword });
  };

  return (
    <div className="container max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {isArabic ? "رجوع" : "Back"}
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Settings className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" data-testid="settings-title">
              {isArabic ? "الإعدادات" : "Settings"}
            </h1>
            <p className="text-muted-foreground">
              {isArabic ? "إدارة حسابك وتفضيلاتك" : "Manage your account and preferences"}
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            <CardTitle>{isArabic ? "تغيير كلمة المرور" : "Change Password"}</CardTitle>
          </div>
          <CardDescription>
            {isArabic 
              ? "قم بتحديث كلمة المرور الخاصة بك للحفاظ على أمان حسابك" 
              : "Update your password to keep your account secure"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">
                {isArabic ? "كلمة المرور الحالية" : "Current Password"}
              </Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={isArabic ? "أدخل كلمة المرور الحالية" : "Enter current password"}
                required
                data-testid="input-current-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">
                {isArabic ? "كلمة المرور الجديدة" : "New Password"}
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={isArabic ? "أدخل كلمة المرور الجديدة" : "Enter new password"}
                required
                data-testid="input-new-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {isArabic ? "تأكيد كلمة المرور" : "Confirm Password"}
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={isArabic ? "أعد إدخال كلمة المرور الجديدة" : "Re-enter new password"}
                required
                data-testid="input-confirm-password"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={resetPasswordMutation.isPending}
              data-testid="button-update-password"
            >
              {resetPasswordMutation.isPending 
                ? (isArabic ? "جاري التحديث..." : "Updating...") 
                : (isArabic ? "تحديث كلمة المرور" : "Update Password")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
