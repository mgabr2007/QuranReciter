import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCcw, Share } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";

interface QuickActionsProps {
  currentSurahId: number;
  currentSurahName: string;
  currentAyahNumber: number;
  onReset: () => void;
}

export const QuickActions = ({
  currentSurahId,
  currentSurahName,
  currentAyahNumber,
  onReset,
}: QuickActionsProps) => {
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleShare = () => {
    const shareText = t('shareText', { surah: currentSurahName, ayah: currentAyahNumber.toString() });
    const shareTitle = t('shareTitle');
    
    if (navigator.share) {
      navigator.share({
        title: shareTitle,
        text: shareText,
        url: window.location.href,
      }).catch(() => {
        // Fallback to clipboard
        navigator.clipboard.writeText(shareText);
        toast({
          title: t('copiedToClipboard'),
          description: t('progressShared'),
        });
      });
    } else {
      navigator.clipboard.writeText(shareText);
      toast({
        title: t('copiedToClipboard'), 
        description: t('progressShared'),
      });
    }
  };

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('quickActions')}</h3>
        <div className="flex justify-center gap-3">
          <Button
            variant="outline"
            onClick={onReset}
            className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-center flex-col h-auto"
          >
            <RotateCcw className="h-5 w-5 text-gray-600 mb-2" />
            <span className="text-sm text-gray-700">{t('resetSession')}</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={handleShare}
            className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-center flex-col h-auto"
          >
            <Share className="h-5 w-5 text-gray-600 mb-2" />
            <span className="text-sm text-gray-700">{t('share')}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
