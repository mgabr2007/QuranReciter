import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { PageLayout } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import { Breadcrumb } from "@/components/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Loader2, Users, BookOpen, UserPlus } from "lucide-react";

interface Community {
  id: number;
  name: string;
  description: string | null;
  maxMembers: number;
}

interface CommunityPreview extends Community {
  memberCount: number;
}

export default function JoinCommunity() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: community, isLoading } = useQuery<CommunityPreview>({
    queryKey: [`/api/communities/${id}`],
  });

  const { data: userCommunities } = useQuery<Array<{ id: number }>>({
    queryKey: ['/api/my-communities'],
    enabled: !!user,
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', `/api/communities/${id}/join`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/my-communities'] });
      toast({
        title: language === 'ar' ? 'تم الانضمام!' : 'Joined!',
        description: language === 'ar' 
          ? `انضممت بنجاح إلى ${community?.name}`
          : `Successfully joined ${community?.name}`,
      });
      setLocation(`/communities/${id}`);
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'فشل الانضمام' : 'Join Failed',
        description: error.message,
      });
    },
  });

  if (isLoading) {
    return (
      <PageLayout maxWidth="4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    );
  }

  if (!community) {
    return (
      <PageLayout maxWidth="4xl">
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {language === 'ar' ? 'المجموعة غير موجودة' : 'Community not found'}
          </p>
        </div>
      </PageLayout>
    );
  }

  const isAlreadyMember = userCommunities?.some(c => c.id === community.id);

  return (
    <PageLayout maxWidth="4xl">
      <Breadcrumb
        items={[
          { label: language === 'ar' ? 'لوحة التحكم' : 'Dashboard', href: '/' },
          { label: language === 'ar' ? 'المجموعات' : 'Communities', href: '/communities' },
          { label: language === 'ar' ? 'انضم إلى المجموعة' : 'Join Community' }
        ]}
      />

      <PageHeader
        title={language === 'ar' ? 'انضم إلى المجموعة' : 'Join Community'}
        subtitle={language === 'ar' ? 'تمت دعوتك للانضمام إلى هذه المجموعة' : 'You\'ve been invited to join this community'}
        icon={<UserPlus className="w-5 h-5 text-white" />}
      />

      <Card>
        <CardContent className="p-8">
          <div className="space-y-6">
            {/* Community Info */}
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">{community.name}</h2>
                {community.description && (
                  <p className="text-muted-foreground">{community.description}</p>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'الأعضاء' : 'Members'}
                  </p>
                </div>
                <p className="text-2xl font-bold">
                  {community.memberCount}/{community.maxMembers}
                </p>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'الأجزاء' : 'Juz Parts'}
                  </p>
                </div>
                <p className="text-2xl font-bold">30</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {!user ? (
                <>
                  <Button
                    className="flex-1"
                    onClick={() => setLocation('/signup')}
                    data-testid="button-signup"
                  >
                    {language === 'ar' ? 'إنشاء حساب للانضمام' : 'Sign Up to Join'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setLocation('/login')}
                    data-testid="button-login"
                  >
                    {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
                  </Button>
                </>
              ) : isAlreadyMember ? (
                <Button
                  className="flex-1"
                  onClick={() => setLocation(`/communities/${id}`)}
                  data-testid="button-view-community"
                >
                  {language === 'ar' ? 'عرض المجموعة' : 'View Community'}
                </Button>
              ) : (
                <>
                  <Button
                    className="flex-1"
                    onClick={() => joinMutation.mutate()}
                    disabled={joinMutation.isPending || community.memberCount >= community.maxMembers}
                    data-testid="button-join-community"
                  >
                    {joinMutation.isPending
                      ? (language === 'ar' ? 'جاري الانضمام...' : 'Joining...')
                      : community.memberCount >= community.maxMembers
                      ? (language === 'ar' ? 'المجموعة ممتلئة' : 'Community Full')
                      : (language === 'ar' ? 'انضم الآن' : 'Join Now')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setLocation('/communities')}
                    data-testid="button-browse-communities"
                  >
                    {language === 'ar' ? 'تصفح المجموعات' : 'Browse Communities'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
