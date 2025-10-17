import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";

export const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="text-gray-600 hover:text-gray-900"
      data-testid="button-language"
    >
      <Languages className="h-4 w-4 mr-2" />
      {language === 'en' ? 'العربية' : 'English'}
    </Button>
  );
};
