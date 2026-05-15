import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, UserPlus, Book, Calendar, TrendingUp, Bell, Check, X, Send, Inbox } from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import { Breadcrumb } from "@/components/breadcrumb";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/i18n/LanguageContext";

interface Community {
  id: number;
  name: string;
  description: string | null;
  adminId: number;
  maxMembers: number;
  createdAt: string;
}

interface MyCommunity extends Community {
  memberCount: number;
  juzNumber: number | null;
}

interface TransferRequest {
  id: number;
  communityId: number;
  communityName: string;
  juzNumber: number;
  fromMemberUsername: string;
  toMemberUsername: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  type: 'received' | 'sent';
}

export default function Communities() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { language } = useLanguage();
  const isArabic = language === "ar";

  const { data: communities, isLoading } = useQuery<Community[]>({
    queryKey: ["/api/communities"],
  });

  const { data: myCommunities, isLoading: myCommunitiesLoading } = useQuery<MyCommunity[]>({
    queryKey: ["/api/my-communities"],
    enabled: !!user,
  });

  const { data: transferRequests, isLoading: requestsLoading } = useQuery<TransferRequest[]>({
    queryKey: ["/api/juz-transfer-requests"],
    enabled: !!user,
  });

  const respondToRequestMutation = useMutation({
    mutationFn: async ({ requestId, action }: { requestId: number; action: 'accept' | 'decline' }) => {
      return await apiRequest("PATCH", `/api/juz-transfer-requests/${requestId}`, { action });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/juz-transfer-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-communities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/communities"] });
      toast({
        title: isArabic ? "نجح!" : "Success!",
        description: isArabic 
          ? variables.action === 'accept' ? 'تم قبول الطلب' : 'تم رفض الطلب'
          : variables.action === 'accept' ? 'Request accepted' : 'Request declined',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: isArabic ? "خطأ" : "Error",
        description: error.message,
      });
    },
  });

  const joinMutation = useMutation({
    mutationFn: async (communityId: number) => {
      return await apiRequest("POST", `/api/communities/${communityId}/join`, {});
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-communities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/communities"] });
      toast({
        title: isArabic ? "نجح!" : "Success!",
        description: isArabic 
          ? `لقد انضممت للمجتمع وتم تعيين الجزء ${data.assignment.juzNumber} لك!`
          : `You've joined the community and been assigned Juz ${data.assignment.juzNumber}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: isArabic ? "فشل الانضمام" : "Failed to join community",
        description: error.message,
      });
    },
  });

  const isAlreadyMember = (communityId: number) => {
    return myCommunities?.some(c => c.id === communityId) || false;
  };

  return (
    <PageLayout>
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Breadcrumb items={[
          { label: isArabic ? "لوحة التحكم" : "Home", href: "/" },
          { label: isArabic ? "المجتمعات" : "Communities" }
        ]} />

        <PageHeader
          title={isArabic ? "المجتمعات" : "Communities"}
          subtitle={isArabic ? "انضم أو أنشئ مجتمعات التلاوة لإتمام القرآن جماعياً" : "Join or create Tilawah communities for group Quran completion"}
          icon={<Users className="w-5 h-5 text-white" />}
          actions={
            user ? (
              <Button
                onClick={() => setLocation("/communities/create")}
                data-testid="button-create-community"
                size="lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                {isArabic ? "إنشاء مجتمع" : "Create Community"}
              </Button>
            ) : null
          }
        />

        {!user && (
          <Card className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
            <CardContent className="pt-6">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                {isArabic ? (
                  <>
                    <a href="/login" className="font-semibold underline">تسجيل الدخول</a> أو{" "}
                    <a href="/signup" className="font-semibold underline">إنشاء حساب</a>{" "}
                    للانضمام إلى المجتمعات وتتبع تقدمك.
                  </>
                ) : (
                  <>
                    <a href="/login" className="font-semibold underline">Sign in</a> or{" "}
                    <a href="/signup" className="font-semibold underline">create an account</a>{" "}
                    to join communities and track your progress.
                  </>
                )}
              </p>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="browse" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="browse">{isArabic ? "تصفح الكل" : "Browse All"}</TabsTrigger>
            <TabsTrigger value="my-communities" disabled={!user}>{isArabic ? "مجتمعاتي" : "My Communities"}</TabsTrigger>
            <TabsTrigger value="requests" disabled={!user} className="relative">
              {isArabic ? "الطلبات" : "My Requests"}
              {transferRequests && transferRequests.filter(r => r.type === 'received' && r.status === 'pending').length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {transferRequests.filter(r => r.type === 'received' && r.status === 'pending').length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Browse Communities Tab */}
          <TabsContent value="browse">
            {isLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
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
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {communities.map((community) => (
                  <Card key={community.id} className="hover:shadow-lg transition-shadow" data-testid={`card-community-${community.id}`}>
                    <div onClick={() => setLocation(`/communities/${community.id}`)} className="cursor-pointer">
                      <CardHeader>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <CardTitle className="text-xl mb-1">{community.name}</CardTitle>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                <Users className="w-3 h-3 mr-1" />
                                {community.maxMembers} {isArabic ? "أعضاء" : "Members"}
                              </Badge>
                            </div>
                          </div>
                          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center flex-shrink-0">
                            <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                          </div>
                        </div>
                        {community.description && (
                          <CardDescription className="line-clamp-2">
                            {community.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                    </div>
                    <CardFooter>
                      {user && (
                        isAlreadyMember(community.id) ? (
                          <Button
                            variant="outline"
                            className="w-full"
                            disabled
                            data-testid={`button-already-member-${community.id}`}
                          >
                            {isArabic ? "عضو بالفعل" : "Already a Member"}
                          </Button>
                        ) : (
                          <Button
                            onClick={() => joinMutation.mutate(community.id)}
                            disabled={joinMutation.isPending}
                            className="w-full"
                            data-testid={`button-join-${community.id}`}
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            {joinMutation.isPending 
                              ? (isArabic ? "جاري الانضمام..." : "Joining...") 
                              : (isArabic ? "انضم للمجتمع" : "Join Community")
                            }
                          </Button>
                        )
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-12 pb-12 text-center text-muted-foreground">
                  <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">{isArabic ? "لا توجد مجتمعات بعد" : "No communities yet"}</p>
                  <p className="text-sm mb-4">{isArabic ? "كن أول من ينشئ مجتمع التلاوة!" : "Be the first to create a Tilawah community!"}</p>
                  {user && (
                    <Button onClick={() => setLocation("/communities/create")}>
                      <Plus className="w-4 h-4 mr-2" />
                      {isArabic ? "إنشاء مجتمع" : "Create Community"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* My Communities Tab */}
          <TabsContent value="my-communities">
            {myCommunitiesLoading ? (
              <div className="grid gap-6 md:grid-cols-2">
                {[1, 2].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : myCommunities && myCommunities.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2">
                {myCommunities.map((community) => (
                  <Card key={community.id} className="hover:shadow-lg transition-shadow" data-testid={`card-my-community-${community.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-2">{community.name}</CardTitle>
                          {community.description && (
                            <CardDescription className="line-clamp-2 mb-3">
                              {community.description}
                            </CardDescription>
                          )}
                        </div>
                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center flex-shrink-0">
                          <Book className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="flex items-center gap-2 p-3 bg-accent rounded-lg">
                          <Book className="w-5 h-5 text-emerald-600" />
                          <div>
                            <p className="text-xs text-muted-foreground">{isArabic ? "الجزء الخاص بك" : "Your Juz"}</p>
                            <p className="text-lg font-bold">{community.juzNumber || (isArabic ? "غير محدد" : "N/A")}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-accent rounded-lg">
                          <Users className="w-5 h-5 text-purple-600" />
                          <div>
                            <p className="text-xs text-muted-foreground">{isArabic ? "الأعضاء" : "Members"}</p>
                            <p className="text-lg font-bold">{community.memberCount}/{community.maxMembers}</p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-12 pb-12 text-center text-muted-foreground">
                  <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">{isArabic ? "لم تنضم لأي مجتمع بعد" : "You haven't joined any communities yet"}</p>
                  <p className="text-sm">{isArabic ? "انضم لمجتمع لبدء رحلتك الجماعية في تلاوة القرآن" : "Join a community to start your group Quran recitation journey"}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* My Requests Tab */}
          <TabsContent value="requests">
            {requestsLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin">⏳</div>
              </div>
            ) : !transferRequests || transferRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bell className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {isArabic ? "لا توجد طلبات نقل" : "No transfer requests"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Received Requests */}
                {transferRequests.filter(r => r.type === 'received').length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Inbox className="w-5 h-5" />
                      {isArabic ? "الطلبات الواردة" : "Received Requests"}
                    </h3>
                    <div className="grid gap-4">
                      {transferRequests
                        .filter(r => r.type === 'received')
                        .map((request) => (
                          <Card key={request.id}>
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <CardTitle className="text-base">
                                    {isArabic 
                                      ? `طلب نقل الجزء ${request.juzNumber}`
                                      : `Juz ${request.juzNumber} Transfer Request`}
                                  </CardTitle>
                                  <CardDescription>
                                    {isArabic
                                      ? `من ${request.fromMemberUsername} في ${request.communityName}`
                                      : `From ${request.fromMemberUsername} in ${request.communityName}`}
                                  </CardDescription>
                                </div>
                                <Badge
                                  variant={
                                    request.status === 'accepted' ? 'default' :
                                    request.status === 'declined' ? 'destructive' :
                                    'secondary'
                                  }
                                >
                                  {request.status === 'accepted' && (isArabic ? 'مقبول' : 'Accepted')}
                                  {request.status === 'declined' && (isArabic ? 'مرفوض' : 'Declined')}
                                  {request.status === 'pending' && (isArabic ? 'قيد الانتظار' : 'Pending')}
                                </Badge>
                              </div>
                            </CardHeader>
                            {request.status === 'pending' && (
                              <CardFooter className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => respondToRequestMutation.mutate({ requestId: request.id, action: 'accept' })}
                                  disabled={respondToRequestMutation.isPending}
                                  data-testid={`button-accept-${request.id}`}
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  {isArabic ? 'قبول' : 'Accept'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => respondToRequestMutation.mutate({ requestId: request.id, action: 'decline' })}
                                  disabled={respondToRequestMutation.isPending}
                                  data-testid={`button-decline-${request.id}`}
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  {isArabic ? 'رفض' : 'Decline'}
                                </Button>
                              </CardFooter>
                            )}
                          </Card>
                        ))}
                    </div>
                  </div>
                )}

                {/* Sent Requests */}
                {transferRequests.filter(r => r.type === 'sent').length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Send className="w-5 h-5" />
                      {isArabic ? "الطلبات المرسلة" : "Sent Requests"}
                    </h3>
                    <div className="grid gap-4">
                      {transferRequests
                        .filter(r => r.type === 'sent')
                        .map((request) => (
                          <Card key={request.id}>
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <CardTitle className="text-base">
                                    {isArabic 
                                      ? `طلب الجزء ${request.juzNumber}`
                                      : `Request for Juz ${request.juzNumber}`}
                                  </CardTitle>
                                  <CardDescription>
                                    {isArabic
                                      ? `إلى ${request.toMemberUsername} في ${request.communityName}`
                                      : `To ${request.toMemberUsername} in ${request.communityName}`}
                                  </CardDescription>
                                </div>
                                <Badge
                                  variant={
                                    request.status === 'accepted' ? 'default' :
                                    request.status === 'declined' ? 'destructive' :
                                    'secondary'
                                  }
                                >
                                  {request.status === 'accepted' && (isArabic ? 'مقبول' : 'Accepted')}
                                  {request.status === 'declined' && (isArabic ? 'مرفوض' : 'Declined')}
                                  {request.status === 'pending' && (isArabic ? 'قيد الانتظار' : 'Pending')}
                                </Badge>
                              </div>
                            </CardHeader>
                          </Card>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}
