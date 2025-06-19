"use client";

import ProjectLayout from "@/components/layout/project-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Kanban, Plus, Filter } from "lucide-react";

export default function ProjectBoardPage() {
  return (
    <ProjectLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Board</h2>
              <p className="text-gray-400">
                Visualize and manage your work with a Kanban board.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create Ticket
              </Button>
            </div>
          </div>
        </div>

        {/* Board Content */}
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-12 text-center">
            <Kanban className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Kanban Board Coming Soon</h3>
            <p className="text-gray-400 mb-6">
              The board view will provide a visual Kanban interface for managing ticket workflows.
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Ticket
            </Button>
          </CardContent>
        </Card>
      </div>
    </ProjectLayout>
  );
}
