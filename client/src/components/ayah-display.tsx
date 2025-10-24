import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { BookOpen, Languages, Volume2 } from "lucide-react";
import type { Ayah } from "@shared/schema";
import { useLanguage } from "@/i18n/LanguageContext";

interface AyahDisplayProps {
  currentAyah: Ayah | null;
  surahName: string;
  currentAyahNumber: number;
  totalAyahs: number;
  isPlaying: boolean;
  showTranslation?: boolean;
  onTranslationToggle?: (show: boolean) => void;
}

export const AyahDisplay = ({
  currentAyah,
  surahName,
  currentAyahNumber,
  totalAyahs,
  isPlaying,
  showTranslation = true,
  onTranslationToggle,
}: AyahDisplayProps) => {
  const { t } = useLanguage();

  if (!currentAyah) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">{t('selectAndPlay')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        {/* Header with surah info and controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Badge variant={isPlaying ? "default" : "secondary"} className="flex items-center gap-1">
              {isPlaying && <Volume2 className="h-3 w-3" />}
              {surahName}
            </Badge>
            <span className="text-sm text-gray-600">
              Ayah {currentAyahNumber} of {totalAyahs}
            </span>
          </div>
        </div>

        {/* Arabic text */}
        <div className="space-y-6">
          <div className="text-center">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-4">
              <p 
                className="text-2xl md:text-3xl leading-loose font-arabic text-gray-900 dark:text-white"
                style={{ fontFamily: "'Amiri Quran', 'Arabic Typesetting', serif", lineHeight: 2 }}
                dir="rtl"
              >
                {currentAyah.text}
              </p>
            </div>
            
            {/* English translation */}
            {showTranslation && currentAyah.translation && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-100 dark:border-blue-800">
                <div className="flex items-start gap-2 mb-2">
                  <Languages className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                    {t('translation')}
                  </p>
                </div>
                <p className="text-base md:text-lg leading-relaxed text-gray-700 dark:text-gray-300 text-left">
                  {currentAyah.translation}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};