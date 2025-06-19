"use client";

import ProjectLayout from "@/components/layout/project-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Kanban, Plus, Filter } from "lucide-react";

export default function ProjectBoardPage() {
  return (
    <ProjectLayout>
      <div className="p-6" style={{ backgroundColor: '#0c0c0c', minHeight: '100vh' }}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#b6c2cf' }}>Board</h2>
              <p style={{ color: '#8993a4' }}>
                Visualize and manage your work with a Kanban board.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                style={{
                  borderColor: '#2c2c34',
                  color: '#8993a4',
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1d1d20';
                  e.currentTarget.style.color = '#b6c2cf';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#8993a4';
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button
                style={{ backgroundColor: '#579dff', color: '#b6c2cf' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#85b8ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#579dff';
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Ticket
              </Button>
            </div>
          </div>
        </div>

        {/* Board Content */}
        <Card style={{ backgroundColor: '#161618', borderColor: '#2c2c34' }}>
          <CardContent className="p-12 text-center">
            <Kanban className="h-16 w-16 mx-auto mb-4" style={{ color: '#6b778c' }} />
            <h3 className="text-xl font-semibold mb-2" style={{ color: '#b6c2cf' }}>Kanban Board Coming Soon</h3>
            <p className="mb-6" style={{ color: '#8993a4' }}>
              The board view will provide a visual Kanban interface for managing ticket workflows.
            </p>
            <Button
              style={{ backgroundColor: '#579dff', color: '#b6c2cf' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#85b8ff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#579dff';
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Ticket
            </Button>
          </CardContent>
        </Card>
      </div>
    </ProjectLayout>
  );
}
