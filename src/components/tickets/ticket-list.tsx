"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  ArrowUpDown,
  MessageSquare,
  Paperclip,
  AlertCircle,
  CheckCircle,
  Clock,
  Pause,
  Play,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { formatDate, getInitials } from "@/lib/utils";
import { Ticket, TicketStatus, TicketType, Priority } from "@/types";
import CompactFilterBar from "./compact-filter-bar";

interface TicketListProps {
  organizationId: string;
  projectId?: string;
  onCreateTicket?: () => void;
  refreshTrigger?: number;
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

export default function TicketList({ organizationId, projectId, onCreateTicket, refreshTrigger }: TicketListProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState("updatedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchTickets();
  }, [organizationId, projectId, search, statusFilter, typeFilter, priorityFilter, assigneeFilter, sortBy, sortOrder, page, refreshTrigger]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        sortBy,
        sortOrder,
      });

      if (search) params.append("search", search);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      if (typeFilter && typeFilter !== "all") params.append("type", typeFilter);
      if (priorityFilter && priorityFilter !== "all") params.append("priority", priorityFilter);
      if (assigneeFilter && assigneeFilter !== "all") params.append("assigneeId", assigneeFilter);
      if (projectId) params.append("projectId", projectId);

      const endpoint = projectId
        ? `/api/organizations/${organizationId}/projects/${projectId}/tickets`
        : `/api/organizations/${organizationId}/tickets`;

      const response = await fetch(`${endpoint}?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setTypeFilter("all");
    setPriorityFilter("all");
    setAssigneeFilter("all");
    setPage(1);
  };

  const getTicketUrl = (ticket: Ticket) => {
    if (projectId) {
      return `/organizations/${organizationId}/projects/${projectId}/tickets/${ticket.id}`;
    }
    return `/organizations/${organizationId}/tickets/${ticket.id}`;
  };

  return (
    <div className="space-y-4">
      {/* Compact Filter Bar */}
      <CompactFilterBar
        organizationId={organizationId}
        projectId={projectId}
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
        assigneeFilter={assigneeFilter}
        onAssigneeFilterChange={setAssigneeFilter}
        onClearFilters={clearFilters}
        onCreateTicket={onCreateTicket}
      />

      {/* Tickets Table */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center">
              <div className="text-gray-400">Loading tickets...</div>
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 mb-4">No tickets found</div>
              {onCreateTicket && (
                <Button onClick={onCreateTicket} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Ticket
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-800">
                  <TableHead className="text-gray-300">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("ticketId")}
                      className="text-gray-300 hover:text-white p-0"
                    >
                      ID
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-gray-300">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("title")}
                      className="text-gray-300 hover:text-white p-0"
                    >
                      Title
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Type</TableHead>
                  <TableHead className="text-gray-300">Priority</TableHead>
                  <TableHead className="text-gray-300">Assignee</TableHead>
                  <TableHead className="text-gray-300">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("updatedAt")}
                      className="text-gray-300 hover:text-white p-0"
                    >
                      Updated
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-gray-300">Activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => {
                  const StatusIcon = statusIcons[ticket.status];
                  return (
                    <TableRow key={ticket.id} className="border-gray-800 hover:bg-gray-800/50">
                      <TableCell>
                        <Link
                          href={getTicketUrl(ticket)}
                          className="text-blue-400 hover:text-blue-300 font-mono"
                        >
                          {ticket.ticketId}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={getTicketUrl(ticket)}
                          className="text-white hover:text-blue-300 font-medium"
                        >
                          {ticket.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusColors[ticket.status]} text-white`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {ticket.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${typeColors[ticket.type]} text-white`}>
                          {ticket.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${priorityColors[ticket.priority]} text-white`}>
                          {ticket.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {ticket.assignee ? (
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={ticket.assignee.avatarUrl || ""} />
                              <AvatarFallback className="text-xs">
                                {getInitials(ticket.assignee.name || "")}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-gray-300 text-sm">
                              {ticket.assignee.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-500">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-400 text-sm">
                        {formatDate(ticket.updatedAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3 text-gray-400">
                          {ticket._count?.comments > 0 && (
                            <div className="flex items-center space-x-1">
                              <MessageSquare className="h-4 w-4" />
                              <span className="text-sm">{ticket._count.comments}</span>
                            </div>
                          )}
                          {ticket._count?.attachments > 0 && (
                            <div className="flex items-center space-x-1">
                              <Paperclip className="h-4 w-4" />
                              <span className="text-sm">{ticket._count.attachments}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-gray-400 text-sm">
            Page {page} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
