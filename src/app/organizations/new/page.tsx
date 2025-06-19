"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Building2, Users, Zap } from "lucide-react";
import Link from "next/link";

// Form validation schema
const createOrganizationSchema = z.object({
  name: z.string().min(1, "Organization name is required").max(100, "Name too long"),
  description: z.string().optional(),
  ticketPrefix: z.string()
    .min(2, "Ticket prefix must be at least 2 characters")
    .max(5, "Ticket prefix must be at most 5 characters")
    .regex(/^[A-Z]+$/, "Ticket prefix must contain only uppercase letters"),
});

type CreateOrganizationForm = z.infer<typeof createOrganizationSchema>;

export default function NewOrganizationPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const form = useForm<CreateOrganizationForm>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: "",
      description: "",
      ticketPrefix: "",
    },
  });

  // Auto-generate ticket prefix from organization name
  const watchedName = form.watch("name");
  const generateTicketPrefix = (name: string) => {
    return name
      .toUpperCase()
      .replace(/[^A-Z\s]/g, "")
      .split(" ")
      .map(word => word.charAt(0))
      .join("")
      .slice(0, 5);
  };

  // Update ticket prefix when name changes
  const handleNameChange = (value: string) => {
    form.setValue("name", value);
    if (value && !form.getValues("ticketPrefix")) {
      const prefix = generateTicketPrefix(value);
      form.setValue("ticketPrefix", prefix);
    }
  };

  const onSubmit = async (data: CreateOrganizationForm) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create organization");
      }

      const organization = await response.json();
      router.push(`/organizations/${organization.id}`);
    } catch (error) {
      console.error("Error creating organization:", error);
      setError(error instanceof Error ? error.message : "Failed to create organization");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center h-16">
            <Link href="/dashboard" className="flex items-center text-gray-400 hover:text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create Organization</h1>
          <p className="text-gray-400">Set up a new organization to manage your team and projects.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Organization Details</CardTitle>
                <CardDescription className="text-gray-400">
                  Enter the basic information for your organization.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Organization Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Acme Corporation"
                              className="bg-gray-800 border-gray-700 text-white"
                              {...field}
                              onChange={(e) => handleNameChange(e.target.value)}
                            />
                          </FormControl>
                          <FormDescription className="text-gray-400">
                            The name of your organization or company.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ticketPrefix"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Ticket Prefix</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="ACME"
                              className="bg-gray-800 border-gray-700 text-white uppercase"
                              maxLength={5}
                              {...field}
                              onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                            />
                          </FormControl>
                          <FormDescription className="text-gray-400">
                            A short prefix for your tickets (e.g., ACME-123). 2-5 uppercase letters only.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="A brief description of your organization..."
                              className="bg-gray-800 border-gray-700 text-white resize-none"
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-gray-400">
                            Help team members understand what your organization does.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-4 pt-4">
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {isLoading ? "Creating..." : "Create Organization"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        className="border-gray-700 text-gray-300 hover:bg-gray-800"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Building2 className="h-5 w-5 mr-2" />
                  What's Next?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Users className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="text-white font-medium">Invite Team Members</h4>
                    <p className="text-gray-400 text-sm">Add your team to start collaborating</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Zap className="h-5 w-5 text-green-400 mt-0.5" />
                  <div>
                    <h4 className="text-white font-medium">Create Projects</h4>
                    <p className="text-gray-400 text-sm">Set up projects and start tracking tasks</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white text-sm">Ticket Prefix Examples</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Acme Corp</span>
                    <span className="text-white font-mono">ACME</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tech Startup</span>
                    <span className="text-white font-mono">TECH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Design Studio</span>
                    <span className="text-white font-mono">DS</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
