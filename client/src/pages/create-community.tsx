import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Users } from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";

const createCommunitySchema = z.object({
  name: z.string().min(3, "Community name must be at least 3 characters"),
  description: z.string().optional(),
  maxMembers: z.number().min(1).max(30).default(30),
});

type CreateCommunityFormData = z.infer<typeof createCommunitySchema>;

export default function CreateCommunity() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<CreateCommunityFormData>({
    resolver: zodResolver(createCommunitySchema),
    defaultValues: {
      name: "",
      description: "",
      maxMembers: 30,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateCommunityFormData) => {
      return await apiRequest("POST", "/api/communities", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-communities"] });
      toast({
        title: "Success!",
        description: "Community created successfully.",
      });
      setLocation("/communities");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to create community",
        description: error.message,
      });
    },
  });

  const onSubmit = (data: CreateCommunityFormData) => {
    createMutation.mutate(data);
  };

  return (
    <PageLayout>
      <PageHeader
        title="Create Community"
        subtitle="Start a new Tilawah community for group Quran recitation"
        icon={<Users className="w-5 h-5 text-white" />}
      />

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Community Details</CardTitle>
            <CardDescription>
              Create a community where members are automatically assigned a juz (1-30) to recite weekly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Community Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Masjid Al-Noor Weekly Tilawah"
                          data-testid="input-community-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe your community's goals and schedule..."
                          rows={4}
                          data-testid="input-community-description"
                        />
                      </FormControl>
                      <FormDescription>
                        Share details about your community's purpose and weekly schedule.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxMembers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Members</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min={1}
                          max={30}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          data-testid="input-max-members"
                        />
                      </FormControl>
                      <FormDescription>
                        Set the maximum number of members (1-30). Each member will be assigned a unique juz.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/communities")}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    data-testid="button-create-community"
                  >
                    {createMutation.isPending ? "Creating..." : "Create Community"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
