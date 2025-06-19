"use client";

import { useParams, useRouter } from "next/navigation";
import ProjectLayout from "@/components/layout/project-layout";
import TicketForm from "@/components/tickets/ticket-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewTicketPage() {
  const params = useParams();
  const router = useRouter();
  const organizationId = params.id as string;
  const projectId = params.projectId as string;

  const handleSuccess = (ticket: any) => {
    // Navigate to the created ticket
    router.push(`/organizations/${organizationId}/projects/${projectId}/tickets/${ticket.id}`);
  };

  const handleCancel = () => {
    // Navigate back to project list
    router.push(`/organizations/${organizationId}/projects/${projectId}/list`);
  };

  return (
    <ProjectLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <Link href={`/organizations/${organizationId}/projects/${projectId}/list`}>
              <Button variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:bg-gray-800">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to List
              </Button>
            </Link>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Create New Ticket</h1>
            <p className="text-gray-400">
              Add a new ticket to track work, bugs, or features for this project.
            </p>
          </div>
        </div>

        {/* Ticket Form */}
        <TicketForm
          organizationId={organizationId}
          projectId={projectId}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </ProjectLayout>
  );
}
