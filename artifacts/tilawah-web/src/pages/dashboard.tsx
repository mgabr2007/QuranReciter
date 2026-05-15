import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Book, Users, BarChart3, Clock, Play, TrendingUp, Award, Calendar } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

export default function Dashboard() {
  const { language } = useLanguage();
  const isArabic = language === "ar";

  // Fetch user stats
  const { data: communities } = useQuery<any[]>({ queryKey: ["/api/my-communities"] });
  const { data: sessions } = useQuery<any[]>({ queryKey: ["/api/sessions"] });
  const { data: bookmarks } = useQuery<any[]>({ queryKey: ["/api/bookmarks"] });

  // Calculate stats
  const totalListeningTime = sessions?.reduce((sum, s) => sum + s.sessionTime, 0) || 0;
  const totalSessions = sessions?.length || 0;
  const communitiesCount = communities?.length || 0;
  const bookmarksCount = bookmarks?.length || 0;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2" data-testid="dashboard-title">
          {isArabic ? "السلام عليكم" : "As-salamu alaykum"}
        </h1>
        <p className="text-muted-foreground text-lg">
          {isArabic ? "مرحباً بك في تطبيق التلاوة" : "Welcome to your Quran recitation journey"}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{isArabic ? "وقت الاستماع" : "Listening Time"}</p>
                <p className="text-2xl font-bold" data-testid="stat-listening-time">{formatTime(totalListeningTime)}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{isArabic ? "الجلسات" : "Sessions"}</p>
                <p className="text-2xl font-bold" data-testid="stat-sessions">{totalSessions}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                <Play className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{isArabic ? "المجتمعات" : "Communities"}</p>
                <p className="text-2xl font-bold" data-testid="stat-communities">{communitiesCount}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{isArabic ? "الإشارات المرجعية" : "Bookmarks"}</p>
                <p className="text-2xl font-bold" data-testid="stat-bookmarks">{bookmarksCount}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center">
                <Award className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" data-testid="card-start-recitation">
          <Link href="/recite">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center">
                  <Book className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <CardTitle>{isArabic ? "ابدأ التلاوة" : "Start Recitation"}</CardTitle>
                  <CardDescription>{isArabic ? "استمع إلى القرآن الكريم" : "Listen to Quran recitation"}</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" data-testid="card-browse-communities">
          <Link href="/communities">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle>{isArabic ? "تصفح المجتمعات" : "Browse Communities"}</CardTitle>
                  <CardDescription>{isArabic ? "انضم إلى مجتمعات الختمة" : "Join Quran completion groups"}</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" data-testid="card-view-analytics">
          <Link href="/memorization">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle>{isArabic ? "عرض التحليلات" : "View Analytics"}</CardTitle>
                  <CardDescription>{isArabic ? "تتبع تقدمك وممارستك" : "Track your progress and practice"}</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" data-testid="card-my-bookmarks">
          <Link href="/bookmarks">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <CardTitle>{isArabic ? "الإشارات المرجعية" : "My Bookmarks"}</CardTitle>
                  <CardDescription>{isArabic ? "الآيات المفضلة لديك" : "Your favorite verses"}</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Link>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            {isArabic ? "النشاط الأخير" : "Recent Activity"}
          </CardTitle>
          <CardDescription>
            {isArabic ? "جلسات الاستماع الأخيرة" : "Your latest listening sessions"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sessions && sessions.length > 0 ? (
            <div className="space-y-3">
              {sessions.slice(0, 5).map((session, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center">
                      <Book className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-medium" data-testid={`session-name-${index}`}>{session.surahName}</p>
                      <p className="text-sm text-muted-foreground">
                        {isArabic ? `آية ${session.startAyah} - ${session.endAyah}` : `Ayah ${session.startAyah}-${session.endAyah}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatTime(session.sessionTime)}</p>
                    <p className="text-xs text-muted-foreground">{new Date(session.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{isArabic ? "لا توجد جلسات بعد" : "No sessions yet"}</p>
              <Link href="/recite">
                <Button variant="link" className="mt-2">
                  {isArabic ? "ابدأ أول جلسة" : "Start your first session"}
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
