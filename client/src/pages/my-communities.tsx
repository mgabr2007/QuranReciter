import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Users, Book, Calendar, Edit } from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import { Breadcrumb } from "@/components/breadcrumb";
import { useLanguage } from "@/i18n/LanguageContext";
import { useState } from "react";

interface MyCommunity {
  id: number;
  name: string;
  description: string | null;
  adminId: number;
  maxMembers: number;
  memberCount: number;
  juzNumber: number | null;
  createdAt: string;
}

export default function MyCommunities() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [selectedCommunity, setSelectedCommunity] = useState<number | null>(null);
  const [newJuzNumber, setNewJuzNumber] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: communities, isLoading } = useQuery<MyCommunity[]>({
    queryKey: ["/api/my-communities"],
  });

  const { data: availableJuzData } = useQuery<number[]>({
    queryKey: ["/api/communities", selectedCommunity, "available-juz"],
    queryFn: async () => {
      if (!selectedCommunity) return [];
      const response = await fetch(`/api/communities/${selectedCommunity}/available-juz`);
      if (!response.ok) throw new Error("Failed to fetch available juz");
      return response.json();
    },
    enabled: !!selectedCommunity && isDialogOpen,
  });

  const { data: canModifyData } = useQuery<{ canModify: boolean }>({
    queryKey: ["/api/communities", selectedCommunity, "can-modify-juz"],
    queryFn: async () => {
      if (!selectedCommunity) return { canModify: false };
      const response = await fetch(`/api/communities/${selectedCommunity}/can-modify-juz`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error("Failed to check modification permission");
      return response.json();
    },
    enabled: !!selectedCommunity && isDialogOpen,
  });

  const updateJuzMutation = useMutation({
    mutationFn: async ({ communityId, juzNumber }: { communityId: number; juzNumber: number }) => {
      return await apiRequest("PATCH", `/api/communities/${communityId}/juz-assignment`, { juzNumber });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-communities"] });
      toast({
        title: t("success"),
        description: t("juzUpdatedSuccess"),
      });
      setIsDialogOpen(false);
      setSelectedCommunity(null);
      setNewJuzNumber("");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: t("failedToUpdateJuz"),
        description: error.message,
      });
    },
  });

  const handleUpdateJuz = () => {
    if (selectedCommunity && newJuzNumber) {
      updateJuzMutation.mutate({
        communityId: selectedCommunity,
        juzNumber: parseInt(newJuzNumber),
      });
    }
  };

  const openJuzDialog = (communityId: number, currentJuz: number | null) => {
    setSelectedCommunity(communityId);
    setNewJuzNumber(currentJuz?.toString() || "");
    setIsDialogOpen(true);
  };

  return (
    <PageLayout>
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Breadcrumb items={[
          { label: t("dashboard"), href: "/" },
          { label: t("communities"), href: "/communities" },
          { label: t("myCommunities") }
        ]} />

        <PageHeader
          title={t("myCommunities")}
          subtitle={t("myCommunitiesSubtitle")}
          icon={<Users className="w-5 h-5 text-white" />}
        />

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : communities && communities.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {communities.map((community) => (
              <Card key={community.id} data-testid={`card-my-community-${community.id}`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{community.name}</span>
                    <Users className="w-5 h-5 text-muted-foreground" />
                  </CardTitle>
                  <CardDescription>
                    {community.memberCount} / {community.maxMembers} {t("membersLabel")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {community.description && (
                    <p className="text-sm text-muted-foreground">
                      {community.description}
                    </p>
                  )}

                  {community.juzNumber && (
                    <div className="flex items-center justify-between p-4 bg-primary/10 dark:bg-primary/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Book className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium">{t("yourAssignedJuz")}</p>
                          <p className="text-2xl font-bold text-primary">
                            {t("juzLabel")} {community.juzNumber}
                          </p>
                        </div>
                      </div>
                      <Dialog open={isDialogOpen && selectedCommunity === community.id} onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (!open) {
                          setSelectedCommunity(null);
                          setNewJuzNumber("");
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openJuzDialog(community.id, community.juzNumber)}
                            data-testid={`button-change-juz-${community.id}`}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            {t("change")}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{t("changeJuzAssignment")}</DialogTitle>
                            <DialogDescription>
                              {canModifyData?.canModify
                                ? t("changeJuzDesc")
                                : t("modificationExpired")}
                            </DialogDescription>
                          </DialogHeader>

                          {canModifyData?.canModify && (
                            <div className="py-4">
                              <label className="text-sm font-medium mb-2 block">
                                {t("selectJuz")}
                              </label>
                              <Select value={newJuzNumber} onValueChange={setNewJuzNumber}>
                                <SelectTrigger data-testid="select-new-juz">
                                  <SelectValue placeholder={t("chooseJuz")} />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableJuzData?.map((juz) => (
                                    <SelectItem key={juz} value={juz.toString()}>
                                      {t("juzLabel")} {juz}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => setIsDialogOpen(false)}
                              data-testid="button-cancel-change"
                            >
                              {t("cancel")}
                            </Button>
                            {canModifyData?.canModify && (
                              <Button
                                onClick={handleUpdateJuz}
                                disabled={!newJuzNumber || updateJuzMutation.isPending}
                                data-testid="button-confirm-change"
                              >
                                {updateJuzMutation.isPending ? t("updatingJuz") : t("updateJuz")}
                              </Button>
                            )}
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{t("weeklyFridayCycle")}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t("noCommunitiesYet")}</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                {t("noCommunitiesJoinDesc")}
              </p>
              <Button
                onClick={() => setLocation("/communities")}
                data-testid="button-browse-communities"
              >
                <Users className="w-4 h-4 mr-2" />
                {t("browseCommunitiesBtn")}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}
