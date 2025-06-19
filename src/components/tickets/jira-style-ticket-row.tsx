"use client";

import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  GripVertical,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Pause,
  Play,
  Eye,
  Bug,
  Square,
  BookOpen,
  Layers,
  ArrowUp,
  ArrowDown,
  Minus,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { formatDate, getInitials } from "@/lib/utils";
import { Ticket } from "@/types";
import { DatePicker } from "@/components/ui/date-picker";

interface JiraStyleTicketRowProps {
  ticket: Ticket;
  organizationId: string;
  projectId?: string;
  onUpdateTicket: (ticketId: string, updates: Partial<Ticket>) => void;
  onOpenSidebar?: (ticketId: string) => void;
  projectMembers?: Array<{
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
      avatarUrl?: string;
    };
  }>;
}

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
  HIGHEST: ChevronUp,
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

export default function JiraStyleTicketRow({
  ticket,
  organizationId,
  projectId,
  onUpdateTicket,
  onOpenSidebar,
  projectMembers = [],
}: JiraStyleTicketRowProps) {
  const [isEditingStoryPoints, setIsEditingStoryPoints] = useState(false);
  const [storyPointsValue, setStoryPointsValue] = useState(
    ticket.storyPoints?.toString() || ""
  );

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ticket.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const StatusIcon = statusIcons[ticket.status];
  const TypeIcon = typeIcons[ticket.type];
  const PriorityIcon = priorityIcons[ticket.priority];

  const getTicketUrl = () => {
    if (projectId) {
      return `/organizations/${organizationId}/projects/${projectId}/tickets/${ticket.id}`;
    }
    return `/organizations/${organizationId}/tickets/${ticket.id}`;
  };

  const handleStatusChange = (newStatus: string) => {
    onUpdateTicket(ticket.id, { status: newStatus as any });
  };

  const handleTypeChange = (newType: string) => {
    onUpdateTicket(ticket.id, { type: newType as any });
  };

  const handlePriorityChange = (newPriority: string) => {
    onUpdateTicket(ticket.id, { priority: newPriority as any });
  };

  const handleAssigneeChange = (newAssigneeId: string) => {
    const assigneeId = newAssigneeId === "unassigned" ? null : newAssigneeId;
    onUpdateTicket(ticket.id, { assigneeId });
  };

  const getDueDateColor = () => {
    if (!ticket.dueDate || ticket.status === 'DONE') return 'text-gray-400';

    const today = new Date();
    const dueDate = new Date(ticket.dueDate);

    // Reset time to compare only dates
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    if (dueDate < today) {
      return 'text-red-400'; // Overdue
    } else if (dueDate.getTime() === today.getTime()) {
      return 'text-yellow-400'; // Due today
    }

    return 'text-gray-400'; // Future or no due date
  };

  const handleStoryPointsChange = () => {
    const points = storyPointsValue.trim();
    const numericPoints = points ? parseInt(points, 10) : null;
    if (points === "" || (!isNaN(numericPoints!) && numericPoints! >= 0)) {
      onUpdateTicket(ticket.id, { storyPoints: numericPoints });
    }
    setIsEditingStoryPoints(false);
  };

  const handleStoryPointsKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleStoryPointsChange();
    } else if (e.key === 'Escape') {
      setStoryPointsValue(ticket.storyPoints?.toString() || "");
      setIsEditingStoryPoints(false);
    }
  };

  return (
    <TooltipProvider>
      <div
        ref={setNodeRef}
        style={style}
        className={`group relative border-b border-gray-700 hover:bg-gray-800 transition-colors ${
          isDragging ? "opacity-50 bg-gray-700" : ""
        }`}
      >
        {/* Main Row */}
        <div className="flex items-center py-2 px-3 min-h-[44px]">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity mr-2 flex-shrink-0"
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>

          {/* Type Icon */}
          <div className="flex-shrink-0 mr-3">
            <TypeIcon className={`h-4 w-4 ${typeColors[ticket.type]}`} />
          </div>

          {/* Ticket ID */}
          <div className="flex-shrink-0 mr-4 w-20">
            <Link
              href={getTicketUrl()}
              className="text-blue-400 hover:text-blue-300 font-mono text-sm font-medium"
            >
              {ticket.ticketId}
            </Link>
          </div>

          {/* Title */}
          <div className="flex-1 min-w-0 mr-6">
            <button
              onClick={() => onOpenSidebar?.(ticket.id)}
              className="text-white hover:text-blue-300 font-medium truncate block w-full text-left text-sm"
              title={ticket.title}
            >
              {ticket.title}
            </button>
          </div>

          {/* Status */}
          <div className="flex-shrink-0 mr-4 w-32">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Badge
                  variant="secondary"
                  className={`${statusColors[ticket.status]} border-0 text-xs px-2 py-0.5 cursor-pointer hover:opacity-80 transition-opacity font-normal`}
                >
                  <StatusIcon className="h-2.5 w-2.5 mr-1" />
                  <span className="text-xs whitespace-nowrap">{ticket.status.replace("_", " ").replace("READY TO DEPLOY", "READY")}</span>
                </Badge>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-800 border-gray-700 min-w-[160px]" align="start">
                {Object.keys(statusColors).map((status) => (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    className="text-gray-300 hover:bg-gray-700 cursor-pointer"
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded ${statusColors[status as keyof typeof statusColors].split(' ')[1]}`} />
                      <span>{status.replace("_", " ").replace("READY TO DEPLOY", "READY")}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Due Date */}
          <div className="flex-shrink-0 mr-4 w-24">
            <DatePicker
              date={ticket.dueDate ? new Date(ticket.dueDate) : null}
              onDateChange={(date) => onUpdateTicket(ticket.id, { dueDate: date })}
              placeholder="No due date"
              variant="inline"
              className={`text-xs ${getDueDateColor()}`}
              showIcon={true}
            />
          </div>

          {/* Story Points */}
          <div className="flex-shrink-0 mr-4 w-10 text-center">
            {isEditingStoryPoints ? (
              <Input
                type="number"
                value={storyPointsValue}
                onChange={(e) => setStoryPointsValue(e.target.value)}
                onBlur={handleStoryPointsChange}
                onKeyDown={handleStoryPointsKeyPress}
                className="w-8 h-8 bg-gray-700 border-gray-600 text-white text-xs text-center p-1 rounded-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="SP"
                min="0"
                autoFocus
              />
            ) : (
              <div
                className="flex items-center justify-center w-5 h-5 bg-gray-700 rounded-full text-xs text-gray-300 cursor-pointer hover:bg-gray-600 transition-colors mx-auto"
                onClick={() => setIsEditingStoryPoints(true)}
              >
                {ticket.storyPoints || "—"}
              </div>
            )}
          </div>

          {/* Priority */}
          <div className="flex-shrink-0 mr-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="cursor-pointer hover:opacity-80 transition-opacity">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <PriorityIcon className={`h-3.5 w-3.5 ${priorityColors[ticket.priority]}`} />
                    </TooltipTrigger>
                    <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                      <p>{ticket.priority}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-800 border-gray-700 min-w-[120px]" align="start">
                {Object.keys(priorityColors).map((priority) => (
                  <DropdownMenuItem
                    key={priority}
                    onClick={() => handlePriorityChange(priority)}
                    className="text-gray-300 hover:bg-gray-700 cursor-pointer"
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

          {/* Assignee */}
          <div className="flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="cursor-pointer hover:opacity-80 transition-opacity">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {ticket.assignee ? (
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={ticket.assignee.avatarUrl || ""} />
                          <AvatarFallback className="text-xs bg-gray-700 text-gray-300 font-medium">
                            {getInitials(ticket.assignee.name || "")}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center">
                          <span className="text-xs text-gray-400">?</span>
                        </div>
                      )}
                    </TooltipTrigger>
                    <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                      <p>{ticket.assignee?.name || "Unassigned"}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-800 border-gray-700">
                <DropdownMenuItem
                  onClick={() => handleAssigneeChange("unassigned")}
                  className="text-gray-300 hover:bg-gray-700"
                >
                  Unassigned
                </DropdownMenuItem>
                {projectMembers.map((member) => (
                  <DropdownMenuItem
                    key={member.user.id}
                    onClick={() => handleAssigneeChange(member.user.id)}
                    className="text-gray-300 hover:bg-gray-700"
                  >
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-4 w-4">
                        <AvatarImage src={member.user.avatarUrl || ""} />
                        <AvatarFallback className="text-xs bg-gray-700 text-gray-300">
                          {getInitials(member.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{member.user.name}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
