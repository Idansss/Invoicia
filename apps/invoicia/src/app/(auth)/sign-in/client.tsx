"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, CheckCircle2, Shield, Zap, Globe } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  twoFactorCode: z.string().trim().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function SignInClient() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/app";
  const routedError =
    params.get("error") === "2FA_REQUIRED_USE_PASSWORD"
      ? "Two-factor authentication is enabled for this account. Sign in with email, password, and authenticator code."
      : null;
  const [error, setError] = useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "", twoFactorCode: "" },
  });

  async function onSubmit(values: FormValues) {
    setError(null);
    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      twoFactorCode: values.twoFactorCode ?? "",
      redirect: false,
      callbackUrl,
    });
    if (result?.error) {
      if (result.error.includes("2FA_REQUIRED")) {
        setError("Two-factor code required. Enter your 6-digit authenticator code.");
        return;
      }
      if (result.error.includes("2FA_INVALID")) {
        setError("Invalid two-factor code. Try the latest code from your authenticator app.");
        return;
      }
      if (result.error.includes("2FA_NOT_CONFIGURED")) {
        setError("2FA is enabled but not fully configured. Contact support.");
        return;
      }
      setError("Invalid email or password.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-foreground text-background p-12">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">Invoicia</span>
          </Link>
        </div>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-balance">Invoicing that works as hard as you do.</h1>
            <p className="mt-3 text-base opacity-70 leading-relaxed">
              Create, send, and track professional invoices in seconds. Get paid faster with automated reminders and seamless payment integrations.
            </p>
          </div>
          <div className="space-y-4">
            {[
              { icon: Zap, text: "Create invoices in under 60 seconds" },
              { icon: Globe, text: "Multi-currency & international compliance" },
              { icon: Shield, text: "Bank-level security & data encryption" },
              { icon: CheckCircle2, text: "Automated payment reminders" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/20">
                  <item.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm opacity-80">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs opacity-50">
          <span>Trusted by 2,000+ businesses</span>
          <span>{"SOC 2 Compliant"}</span>
          <span>{"99.9% Uptime"}</span>
        </div>
      </div>

      <div className="flex w-full lg:w-1/2 items-center justify-center p-6">
        <Card className="w-full max-w-md border-0 shadow-none lg:border lg:shadow-sm">
          <CardHeader className="space-y-1 text-center">
            <div className="flex items-center justify-center gap-2 lg:hidden mb-4">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary">
                <FileText className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">Invoicia</span>
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">Welcome back</CardTitle>
            <CardDescription>Sign in to your account to continue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">continue with email</span>
              </div>
            </div>
            <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  className="h-11"
                  {...form.register("email")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="h-11"
                  {...form.register("password")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twoFactorCode">Authenticator code (if enabled)</Label>
                <Input
                  id="twoFactorCode"
                  inputMode="numeric"
                  placeholder="123456"
                  className="h-11"
                  {...form.register("twoFactorCode")}
                />
              </div>
              {error ?? routedError ? (
                <p className="text-sm text-red-600" role="alert">
                  {error ?? routedError}
                </p>
              ) : null}
              <Button className="w-full h-11 font-medium" type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground">
              {"Don't have an account? "}
              <Link href="/sign-up" className="font-medium text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
