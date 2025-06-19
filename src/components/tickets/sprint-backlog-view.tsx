"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  MoreHorizontal,
  Calendar,
  Target,
} from "lucide-react";
import { Ticket, Sprint } from "@/types";
import CompactFilterBar from "./compact-filter-bar";
import EnhancedTicketRow from "./enhanced-ticket-row";
import JiraStyleTicketRow from "./jira-style-ticket-row";
import TicketSidebar from "./ticket-sidebar";

interface SprintBacklogViewProps {
  organizationId: string;
  projectId: string;
  onCreateTicket?: () => void;
  refreshTrigger?: number; // Add this to trigger refresh when tickets are created
}



export default function SprintBacklogView({
  organizationId,
  projectId,
  onCreateTicket,
  refreshTrigger,
}: SprintBacklogViewProps) {
  const [allSprints, setAllSprints] = useState<(Sprint & { tickets: Ticket[] })[]>([]);
  const [allBacklogTickets, setAllBacklogTickets] = useState<Ticket[]>([]);
  const [projectMembers, setProjectMembers] = useState<Array<{
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
      avatarUrl?: string;
    };
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSprints, setExpandedSprints] = useState<Set<string>>(new Set());

  // Sidebar state
  const [sidebarTicketId, setSidebarTicketId] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(400);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch data when component mounts, project changes, or refresh is triggered
  useEffect(() => {
    fetchSprintsAndTickets();
  }, [organizationId, projectId, refreshTrigger]);

  const fetchSprintsAndTickets = async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch sprints with all tickets (no filtering on server)
      const sprintsResponse = await fetch(
        `/api/organizations/${organizationId}/projects/${projectId}/sprints`
      );

      // Fetch all backlog tickets (no filtering on server, ordered by updatedAt to maintain drag order)
      const backlogResponse = await fetch(
        `/api/organizations/${organizationId}/projects/${projectId}/tickets?sprintId=null&limit=1000&sortBy=updatedAt&sortOrder=asc`
      );

      // Fetch project members
      const membersResponse = await fetch(
        `/api/organizations/${organizationId}/projects/${projectId}/members`
      );

      if (sprintsResponse.ok && backlogResponse.ok && membersResponse.ok) {
        const sprintsData = await sprintsResponse.json();
        const backlogData = await backlogResponse.json();
        const membersData = await membersResponse.json();

        setAllSprints(sprintsData);
        setAllBacklogTickets(backlogData.tickets || []);
        setProjectMembers(membersData);

        // Expand active sprints by default
        const activeSprints = sprintsData
          .filter((sprint: Sprint) => sprint.status === "ACTIVE")
          .map((sprint: Sprint) => sprint.id);
        setExpandedSprints(new Set(activeSprints));
      }
    } catch (error) {
      console.error("Error fetching sprints and tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering to prevent re-renders
  const filterTicket = useCallback((ticket: Ticket) => {
    if (search && !ticket.title.toLowerCase().includes(search.toLowerCase()) &&
        !ticket.ticketId.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (statusFilter !== "all" && ticket.status !== statusFilter) {
      return false;
    }
    if (typeFilter !== "all" && ticket.type !== typeFilter) {
      return false;
    }
    if (priorityFilter !== "all" && ticket.priority !== priorityFilter) {
      return false;
    }
    if (assigneeFilter !== "all" && ticket.assignee?.id !== assigneeFilter) {
      return false;
    }
    return true;
  }, [search, statusFilter, typeFilter, priorityFilter, assigneeFilter]);

  // Memoized filtered data
  const filteredSprints = useMemo(() => {
    return allSprints.map(sprint => ({
      ...sprint,
      tickets: sprint.tickets.filter(filterTicket)
    }));
  }, [allSprints, filterTicket]);

  const filteredBacklogTickets = useMemo(() => {
    return allBacklogTickets.filter(filterTicket);
  }, [allBacklogTickets, filterTicket]);

  const toggleSprintExpansion = useCallback((sprintId: string) => {
    setExpandedSprints(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(sprintId)) {
        newExpanded.delete(sprintId);
      } else {
        newExpanded.add(sprintId);
      }
      return newExpanded;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setSearch("");
    setStatusFilter("all");
    setTypeFilter("all");
    setPriorityFilter("all");
    setAssigneeFilter("all");
  }, []);

  // Handle ticket updates
  const handleUpdateTicket = useCallback(async (ticketId: string, updates: Partial<Ticket>) => {
    // Optimistically update the UI first
    const updateTicketInState = (ticket: Ticket) =>
      ticket.id === ticketId ? { ...ticket, ...updates } : ticket;

    setAllSprints(prev => prev.map(sprint => ({
      ...sprint,
      tickets: sprint.tickets.map(updateTicketInState)
    })));

    setAllBacklogTickets(prev => prev.map(updateTicketInState));

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

        // Update with the server response to ensure consistency
        setAllSprints(prev => prev.map(sprint => ({
          ...sprint,
          tickets: sprint.tickets.map(ticket =>
            ticket.id === ticketId ? { ...ticket, ...updatedTicket } : ticket
          )
        })));

        setAllBacklogTickets(prev => prev.map(ticket =>
          ticket.id === ticketId ? { ...ticket, ...updatedTicket } : ticket
        ));
      } else {
        // Revert optimistic update on error
        console.error("Failed to update ticket, reverting changes");
        // You could implement a revert mechanism here
      }
    } catch (error) {
      console.error("Error updating ticket:", error);
      // Revert optimistic update on error
    }
  }, [organizationId, projectId]);

  // Handle drag end
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find which sprint or backlog contains the active item
    let activeSprintId: string | null = null;
    let overSprintId: string | null = null;

    // Check if active item is in backlog
    const activeInBacklog = allBacklogTickets.find(t => t.id === activeId);
    if (activeInBacklog) {
      activeSprintId = null;
    } else {
      // Find which sprint contains the active item
      for (const sprint of allSprints) {
        if (sprint.tickets.find(t => t.id === activeId)) {
          activeSprintId = sprint.id;
          break;
        }
      }
    }

    // Check if over item is in backlog
    const overInBacklog = allBacklogTickets.find(t => t.id === overId);
    if (overInBacklog) {
      overSprintId = null;
    } else {
      // Find which sprint contains the over item
      for (const sprint of allSprints) {
        if (sprint.tickets.find(t => t.id === overId)) {
          overSprintId = sprint.id;
          break;
        }
      }
    }

    // If both items are in the same container, reorder them
    if (activeSprintId === overSprintId) {
      let newOrder: string[] = [];

      if (activeSprintId === null) {
        // Reorder in backlog
        const oldIndex = allBacklogTickets.findIndex(t => t.id === activeId);
        const newIndex = allBacklogTickets.findIndex(t => t.id === overId);
        const reorderedTickets = arrayMove(allBacklogTickets, oldIndex, newIndex);

        setAllBacklogTickets(reorderedTickets);
        newOrder = reorderedTickets.map(t => t.id);

        // Save order to database
        try {
          await fetch(`/api/organizations/${organizationId}/projects/${projectId}/tickets/reorder`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ticketIds: newOrder,
              sprintId: null, // backlog
            }),
          });
        } catch (error) {
          console.error('Failed to save ticket order:', error);
        }
      } else {
        // Reorder within sprint
        const sprint = allSprints.find(s => s.id === activeSprintId);
        if (sprint) {
          const oldIndex = sprint.tickets.findIndex(t => t.id === activeId);
          const newIndex = sprint.tickets.findIndex(t => t.id === overId);
          const reorderedTickets = arrayMove(sprint.tickets, oldIndex, newIndex);

          setAllSprints(prev => prev.map(s => {
            if (s.id === activeSprintId) {
              return {
                ...s,
                tickets: reorderedTickets
              };
            }
            return s;
          }));

          newOrder = reorderedTickets.map(t => t.id);

          // Save order to database
          try {
            await fetch(`/api/organizations/${organizationId}/projects/${projectId}/tickets/reorder`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                ticketIds: newOrder,
                sprintId: activeSprintId,
              }),
            });
          } catch (error) {
            console.error('Failed to save ticket order:', error);
          }
        }
      }
    }
  }, [allSprints, allBacklogTickets, organizationId, projectId]);

  const getTicketUrl = (ticket: Ticket) => {
    return `/organizations/${organizationId}/projects/${projectId}/tickets/${ticket.id}`;
  };

  const handleOpenSidebar = useCallback((ticketId: string) => {
    setSidebarTicketId(ticketId);
  }, []);

  const handleCloseSidebar = useCallback(() => {
    setSidebarTicketId(null);
  }, []);

  const handleSidebarWidthChange = useCallback((width: number) => {
    setSidebarWidth(width);
  }, []);

  const renderTicket = useCallback((ticket: Ticket) => {
    return (
      <JiraStyleTicketRow
        key={ticket.id}
        ticket={ticket}
        organizationId={organizationId}
        projectId={projectId}
        onUpdateTicket={handleUpdateTicket}
        onOpenSidebar={handleOpenSidebar}
        projectMembers={projectMembers}
      />
    );
  }, [organizationId, projectId, handleUpdateTicket, handleOpenSidebar, projectMembers]);

  const renderSprint = useCallback((sprint: Sprint & { tickets: Ticket[] }) => {
    const isExpanded = expandedSprints.has(sprint.id);
    const completedTickets = sprint.tickets.filter(t => t.status === "DONE").length;
    const totalTickets = sprint.tickets.length;

    return (
      <div
        key={sprint.id}
        style={{ backgroundColor: '#161618', border: '1px solid #2c2c34' }}
        className="rounded-lg overflow-hidden"
      >
        {/* Sprint Header */}
        <div
          className="flex items-center justify-between px-3 py-2 cursor-pointer transition-colors"
          style={{
            backgroundColor: '#1d1d20',
            borderBottom: '1px solid #2c2c34'
          }}
          onClick={() => toggleSprintExpansion(sprint.id)}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#22222a';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#1d1d20';
          }}
        >
          <div className="flex items-center space-x-2">
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" style={{ color: '#8993a4' }} />
            ) : (
              <ChevronUp className="h-3 w-3" style={{ color: '#8993a4' }} />
            )}

            <Calendar className="h-3 w-3" style={{ color: '#579dff' }} />
            <h3 style={{ color: '#b6c2cf' }} className="font-medium text-sm">{sprint.name}</h3>
            <span style={{ color: '#8993a4' }} className="text-xs">
              {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
            </span>
            <span style={{ color: '#6b778c' }} className="text-xs">
              ({completedTickets} of {totalTickets} items)
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span
              style={{ backgroundColor: '#579dff', color: '#b6c2cf' }}
              className="px-1.5 py-0.5 rounded text-xs font-medium"
            >
              {totalTickets}
            </span>
            <span
              style={{ backgroundColor: '#22c55e', color: '#b6c2cf' }}
              className="px-1.5 py-0.5 rounded text-xs font-medium"
            >
              {completedTickets}
            </span>
            <span style={{ color: '#8993a4' }} className="text-xs">Complete sprint</span>
            <Button
              variant="ghost"
              size="sm"
              className="p-1"
              style={{ color: '#8993a4' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#b6c2cf';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#8993a4';
              }}
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {isExpanded && (
          <div style={{ backgroundColor: '#161618' }}>
            {sprint.tickets.length === 0 ? (
              <div className="text-center py-8" style={{ color: '#8993a4' }}>
                <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">There's nothing matching this filter</p>
              </div>
            ) : (
              <SortableContext
                items={sprint.tickets.map(t => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div style={{ borderColor: '#2c2c34' }} className="divide-y">
                  {sprint.tickets.map(renderTicket)}
                </div>
              </SortableContext>
            )}

            <div
              className="px-3 py-2"
              style={{
                borderTop: '1px solid #2c2c34',
                backgroundColor: '#1d1d20'
              }}
            >
              <Button
                variant="ghost"
                size="sm"
                className="text-xs px-2 py-1"
                style={{ color: '#8993a4' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#b6c2cf';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#8993a4';
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateTicket?.();
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Create
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }, [expandedSprints, onCreateTicket, renderTicket]);

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div style={{ color: '#8993a4' }}>Loading backlog...</div>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden" style={{ backgroundColor: '#0c0c0c' }}>
      {/* Main Content */}
      <div
        className="flex-1 transition-all duration-300 ease-in-out min-w-0 overflow-x-hidden"
        style={{
          width: sidebarTicketId ? `calc(100% - ${sidebarWidth}px)` : '100%',
          paddingRight: sidebarTicketId ? '12px' : '0px'
        }}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="h-full flex flex-col">
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

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-4 space-y-3">

              {/* Sprints */}
              {filteredSprints.map(renderSprint)}

              {/* Backlog Section */}
              {filteredBacklogTickets.length > 0 && (
                <div
                  style={{ backgroundColor: '#161618', border: '1px solid #2c2c34' }}
                  className="rounded-md overflow-hidden"
                >
                  {/* Backlog Header */}
                  <div
                    className="flex items-center justify-between px-3 py-2"
                    style={{
                      backgroundColor: '#1d1d20',
                      borderBottom: '1px solid #2c2c34'
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <ChevronDown className="h-3 w-3" style={{ color: '#8993a4' }} />
                      <h3 style={{ color: '#b6c2cf' }} className="font-medium text-xs">Backlog</h3>
                      <span style={{ color: '#6b778c' }} className="text-xs">
                        ({filteredBacklogTickets.length} of {allBacklogTickets.length} items)
                      </span>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs px-2 py-1 h-6"
                      style={{ color: '#8993a4' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#b6c2cf';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#8993a4';
                      }}
                    >
                      Start sprint
                    </Button>
                  </div>

                  {/* Backlog Content */}
                  <div style={{ backgroundColor: '#161618' }}>
                    <SortableContext
                      items={filteredBacklogTickets.map(t => t.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div style={{ borderColor: '#2c2c34' }} className="divide-y">
                        {filteredBacklogTickets.map(renderTicket)}
                      </div>
                    </SortableContext>

                    <div
                      className="px-3 py-2"
                      style={{
                        borderTop: '1px solid #2c2c34',
                        backgroundColor: '#1d1d20'
                      }}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs px-2 py-1"
                        style={{ color: '#8993a4' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#b6c2cf';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#8993a4';
                        }}
                        onClick={onCreateTicket}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Create
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-center text-xs py-2" style={{ color: '#6b778c' }}>
                {filteredBacklogTickets.length + filteredSprints.reduce((acc, sprint) => acc + sprint.tickets.length, 0)} of {allBacklogTickets.length + allSprints.reduce((acc, sprint) => acc + sprint.tickets.length, 0)} work items visible
              </div>
            </div>
          </div>
        </DndContext>
      </div>

      {/* Ticket Sidebar */}
      <TicketSidebar
        ticketId={sidebarTicketId || ""}
        organizationId={organizationId}
        projectId={projectId}
        isOpen={!!sidebarTicketId}
        onClose={handleCloseSidebar}
        onUpdateTicket={handleUpdateTicket}
        width={sidebarWidth}
        onWidthChange={handleSidebarWidthChange}
      />
    </div>
  );
}
