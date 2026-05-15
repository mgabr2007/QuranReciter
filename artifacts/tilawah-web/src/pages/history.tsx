import { History as HistoryIcon, RotateCcw } from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import { BackButton } from "@/components/back-button";
import { Breadcrumb } from "@/components/breadcrumb";
import { ListeningHistory } from "@/components/listening-history";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function History() {
  const { t } = useLanguage();
  
  return (
    <>
      <Breadcrumb 
        items={[
          { label: t("dashboard"), href: "/" },
          { label: t("history") }
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
        title={t("listeningHistory")}
        subtitle={t("trackQuranProgress")}
        actions={
          <Link href="/recite">
            <Button variant="outline" size="sm" className="flex items-center gap-2" data-testid="button-back-to-practice">
              <RotateCcw className="h-4 w-4" />
              {t("backToPractice")}
            </Button>
          </Link>
        }
      />
      
      <PageLayout>
        <ListeningHistory userId={1} />
      </PageLayout>
    </>
  );
}
