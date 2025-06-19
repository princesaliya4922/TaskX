"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ProjectLayout from "@/components/layout/project-layout";
import SprintBacklogView from "@/components/tickets/sprint-backlog-view";
import TicketForm from "@/components/tickets/ticket-form";

export default function ProjectBacklogPage() {
  const params = useParams();
  const organizationId = params.id as string;
  const projectId = params.projectId as string;
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCreateTicket = () => {
    setShowCreateDialog(true);
  };

  const handleTicketCreated = () => {
    setShowCreateDialog(false);
    // Trigger refresh of the ticket list
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <ProjectLayout>
      <div className="bg-gray-950 min-h-full">
        <SprintBacklogView
          organizationId={organizationId}
          projectId={projectId}
          onCreateTicket={handleCreateTicket}
          refreshTrigger={refreshTrigger}
        />

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl bg-gray-900 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Ticket</DialogTitle>
            </DialogHeader>
            <TicketForm
              organizationId={organizationId}
              projectId={projectId}
              onSuccess={handleTicketCreated}
              onCancel={() => setShowCreateDialog(false)}
              isDialog={true}
            />
          </DialogContent>
        </Dialog>
      </div>
    </ProjectLayout>
  );
}
