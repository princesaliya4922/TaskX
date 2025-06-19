"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ProjectLayout from "@/components/layout/project-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Edit,
  Edit2,
  Check,
  X as XIcon,
  MessageSquare,
  Paperclip,
  Calendar,
  User,
  Target,
  Flag,
  Clock,
  Play,
  Eye,
  Pause,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { formatDate, formatDateTime, getInitials } from "@/lib/utils";
import { Ticket } from "@/types";
import { DatePicker } from "@/components/ui/date-picker";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { RichTextDisplay } from "@/components/ui/rich-text-display";

const statusIcons = {
  TODO: Clock,
  IN_PROGRESS: Play,
  IN_REVIEW: Eye,
  ON_HOLD: Pause,
  READY_TO_DEPLOY: CheckCircle,
  REVIEW_PROD: AlertCircle,
  DONE: CheckCircle,
};

const statusColors = {
  TODO: "bg-gray-500",
  IN_PROGRESS: "bg-blue-500",
  IN_REVIEW: "bg-yellow-500",
  ON_HOLD: "bg-orange-500",
  READY_TO_DEPLOY: "bg-purple-500",
  REVIEW_PROD: "bg-pink-500",
  DONE: "bg-green-500",
};

const typeColors = {
  BUG: "bg-red-500",
  TASK: "bg-blue-500",
  STORY: "bg-green-500",
  EPIC: "bg-purple-500",
};

const priorityColors = {
  HIGHEST: "bg-red-600",
  HIGH: "bg-red-500",
  MEDIUM: "bg-yellow-500",
  LOW: "bg-green-500",
  LOWEST: "bg-gray-500",
};

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const organizationId = params.id as string;
  const projectId = params.projectId as string;
  const ticketId = params.ticketId as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);

  // Editing states
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [editingStoryPoints, setEditingStoryPoints] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [descriptionValue, setDescriptionValue] = useState("");
  const [storyPointsValue, setStoryPointsValue] = useState("");
  const [projectMembers, setProjectMembers] = useState<Array<{
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
      avatarUrl?: string;
    };
  }>>([]);

  useEffect(() => {
    fetchTicket();
    fetchProjectMembers();
  }, [ticketId]);

  useEffect(() => {
    if (ticket) {
      setTitleValue(ticket.title);
      // Handle rich text content - if it's JSON, convert to HTML string, otherwise use as string
      if (ticket.description) {
        if (typeof ticket.description === 'string') {
          setDescriptionValue(ticket.description);
        } else {
          // If it's stored as JSON, it might be HTML content
          setDescriptionValue(JSON.stringify(ticket.description));
        }
      } else {
        setDescriptionValue('');
      }
      setStoryPointsValue(ticket.storyPoints?.toString() || '');
    }
  }, [ticket]);

  const fetchTicket = async () => {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/projects/${projectId}/tickets/${ticketId}`);
      if (response.ok) {
        const data = await response.json();
        setTicket(data);
      } else {
        console.error("Failed to fetch ticket");
      }
    } catch (error) {
      console.error("Error fetching ticket:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectMembers = async () => {
    if (!projectId) return;
    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/projects/${projectId}/members`
      );
      if (response.ok) {
        const membersData = await response.json();
        setProjectMembers(membersData);
      }
    } catch (error) {
      console.error("Error fetching project members:", error);
    }
  };

  const handleUpdateTicket = async (updates: Partial<Ticket>) => {
    if (!ticket) return;

    // Optimistically update the UI immediately
    const optimisticTicket = { ...ticket, ...updates };
    setTicket(optimisticTicket);

    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/projects/${projectId}/tickets/${ticketId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updates),
        }
      );

      if (response.ok) {
        const updatedTicket = await response.json();
        setTicket(updatedTicket);
      } else {
        // Revert on error
        setTicket(ticket);
        console.error("Failed to update ticket");
      }
    } catch (error) {
      // Revert on error
      setTicket(ticket);
      console.error("Error updating ticket:", error);
    }
  };

  const handleTitleSave = () => {
    if (titleValue.trim() !== ticket?.title) {
      handleUpdateTicket({ title: titleValue.trim() });
    }
    setEditingTitle(false);
  };

  const handleDescriptionSave = () => {
    if (descriptionValue !== ticket?.description) {
      handleUpdateTicket({ description: descriptionValue });
    }
    setEditingDescription(false);
  };

  const handleStoryPointsSave = () => {
    const points = storyPointsValue.trim();
    const numericPoints = points ? parseInt(points, 10) : null;
    if (points === "" || (!isNaN(numericPoints!) && numericPoints! >= 0)) {
      handleUpdateTicket({ storyPoints: numericPoints });
    }
    setEditingStoryPoints(false);
  };

  const handleStatusChange = (newStatus: string) => {
    handleUpdateTicket({ status: newStatus as any });
  };

  const handleTypeChange = (newType: string) => {
    handleUpdateTicket({ type: newType as any });
  };

  const handlePriorityChange = (newPriority: string) => {
    handleUpdateTicket({ priority: newPriority as any });
  };

  const handleAssigneeChange = (newAssigneeId: string) => {
    const assigneeId = newAssigneeId === "unassigned" ? null : newAssigneeId;
    handleUpdateTicket({ assigneeId });
  };

  if (loading) {
    return (
      <ProjectLayout>
        <div className="p-6">
          <div className="text-white">Loading ticket...</div>
        </div>
      </ProjectLayout>
    );
  }

  if (!ticket) {
    return (
      <ProjectLayout>
        <div className="p-6">
          <div className="text-white">Ticket not found</div>
        </div>
      </ProjectLayout>
    );
  }

  const StatusIcon = statusIcons[ticket.status];

  return (
    <ProjectLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
              onClick={() => {
                // Try to go back, but fallback to backlog if no history
                if (window.history.length > 1) {
                  router.back();
                } else {
                  router.push(`/organizations/${organizationId}/projects/${projectId}/backlog`);
                }
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-blue-400 font-mono text-lg">{ticket.ticketId}</span>

                {/* Type */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Badge className={`${typeColors[ticket.type]} text-white cursor-pointer hover:opacity-80 transition-opacity`}>
                      {ticket.type}
                    </Badge>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="bg-gray-800 border-gray-700 min-w-[120px]"
                    align="start"
                    sideOffset={4}
                  >
                    {Object.keys(typeColors).map((type) => (
                      <DropdownMenuItem
                        key={type}
                        onClick={() => handleTypeChange(type)}
                        className="text-gray-300 hover:bg-gray-700 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded ${typeColors[type as keyof typeof typeColors]}`} />
                          <span>{type}</span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Status */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Badge className={`${statusColors[ticket.status]} text-white cursor-pointer hover:opacity-80 transition-opacity`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {ticket.status.replace("_", " ")}
                    </Badge>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="bg-gray-800 border-gray-700 min-w-[160px]"
                    align="start"
                    sideOffset={4}
                  >
                    {Object.keys(statusColors).map((status) => (
                      <DropdownMenuItem
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        className="text-gray-300 hover:bg-gray-700 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded ${statusColors[status as keyof typeof statusColors]}`} />
                          <span>{status.replace("_", " ")}</span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Priority */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Badge className={`${priorityColors[ticket.priority]} text-white cursor-pointer hover:opacity-80 transition-opacity`}>
                      {ticket.priority}
                    </Badge>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="bg-gray-800 border-gray-700 min-w-[120px]"
                    align="start"
                    sideOffset={4}
                  >
                    {Object.keys(priorityColors).map((priority) => (
                      <DropdownMenuItem
                        key={priority}
                        onClick={() => handlePriorityChange(priority)}
                        className="text-gray-300 hover:bg-gray-700 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded ${priorityColors[priority as keyof typeof priorityColors]}`} />
                          <span>{priority}</span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Title */}
              <div className="group mb-2">
                {editingTitle ? (
                  <div className="flex items-center space-x-2">
                    <Input
                      value={titleValue}
                      onChange={(e) => setTitleValue(e.target.value)}
                      onBlur={handleTitleSave}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleTitleSave();
                        if (e.key === 'Escape') {
                          setTitleValue(ticket.title);
                          setEditingTitle(false);
                        }
                      }}
                      className="flex-1 bg-gray-800 border-gray-700 text-white text-3xl font-bold"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleTitleSave}
                      className="text-green-400 hover:text-green-300"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setTitleValue(ticket.title);
                        setEditingTitle(false);
                      }}
                      className="text-red-400 hover:text-red-300"
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="flex items-center space-x-2 cursor-pointer hover:bg-gray-800 rounded p-2 -m-2"
                    onClick={() => setEditingTitle(true)}
                  >
                    <h1 className="text-3xl font-bold text-white flex-1">
                      {ticket.title}
                    </h1>
                    <Edit2 className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="group">
                  {editingDescription ? (
                    <div className="space-y-3">
                      <RichTextEditor
                        content={descriptionValue}
                        onChange={setDescriptionValue}
                        placeholder="Add a description..."
                        className="bg-gray-800 border-gray-700"
                        projectMembers={projectMembers}
                      />
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          onClick={handleDescriptionSave}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            // Reset to original value
                            if (ticket.description) {
                              if (typeof ticket.description === 'string') {
                                setDescriptionValue(ticket.description);
                              } else {
                                setDescriptionValue(JSON.stringify(ticket.description));
                              }
                            } else {
                              setDescriptionValue('');
                            }
                            setEditingDescription(false);
                          }}
                          className="text-gray-400 hover:text-gray-300"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="cursor-pointer hover:bg-gray-800 rounded p-3 -m-3 group min-h-[100px] flex items-start"
                      onClick={() => setEditingDescription(true)}
                    >
                      <div className="flex-1">
                        {ticket.description ? (
                          <RichTextDisplay
                            content={typeof ticket.description === 'string' ? ticket.description : JSON.stringify(ticket.description)}
                            className="text-gray-300"
                          />
                        ) : (
                          <div className="text-gray-500 italic">
                            Click to add a description...
                          </div>
                        )}
                      </div>
                      <Edit2 className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2 mt-1" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Comments */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Comments ({ticket._count?.comments || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ticket.comments && ticket.comments.length > 0 ? (
                  <div className="space-y-4">
                    {ticket.comments.map((comment) => (
                      <div key={comment.id} className="flex space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={comment.author.avatarUrl || ""} />
                          <AvatarFallback className="text-xs">
                            {getInitials(comment.author.name || "")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-white font-medium">{comment.author.name}</span>
                            <span className="text-gray-400 text-sm">
                              {formatDateTime(comment.createdAt)}
                            </span>
                          </div>
                          <div className="text-gray-300">
                            {typeof comment.content === 'string' 
                              ? comment.content 
                              : JSON.stringify(comment.content, null, 2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-center py-8">
                    No comments yet. Be the first to comment!
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Details */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Assignee */}
                <div>
                  <div className="text-gray-400 text-sm mb-1">Assignee</div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="cursor-pointer hover:bg-gray-700 rounded px-2 py-1 -mx-2 transition-colors min-h-[32px] flex items-center">
                        {ticket.assignee ? (
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={ticket.assignee.avatarUrl || ""} />
                              <AvatarFallback className="text-xs">
                                {getInitials(ticket.assignee.name || "")}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-white">{ticket.assignee.name}</span>
                          </div>
                        ) : (
                          <span className="text-gray-500">Unassigned</span>
                        )}
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="bg-gray-800 border-gray-700 min-w-[200px]"
                      align="start"
                      sideOffset={4}
                    >
                      <DropdownMenuItem
                        onClick={() => handleAssigneeChange("unassigned")}
                        className="text-gray-300 hover:bg-gray-700 cursor-pointer transition-colors"
                      >
                        <span className="text-gray-500">Unassigned</span>
                      </DropdownMenuItem>
                      {projectMembers.map((member) => (
                        <DropdownMenuItem
                          key={member.user.id}
                          onClick={() => handleAssigneeChange(member.user.id)}
                          className="text-gray-300 hover:bg-gray-700 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={member.user.avatarUrl || ""} />
                              <AvatarFallback className="text-xs bg-gray-700 text-gray-300">
                                {getInitials(member.user.name || "")}
                              </AvatarFallback>
                            </Avatar>
                            <span>{member.user.name}</span>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <Separator className="bg-gray-800" />

                {/* Reporter */}
                <div>
                  <div className="text-gray-400 text-sm mb-1">Reporter</div>
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={ticket.reporter.avatarUrl || ""} />
                      <AvatarFallback className="text-xs">
                        {getInitials(ticket.reporter.name || "")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-white">{ticket.reporter.name}</span>
                  </div>
                </div>

                <Separator className="bg-gray-800" />

                {/* Sprint */}
                <div>
                  <div className="text-gray-400 text-sm mb-1">Sprint</div>
                  {ticket.sprint ? (
                    <span className="text-white">{ticket.sprint.name}</span>
                  ) : (
                    <span className="text-gray-500">No sprint</span>
                  )}
                </div>

                <Separator className="bg-gray-800" />

                {/* Story Points */}
                <div>
                  <div className="text-gray-400 text-sm mb-1">Story Points</div>
                  <div className="group">
                    {editingStoryPoints ? (
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          value={storyPointsValue}
                          onChange={(e) => setStoryPointsValue(e.target.value)}
                          onBlur={handleStoryPointsSave}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleStoryPointsSave();
                            if (e.key === 'Escape') {
                              setStoryPointsValue(ticket.storyPoints?.toString() || '');
                              setEditingStoryPoints(false);
                            }
                          }}
                          className="bg-gray-800 border-gray-700 text-white text-sm w-20"
                          placeholder="Story Points"
                          min="0"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleStoryPointsSave}
                          className="text-green-400 hover:text-green-300 p-1"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <span
                        className="text-white cursor-pointer hover:bg-gray-700 rounded px-2 py-1 -mx-2 inline-block"
                        onClick={() => setEditingStoryPoints(true)}
                      >
                        {ticket.storyPoints || "None"}
                      </span>
                    )}
                  </div>
                </div>

                <Separator className="bg-gray-800" />

                {/* Due Date */}
                <div>
                  <div className="text-gray-400 text-sm mb-1">Due Date</div>
                  <DatePicker
                    date={ticket.dueDate ? new Date(ticket.dueDate) : null}
                    onDateChange={(date) => handleUpdateTicket({ dueDate: date })}
                    placeholder="Set due date"
                    variant="compact"
                    className="w-full justify-start"
                  />
                </div>

                <Separator className="bg-gray-800" />

                {/* Area */}
                <div>
                  <div className="text-gray-400 text-sm mb-1">Area</div>
                  <span className="text-white">{ticket.area}</span>
                </div>

                <Separator className="bg-gray-800" />

                {/* Created */}
                <div>
                  <div className="text-gray-400 text-sm mb-1">Created</div>
                  <span className="text-white">{formatDateTime(ticket.createdAt)}</span>
                </div>

                {/* Updated */}
                <div>
                  <div className="text-gray-400 text-sm mb-1">Updated</div>
                  <span className="text-white">{formatDateTime(ticket.updatedAt)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Activity */}
            {ticket._count && (ticket._count.comments > 0 || ticket._count.attachments > 0) && (
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {ticket._count.comments > 0 && (
                    <div className="flex items-center space-x-2 text-gray-300">
                      <MessageSquare className="h-4 w-4" />
                      <span>{ticket._count.comments} comment{ticket._count.comments !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {ticket._count.attachments > 0 && (
                    <div className="flex items-center space-x-2 text-gray-300">
                      <Paperclip className="h-4 w-4" />
                      <span>{ticket._count.attachments} attachment{ticket._count.attachments !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ProjectLayout>
  );
}
