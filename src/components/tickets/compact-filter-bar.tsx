"use client";

import { useState, useEffect } from "react";
import { Search, Plus, ChevronDown, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProjectMember {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  role: string;
}

interface CompactFilterBarProps {
  organizationId: string;
  projectId?: string;
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (value: string) => void;
  assigneeFilter: string;
  onAssigneeFilterChange: (value: string) => void;
  onClearFilters: () => void;
  onCreateTicket?: () => void;
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export default function CompactFilterBar({
  organizationId,
  projectId,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  assigneeFilter,
  onAssigneeFilterChange,
  onClearFilters,
  onCreateTicket,
}: CompactFilterBarProps) {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllMembers, setShowAllMembers] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, [organizationId, projectId]);

  const fetchMembers = async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/organizations/${organizationId}/projects/${projectId}/members`);
      if (response.ok) {
        const data = await response.json();
        setMembers(data);
      }
    } catch (error) {
      console.error("Error fetching project members:", error);
    } finally {
      setLoading(false);
    }
  };

  const visibleMembers = members.slice(0, 6);
  const hiddenMembers = members.slice(6);
  const selectedMember = members.find(m => m.user.id === assigneeFilter);

  return (
    <TooltipProvider>
      {/* Jira-style compact filter bar */}
      <div className="bg-gray-900 border-b border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between space-x-3">
          {/* Left side - Search and Member Avatars */}
          <div className="flex items-center space-x-3 flex-1">
            {/* Search Bar */}
            <div className="relative w-56">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
              <Input
                placeholder="Search backlog"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-7 bg-gray-800 border-gray-600 text-white h-7 text-xs placeholder:text-gray-500 focus:border-blue-500"
              />
            </div>

            {/* Member Avatars - Compact */}
            <div className="flex items-center space-x-1">
              {!loading && (
                <>
                  {/* Show first 8 members */}
                  {visibleMembers.map((member) => (
                    <Tooltip key={member.user.id} delayDuration={300}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() =>
                            onAssigneeFilterChange(
                              assigneeFilter === member.user.id ? "all" : member.user.id
                            )
                          }
                          className={`relative cursor-pointer hover:opacity-80 transition-opacity rounded-full ${
                            assigneeFilter === member.user.id
                              ? "ring-1 ring-blue-400"
                              : ""
                          }`}
                          title={member.user.name}
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={member.user.avatarUrl || ""} />
                            <AvatarFallback className="text-[10px] bg-gray-700 text-gray-300">
                              {getInitials(member.user.name)}
                            </AvatarFallback>
                          </Avatar>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        className="bg-gray-800 border-gray-700 text-white text-xs px-2 py-1 rounded shadow-lg"
                        side="bottom"
                        sideOffset={4}
                      >
                        <p>{member.user.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}

                  {/* Show +N button if there are more members */}
                  {hiddenMembers.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 w-6 rounded-full p-0 bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 text-[10px]"
                        >
                          +{hiddenMembers.length}
                          <span className="sr-only">Show more members</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="bg-gray-800 border-gray-600">
                        {hiddenMembers.map((member) => (
                          <DropdownMenuItem
                            key={member.user.id}
                            onClick={() =>
                              onAssigneeFilterChange(
                                assigneeFilter === member.user.id ? "all" : member.user.id
                              )
                            }
                            className="text-gray-300 hover:bg-gray-700 focus:bg-gray-700"
                          >
                            <div className="flex items-center space-x-2">
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={member.user.avatarUrl || ""} />
                                <AvatarFallback className="text-[10px] bg-gray-700 text-gray-300">
                                  {getInitials(member.user.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs">{member.user.name}</span>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </>
              )}
            </div>
        </div>

          {/* Right side - Filters and Actions */}
          <div className="flex items-center space-x-2">
            {/* Epic Filter */}
            <Select value={typeFilter} onValueChange={onTypeFilterChange}>
              <SelectTrigger className="w-16 bg-gray-800 border-gray-600 text-white h-7 text-xs">
                <SelectValue placeholder="Epic" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="all">Epic</SelectItem>
                <SelectItem value="BUG">Bug</SelectItem>
                <SelectItem value="TASK">Task</SelectItem>
                <SelectItem value="STORY">Story</SelectItem>
                <SelectItem value="EPIC">Epic</SelectItem>
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger className="w-16 bg-gray-800 border-gray-600 text-white h-7 text-xs">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="all">Type</SelectItem>
                <SelectItem value="TODO">To Do</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="IN_REVIEW">In Review</SelectItem>
                <SelectItem value="DONE">Done</SelectItem>
              </SelectContent>
            </Select>

            {/* Label Filter */}
            <Select value={priorityFilter} onValueChange={onPriorityFilterChange}>
              <SelectTrigger className="w-16 bg-gray-800 border-gray-600 text-white h-7 text-xs">
                <SelectValue placeholder="Label" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="all">Label</SelectItem>
                <SelectItem value="HIGHEST">Highest</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="LOWEST">Lowest</SelectItem>
              </SelectContent>
            </Select>

            {/* Custom Filters Button */}
            <Button
              variant="outline"
              size="sm"
              className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 h-7 text-xs px-2"
            >
              Custom filters
              <ChevronDown className="ml-1 h-3 w-3" />
            </Button>

            {/* Clear Filters */}
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 h-7 text-xs px-2"
            >
              Clear filters
            </Button>

            {/* Create Button */}
            {onCreateTicket && (
              <Button
                onClick={onCreateTicket}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 h-7 text-xs px-3"
              >
                Create
              </Button>
            )}
          </div>
        </div>

        {/* Active Filters Display - Compact */}
        {(assigneeFilter !== "all" || statusFilter !== "all" || typeFilter !== "all" || priorityFilter !== "all" || search) && (
          <div className="flex items-center space-x-2 mt-2 pt-2 border-t border-gray-700">
            <span className="text-xs text-gray-400">Active filters:</span>
          {selectedMember && (
            <div className="flex items-center space-x-1 bg-gray-800 rounded-full px-2 py-1">
              <Avatar className="h-4 w-4">
                <AvatarImage src={selectedMember.user.avatarUrl || ""} />
                <AvatarFallback className="text-xs bg-gray-700 text-gray-300">
                  {getInitials(selectedMember.user.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-gray-300">{selectedMember.user.name}</span>
              <button
                onClick={() => onAssigneeFilterChange("all")}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {search && (
            <div className="flex items-center space-x-1 bg-gray-800 rounded-full px-2 py-1">
              <span className="text-xs text-gray-300">"{search}"</span>
              <button
                onClick={() => onSearchChange("")}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
    </TooltipProvider>
  );
}
