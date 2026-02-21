"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordAction } from "./actions";
import { PasswordStrength } from "@/components/ui/password-strength";

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const result = await resetPasswordAction({ token, password });
      if (!result.ok) {
        setError(result.error ?? "Something went wrong.");
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/sign-in"), 2500);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <p className="text-sm text-destructive text-center">
        Invalid or missing reset token.{" "}
        <Link href="/forgot-password" className="font-medium text-primary hover:underline">
          Request a new link
        </Link>
        .
      </p>
    );
  }

  return (
    <>
      {done ? (
        <div className="rounded-lg bg-muted p-4 text-center space-y-2">
          <p className="text-sm font-medium text-foreground">Password updated</p>
          <p className="text-sm text-muted-foreground">Redirecting you to sign in…</p>
        </div>
      ) : (
        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              placeholder="At least 8 characters"
              className="h-11"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <PasswordStrength password={password} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input
              id="confirm"
              type="password"
              placeholder="Repeat your new password"
              className="h-11"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">{error}</p>
          ) : null}
          <Button className="w-full h-11 font-medium" type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update password"}
          </Button>
        </form>
      )}
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/sign-in" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">Invoicia</span>
          </div>
          <CardTitle className="text-2xl font-bold">Set new password</CardTitle>
          <CardDescription>Enter and confirm your new password below.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Suspense fallback={null}>
            <ResetPasswordForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
