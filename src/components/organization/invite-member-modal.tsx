"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { X, Mail, UserPlus, Shield, User } from "lucide-react";

// Form validation schema
const inviteMemberSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

type InviteMemberForm = z.infer<typeof inviteMemberSchema>;

interface InviteMemberModalProps {
  organizationId: string;
  organizationName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function InviteMemberModal({
  organizationId,
  organizationName,
  isOpen,
  onClose,
  onSuccess,
}: InviteMemberModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const form = useForm<InviteMemberForm>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      email: "",
      role: "MEMBER",
    },
  });

  const onSubmit = async (data: InviteMemberForm) => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/organizations/${organizationId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to invite member");
      }

      const result = await response.json();
      
      if (result.message) {
        // Invitation sent to new user
        setSuccess(`Invitation sent to ${data.email}`);
      } else {
        // Existing user added directly
        setSuccess(`${data.email} has been added to the organization`);
      }

      form.reset();
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error inviting member:", error);
      setError(error instanceof Error ? error.message : "Failed to invite member");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center">
                <UserPlus className="h-5 w-5 mr-2" />
                Invite Member
              </CardTitle>
              <CardDescription className="text-gray-400">
                Invite someone to join {organizationName}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-900/20 border border-green-800 rounded-lg">
              <p className="text-green-400 text-sm">{success}</p>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Email Address</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="colleague@company.com"
                        className="bg-gray-800 border-gray-700 text-white"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-gray-400">
                      Enter the email address of the person you want to invite.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Role</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => field.onChange("MEMBER")}
                          className={`p-3 rounded-lg border text-left transition-colors ${
                            field.value === "MEMBER"
                              ? "border-blue-500 bg-blue-900/20"
                              : "border-gray-700 bg-gray-800 hover:bg-gray-700"
                          }`}
                        >
                          <div className="flex items-center space-x-2 mb-1">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-white font-medium">Member</span>
                          </div>
                          <p className="text-xs text-gray-400">
                            Can view and work on tickets
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => field.onChange("ADMIN")}
                          className={`p-3 rounded-lg border text-left transition-colors ${
                            field.value === "ADMIN"
                              ? "border-blue-500 bg-blue-900/20"
                              : "border-gray-700 bg-gray-800 hover:bg-gray-700"
                          }`}
                        >
                          <div className="flex items-center space-x-2 mb-1">
                            <Shield className="h-4 w-4 text-blue-400" />
                            <span className="text-white font-medium">Admin</span>
                          </div>
                          <p className="text-xs text-gray-400">
                            Can manage members and settings
                          </p>
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isLoading ? "Sending..." : "Send Invitation"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>

          <div className="mt-6 p-3 bg-gray-800 rounded-lg">
            <div className="flex items-start space-x-2">
              <Mail className="h-4 w-4 text-blue-400 mt-0.5" />
              <div>
                <h4 className="text-white text-sm font-medium">How it works</h4>
                <p className="text-gray-400 text-xs mt-1">
                  If the person already has an account, they'll be added immediately. 
                  Otherwise, they'll receive an email invitation to join.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
