"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Target, Users, Zap, CheckCircle } from "lucide-react";
import Link from "next/link";

// Form validation schema
const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100, "Name too long"),
  description: z.string().optional(),
});

type CreateProjectForm = z.infer<typeof createProjectSchema>;

export default function NewProjectPage() {
  const router = useRouter();
  const params = useParams();
  const organizationId = params.id as string;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const form = useForm<CreateProjectForm>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Project key will be auto-generated from organization ticket prefix

  const onSubmit = async (data: CreateProjectForm) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/organizations/${organizationId}/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create project");
      }

      const project = await response.json();
      router.push(`/organizations/${organizationId}/projects/${project.id}`);
    } catch (error) {
      console.error("Error creating project:", error);
      setError(error instanceof Error ? error.message : "Failed to create project");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Link 
            href={`/organizations/${organizationId}`} 
            className="flex items-center text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Organization
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Create Project</h1>
        <p className="text-gray-400">Set up a new project to organize your team's work and track progress.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Project Details</CardTitle>
              <CardDescription className="text-gray-400">
                Enter the basic information for your project.
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
                        <FormLabel className="text-white">Project Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="My Awesome Project"
                            className="bg-gray-800 border-gray-700 text-white"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-gray-400">
                          A descriptive name for your project.
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
                            placeholder="A brief description of your project goals and scope..."
                            className="bg-gray-800 border-gray-700 text-white resize-none"
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-gray-400">
                          Help team members understand the project's purpose and goals.
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
                      {isLoading ? "Creating..." : "Create Project"}
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
                <Target className="h-5 w-5 mr-2" />
                What's Next?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <Users className="h-5 w-5 text-blue-400 mt-0.5" />
                <div>
                  <h4 className="text-white font-medium">Add Team Members</h4>
                  <p className="text-gray-400 text-sm">Invite your team to collaborate on this project</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                <div>
                  <h4 className="text-white font-medium">Create Your First Ticket</h4>
                  <p className="text-gray-400 text-sm">Start tracking work with tickets and tasks</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Zap className="h-5 w-5 text-purple-400 mt-0.5" />
                <div>
                  <h4 className="text-white font-medium">Plan Your First Sprint</h4>
                  <p className="text-gray-400 text-sm">Organize work into manageable sprints</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white text-sm">Project Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-400">Project Key:</span>
                  <p className="text-white mt-1">
                    Will use your organization's ticket prefix for consistency
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">Ticket Format:</span>
                  <p className="text-white mt-1 font-mono">
                    ORG-123, ORG-124, etc.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
