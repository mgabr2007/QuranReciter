import { History as HistoryIcon } from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import { BackButton } from "@/components/back-button";
import { Breadcrumb } from "@/components/breadcrumb";
import { ListeningHistory } from "@/components/listening-history";

export default function History() {
  return (
    <>
      <Breadcrumb 
        items={[
          { label: "Dashboard", href: "/" },
          { label: "History" }
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
        title="Listening History"
        subtitle="Track your Quran recitation progress"
      />
      
      <PageLayout>
        <ListeningHistory userId={1} />
      </PageLayout>
    </>
  );
}