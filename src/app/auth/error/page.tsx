"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const errorMessages: Record<string, string> = {
  Configuration: "There is a problem with the server configuration.",
  AccessDenied: "You do not have permission to sign in.",
  Verification: "The verification token has expired or has already been used.",
  Default: "An error occurred during authentication.",
  CredentialsSignin: "Invalid email or password.",
  EmailCreateAccount: "Could not create account with this email.",
  EmailSignin: "Could not send email.",
  SessionRequired: "Please sign in to access this page.",
  Callback: "Error in callback handler.",
  OAuthAccountNotLinked: "This account is already linked to another user.",
  OAuthCallback: "Error in OAuth callback.",
  OAuthCreateAccount: "Could not create OAuth account.",
  OAuthSignin: "Error signing in with OAuth provider.",
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const errorMessage = error ? errorMessages[error] || errorMessages.Default : errorMessages.Default;

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <CardTitle className="text-2xl">Authentication Error</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-muted-foreground mb-4">
          {errorMessage}
        </p>
        {error && (
          <div className="rounded-md bg-muted p-3 mb-4">
            <p className="text-sm font-mono text-muted-foreground">
              Error code: {error}
            </p>
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          If this problem persists, please contact support.
        </p>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <Button asChild className="w-full">
          <Link href="/auth/signin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sign In
          </Link>
        </Button>
        <Button variant="outline" asChild className="w-full">
          <Link href="/">
            Go to Home
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
