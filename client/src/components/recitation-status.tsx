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
  
  return null;
};
