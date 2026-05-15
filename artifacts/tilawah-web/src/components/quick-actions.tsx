import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCcw, Share, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "wouter";

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
    const appUrl = window.location.origin;
    const shareText = t('shareText', { 
      surah: currentSurahName, 
      ayah: currentAyahNumber.toString(),
      url: appUrl
    });
    const shareTitle = t('shareTitle');
    
    if (navigator.share) {
      navigator.share({
        title: shareTitle,
        text: shareText,
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
    <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('quickActions')}</h3>
        <div className="flex justify-center gap-3">
          <Button
            variant="outline"
            onClick={onReset}
            className="p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors text-center flex-col h-auto"
            data-testid="button-reset-session"
          >
            <RotateCcw className="h-5 w-5 text-gray-600 dark:text-gray-300 mb-2" />
            <span className="text-sm text-gray-700 dark:text-gray-300">{t('resetSession')}</span>
          </Button>
          
          <Link href="/memorization">
            <Button
              className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-lg transition-all text-center flex-col h-auto shadow-md hover:shadow-lg transform hover:scale-105"
              data-testid="button-memorization"
            >
              <BookOpen className="h-6 w-6 text-white mb-2" />
              <span className="text-sm font-semibold text-white">{t('memorization')}</span>
              <span className="text-xs text-blue-100 mt-1">{t('viewProgress')}</span>
            </Button>
          </Link>
          
          <Button
            variant="outline"
            onClick={handleShare}
            className="p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors text-center flex-col h-auto"
            data-testid="button-share"
          >
            <Share className="h-5 w-5 text-gray-600 dark:text-gray-300 mb-2" />
            <span className="text-sm text-gray-700 dark:text-gray-300">{t('share')}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
