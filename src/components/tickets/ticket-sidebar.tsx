"use client";

import { useState, useEffect, useRef } from "react";
import { X, Calendar, User, Tag, Clock, MessageSquare, Paperclip, Activity, GripVertical, Edit2, Check, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { formatDate, getInitials } from "@/lib/utils";
import { Ticket } from "@/types";
import { DatePicker } from "@/components/ui/date-picker";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { RichTextDisplay } from "@/components/ui/rich-text-display";

interface TicketSidebarProps {
  ticketId: string;
  organizationId: string;
  projectId?: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTicket?: (ticketId: string, updates: Partial<Ticket>) => void;
  width?: number;
  onWidthChange?: (width: number) => void;
}

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

export default function TicketSidebar({
  ticketId,
  organizationId,
  projectId,
  isOpen,
  onClose,
  onUpdateTicket,
  width = 400,
  onWidthChange,
}: TicketSidebarProps) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

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
    if (isOpen && ticketId) {
      fetchTicketDetails();
      fetchProjectMembers();
    }
  }, [isOpen, ticketId]);

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

  // Handle resize functionality
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !onWidthChange) return;

      const newWidth = window.innerWidth - e.clientX;
      const minWidth = 300;
      const maxWidth = window.innerWidth * 0.7;

      if (newWidth >= minWidth && newWidth <= maxWidth) {
        onWidthChange(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, onWidthChange]);

  const handleResizeStart = () => {
    setIsResizing(true);
  };

  const fetchTicketDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/organizations/${organizationId}/projects/${projectId}/tickets/${ticketId}`
      );
      if (response.ok) {
        const ticketData = await response.json();
        setTicket(ticketData);
      }
    } catch (error) {
      console.error("Error fetching ticket details:", error);
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
    onUpdateTicket?.(ticketId, updates);

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

  const handleAddComment = async () => {
    if (!newComment.trim() || !ticket) return;

    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/tickets/${ticketId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: newComment,
          }),
        }
      );

      if (response.ok) {
        setNewComment("");
        fetchTicketDetails(); // Refresh to get new comment
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={sidebarRef}
      className="fixed top-0 right-0 h-full bg-gray-900 border-l border-gray-800 flex flex-col z-40 shadow-2xl overflow-hidden"
      style={{
        width: `${width}px`,
        maxWidth: '80vw',
        minWidth: '320px'
      }}
    >
      {/* Resize Handle */}
      <div
        className="absolute left-0 top-0 w-2 h-full cursor-col-resize hover:bg-blue-500/20 transition-colors group border-r border-transparent hover:border-blue-500/50"
        onMouseDown={handleResizeStart}
      >
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex flex-col space-y-1">
            <div className="w-0.5 h-4 bg-gray-500 rounded"></div>
            <div className="w-0.5 h-4 bg-gray-500 rounded"></div>
            <div className="w-0.5 h-4 bg-gray-500 rounded"></div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900/50">
        <div className="flex items-center space-x-2">
          {ticket && (
            <>
              <Badge className={`${typeColors[ticket.type]} text-white text-xs font-medium`}>
                {ticket.type}
              </Badge>
              <span className="text-blue-400 font-mono text-sm font-medium">
                {ticket.ticketId}
              </span>
            </>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-gray-400 hover:text-white hover:bg-gray-800 rounded-md"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-400">
            Loading ticket details...
          </div>
        ) : ticket ? (
          <div className="p-3 space-y-3">
              {/* Title */}
              <div className="group">
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
                      className="flex-1 bg-gray-800 border-gray-700 text-white text-lg font-semibold"
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
                    <h2 className="text-lg font-semibold text-white flex-1">
                      {ticket.title}
                    </h2>
                    <Edit2 className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="group">
                <div className="mb-2">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Description</h3>
                </div>
                {editingDescription ? (
                  <div className="space-y-2">
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
                    className="cursor-pointer hover:bg-gray-800 rounded p-3 border border-gray-700 group min-h-[60px] relative"
                    onClick={() => setEditingDescription(true)}
                  >
                    {ticket.description ? (
                      <RichTextDisplay
                        content={typeof ticket.description === 'string' ? ticket.description : JSON.stringify(ticket.description)}
                        className="text-sm text-gray-300"
                      />
                    ) : (
                      <div className="text-sm text-gray-500 italic">
                        Add a description...
                      </div>
                    )}
                    <Edit2 className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2" />
                  </div>
                )}
              </div>

              {/* Status, Type, and Priority */}
              <div className="flex items-center space-x-2 flex-wrap">
                {/* Status */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Badge className={`${statusColors[ticket.status]} text-white text-xs cursor-pointer hover:opacity-80 transition-opacity`}>
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

                {/* Type */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Badge className={`${typeColors[ticket.type]} text-white text-xs cursor-pointer hover:opacity-80 transition-opacity`}>
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

                {/* Priority */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Badge className={`${priorityColors[ticket.priority]} text-white text-xs cursor-pointer hover:opacity-80 transition-opacity`}>
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

              {/* Details */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader className="pb-2 pt-3">
                  <CardTitle className="text-sm text-gray-300 font-medium">Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  {/* Assignee */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Assignee</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <div className="flex items-center space-x-2 cursor-pointer hover:bg-gray-700 rounded px-2 py-1 transition-colors min-w-[120px] justify-end">
                          {ticket.assignee ? (
                            <>
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={ticket.assignee.avatarUrl || ""} />
                                <AvatarFallback className="text-xs bg-gray-700 text-gray-300">
                                  {getInitials(ticket.assignee.name || "")}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-gray-300 truncate">
                                {ticket.assignee.name}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm text-gray-500">Unassigned</span>
                          )}
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        className="bg-gray-800 border-gray-700 min-w-[200px]"
                        align="end"
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

                  {/* Reporter */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Reporter</span>
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={ticket.reporter.avatarUrl || ""} />
                        <AvatarFallback className="text-xs bg-gray-700 text-gray-300">
                          {getInitials(ticket.reporter.name || "")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-300">
                        {ticket.reporter.name}
                      </span>
                    </div>
                  </div>

                  {/* Story Points */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Story Points</span>
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
                            className="bg-gray-800 border-gray-700 text-white text-sm w-16 text-center"
                            placeholder="SP"
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
                          className="text-sm text-gray-300 cursor-pointer hover:bg-gray-700 rounded px-2 py-1"
                          onClick={() => setEditingStoryPoints(true)}
                        >
                          {ticket.storyPoints || "None"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Due Date */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Due Date</span>
                    <DatePicker
                      date={ticket.dueDate ? new Date(ticket.dueDate) : null}
                      onDateChange={(date) => handleUpdateTicket({ dueDate: date })}
                      placeholder="Set due date"
                      variant="inline"
                      className="text-sm"
                    />
                  </div>

                  {/* Created */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Created</span>
                    <span className="text-sm text-gray-300">
                      {formatDate(ticket.createdAt)}
                    </span>
                  </div>

                  {/* Updated */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Updated</span>
                    <span className="text-sm text-gray-300">
                      {formatDate(ticket.updatedAt)}
                    </span>
                  </div>
                </CardContent>
              </Card>



              {/* Activity Tabs */}
              <Tabs defaultValue="comments" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-gray-800/50 h-8">
                  <TabsTrigger value="comments" className="text-xs py-1 data-[state=active]:bg-gray-700">
                    Comments ({ticket._count?.comments || 0})
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="text-xs py-1 data-[state=active]:bg-gray-700">
                    Activity
                  </TabsTrigger>
                  <TabsTrigger value="attachments" className="text-xs py-1 data-[state=active]:bg-gray-700">
                    Files ({ticket._count?.attachments || 0})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="comments" className="space-y-3 mt-3">
                  {/* Add Comment */}
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="bg-gray-800/50 border-gray-700 text-white text-sm resize-none"
                      rows={2}
                    />
                    <Button
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 h-7 text-xs"
                    >
                      Comment
                    </Button>
                  </div>

                  {/* Comments List */}
                  <div className="space-y-2">
                    {ticket.comments?.map((comment) => (
                      <div key={comment.id} className="bg-gray-800/30 rounded-md p-2 border border-gray-700/50">
                        <div className="flex items-center space-x-2 mb-1">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={comment.author.avatarUrl || ""} />
                            <AvatarFallback className="text-xs bg-gray-700 text-gray-300">
                              {getInitials(comment.author.name || "")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium text-gray-300">
                            {comment.author.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-300 ml-7">
                          {typeof comment.content === 'string'
                            ? comment.content
                            : JSON.stringify(comment.content)
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="activity">
                  <div className="text-sm text-gray-400">
                    Activity feed coming soon...
                  </div>
                </TabsContent>

                <TabsContent value="attachments">
                  <div className="text-sm text-gray-400">
                    Attachments coming soon...
                  </div>
                </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="p-4 text-center text-gray-400">
            Ticket not found
          </div>
        )}
      </div>
    </div>
  );
}
