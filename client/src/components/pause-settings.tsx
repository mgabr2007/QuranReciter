import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";

interface PauseSettingsProps {
  pauseDuration: number;
  autoRepeat: boolean;
  onPauseDurationChange: (duration: number) => void;
  onAutoRepeatChange: (autoRepeat: boolean) => void;
}

export const PauseSettings = ({
  pauseDuration,
  autoRepeat,
  onPauseDurationChange,
  onAutoRepeatChange,
}: PauseSettingsProps) => {
  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Pause Settings</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label className="text-sm font-medium text-gray-700">
                Silence Duration Between Ayahs
              </Label>
              <span className="text-lg font-semibold text-islamic-green">
                {pauseDuration} seconds
              </span>
            </div>
            <Slider
              value={[pauseDuration]}
              onValueChange={(values) => onPauseDurationChange(values[0])}
              min={1}
              max={30}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1s</span>
              <span>15s</span>
              <span>30s</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Checkbox
              id="autoRepeat"
              checked={autoRepeat}
              onCheckedChange={(checked) => onAutoRepeatChange(checked as boolean)}
              className="data-[state=checked]:bg-islamic-green data-[state=checked]:border-islamic-green"
            />
            <Label htmlFor="autoRepeat" className="text-sm text-gray-700">
              Auto-repeat current ayah
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
