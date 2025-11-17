import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, UserPlus } from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/hooks/use-auth";

interface Community {
  id: number;
  name: string;
  description: string | null;
  adminId: number;
  maxMembers: number;
  createdAt: string;
}

export default function Communities() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: communities, isLoading } = useQuery<Community[]>({
    queryKey: ["/api/communities"],
  });

  const { data: myCommunities } = useQuery<Community[]>({
    queryKey: ["/api/my-communities"],
    enabled: !!user,
  });

  const joinMutation = useMutation({
    mutationFn: async (communityId: number) => {
      return await apiRequest("POST", `/api/communities/${communityId}/join`, {});
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-communities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/communities"] });
      toast({
        title: "Success!",
        description: `You've joined the community and been assigned Juz ${data.assignment.juzNumber}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to join community",
        description: error.message,
      });
    },
  });

  const isAlreadyMember = (communityId: number) => {
    return myCommunities?.some(c => c.id === communityId) || false;
  };

  return (
    <PageLayout>
      <PageHeader
        title="Communities"
        subtitle="Join a Tilawah community and contribute to completing the entire Quran weekly"
        icon={<Users className="w-5 h-5 text-white" />}
        actions={
          user ? (
            <Button
              onClick={() => setLocation("/communities/create")}
              data-testid="button-create-community"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Community
            </Button>
          ) : null
        }
      />

      {!user && (
        <Card className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <a href="/login" className="font-semibold underline">Sign in</a> or{" "}
              <a href="/signup" className="font-semibold underline">create an account</a>{" "}
              to join communities and track your progress.
            </p>
          </CardContent>
        </Card>
      )}

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
            <Card key={community.id} data-testid={`card-community-${community.id}`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{community.name}</span>
                  <Users className="w-5 h-5 text-muted-foreground" />
                </CardTitle>
                <CardDescription>
                  Max {community.maxMembers} members
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {community.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {community.description}
                  </p>
                )}

                {user && (
                  <Button
                    onClick={() => joinMutation.mutate(community.id)}
                    disabled={joinMutation.isPending || isAlreadyMember(community.id)}
                    className="w-full"
                    variant={isAlreadyMember(community.id) ? "secondary" : "default"}
                    data-testid={`button-join-${community.id}`}
                  >
                    {isAlreadyMember(community.id) ? (
                      "Already Joined"
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Join Community
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No communities yet</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Be the first to create a community and start a weekly Quran recitation group.
            </p>
            {user && (
              <Button
                onClick={() => setLocation("/communities/create")}
                data-testid="button-create-first-community"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Community
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </PageLayout>
  );
}
