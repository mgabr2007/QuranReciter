import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { BookOpen } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/i18n/LanguageContext";

export default function Signup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();

  const signupSchema = z.object({
    username: z.string().min(3, t("usernameMinLength")),
    email: z.string().email(t("invalidEmail")).optional().or(z.literal("")),
    displayName: z.string().min(2, t("displayNameMinLength")),
    password: z.string().min(6, t("passwordMinLength")),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t("passwordsDontMatch"),
    path: ["confirmPassword"],
  });

  type SignupFormData = z.infer<typeof signupSchema>;

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: "",
      email: "",
      displayName: "",
      password: "",
      confirmPassword: "",
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: SignupFormData) => {
      const { confirmPassword, ...signupData } = data;
      return await apiRequest("POST", "/api/auth/signup", signupData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: t("welcome"),
        description: t("accountCreatedSuccess"),
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: t("signupFailed"),
        description: error.message || t("unableToCreateAccount"),
      });
    },
  });

  const onSubmit = (data: SignupFormData) => {
    signupMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">{t("joinTilawah")}</CardTitle>
            <CardDescription className="text-base mt-2">
              {t("startQuranJourney")}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("username")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("chooseUsername")}
                        autoComplete="username"
                        data-testid="input-username"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("displayName")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("yourName")}
                        autoComplete="name"
                        data-testid="input-displayname"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("emailOptional")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder={t("yourEmail")}
                        autoComplete="email"
                        data-testid="input-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("password")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder={t("createPassword")}
                        autoComplete="new-password"
                        data-testid="input-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("confirmPassword")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder={t("confirmYourPassword")}
                        autoComplete="new-password"
                        data-testid="input-confirm-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={signupMutation.isPending}
                data-testid="button-signup"
              >
                {signupMutation.isPending ? t("creatingAccount") : t("createAccount")}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                {t("alreadyHaveAccount")}{" "}
                <Link href="/login" className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium" data-testid="link-login">
                  {t("signIn")}
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
