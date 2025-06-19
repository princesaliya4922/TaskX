"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Github, Mail, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type SignInFormData = z.infer<typeof signInSchema>;

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignInFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        // Refresh session and redirect
        await getSession();
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (error) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: string) => {
    setIsLoading(true);
    setError("");

    try {
      console.log(`Attempting ${provider} OAuth sign-in...`);

      // For OAuth, we want to redirect immediately
      const result = await signIn(provider, {
        callbackUrl,
        redirect: true // Let NextAuth handle the redirect
      });

      // This code might not execute if redirect is successful
      if (result?.error) {
        console.error(`OAuth error:`, result.error);
        setError(`Failed to sign in with ${provider}. Please try again.`);
      }
    } catch (error) {
      console.error("OAuth sign-in error:", error);
      setError(`Unable to connect to ${provider}. Please try again or use email/password.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full animate-fade-in">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-500 rounded-3xl blur-xl opacity-20"></div>
        <Card className="professional-card shadow-2xl border-2 border-purple-100 dark:border-purple-900/50">
          <CardHeader className="space-y-3 text-center pb-10">
            <CardTitle className="text-4xl font-bold text-high-contrast">Welcome back</CardTitle>
            <CardDescription className="text-medium-contrast text-xl font-medium">
              Sign in to your TrackX account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                  <p className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</p>
                </div>
              </div>
            )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      {...field}
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
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full btn-professional text-lg py-6"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="spinner w-5 h-5 border-2 border-white/30 border-t-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                "Sign in to TrackX"
              )}
            </Button>
          </form>
        </Form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-200 dark:border-slate-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white dark:bg-slate-800 px-4 text-slate-500 dark:text-slate-400 font-medium">
              Or continue with
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {/* Google OAuth */}
          <Button
            variant="outline"
            onClick={() => handleOAuthSignIn("google")}
            disabled={isLoading}
            className="w-full py-6 professional-card border-2 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300"
          >
            <Mail className="mr-2 h-5 w-5 text-red-500" />
            <span className="font-semibold text-high-contrast">Continue with Google</span>
          </Button>
        </div>

        {/* Demo Account Info */}
        <div className="professional-card border-2 border-blue-100 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-900/10">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center mr-3 shadow-lg">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd"/>
              </svg>
            </div>
            <h4 className="font-bold text-high-contrast text-lg">Demo Accounts</h4>
          </div>
          <div className="space-y-3">
            <div className="bg-white/70 dark:bg-slate-800/70 rounded-xl p-3 border border-blue-200 dark:border-blue-800">
              <div className="text-sm space-y-2">
                <div>
                  <div className="font-semibold text-high-contrast">Admin:</div>
                  <div className="font-mono text-blue-600 dark:text-blue-400 text-xs">john@example.com</div>
                </div>
                <div>
                  <div className="font-semibold text-high-contrast">Member:</div>
                  <div className="font-mono text-blue-600 dark:text-blue-400 text-xs">jane@example.com</div>
                </div>
              </div>
            </div>
            <div className="bg-white/70 dark:bg-slate-800/70 rounded-xl p-3 border border-blue-200 dark:border-blue-800 text-center">
              <div className="text-sm">
                <div className="font-semibold text-high-contrast mb-1">Password:</div>
                <div className="font-mono text-blue-600 dark:text-blue-400 font-bold">password123</div>
              </div>
            </div>
          </div>
        </div>


          </CardContent>
          <CardFooter className="pt-6">
            <div className="w-full text-center">
              <p className="text-slate-600 dark:text-slate-300">
                Don't have an account?{" "}
                <Link
                  href="/auth/signup"
                  className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  Create one now
                </Link>
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
