import { Card, CardContent } from "@/components/ui/card";
import { formatTime } from "@/lib/quran-data";
import { useLanguage } from "@/i18n/LanguageContext";

interface RecitationStatusProps {
  completedAyahs: number;
  remainingAyahs: number;
  sessionTime: number;
}

export const RecitationStatus = ({
  completedAyahs,
  remainingAyahs,
  sessionTime,
}: RecitationStatusProps) => {
  const { t } = useLanguage();
  
  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('recitationStatus')}</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-islamic-green">{completedAyahs}</div>
            <div className="text-sm text-gray-600">{t('ayahs')} {t('completed')}</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-islamic-green">{remainingAyahs}</div>
            <div className="text-sm text-gray-600">{t('ayahs')} {t('remaining')}</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-islamic-green">{formatTime(sessionTime)}</div>
            <div className="text-sm text-gray-600">{t('sessionTime')}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
