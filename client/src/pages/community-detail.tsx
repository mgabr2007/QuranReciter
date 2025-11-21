import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { PageLayout } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import { Breadcrumb } from "@/components/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Loader2, Users, BookOpen, CheckCircle2, Clock, Circle } from "lucide-react";
import { useState } from "react";

interface JuzData {
  juzNumber: number;
  member: { id: number; username: string } | null;
  completionPercentage: number;
  status: 'completed' | 'in_progress' | 'not_started' | 'available';
  assignmentId: number | null;
}

interface CommunityDetails {
  community: {
    id: number;
    name: string;
    description: string | null;
    maxMembers: number;
  };
  juzData: JuzData[];
}

export default function CommunityDetail() {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const isRTL = language === 'ar';
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [selectedJuz, setSelectedJuz] = useState<JuzData | null>(null);

  const { data, isLoading, error } = useQuery<CommunityDetails>({
    queryKey: ['/api/communities', id, 'details'],
  });

  const claimMutation = useMutation({
    mutationFn: async (juzNumber: number) => {
      return await apiRequest('POST', `/api/communities/${id}/claim-juz`, { juzNumber });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/communities', id, 'details'] });
      toast({
        title: language === 'ar' ? 'تم المطالبة بالجزء' : 'Juz Claimed',
        description: language === 'ar' 
          ? `تم تخصيص الجزء ${selectedJuz?.juzNumber} لك بنجاح`
          : `Juz ${selectedJuz?.juzNumber} has been assigned to you`,
      });
      setClaimDialogOpen(false);
      setSelectedJuz(null);
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'فشلت المطالبة' : 'Claim Failed',
        description: error.message,
      });
    },
  });

  const requestMutation = useMutation({
    mutationFn: async ({ juzNumber, fromMemberId }: { juzNumber: number; fromMemberId: number }) => {
      return await apiRequest('POST', `/api/communities/${id}/juz-transfer-request`, {
        juzNumber,
        fromMemberId,
      });
    },
    onSuccess: () => {
      toast({
        title: language === 'ar' ? 'تم إرسال الطلب' : 'Request Sent',
        description: language === 'ar'
          ? `تم إرسال طلبك للجزء ${selectedJuz?.juzNumber} إلى ${selectedJuz?.member?.username}`
          : `Your request for Juz ${selectedJuz?.juzNumber} has been sent to ${selectedJuz?.member?.username}`,
      });
      setRequestDialogOpen(false);
      setSelectedJuz(null);
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'فشل الطلب' : 'Request Failed',
        description: error.message,
      });
    },
  });

  const handleClaimJuz = (juz: JuzData) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'تسجيل الدخول مطلوب' : 'Login Required',
        description: language === 'ar' ? 'يجب تسجيل الدخول للمطالبة بالجزء' : 'Please login to claim a juz',
      });
      return;
    }
    setSelectedJuz(juz);
    setClaimDialogOpen(true);
  };

  const handleRequestJuz = (juz: JuzData) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'تسجيل الدخول مطلوب' : 'Login Required',
        description: language === 'ar' ? 'يجب تسجيل الدخول لطلب الجزء' : 'Please login to request a juz',
      });
      return;
    }
    setSelectedJuz(juz);
    setRequestDialogOpen(true);
  };

  const getStatusColor = (status: JuzData['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900 border-green-300 dark:border-green-700';
      case 'in_progress':
        return 'bg-yellow-100 dark:bg-yellow-900 border-yellow-300 dark:border-yellow-700';
      case 'not_started':
        return 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600';
      case 'available':
        return 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800';
    }
  };

  const getStatusIcon = (status: JuzData['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
      case 'not_started':
        return <Circle className="h-4 w-4 text-gray-400" />;
      case 'available':
        return <Circle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusText = (status: JuzData['status']) => {
    if (language === 'ar') {
      switch (status) {
        case 'completed': return 'مكتمل';
        case 'in_progress': return 'جاري';
        case 'not_started': return 'لم يبدأ';
        case 'available': return 'متاح';
      }
    }
    switch (status) {
      case 'completed': return 'Complete';
      case 'in_progress': return 'In Progress';
      case 'not_started': return 'Not Started';
      case 'available': return 'Available';
    }
  };

  if (isLoading) {
    return (
      <PageLayout maxWidth="7xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    );
  }

  if (error || !data) {
    return (
      <PageLayout maxWidth="7xl">
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {language === 'ar' ? 'فشل في تحميل تفاصيل المجموعة' : 'Failed to load community details'}
          </p>
        </div>
      </PageLayout>
    );
  }

  const { community, juzData } = data;
  const assignedJuz = juzData.filter(j => j.member !== null).length;
  const completedJuz = juzData.filter(j => j.status === 'completed').length;
  const availableJuz = juzData.filter(j => j.status === 'available').length;

  return (
    <PageLayout maxWidth="7xl">
      <Breadcrumb
        items={[
          { label: language === 'ar' ? 'لوحة التحكم' : 'Dashboard', href: '/' },
          { label: language === 'ar' ? 'المجموعات' : 'Communities', href: '/communities' },
          { label: community.name }
        ]}
      />

      <PageHeader
        title={community.name}
        subtitle={community.description || (language === 'ar' ? 'تتبع تقدم جميع الأعضاء في هذه المجموعة' : 'Track progress of all members in this community')}
        icon={<Users className="w-5 h-5 text-white" />}
        maxWidth="7xl"
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'الأجزاء المخصصة' : 'Assigned Juz'}
                </p>
                <p className="text-2xl font-bold">{assignedJuz}/30</p>
              </div>
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'مكتمل' : 'Completed'}
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{completedJuz}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'متاح' : 'Available'}
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{availableJuz}</p>
              </div>
              <Circle className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'الإنجاز الكلي' : 'Overall Progress'}
                </p>
                <p className="text-2xl font-bold">{Math.round((completedJuz / 30) * 100)}%</p>
              </div>
              <div className="h-8 w-8 rounded-full border-4 border-primary flex items-center justify-center">
                <span className="text-xs font-bold">{completedJuz}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700" />
              <span className="text-sm">{language === 'ar' ? 'مكتمل' : 'Completed'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700" />
              <span className="text-sm">{language === 'ar' ? 'جاري' : 'In Progress'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600" />
              <span className="text-sm">{language === 'ar' ? 'لم يبدأ' : 'Not Started'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800" />
              <span className="text-sm">{language === 'ar' ? 'متاح للمطالبة' : 'Available to Claim'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Juz Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {juzData.map((juz) => (
          <Card
            key={juz.juzNumber}
            className={`${getStatusColor(juz.status)} transition-all hover:shadow-md cursor-pointer`}
            data-testid={`juz-card-${juz.juzNumber}`}
          >
            <CardContent className="p-4">
              <div className="space-y-2">
                {/* Juz Number */}
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs font-bold">
                    {language === 'ar' ? `جزء ${juz.juzNumber}` : `Juz ${juz.juzNumber}`}
                  </Badge>
                  {getStatusIcon(juz.status)}
                </div>

                {/* Member or Available */}
                <div className={`text-sm font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
                  {juz.member ? (
                    <span className="truncate block">{juz.member.username}</span>
                  ) : (
                    <span className="text-blue-600 dark:text-blue-400">
                      {language === 'ar' ? 'متاح' : 'Available'}
                    </span>
                  )}
                </div>

                {/* Progress Bar */}
                {juz.member && (
                  <>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          juz.status === 'completed'
                            ? 'bg-green-600 dark:bg-green-400'
                            : juz.status === 'in_progress'
                            ? 'bg-yellow-600 dark:bg-yellow-400'
                            : 'bg-gray-400'
                        }`}
                        style={{ width: `${juz.completionPercentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-center text-muted-foreground">
                      {juz.completionPercentage}%
                    </p>
                  </>
                )}

                {/* Action Button */}
                {juz.status === 'available' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs"
                    onClick={() => handleClaimJuz(juz)}
                    data-testid={`claim-juz-${juz.juzNumber}`}
                  >
                    {language === 'ar' ? 'المطالبة' : 'Claim'}
                  </Button>
                )}

                {juz.member && juz.status !== 'completed' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full text-xs"
                    onClick={() => handleRequestJuz(juz)}
                    data-testid={`request-juz-${juz.juzNumber}`}
                  >
                    {language === 'ar' ? 'طلب' : 'Request'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Claim Juz Dialog */}
      <Dialog open={claimDialogOpen} onOpenChange={setClaimDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'المطالبة بالجزء' : 'Claim Juz'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ar'
                ? `هل أنت متأكد أنك تريد المطالبة بالجزء ${selectedJuz?.juzNumber}؟ سيتم تعيينه لك ويمكنك البدء في التلاوة.`
                : `Are you sure you want to claim Juz ${selectedJuz?.juzNumber}? It will be assigned to you and you can start recitation.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setClaimDialogOpen(false)}
              data-testid="button-cancel-claim"
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={() => selectedJuz && claimMutation.mutate(selectedJuz.juzNumber)}
              disabled={claimMutation.isPending}
              data-testid="button-confirm-claim"
            >
              {claimMutation.isPending
                ? (language === 'ar' ? 'جاري المطالبة...' : 'Claiming...')
                : (language === 'ar' ? 'تأكيد' : 'Confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Juz Dialog */}
      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'طلب الجزء' : 'Request Juz'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ar'
                ? `هل تريد طلب الجزء ${selectedJuz?.juzNumber} من ${selectedJuz?.member?.username}؟ سيتم إخطارهم بطلبك ويمكنهم قبوله أو رفضه.`
                : `Do you want to request Juz ${selectedJuz?.juzNumber} from ${selectedJuz?.member?.username}? They will be notified and can accept or decline your request.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRequestDialogOpen(false)}
              data-testid="button-cancel-request"
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={() =>
                selectedJuz?.member &&
                requestMutation.mutate({
                  juzNumber: selectedJuz.juzNumber,
                  fromMemberId: selectedJuz.member.id,
                })
              }
              disabled={requestMutation.isPending}
              data-testid="button-confirm-request"
            >
              {requestMutation.isPending
                ? (language === 'ar' ? 'جاري الإرسال...' : 'Sending...')
                : (language === 'ar' ? 'إرسال الطلب' : 'Send Request')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
