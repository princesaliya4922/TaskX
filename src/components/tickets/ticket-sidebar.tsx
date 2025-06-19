"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { X, Calendar, User, Tag, Clock, MessageSquare, Paperclip, Activity, GripVertical, Edit2, Check, XIcon, ChevronDown, ChevronUp, MoreHorizontal, Link2, Flag, Users, Zap, Circle, ArrowUp, ArrowDown, Minus, AlertCircle, CheckCircle, Square, BookOpen, Layers, Bug } from "lucide-react";
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

// Ticket cache for individual tickets
const ticketCache = new Map<string, { data: Ticket; timestamp: number }>();
const TICKET_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCachedTicket = (ticketId: string): Ticket | null => {
  const cached = ticketCache.get(ticketId);
  if (!cached) return null;

  const now = Date.now();
  if (now - cached.timestamp > TICKET_CACHE_TTL) {
    ticketCache.delete(ticketId);
    return null;
  }

  return cached.data;
};

const setCachedTicket = (ticketId: string, ticket: Ticket) => {
  ticketCache.set(ticketId, {
    data: ticket,
    timestamp: Date.now(),
  });
};

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

// Exact same colors and icons as backlog table
const statusIcons = {
  TODO: Circle,
  IN_PROGRESS: Circle,
  IN_REVIEW: AlertCircle,
  ON_HOLD: AlertCircle,
  READY_TO_DEPLOY: CheckCircle,
  REVIEW_PROD: AlertCircle,
  DONE: CheckCircle,
};

const statusColors = {
  TODO: "text-gray-300 bg-gray-700",
  IN_PROGRESS: "text-blue-300 bg-blue-900",
  IN_REVIEW: "text-yellow-300 bg-yellow-900",
  ON_HOLD: "text-orange-300 bg-orange-900",
  READY_TO_DEPLOY: "text-purple-300 bg-purple-900",
  REVIEW_PROD: "text-pink-300 bg-pink-900",
  DONE: "text-green-300 bg-green-900",
};

const typeIcons = {
  BUG: Bug,
  TASK: Square,
  STORY: BookOpen,
  EPIC: Layers,
};

const typeColors = {
  BUG: "text-red-400",
  TASK: "text-blue-400",
  STORY: "text-green-400",
  EPIC: "text-purple-400",
};

const priorityIcons = {
  HIGHEST: ArrowUp,
  HIGH: ArrowUp,
  MEDIUM: Minus,
  LOW: ArrowDown,
  LOWEST: ChevronDown,
};

const priorityColors = {
  HIGHEST: "text-red-400",
  HIGH: "text-red-400",
  MEDIUM: "text-yellow-400",
  LOW: "text-green-400",
  LOWEST: "text-gray-400",
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
      // Check cache first
      const cachedTicket = getCachedTicket(ticketId);
      if (cachedTicket) {
        setTicket(cachedTicket);
        setLoading(false);
      } else {
        fetchTicketDetails();
      }
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

  const fetchTicketDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/organizations/${organizationId}/projects/${projectId}/tickets/${ticketId}`
      );
      if (response.ok) {
        const ticketData = await response.json();
        setTicket(ticketData);
        // Cache the ticket data
        setCachedTicket(ticketId, ticketData);
      }
    } catch (error) {
      console.error("Error fetching ticket details:", error);
    } finally {
      setLoading(false);
    }
  }, [organizationId, projectId, ticketId]);

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

  const handleUpdateTicket = useCallback(async (updates: Partial<Ticket>) => {
    if (!ticket) return;

    // Optimistically update the UI immediately
    const optimisticTicket = { ...ticket, ...updates };
    setTicket(optimisticTicket);
    onUpdateTicket?.(ticketId, updates);

    // Update cache immediately
    setCachedTicket(ticketId, optimisticTicket);

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
        // Update cache with server response
        setCachedTicket(ticketId, updatedTicket);
      } else {
        // Revert on error
        setTicket(ticket);
        setCachedTicket(ticketId, ticket);
        console.error("Failed to update ticket");
      }
    } catch (error) {
      // Revert on error
      setTicket(ticket);
      setCachedTicket(ticketId, ticket);
      console.error("Error updating ticket:", error);
    }
  }, [ticket, ticketId, organizationId, projectId, onUpdateTicket]);

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
      className="fixed top-0 right-0 h-full flex flex-col z-40 shadow-2xl overflow-hidden"
      style={{
        width: `${width}px`,
        maxWidth: '80vw',
        minWidth: '400px',
        backgroundColor: '#1d1d20',
        borderLeft: '1px solid #2c2c34'
      }}
    >
      {/* Resize Handle */}
      <div
        className="absolute left-0 top-0 w-1 h-full cursor-col-resize hover:opacity-80 transition-opacity group"
        style={{ backgroundColor: '#2c2c34' }}
        onMouseDown={handleResizeStart}
      >
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="h-4 w-4" style={{ color: '#8993a4' }} />
        </div>
      </div>

      {/* Jira-style Header */}
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{
          backgroundColor: '#1d1d20',
          color: '#b6c2cf'
        }}
      >
        <div className="flex items-center space-x-3">
          {ticket && (
            <>
              <div className="flex items-center space-x-2">
                {React.createElement(typeIcons[ticket.type], {
                  className: `h-4 w-4 ${typeColors[ticket.type]}`
                })}
                <span
                  className="font-mono text-sm font-semibold tracking-wide"
                  style={{ color: '#579dff' }}
                >
                  {ticket.ticketId}
                </span>
              </div>
              <div className="h-4 w-px" style={{ backgroundColor: '#2c2c34' }}></div>
              <span className={`text-xs font-medium ${typeColors[ticket.type]}`}>
                {ticket.type}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="p-2 rounded-md"
            style={{ color: '#8993a4' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2c2c34';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2 rounded-md"
            style={{ color: '#8993a4' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2c2c34';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ backgroundColor: '#1d1d20' }}
      >
        {loading ? (
          <div className="p-6 text-center" style={{ color: '#8993a4' }}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: '#579dff' }}></div>
            Loading ticket details...
          </div>
        ) : ticket ? (
          <div className="flex flex-col h-full">
            {/* Title Section */}
            <div className="px-6 py-2">
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
                      className="flex-1 text-lg font-semibold focus:ring-1"
                      style={{
                        backgroundColor: '#2c2c34',
                        borderColor: '#44474a',
                        color: '#b6c2cf',
                        focusBorderColor: '#579dff',
                        focusRingColor: '#579dff'
                      }}
                      autoFocus
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleTitleSave}
                      className="p-2"
                      style={{ color: '#22c55e' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#22c55e20';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
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
                      className="p-2"
                      style={{ color: '#ef4444' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#ef444420';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="flex items-start space-x-2 cursor-pointer rounded-md p-3 -m-3 transition-colors"
                    onClick={() => setEditingTitle(true)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#2c2c34';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <h1
                      className="text-xl font-semibold flex-1 leading-tight"
                      style={{ color: '#b6c2cf' }}
                    >
                      {ticket.title}
                    </h1>
                    <Edit2
                      className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex-shrink-0"
                      style={{ color: '#8993a4' }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Status and Priority Bar */}
            <div className="px-6 py-3">
              <div className="flex items-center space-x-3">
                {/* Status */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Badge
                      variant="secondary"
                      className={`${statusColors[ticket.status]} border-0 text-xs px-2 py-0.5 cursor-pointer hover:opacity-80 transition-opacity font-normal`}
                    >
                      {React.createElement(statusIcons[ticket.status], { className: "h-2.5 w-2.5 mr-1" })}
                      <span className="text-xs whitespace-nowrap">
                        {ticket.status.replace("_", " ").replace("READY TO DEPLOY", "READY")}
                      </span>
                    </Badge>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="min-w-[160px]"
                    align="start"
                    style={{ backgroundColor: '#1d1d20', borderColor: '#2c2c34' }}
                  >
                    {Object.keys(statusColors).map((status) => (
                      <DropdownMenuItem
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        className="cursor-pointer"
                        style={{ color: '#b6c2cf' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#2c2c34';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded ${statusColors[status as keyof typeof statusColors].split(' ')[1]}`} />
                          <span>{status.replace("_", " ").replace("READY TO DEPLOY", "READY")}</span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Priority */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="cursor-pointer hover:opacity-80 transition-opacity">
                      {React.createElement(priorityIcons[ticket.priority], {
                        className: `h-3.5 w-3.5 ${priorityColors[ticket.priority]}`
                      })}
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="min-w-[120px]"
                    align="start"
                    style={{ backgroundColor: '#1d1d20', borderColor: '#2c2c34' }}
                  >
                    {Object.keys(priorityColors).map((priority) => (
                      <DropdownMenuItem
                        key={priority}
                        onClick={() => handlePriorityChange(priority)}
                        className="cursor-pointer"
                        style={{ color: '#b6c2cf' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#2c2c34';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          <div className={`${priorityColors[priority as keyof typeof priorityColors]}`}>
                            {React.createElement(priorityIcons[priority as keyof typeof priorityIcons], { className: "h-3 w-3" })}
                          </div>
                          <span>{priority}</span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto">
              {/* Description Section */}
              <div className="px-6 py-3">
                <div className="group">
                  <div className="mb-2">
                    <h3
                      className="text-sm font-semibold uppercase tracking-wide"
                      style={{ color: '#8993a4' }}
                    >
                      Description
                    </h3>
                  </div>
                  {editingDescription ? (
                    <div className="space-y-3">
                      <RichTextEditor
                        content={descriptionValue}
                        onChange={setDescriptionValue}
                        placeholder="Add a description..."
                        className="min-h-[120px]"
                        style={{
                          backgroundColor: '#2c2c34',
                          borderColor: '#44474a'
                        }}
                        projectMembers={projectMembers}
                      />
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          onClick={handleDescriptionSave}
                          className="text-white"
                          style={{ backgroundColor: '#579dff' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#4c8ce8';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#579dff';
                          }}
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
                          style={{ color: '#8993a4' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#2c2c34';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="cursor-pointer rounded-md group min-h-[60px] relative transition-colors"
                      onClick={() => setEditingDescription(true)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#2c2c34';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {ticket.description ? (
                        <RichTextDisplay
                          content={typeof ticket.description === 'string' ? ticket.description : JSON.stringify(ticket.description)}
                          className="text-sm"
                          style={{ color: '#b6c2cf' }}
                        />
                      ) : (
                        <div
                          className="text-sm italic"
                          style={{ color: '#8993a4' }}
                        >
                          Add a description...
                        </div>
                      )}
                      <Edit2
                        className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2"
                        style={{ color: '#8993a4' }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Details Section */}
              <div className="px-6 py-3">
                {/* Table with border and header */}
                <div className="border rounded-sm" style={{ borderColor: '#2c2c34' }}>
                  {/* Table Header */}
                  <div className="px-3 py-2 border-b" style={{ borderBottomColor: '#2c2c34', backgroundColor: '#2c2c34' }}>
                    <h3
                      className="text-sm font-semibold uppercase tracking-wide"
                      style={{ color: '#8993a4' }}
                    >
                      Details
                    </h3>
                  </div>
                  {/* Table Content */}
                  <table className="w-full">
                    <tbody>
                      {/* Assignee */}
                      <tr>
                        <td className="py-2 pl-3 pr-4 text-sm font-medium" style={{ color: '#8993a4', width: '30%' }}>
                          Assignee
                        </td>
                        <td className="py-2 pr-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <div
                                className="flex items-center space-x-2 cursor-pointer rounded-md px-2 py-1 transition-colors w-full justify-end"
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#2c2c34';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                {ticket.assignee ? (
                                  <>
                                    <Avatar className="h-5 w-5">
                                      <AvatarImage src={ticket.assignee.avatarUrl || ""} />
                                      <AvatarFallback
                                        className="text-xs"
                                        style={{ backgroundColor: '#2c2c34', color: '#b6c2cf' }}
                                      >
                                        {getInitials(ticket.assignee.name || "")}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span
                                      className="text-sm truncate"
                                      style={{ color: '#b6c2cf' }}
                                    >
                                      {ticket.assignee.name}
                                    </span>
                                  </>
                                ) : (
                                  <span
                                    className="text-sm italic"
                                    style={{ color: '#8993a4' }}
                                  >
                                    Unassigned
                                  </span>
                                )}
                              </div>
                            </DropdownMenuTrigger>
                      <DropdownMenuContent
                        className="min-w-[220px]"
                        align="end"
                        sideOffset={4}
                        style={{ backgroundColor: '#1d1d20', borderColor: '#2c2c34' }}
                      >
                        <DropdownMenuItem
                          onClick={() => handleAssigneeChange("unassigned")}
                          className="cursor-pointer py-2"
                          style={{ color: '#b6c2cf' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#2c2c34';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <span className="italic" style={{ color: '#8993a4' }}>Unassigned</span>
                        </DropdownMenuItem>
                        {projectMembers.map((member) => (
                          <DropdownMenuItem
                            key={member.user.id}
                            onClick={() => handleAssigneeChange(member.user.id)}
                            className="cursor-pointer py-2"
                            style={{ color: '#b6c2cf' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#2c2c34';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={member.user.avatarUrl || ""} />
                                <AvatarFallback
                                  className="text-xs"
                                  style={{ backgroundColor: '#2c2c34', color: '#b6c2cf' }}
                                >
                                  {getInitials(member.user.name || "")}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{member.user.name}</span>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                        </td>
                      </tr>

                      {/* Reporter */}
                      <tr>
                        <td className="py-2 pl-3 pr-4 text-sm font-medium" style={{ color: '#8993a4', width: '30%' }}>
                          Reporter
                        </td>
                        <td className="py-2 pr-3">
                          <div className="flex items-center space-x-2 justify-end">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={ticket.reporter.avatarUrl || ""} />
                              <AvatarFallback
                                className="text-xs"
                                style={{ backgroundColor: '#2c2c34', color: '#b6c2cf' }}
                              >
                                {getInitials(ticket.reporter.name || "")}
                              </AvatarFallback>
                            </Avatar>
                            <span
                              className="text-sm"
                              style={{ color: '#b6c2cf' }}
                            >
                              {ticket.reporter.name}
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* Story Points */}
                      <tr>
                        <td className="py-2 pl-3 pr-4 text-sm font-medium" style={{ color: '#8993a4', width: '30%' }}>
                          Story Points
                        </td>
                        <td className="py-2 pr-3">
                          <div className="flex justify-end">
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
                                  className="text-sm w-20 text-center focus:ring-1"
                                  style={{
                                    backgroundColor: '#2c2c34',
                                    borderColor: '#44474a',
                                    color: '#b6c2cf',
                                    focusBorderColor: '#579dff',
                                    focusRingColor: '#579dff'
                                  }}
                                  placeholder="SP"
                                  min="0"
                                  autoFocus
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleStoryPointsSave}
                                  className="p-1"
                                  style={{ color: '#22c55e' }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#22c55e20';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }}
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <div
                                className="text-sm cursor-pointer rounded-md px-2 py-1 transition-colors"
                                onClick={() => setEditingStoryPoints(true)}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#2c2c34';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                {ticket.storyPoints ? (
                                  <span
                                    className="px-2 py-1 rounded-full text-xs font-semibold"
                                    style={{ backgroundColor: '#579dff', color: '#ffffff' }}
                                  >
                                    {ticket.storyPoints}
                                  </span>
                                ) : (
                                  <span
                                    className="italic"
                                    style={{ color: '#8993a4' }}
                                  >
                                    None
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Due Date */}
                      <tr>
                        <td className="py-2 pl-3 pr-4 text-sm font-medium" style={{ color: '#8993a4', width: '30%' }}>
                          Due Date
                        </td>
                        <td className="py-2 pr-3">
                          <div className="flex justify-end">
                            <DatePicker
                              date={ticket.dueDate ? new Date(ticket.dueDate) : null}
                              onDateChange={(date) => handleUpdateTicket({ dueDate: date })}
                              placeholder="Set due date"
                              variant="inline"
                              className="text-sm"
                            />
                          </div>
                        </td>
                      </tr>

                      {/* Created */}
                      <tr>
                        <td className="py-2 pl-3 pr-4 text-sm font-medium" style={{ color: '#8993a4', width: '30%' }}>
                          Created
                        </td>
                        <td className="py-2 pr-3 text-sm text-right" style={{ color: '#b6c2cf' }}>
                          {formatDate(ticket.createdAt)}
                        </td>
                      </tr>

                      {/* Updated */}
                      <tr>
                        <td className="py-2 pl-3 pr-4 text-sm font-medium" style={{ color: '#8993a4', width: '30%' }}>
                          Updated
                        </td>
                        <td className="py-2 pr-3 text-sm text-right" style={{ color: '#b6c2cf' }}>
                          {formatDate(ticket.updatedAt)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>



              {/* Activity Tabs */}
              <div className="flex-1 flex flex-col border-t" style={{ borderTopColor: '#2c2c34' }}>
                <Tabs defaultValue="comments" className="flex-1 flex flex-col">
                  <div
                    className="px-0 py-0 border-b"
                    style={{ backgroundColor: '#1d1d20', borderBottomColor: '#2c2c34' }}
                  >
                    <TabsList
                      className="grid w-full grid-cols-3 h-12 rounded-none bg-transparent p-0"
                    >
                      <TabsTrigger
                        value="comments"
                        className="text-sm py-3 px-4 font-medium flex items-center justify-center space-x-2 data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none border-b-2 border-transparent transition-colors"
                        style={{
                          color: '#8993a4'
                        }}
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span>Comments ({ticket._count?.comments || 0})</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="activity"
                        className="text-sm py-3 px-4 font-medium flex items-center justify-center space-x-2 data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none border-b-2 border-transparent transition-colors"
                        style={{
                          color: '#8993a4'
                        }}
                      >
                        <Activity className="h-4 w-4" />
                        <span>Activity</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="attachments"
                        className="text-sm py-3 px-4 font-medium flex items-center justify-center space-x-2 data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none border-b-2 border-transparent transition-colors"
                        style={{
                          color: '#8993a4'
                        }}
                      >
                        <Paperclip className="h-4 w-4" />
                        <span>Files ({ticket._count?.attachments || 0})</span>
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent
                    value="comments"
                    className="flex-1 flex flex-col px-6 py-3"
                    style={{ backgroundColor: '#1d1d20' }}
                  >
                    {/* Add Comment */}
                    <div className="space-y-2 mb-4">
                      <Textarea
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="text-sm resize-none focus:ring-1 min-h-[60px] border-0"
                        style={{
                          backgroundColor: '#2c2c34',
                          color: '#b6c2cf',
                          focusRingColor: '#579dff'
                        }}
                        rows={2}
                      />
                      <div className="flex justify-end">
                        <Button
                          onClick={handleAddComment}
                          disabled={!newComment.trim()}
                          size="sm"
                          className="text-white font-medium h-7 px-3 text-xs"
                          style={{ backgroundColor: '#579dff' }}
                          onMouseEnter={(e) => {
                            if (!e.currentTarget.disabled) {
                              e.currentTarget.style.backgroundColor = '#4c8ce8';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!e.currentTarget.disabled) {
                              e.currentTarget.style.backgroundColor = '#579dff';
                            }
                          }}
                        >
                          Add Comment
                        </Button>
                      </div>
                    </div>

                    {/* Comments List */}
                    <div className="flex-1 space-y-3 overflow-y-auto">
                      {ticket.comments?.length ? (
                        ticket.comments.map((comment) => (
                          <div
                            key={comment.id}
                            className="rounded-sm p-3 border-l-2"
                            style={{
                              backgroundColor: '#2c2c34',
                              borderLeftColor: '#579dff'
                            }}
                          >
                            <div className="flex items-start space-x-2 mb-2">
                              <Avatar className="h-6 w-6 mt-0.5">
                                <AvatarImage src={comment.author.avatarUrl || ""} />
                                <AvatarFallback
                                  className="text-xs"
                                  style={{ backgroundColor: '#44474a', color: '#b6c2cf' }}
                                >
                                  {getInitials(comment.author.name || "")}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <span
                                    className="text-sm font-medium truncate"
                                    style={{ color: '#b6c2cf' }}
                                  >
                                    {comment.author.name}
                                  </span>
                                  <span
                                    className="text-xs flex-shrink-0"
                                    style={{ color: '#8993a4' }}
                                  >
                                    {formatDate(comment.createdAt)}
                                  </span>
                                </div>
                                <div
                                  className="text-sm mt-1 leading-normal"
                                  style={{ color: '#b6c2cf' }}
                                >
                                  {typeof comment.content === 'string'
                                    ? comment.content
                                    : JSON.stringify(comment.content)
                                  }
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6">
                          <MessageSquare
                            className="h-8 w-8 mx-auto mb-2"
                            style={{ color: '#44474a' }}
                          />
                          <p
                            className="text-sm mb-1"
                            style={{ color: '#8993a4' }}
                          >
                            No comments yet
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: '#6b7280' }}
                          >
                            Be the first to add a comment
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="activity"
                    className="flex-1 px-6 py-4"
                    style={{ backgroundColor: '#1d1d20' }}
                  >
                    <div className="text-center py-8">
                      <Activity
                        className="h-12 w-12 mx-auto mb-3"
                        style={{ color: '#44474a' }}
                      />
                      <p
                        className="text-sm"
                        style={{ color: '#8993a4' }}
                      >
                        Activity feed coming soon
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: '#6b7280' }}
                      >
                        Track all changes and updates here
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="attachments"
                    className="flex-1 px-6 py-4"
                    style={{ backgroundColor: '#1d1d20' }}
                  >
                    <div className="text-center py-8">
                      <Paperclip
                        className="h-12 w-12 mx-auto mb-3"
                        style={{ color: '#44474a' }}
                      />
                      <p
                        className="text-sm"
                        style={{ color: '#8993a4' }}
                      >
                        No attachments yet
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: '#6b7280' }}
                      >
                        Drag and drop files to attach them
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="p-6 text-center"
            style={{ color: '#8993a4' }}
          >
            <div className="mb-4">
              <X
                className="h-12 w-12 mx-auto mb-3"
                style={{ color: '#44474a' }}
              />
              <p
                className="text-sm"
                style={{ color: '#8993a4' }}
              >
                Ticket not found
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
