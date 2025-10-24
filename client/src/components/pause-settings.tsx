import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { useLanguage } from "@/i18n/LanguageContext";

interface PauseSettingsProps {
  pauseDuration: number;
  noPause: boolean;
  autoRepeat: boolean;
  autoRepeatAyah: boolean;
  pauseCountdown: number;
  lastAyahDuration?: number;
  onPauseDurationChange: (duration: number) => void;
  onNoPauseChange: (noPause: boolean) => void;
  onAutoRepeatChange: (autoRepeat: boolean) => void;
  onAutoRepeatAyahChange: (autoRepeatAyah: boolean) => void;
}

export const PauseSettings = ({
  pauseDuration,
  noPause,
  autoRepeat,
  autoRepeatAyah,
  pauseCountdown,
  lastAyahDuration = 0,
  onPauseDurationChange,
  onNoPauseChange,
  onAutoRepeatChange,
  onAutoRepeatAyahChange,
}: PauseSettingsProps) => {
  const { t } = useLanguage();
  
  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{t('pauseSettings')}</h2>
          {pauseCountdown > 0 && (
            <div className="flex flex-col items-end gap-1 bg-islamic-green/10 text-islamic-green px-4 py-2 rounded-lg animate-pulse">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{t('nextAyahIn')}</span>
                <span className="text-2xl font-bold">{pauseCountdown}s</span>
              </div>
              {lastAyahDuration > 0 && (
                <span className="text-xs opacity-75">
                  ({t('ayahDuration', { duration: lastAyahDuration, extra: pauseDuration })})
                </span>
              )}
            </div>
          )}
        </div>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="noPause"
              checked={noPause}
              onCheckedChange={(checked) => onNoPauseChange(checked as boolean)}
              className="data-[state=checked]:bg-islamic-green data-[state=checked]:border-islamic-green"
              data-testid="checkbox-no-pause"
            />
            <Label htmlFor="noPause" className="text-sm font-medium text-gray-700">
              {t('noPause')}
            </Label>
          </div>
          {!noPause && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-sm font-medium text-gray-700">
                  {t('extraPauseTime')}
                </Label>
                <span className="text-lg font-semibold text-islamic-green">
                  {pauseDuration === 0 ? t('matchAyah') : t('matchAyahPlus', { time: pauseDuration })}
                </span>
              </div>
              <Slider
                value={[pauseDuration]}
                onValueChange={(values) => onPauseDurationChange(values[0])}
                min={0}
                max={30}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>+0s</span>
                <span>+15s</span>
                <span>+30s</span>
              </div>
            </div>
          )}
          <div className="flex items-center space-x-3">
            <Checkbox
              id="autoRepeatAyah"
              checked={autoRepeatAyah}
              onCheckedChange={(checked) => onAutoRepeatAyahChange(checked as boolean)}
              className="data-[state=checked]:bg-islamic-green data-[state=checked]:border-islamic-green"
              data-testid="checkbox-auto-repeat-ayah"
            />
            <Label htmlFor="autoRepeatAyah" className="text-sm text-gray-700">
              {t('autoRepeatAyah')}
            </Label>
          </div>
          <div className="flex items-center space-x-3">
            <Checkbox
              id="autoRepeat"
              checked={autoRepeat}
              onCheckedChange={(checked) => onAutoRepeatChange(checked as boolean)}
              className="data-[state=checked]:bg-islamic-green data-[state=checked]:border-islamic-green"
              data-testid="checkbox-auto-repeat-surah"
            />
            <Label htmlFor="autoRepeat" className="text-sm text-gray-700">
              {t('autoRepeat')}
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
