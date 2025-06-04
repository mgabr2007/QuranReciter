import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, Play, Calendar, TrendingUp, BookOpen, CheckCircle } from "lucide-react";
import { formatTime } from "@/lib/quran-data";
import type { RecitationSession } from "@shared/schema";

interface ListeningHistoryProps {
  userId: number;
}

interface SessionStats {
  totalSessions: number;
  totalTime: number;
  totalAyahs: number;
  completedSessions: number;
  averageSessionTime: number;
  mostListenedSurah: string;
  weeklyProgress: number[];
}

export const ListeningHistory = ({ userId }: ListeningHistoryProps) => {
  const { data: sessions, isLoading } = useQuery<RecitationSession[]>({
    queryKey: ['/api/sessions', userId],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<SessionStats>({
    queryKey: ['/api/sessions/stats', userId],
  });

  if (isLoading || statsLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
        <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProgressPercentage = (completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSessions}</div>
              <p className="text-xs text-muted-foreground">
                {stats.completedSessions} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatTime(stats.totalTime)}</div>
              <p className="text-xs text-muted-foreground">
                Avg: {formatTime(stats.averageSessionTime)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ayahs Practiced</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAyahs}</div>
              <p className="text-xs text-muted-foreground">
                Across all sessions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Favorite Surah</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{stats.mostListenedSurah}</div>
              <p className="text-xs text-muted-foreground">
                Most practiced
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Sessions
          </CardTitle>
          <CardDescription>
            Your latest Quran recitation practice sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sessions && sessions.length > 0 ? (
            <div className="space-y-4">
              {sessions.slice(0, 10).map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {session.isCompleted ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Play className="h-5 w-5 text-gray-400" />
                      )}
                      <div>
                        <h4 className="font-semibold">{session.surahName}</h4>
                        <p className="text-sm text-muted-foreground">
                          Ayahs {session.startAyah}-{session.endAyah}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={getProgressPercentage(session.completedAyahs, session.endAyah - session.startAyah + 1)} 
                          className="w-20"
                        />
                        <span className="text-sm font-medium">
                          {getProgressPercentage(session.completedAyahs, session.endAyah - session.startAyah + 1)}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {session.completedAyahs}/{session.endAyah - session.startAyah + 1} ayahs
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <Badge variant={session.isCompleted ? "default" : "secondary"}>
                        {formatTime(session.sessionTime)}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(session.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No sessions yet</h3>
              <p className="text-muted-foreground">
                Start your first recitation session to see your progress here
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};