"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, X, Plus, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { getInitials } from "@/lib/utils";
import { TicketType, Priority, Area, User, Project, Sprint } from "@/types";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

interface TicketFormProps {
  organizationId: string;
  projectId?: string;
  onSuccess?: (ticket: any) => void;
  onCancel?: () => void;
  isDialog?: boolean;
}

export default function TicketForm({
  organizationId,
  projectId,
  onSuccess,
  onCancel,
  isDialog = false,
}: TicketFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<TicketType>("TASK");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [area, setArea] = useState<Area>("DEVELOPMENT");
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || "");
  const [assigneeId, setAssigneeId] = useState("");
  const [sprintId, setSprintId] = useState("");
  const [storyPoints, setStoryPoints] = useState("");
  const [dueDate, setDueDate] = useState<Date>();

  useEffect(() => {
    fetchProjects();
    fetchMembers();
  }, [organizationId]);

  useEffect(() => {
    if (selectedProjectId) {
      fetchSprints(selectedProjectId);
    }
  }, [selectedProjectId]);

  const fetchProjects = async () => {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/projects`);
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/members`);
      if (response.ok) {
        const data = await response.json();
        // Extract user objects from OrganizationMember objects
        const users = data.map((member: any) => member.user);
        setMembers(users);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  };

  const fetchSprints = async (projectId: string) => {
    try {
      // Note: We'll need to create this endpoint later
      // const response = await fetch(`/api/organizations/${organizationId}/projects/${projectId}/sprints`);
      // if (response.ok) {
      //   const data = await response.json();
      //   setSprints(data);
      // }
      setSprints([]); // Placeholder for now
    } catch (error) {
      console.error("Error fetching sprints:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !type) {
      return;
    }

    setLoading(true);

    try {
      const endpoint = selectedProjectId
        ? `/api/organizations/${organizationId}/projects/${selectedProjectId}/tickets`
        : `/api/organizations/${organizationId}/tickets`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          type,
          priority,
          area,
          projectId: selectedProjectId && selectedProjectId !== "none" ? selectedProjectId : null,
          assigneeId: assigneeId && assigneeId !== "unassigned" ? assigneeId : null,
          sprintId: sprintId && sprintId !== "none" ? sprintId : null,
          storyPoints: storyPoints ? parseInt(storyPoints) : null,
          dueDate: dueDate?.toISOString() || null,
        }),
      });

      if (response.ok) {
        const ticket = await response.json();
        
        if (onSuccess) {
          onSuccess(ticket);
        } else {
          // Navigate to ticket detail
          const ticketUrl = selectedProjectId
            ? `/organizations/${organizationId}/projects/${selectedProjectId}/tickets/${ticket.id}`
            : `/organizations/${organizationId}/tickets/${ticket.id}`;
          router.push(ticketUrl);
        }
      } else {
        const error = await response.json();
        console.error("Error creating ticket:", error);
      }
    } catch (error) {
      console.error("Error creating ticket:", error);
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-white">
          Title *
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter ticket title..."
          className="bg-gray-800 border-gray-700 text-white"
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-white">
          Description
        </Label>
        <RichTextEditor
          content={description}
          onChange={setDescription}
          placeholder="Describe the ticket..."
          className="bg-gray-800 border-gray-700"
          projectMembers={members}
        />
      </div>

      {/* Type and Priority */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-white">Type *</Label>
          <Select value={type} onValueChange={(value: TicketType) => setType(value)}>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BUG">🐛 Bug</SelectItem>
              <SelectItem value="TASK">📋 Task</SelectItem>
              <SelectItem value="STORY">📖 Story</SelectItem>
              <SelectItem value="EPIC">🎯 Epic</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-white">Priority</Label>
          <Select value={priority} onValueChange={(value: Priority) => setPriority(value)}>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="HIGHEST">🔴 Highest</SelectItem>
              <SelectItem value="HIGH">🟠 High</SelectItem>
              <SelectItem value="MEDIUM">🟡 Medium</SelectItem>
              <SelectItem value="LOW">🟢 Low</SelectItem>
              <SelectItem value="LOWEST">⚪ Lowest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Project and Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {!projectId && (
          <div className="space-y-2">
            <Label className="text-white">Project</Label>
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Select project..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Project</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name} ({project.key})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-white">Area</Label>
          <Select value={area} onValueChange={(value: Area) => setArea(value)}>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DEVELOPMENT">💻 Development</SelectItem>
              <SelectItem value="DESIGN">🎨 Design</SelectItem>
              <SelectItem value="PRODUCT">📊 Product</SelectItem>
              <SelectItem value="RESEARCH">🔬 Research</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Assignee and Sprint */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-white">Assignee</Label>
          <Select value={assigneeId} onValueChange={setAssigneeId}>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Select assignee..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {members.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={member.avatarUrl || ""} />
                      <AvatarFallback className="text-xs">
                        {getInitials(member.name || "")}
                      </AvatarFallback>
                    </Avatar>
                    <span>{member.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-white">Sprint</Label>
          <Select value={sprintId} onValueChange={setSprintId}>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Select sprint..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Sprint</SelectItem>
              {sprints.map((sprint) => (
                <SelectItem key={sprint.id} value={sprint.id}>
                  {sprint.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Story Points and Due Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="storyPoints" className="text-white">
            Story Points
          </Label>
          <Input
            id="storyPoints"
            type="number"
            value={storyPoints}
            onChange={(e) => setStoryPoints(e.target.value)}
            placeholder="e.g., 3"
            min="1"
            max="100"
            className="bg-gray-800 border-gray-700 text-white"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-white">Due Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dueDate ? format(dueDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dueDate}
                onSelect={setDueDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-3 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={loading || !title.trim()}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Ticket
        </Button>
      </div>
    </form>
  );

  if (isDialog) {
    return formContent;
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">Create New Ticket</CardTitle>
      </CardHeader>
      <CardContent>{formContent}</CardContent>
    </Card>
  );
}
