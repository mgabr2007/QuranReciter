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
import { Breadcrumb } from "@/components/breadcrumb";
import { useLanguage } from "@/i18n/LanguageContext";

export default function CreateCommunity() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();

  const createCommunitySchema = z.object({
    name: z.string().min(3, t("communityNameMinLength")),
    description: z.string().optional(),
    maxMembers: z.number().min(1).max(30).default(30),
  });

  type CreateCommunityFormData = z.infer<typeof createCommunitySchema>;

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
        title: t("success"),
        description: t("communityCreatedSuccess"),
      });
      setLocation("/communities");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: t("failedToCreateCommunity"),
        description: error.message,
      });
    },
  });

  const onSubmit = (data: CreateCommunityFormData) => {
    createMutation.mutate(data);
  };

  return (
    <PageLayout>
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Breadcrumb items={[
          { label: t("dashboard"), href: "/" },
          { label: t("communities"), href: "/communities" },
          { label: t("createCommunity") }
        ]} />

        <PageHeader
          title={t("createCommunity")}
          subtitle={t("createCommunitySubtitle")}
          icon={<Users className="w-5 h-5 text-white" />}
        />

        <div className="max-w-2xl mx-auto mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("communityDetails")}</CardTitle>
              <CardDescription>
                {t("communityDetailsDesc")}
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
                        <FormLabel>{t("communityName")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={t("communityNamePlaceholder")}
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
                        <FormLabel>{t("descriptionOptional")}</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder={t("descriptionPlaceholder")}
                            rows={4}
                            data-testid="input-community-description"
                          />
                        </FormControl>
                        <FormDescription>
                          {t("descriptionHelp")}
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
                        <FormLabel>{t("maximumMembers")}</FormLabel>
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
                          {t("maximumMembersHelp")}
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
                      {t("cancel")}
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending}
                      data-testid="button-create-community"
                    >
                      {createMutation.isPending ? t("creating") : t("createCommunity")}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}
