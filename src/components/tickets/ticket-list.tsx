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
import { useTicketList } from "@/hooks/use-project-cache";

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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState("updatedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  // Use cached data hook
  const {
    data: ticketData,
    loading,
    error,
    updateTicketInCache,
    invalidateCache
  } = useTicketList(
    organizationId,
    projectId,
    {
      search,
      status: statusFilter,
      type: typeFilter,
      priority: priorityFilter,
      assignee: assigneeFilter,
      sortBy,
      sortOrder,
      page
    },
    refreshTrigger
  );

  // Extract data from cached result
  const tickets = ticketData?.tickets || [];
  const totalPages = ticketData?.totalPages || 1;



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
      <Card style={{ backgroundColor: '#161618', borderColor: '#2c2c34' }}>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center">
              <div style={{ color: '#8993a4' }}>Loading tickets...</div>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <div style={{ color: '#ef4444' }}>Error loading tickets: {error}</div>
              <button
                onClick={() => invalidateCache()}
                className="mt-2 px-4 py-2 text-sm rounded"
                style={{ backgroundColor: '#579dff', color: '#b6c2cf' }}
              >
                Retry
              </button>
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mb-4" style={{ color: '#8993a4' }}>No tickets found</div>
              {onCreateTicket && (
                <Button
                  onClick={onCreateTicket}
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
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow style={{ borderColor: '#2c2c34' }}>
                  <TableHead style={{ color: '#8993a4' }}>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("ticketId")}
                      className="p-0"
                      style={{ color: '#8993a4' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#b6c2cf';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#8993a4';
                      }}
                    >
                      ID
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead style={{ color: '#8993a4' }}>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("title")}
                      className="p-0"
                      style={{ color: '#8993a4' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#b6c2cf';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#8993a4';
                      }}
                    >
                      Title
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead style={{ color: '#8993a4' }}>Status</TableHead>
                  <TableHead style={{ color: '#8993a4' }}>Type</TableHead>
                  <TableHead style={{ color: '#8993a4' }}>Priority</TableHead>
                  <TableHead style={{ color: '#8993a4' }}>Assignee</TableHead>
                  <TableHead style={{ color: '#8993a4' }}>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("updatedAt")}
                      className="p-0"
                      style={{ color: '#8993a4' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#b6c2cf';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#8993a4';
                      }}
                    >
                      Updated
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead style={{ color: '#8993a4' }}>Activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => {
                  const StatusIcon = statusIcons[ticket.status];
                  return (
                    <TableRow
                      key={ticket.id}
                      style={{ borderColor: '#2c2c34' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#1d1d20';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <TableCell>
                        <Link
                          href={getTicketUrl(ticket)}
                          className="font-mono"
                          style={{ color: '#579dff' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#85b8ff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#579dff';
                          }}
                        >
                          {ticket.ticketId}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={getTicketUrl(ticket)}
                          className="font-medium"
                          style={{ color: '#b6c2cf' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#579dff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#b6c2cf';
                          }}
                        >
                          {ticket.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusColors[ticket.status]}`} style={{ color: '#b6c2cf' }}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {ticket.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${typeColors[ticket.type]}`} style={{ color: '#b6c2cf' }}>
                          {ticket.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${priorityColors[ticket.priority]}`} style={{ color: '#b6c2cf' }}>
                          {ticket.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {ticket.assignee ? (
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={ticket.assignee.avatarUrl || ""} />
                              <AvatarFallback
                                className="text-xs"
                                style={{ backgroundColor: '#1d1d20', color: '#8993a4' }}
                              >
                                {getInitials(ticket.assignee.name || "")}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm" style={{ color: '#8993a4' }}>
                              {ticket.assignee.name}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: '#6b778c' }}>Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm" style={{ color: '#8993a4' }}>
                        {formatDate(ticket.updatedAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3" style={{ color: '#8993a4' }}>
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
          <div className="text-sm" style={{ color: '#8993a4' }}>
            Page {page} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              style={{
                borderColor: '#2c2c34',
                color: '#8993a4',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                if (page !== 1) {
                  e.currentTarget.style.backgroundColor = '#1d1d20';
                  e.currentTarget.style.color = '#b6c2cf';
                }
              }}
              onMouseLeave={(e) => {
                if (page !== 1) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#8993a4';
                }
              }}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              style={{
                borderColor: '#2c2c34',
                color: '#8993a4',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                if (page !== totalPages) {
                  e.currentTarget.style.backgroundColor = '#1d1d20';
                  e.currentTarget.style.color = '#b6c2cf';
                }
              }}
              onMouseLeave={(e) => {
                if (page !== totalPages) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#8993a4';
                }
              }}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
