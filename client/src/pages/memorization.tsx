import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageLayout } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Flame, BarChart3, Trophy } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/i18n/LanguageContext";
import type { Surah } from "@shared/schema";

interface HeatmapData {
  surahId: number;
  ayahNumber: number;
  count: number;
  lastPracticed: string;
}

interface SurahProgress {
  ayahNumber: number;
  count: number;
  lastPracticed: string;
}

interface CalendarData {
  date: string;
  count: number;
  duration: number;
}

interface TopAyah {
  surahId: number;
  surahName: string;
  ayahNumber: number;
  count: number;
}

export default function MemorizationPage() {
  const { t } = useLanguage();
  const [selectedSurahId, setSelectedSurahId] = useState<number>(1);
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);

  const { data: surahs = [] } = useQuery<Surah[]>({
    queryKey: ['/api/surahs'],
  });

  const { data: heatmapData = [], isLoading: heatmapLoading, error: heatmapError } = useQuery<HeatmapData[]>({
    queryKey: ['/api/practice/heatmap'],
  });

  const { data: surahProgress = [], isLoading: progressLoading, error: progressError } = useQuery<SurahProgress[]>({
    queryKey: [`/api/practice/surah/${selectedSurahId}`],
  });

  const { data: calendarData = [], isLoading: calendarLoading, error: calendarError } = useQuery<CalendarData[]>({
    queryKey: [`/api/practice/calendar/${selectedYear}/${selectedMonth}`],
  });

  const { data: topAyahs = [], isLoading: topLoading, error: topError } = useQuery<TopAyah[]>({
    queryKey: ['/api/practice/top/10'],
  });

  const getColorForCount = (count: number): string => {
    if (count === 0) return "bg-gray-100 dark:bg-gray-800";
    if (count <= 2) return "bg-green-200 dark:bg-green-900";
    if (count <= 5) return "bg-green-400 dark:bg-green-700";
    if (count <= 10) return "bg-green-600 dark:bg-green-500";
    return "bg-green-800 dark:bg-green-300";
  };

  const getTextColorForCount = (count: number): string => {
    if (count === 0) return "text-gray-400 dark:text-gray-600";
    if (count <= 2) return "text-green-800 dark:text-green-200";
    if (count <= 5) return "text-green-900 dark:text-green-100";
    return "text-white dark:text-gray-900";
  };

  const selectedSurah = surahs.find(s => s.id === selectedSurahId);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  const getCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    const firstDay = new Date(selectedYear, selectedMonth - 1, 1).getDay();
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const dayData = calendarData.find(d => d.date === dateStr);
      days.push({
        day,
        date: dateStr,
        count: dayData?.count || 0,
        duration: dayData?.duration || 0
      });
    }

    return days;
  };

  return (
    <PageLayout>
      <PageHeader
        icon={<Flame className="h-6 w-6 text-white" />}
        title={t('memorization')}
        subtitle={t('memorization_subtitle')}
      />

      <Tabs defaultValue="heatmap" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="heatmap" data-testid="tab-heatmap">
            <Flame className="w-4 h-4 mr-2" />
            {t('heatmap')}
          </TabsTrigger>
          <TabsTrigger value="calendar" data-testid="tab-calendar">
            <Calendar className="w-4 h-4 mr-2" />
            {t('calendar')}
          </TabsTrigger>
          <TabsTrigger value="progress" data-testid="tab-progress">
            <BarChart3 className="w-4 h-4 mr-2" />
            {t('surah_progress')}
          </TabsTrigger>
          <TabsTrigger value="top" data-testid="tab-top">
            <Trophy className="w-4 h-4 mr-2" />
            {t('top_ayahs')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="heatmap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('practice_heatmap')}</CardTitle>
              <CardDescription>{t('heatmap_description')}</CardDescription>
            </CardHeader>
            <CardContent>
              {heatmapLoading && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {t('loading')}
                </div>
              )}
              {heatmapError && (
                <div className="text-center py-8 text-red-500 dark:text-red-400">
                  {t('error')}: Failed to load heatmap data
                </div>
              )}
              {!heatmapLoading && !heatmapError && (
              <>
              <div className="space-y-2">
                {surahs.map((surah) => {
                  const surahData = heatmapData.filter(d => d.surahId === surah.id);
                  if (surahData.length === 0) return null;

                  return (
                    <div key={surah.id} className="space-y-1">
                      <div className="text-sm font-medium">
                        {surah.id}. {surah.name} ({surah.nameArabic})
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {Array.from({ length: surah.totalAyahs }, (_, i) => i + 1).map(ayahNum => {
                          const ayahData = surahData.find(d => d.ayahNumber === ayahNum);
                          const count = ayahData?.count || 0;
                          
                          return (
                            <div
                              key={ayahNum}
                              className={`w-8 h-8 rounded flex items-center justify-center text-xs font-medium ${getColorForCount(count)} ${getTextColorForCount(count)} cursor-pointer hover:scale-110 transition-transform`}
                              title={`Ayah ${ayahNum}: ${count} times${ayahData ? `, last: ${ayahData.lastPracticed}` : ''}`}
                              data-testid={`heatmap-cell-${surah.id}-${ayahNum}`}
                            >
                              {ayahNum}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-6 flex items-center gap-4 text-sm">
                <span className="font-medium">{t('legend')}:</span>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gray-100 dark:bg-gray-800"></div>
                  <span>0</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-200 dark:bg-green-900"></div>
                  <span>1-2</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-400 dark:bg-green-700"></div>
                  <span>3-5</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-600 dark:bg-green-500"></div>
                  <span>6-10</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-800 dark:bg-green-300"></div>
                  <span>11+</span>
                </div>
              </div>
              </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('practice_calendar')}</CardTitle>
              <CardDescription>{t('calendar_description')}</CardDescription>
              {calendarLoading && (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  {t('loading')}
                </div>
              )}
              {calendarError && (
                <div className="text-center py-4 text-red-500 dark:text-red-400">
                  {t('error')}: Failed to load calendar data
                </div>
              )}
              <div className="flex gap-2 mt-4">
                <Select value={selectedMonth.toString()} onValueChange={(val) => setSelectedMonth(parseInt(val))}>
                  <SelectTrigger className="w-[180px]" data-testid="select-month">
                    <SelectValue placeholder={t('select_month')} />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <SelectItem key={month} value={month.toString()}>
                        {new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedYear.toString()} onValueChange={(val) => setSelectedYear(parseInt(val))}>
                  <SelectTrigger className="w-[180px]" data-testid="select-year">
                    <SelectValue placeholder={t('select_year')} />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i).map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {!calendarLoading && !calendarError && (
              <div className="grid grid-cols-7 gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                    {day}
                  </div>
                ))}
                {getCalendarGrid().map((dayData, index) => {
                  if (!dayData) {
                    return <div key={`empty-${index}`} className="aspect-square"></div>;
                  }

                  const { day, count, duration } = dayData;
                  const minutes = Math.floor(duration / 60);

                  return (
                    <div
                      key={day}
                      className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm font-medium ${getColorForCount(count)} ${getTextColorForCount(count)} cursor-pointer hover:scale-105 transition-transform`}
                      title={`${count} ayahs practiced, ${minutes} minutes`}
                      data-testid={`calendar-day-${day}`}
                    >
                      <div>{day}</div>
                      {count > 0 && <div className="text-xs">{count}</div>}
                    </div>
                  );
                })}
              </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('surah_by_surah_progress')}</CardTitle>
              <CardDescription>{t('progress_description')}</CardDescription>
              {progressLoading && (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  {t('loading')}
                </div>
              )}
              {progressError && (
                <div className="text-center py-4 text-red-500 dark:text-red-400">
                  {t('error')}: Failed to load surah progress
                </div>
              )}
              <Select value={selectedSurahId.toString()} onValueChange={(val) => setSelectedSurahId(parseInt(val))}>
                <SelectTrigger className="w-full mt-4" data-testid="select-surah">
                  <SelectValue placeholder={t('select_surah')} />
                </SelectTrigger>
                <SelectContent>
                  {surahs.map(surah => (
                    <SelectItem key={surah.id} value={surah.id.toString()}>
                      {surah.id}. {surah.name} - {surah.nameArabic} ({surah.totalAyahs} {t('ayahs')})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {!progressLoading && !progressError && selectedSurah && (
                <div className="space-y-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {t('showing_progress_for')} <span className="font-semibold">{selectedSurah.name}</span> ({selectedSurah.totalAyahs} {t('ayahs')})
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: selectedSurah.totalAyahs }, (_, i) => i + 1).map(ayahNum => {
                      const ayahData = surahProgress.find(d => d.ayahNumber === ayahNum);
                      const count = ayahData?.count || 0;
                      
                      return (
                        <div
                          key={ayahNum}
                          className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center text-xs font-medium ${getColorForCount(count)} ${getTextColorForCount(count)} cursor-pointer hover:scale-110 transition-transform`}
                          title={`Ayah ${ayahNum}: ${count} times${ayahData ? `, last: ${ayahData.lastPracticed}` : ''}`}
                          data-testid={`progress-cell-${ayahNum}`}
                        >
                          <div>{ayahNum}</div>
                          {count > 0 && <div className="text-[10px]">{count}x</div>}
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-2">{t('statistics')}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {surahProgress.filter(p => p.count > 0).length}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{t('ayahs_practiced')}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {Math.round((surahProgress.filter(p => p.count > 0).length / selectedSurah.totalAyahs) * 100)}%
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{t('completion')}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {Math.max(...surahProgress.map(p => p.count), 0)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{t('max_repetitions')}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                          {surahProgress.length > 0 ? Math.round(surahProgress.reduce((sum, p) => sum + p.count, 0) / surahProgress.length) : 0}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{t('avg_repetitions')}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="top" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('most_practiced_ayahs')}</CardTitle>
              <CardDescription>{t('top_ayahs_description')}</CardDescription>
            </CardHeader>
            <CardContent>
              {topLoading && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {t('loading')}
                </div>
              )}
              {topError && (
                <div className="text-center py-8 text-red-500 dark:text-red-400">
                  {t('error')}: Failed to load top ayahs
                </div>
              )}
              {!topLoading && !topError && (
              <div className="space-y-2">
                {topAyahs.map((ayah, index) => (
                  <div
                    key={`${ayah.surahId}-${ayah.ayahNumber}`}
                    className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    data-testid={`top-ayah-${index}`}
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-600 dark:bg-green-500 text-white font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">
                        {ayah.surahName} - {t('ayah')} {ayah.ayahNumber}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {t('surah')} {ayah.surahId}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {ayah.count}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {t('times')}
                      </div>
                    </div>
                  </div>
                ))}
                {topAyahs.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    {t('no_practice_data')}
                  </div>
                )}
              </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}
