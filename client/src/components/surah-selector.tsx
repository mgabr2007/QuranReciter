import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { Surah } from "@shared/schema";
import { getSurahDisplayName, getAyahRange } from "@/lib/quran-data";
import { useLanguage } from "@/i18n/LanguageContext";

interface SurahSelectorProps {
  selectedSurah: number;
  startAyah: number;
  endAyah: number;
  onSelectionChange: (surah: number, startAyah: number, endAyah: number) => void;
}

export const SurahSelector = ({
  selectedSurah,
  startAyah,
  endAyah,
  onSelectionChange,
}: SurahSelectorProps) => {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  
  useEffect(() => {
    // Force refresh of surahs data on component mount
    queryClient.invalidateQueries({ queryKey: ["/api/surahs"] });
  }, [queryClient]);

  const { data: surahs = [], isLoading, error, refetch } = useQuery<Surah[]>({
    queryKey: ["/api/surahs"],
    staleTime: 0,
    refetchOnMount: true,
  });

  console.log('SurahSelector data:', { 
    surahs: surahs.length, 
    isLoading, 
    error, 
    selectedSurah,
    firstSurah: surahs[0],
    surahsArray: surahs.slice(0, 3),
    actualSurahs: surahs
  });

  // Force refetch if surahs array is empty but not loading
  useEffect(() => {
    if (!isLoading && surahs.length === 0 && !error) {
      console.log('Forcing refetch due to empty surahs');
      refetch();
    }
  }, [isLoading, surahs.length, error, refetch]);

  const currentSurah = surahs.find(s => s.id === selectedSurah);

  const handleSurahChange = (surahId: string) => {
    const id = parseInt(surahId);
    const surah = surahs.find(s => s.id === id);
    if (surah) {
      // Default to full surah range
      onSelectionChange(id, 1, surah.totalAyahs);
    }
  };

  const handleStartAyahChange = (value: string) => {
    const start = parseInt(value) || 1;
    if (currentSurah) {
      const range = getAyahRange(currentSurah.totalAyahs, start, endAyah);
      onSelectionChange(selectedSurah, range.start, range.end);
    }
  };

  const handleEndAyahChange = (value: string) => {
    const end = parseInt(value) || 1;
    if (currentSurah) {
      const range = getAyahRange(currentSurah.totalAyahs, startAyah, end);
      onSelectionChange(selectedSurah, range.start, range.end);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-300 rounded w-1/4 mb-4"></div>
            <div className="h-10 bg-gray-300 rounded mb-4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white rounded-xl shadow-sm border border-red-200">
        <CardContent className="p-6">
          <p className="text-red-600">{t('failedToLoadSurahs')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('selectSurah')}</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              {t('surah')}
            </Label>
            <Select value={selectedSurah.toString()} onValueChange={handleSurahChange}>
              <SelectTrigger className="w-full focus:ring-2 focus:ring-islamic-green focus:border-transparent" data-testid="select-surah">
                <SelectValue placeholder={surahs.length > 0 ? t('selectASurah') : t('loadingSurahs')} />
              </SelectTrigger>
              <SelectContent>
                {surahs.length > 0 ? (
                  surahs.map((surah) => (
                    <SelectItem key={surah.id} value={surah.id.toString()}>
                      {getSurahDisplayName(surah, language)}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="loading" disabled>{t('loadingSurahs')}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              {t('ayahRange')}
            </Label>
            <div className="flex space-x-2">
              <Input
                type="number"
                placeholder={t('from')}
                min="1"
                max={currentSurah?.totalAyahs || 1}
                value={startAyah}
                onChange={(e) => handleStartAyahChange(e.target.value)}
                className="flex-1 focus:ring-2 focus:ring-islamic-green focus:border-transparent"
                data-testid="input-start-ayah"
              />
              <Input
                type="number"
                placeholder={t('to')}
                min="1"
                max={currentSurah?.totalAyahs || 1}
                value={endAyah}
                onChange={(e) => handleEndAyahChange(e.target.value)}
                className="flex-1 focus:ring-2 focus:ring-islamic-green focus:border-transparent"
                data-testid="input-end-ayah"
              />
            </div>
            {currentSurah && (
              <p className="text-xs text-gray-500 mt-1">
                {t('totalAyahsIn', { surah: currentSurah.name, count: currentSurah.totalAyahs })}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
