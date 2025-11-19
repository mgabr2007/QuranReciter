import { History as HistoryIcon } from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import { BackButton } from "@/components/back-button";
import { Breadcrumb } from "@/components/breadcrumb";
import { ListeningHistory } from "@/components/listening-history";
import { useLanguage } from "@/i18n/LanguageContext";

export default function History() {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  
  return (
    <>
      <Breadcrumb 
        items={[
          { label: isArabic ? "لوحة التحكم" : "Dashboard", href: "/" },
          { label: isArabic ? "السجل" : "History" }
        ]}
      />
      
      <PageHeader
        leftContent={
          <>
            <BackButton />
            <div className="h-6 w-px bg-gray-300 mx-3"></div>
          </>
        }
        icon={<HistoryIcon className="h-6 w-6 text-white" />}
        title={isArabic ? "سجل الاستماع" : "Listening History"}
        subtitle={isArabic ? "تتبع تقدمك في تلاوة القرآن" : "Track your Quran recitation progress"}
      />
      
      <PageLayout>
        <ListeningHistory userId={1} />
      </PageLayout>
    </>
  );
}