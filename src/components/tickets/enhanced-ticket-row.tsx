"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";
import { formatDate, getInitials } from "@/lib/utils";
import { Ticket } from "@/types";
import { DatePicker } from "@/components/ui/date-picker";

interface EnhancedTicketRowProps {
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

export default function EnhancedTicketRow({
  ticket,
  organizationId,
  projectId,
  onUpdateTicket,
  onOpenSidebar,
  projectMembers = [],
}: EnhancedTicketRowProps) {
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
        className={`flex items-center space-x-3 p-2 bg-gray-800 rounded hover:bg-gray-750 transition-colors group ${
          isDragging ? "opacity-50" : ""
        }`}
      >
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity"
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>

        {/* Ticket ID and Title */}
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <Link
            href={getTicketUrl()}
            className="text-blue-400 hover:text-blue-300 font-mono text-sm font-medium"
          >
            {ticket.ticketId}
          </Link>

          <button
            onClick={() => onOpenSidebar?.(ticket.id)}
            className="text-white hover:text-blue-300 font-medium truncate flex-1 text-left"
          >
            {ticket.title}
          </button>
        </div>

        {/* Inline Editable Fields */}
        <div className="flex items-center space-x-2">
          {/* Story Points */}
          {isEditingStoryPoints ? (
            <Input
              type="number"
              value={storyPointsValue}
              onChange={(e) => setStoryPointsValue(e.target.value)}
              onBlur={handleStoryPointsChange}
              onKeyDown={handleStoryPointsKeyPress}
              className="w-12 h-6 bg-gray-700 border-gray-600 text-white text-xs text-center p-1"
              placeholder="SP"
              min="0"
              autoFocus
            />
          ) : (
            <div
              className="flex items-center justify-center w-6 h-6 bg-gray-700 rounded text-xs text-white cursor-pointer hover:bg-gray-600 transition-colors"
              onClick={() => setIsEditingStoryPoints(true)}
            >
              {ticket.storyPoints || "?"}
            </div>
          )}

          {/* Status */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Badge
                className={`${statusColors[ticket.status]} text-white text-xs px-1.5 py-0.5 cursor-pointer hover:opacity-80 transition-opacity`}
              >
                <StatusIcon className="h-2.5 w-2.5 mr-1" />
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
              <Badge
                className={`${typeColors[ticket.type]} text-white text-xs px-1.5 py-0.5 cursor-pointer hover:opacity-80 transition-opacity`}
              >
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
              <Badge
                className={`${priorityColors[ticket.priority]} text-white text-xs px-1.5 py-0.5 cursor-pointer hover:opacity-80 transition-opacity`}
              >
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

          {/* Assignee */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-pointer hover:opacity-80">
                    {ticket.assignee ? (
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={ticket.assignee.avatarUrl || ""} />
                        <AvatarFallback className="text-xs bg-gray-700 text-gray-300">
                          {getInitials(ticket.assignee.name || "")}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-xs text-gray-400">?</span>
                      </div>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                  <p>{ticket.assignee?.name || "Unassigned"}</p>
                </TooltipContent>
              </Tooltip>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-800 border-gray-700">
              <DropdownMenuItem
                onClick={() => handleAssigneeChange("unassigned")}
                className="text-gray-300 hover:bg-gray-700 focus:bg-gray-700"
              >
                Unassigned
              </DropdownMenuItem>
              {projectMembers.map((member) => (
                <DropdownMenuItem
                  key={member.user.id}
                  onClick={() => handleAssigneeChange(member.user.id)}
                  className="text-gray-300 hover:bg-gray-700 focus:bg-gray-700"
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

          {/* Due Date */}
          <DatePicker
            date={ticket.dueDate ? new Date(ticket.dueDate) : null}
            onDateChange={(date) => onUpdateTicket(ticket.id, { dueDate: date })}
            placeholder="No due date"
            variant="inline"
            className="text-xs"
            showIcon={true}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}
