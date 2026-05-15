import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Volume2, Languages, EyeOff } from "lucide-react";
import type { Ayah } from "../lib/types";
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
  const { t, language } = useLanguage();
  const isArabic = language === "ar";

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

  const translation = currentAyah.translationSahih || currentAyah.translation;

  return (
    <Card className="w-full">
      <CardContent className="p-4 sm:p-6">
        {/* Header: surah info + translation toggle */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Badge
              variant={isPlaying ? "default" : "secondary"}
              className="flex items-center gap-1"
            >
              {isPlaying && <Volume2 className="h-3 w-3" />}
              {surahName}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {isArabic
                ? `الآية ${currentAyahNumber} من ${totalAyahs}`
                : `Ayah ${currentAyahNumber} of ${totalAyahs}`}
            </span>
          </div>

          {onTranslationToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onTranslationToggle(!showTranslation)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {showTranslation ? (
                <>
                  <EyeOff className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">
                    {isArabic ? "إخفاء الترجمة" : "Hide Translation"}
                  </span>
                </>
              ) : (
                <>
                  <Languages className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">
                    {isArabic ? "إظهار الترجمة" : "Show Translation"}
                  </span>
                </>
              )}
            </Button>
          )}
        </div>

        {/* Main content: side-by-side on desktop, stacked on mobile */}
        {showTranslation && translation ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* Translation panel — left on desktop, top on mobile */}
            <div className="bg-blue-50 dark:bg-blue-950/40 p-5 sm:p-6 flex flex-col justify-center order-2 md:order-1 border-t md:border-t-0 md:border-r border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-1.5 mb-3">
                <Languages className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                  {isArabic ? "الترجمة الإنجليزية" : "English Translation"}
                </span>
              </div>
              <p className="text-base md:text-lg leading-relaxed text-gray-700 dark:text-gray-200 text-left" dir="ltr">
                {translation}
              </p>
            </div>

            {/* Arabic panel — right on desktop, bottom on mobile */}
            <div className="bg-gray-50 dark:bg-gray-800/60 p-5 sm:p-6 flex flex-col justify-center order-1 md:order-2">
              <div className="flex items-center justify-end gap-1.5 mb-3">
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                  النص العربي
                </span>
              </div>
              <p
                className="text-2xl md:text-3xl text-gray-900 dark:text-white text-right font-arabic"
                style={{ lineHeight: 2.2 }}
                dir="rtl"
              >
                {currentAyah.text}
              </p>
            </div>
          </div>
        ) : (
          /* Arabic only — full width */
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <p
              className="text-2xl md:text-3xl text-gray-900 dark:text-white text-center font-arabic"
              style={{ lineHeight: 2.2 }}
              dir="rtl"
            >
              {currentAyah.text}
            </p>
          </div>
        )}

        {/* Ayah number ornament */}
        <div className="mt-3 flex justify-center">
          <span className="text-xs text-muted-foreground font-arabic" dir="rtl">
            ﴿{currentAyahNumber}﴾
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
