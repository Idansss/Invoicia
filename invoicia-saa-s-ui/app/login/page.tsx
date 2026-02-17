"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { FileText, CheckCircle2, Shield, Zap, Globe } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [oauthLoading, setOauthLoading] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleGoogleSignIn = async () => {
    setOauthLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      
      if (error) throw error
      // Redirect will happen automatically
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to sign in with Google")
      setOauthLoading(false)
    }
  }

  const handleEmailSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    
    if (!email.trim()) {
      toast.error("Email is required")
      return
    }
    if (!email.includes("@")) {
      toast.error("Please enter a valid email address")
      return
    }
    if (!password) {
      toast.error("Password is required")
      return
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    setEmailLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) throw error

      toast.success("Signed in successfully")
      router.push("/app")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to sign in")
    } finally {
      setEmailLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
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

      {/* Right panel */}
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
            <Button variant="outline" className="w-full h-11 font-medium bg-transparent" onClick={handleGoogleSignIn} disabled={oauthLoading} type="button">
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              {oauthLoading ? "Connecting..." : "Continue with Google"}
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or continue with email</span>
              </div>
            </div>
            <form className="space-y-3" onSubmit={handleEmailSignIn}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@company.com" 
                  className="h-11"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={emailLoading}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="#" className="text-xs text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Enter your password" 
                  className="h-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={emailLoading}
                />
              </div>
              <Button className="w-full h-11 font-medium" type="submit" disabled={emailLoading}>
                {emailLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground">
              {"Don't have an account? "}
              <Link href="/signup" className="font-medium text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
