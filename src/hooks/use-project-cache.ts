"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Ticket, Sprint } from '@/types';

// Cache configuration
const CACHE_TTL = {
  SHORT: 2 * 60 * 1000,   // 2 minutes
  MEDIUM: 5 * 60 * 1000,  // 5 minutes
  LONG: 10 * 60 * 1000,   // 10 minutes
};

// Cache storage
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const cache = new Map<string, CacheEntry<any>>();

// Cache utilities
const getCacheKey = (type: string, params: Record<string, any>) => {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|');
  return `${type}:${sortedParams}`;
};

const getCachedData = <T>(key: string): T | null => {
  const cached = cache.get(key);
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.timestamp > cached.ttl) {
    cache.delete(key);
    return null;
  }
  
  return cached.data;
};

const setCachedData = <T>(key: string, data: T, ttl: number = CACHE_TTL.MEDIUM) => {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });
};

// Sprint backlog data interface
interface SprintBacklogData {
  sprints: (Sprint & { tickets: Ticket[] })[];
  backlogTickets: Ticket[];
  projectMembers: Array<{
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
      avatarUrl?: string;
    };
  }>;
}

// Ticket list data interface
interface TicketListData {
  tickets: Ticket[];
  totalPages: number;
  currentPage: number;
}

// Hook for sprint backlog data
export function useSprintBacklog(organizationId: string, projectId: string, refreshTrigger?: number) {
  const [data, setData] = useState<SprintBacklogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = useMemo(() => 
    getCacheKey('sprint-backlog', { organizationId, projectId }), 
    [organizationId, projectId]
  );

  const fetchData = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    // Check cache first
    const cachedData = getCachedData<SprintBacklogData>(cacheKey);
    if (cachedData) {
      setData(cachedData);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [sprintsResponse, backlogResponse, membersResponse] = await Promise.all([
        fetch(`/api/organizations/${organizationId}/projects/${projectId}/sprints`),
        fetch(`/api/organizations/${organizationId}/projects/${projectId}/tickets?sprintId=null&limit=1000&sortBy=updatedAt&sortOrder=asc`),
        fetch(`/api/organizations/${organizationId}/projects/${projectId}/members`)
      ]);

      if (sprintsResponse.ok && backlogResponse.ok && membersResponse.ok) {
        const [sprintsData, backlogData, membersData] = await Promise.all([
          sprintsResponse.json(),
          backlogResponse.json(),
          membersResponse.json()
        ]);

        const result: SprintBacklogData = {
          sprints: sprintsData,
          backlogTickets: backlogData.tickets || [],
          projectMembers: membersData
        };

        // Cache the result
        setCachedData(cacheKey, result, CACHE_TTL.LONG);
        setData(result);
      } else {
        throw new Error('Failed to fetch sprint backlog data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [organizationId, projectId, cacheKey]);

  // Fetch data when dependencies change or refresh is triggered
  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger]);

  // Function to update a ticket in the cache
  const updateTicketInCache = useCallback((ticketId: string, updates: Partial<Ticket>) => {
    const cachedData = getCachedData<SprintBacklogData>(cacheKey);
    if (!cachedData) return;

    const updatedData = {
      ...cachedData,
      sprints: cachedData.sprints.map(sprint => ({
        ...sprint,
        tickets: sprint.tickets.map(ticket =>
          ticket.id === ticketId ? { ...ticket, ...updates } : ticket
        )
      })),
      backlogTickets: cachedData.backlogTickets.map(ticket =>
        ticket.id === ticketId ? { ...ticket, ...updates } : ticket
      )
    };

    setCachedData(cacheKey, updatedData, CACHE_TTL.LONG);
    setData(updatedData);
  }, [cacheKey]);

  // Function to reorder tickets in cache without refetching
  const reorderTicketsInCache = useCallback((
    ticketIds: string[],
    sprintId: string | null
  ) => {
    const cachedData = getCachedData<SprintBacklogData>(cacheKey);
    if (!cachedData) return;

    let updatedData = { ...cachedData };

    if (sprintId === null) {
      // Reordering backlog tickets
      const ticketMap = new Map(cachedData.backlogTickets.map(t => [t.id, t]));
      const reorderedTickets = ticketIds.map(id => ticketMap.get(id)).filter(Boolean) as Ticket[];
      updatedData.backlogTickets = reorderedTickets;
    } else {
      // Reordering sprint tickets
      updatedData.sprints = cachedData.sprints.map(sprint => {
        if (sprint.id === sprintId) {
          const ticketMap = new Map(sprint.tickets.map(t => [t.id, t]));
          const reorderedTickets = ticketIds.map(id => ticketMap.get(id)).filter(Boolean) as Ticket[];
          return { ...sprint, tickets: reorderedTickets };
        }
        return sprint;
      });
    }

    setCachedData(cacheKey, updatedData, CACHE_TTL.LONG);
    setData(updatedData);
  }, [cacheKey]);

  // Function to invalidate cache
  const invalidateCache = useCallback(() => {
    cache.delete(cacheKey);
    fetchData();
  }, [cacheKey, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    updateTicketInCache,
    reorderTicketsInCache,
    invalidateCache
  };
}

// Hook for ticket list data
export function useTicketList(
  organizationId: string, 
  projectId?: string, 
  filters?: {
    search?: string;
    status?: string;
    type?: string;
    priority?: string;
    assignee?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
  },
  refreshTrigger?: number
) {
  const [data, setData] = useState<TicketListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = useMemo(() => 
    getCacheKey('ticket-list', { 
      organizationId, 
      projectId: projectId || 'all',
      ...filters 
    }), 
    [organizationId, projectId, filters]
  );

  const fetchData = useCallback(async () => {
    // Check cache first
    const cachedData = getCachedData<TicketListData>(cacheKey);
    if (cachedData) {
      setData(cachedData);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters?.type && filters.type !== 'all') params.append('type', filters.type);
      if (filters?.priority && filters.priority !== 'all') params.append('priority', filters.priority);
      if (filters?.assignee && filters.assignee !== 'all') params.append('assigneeId', filters.assignee);
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);
      if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
      if (filters?.page) params.append('page', filters.page.toString());

      const url = projectId 
        ? `/api/organizations/${organizationId}/projects/${projectId}/tickets?${params}`
        : `/api/organizations/${organizationId}/tickets?${params}`;

      const response = await fetch(url);

      if (response.ok) {
        const result = await response.json();
        
        const ticketListData: TicketListData = {
          tickets: result.tickets || [],
          totalPages: result.totalPages || 1,
          currentPage: result.currentPage || 1
        };

        // Cache the result
        setCachedData(cacheKey, ticketListData, CACHE_TTL.MEDIUM);
        setData(ticketListData);
      } else {
        throw new Error('Failed to fetch ticket list');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [organizationId, projectId, cacheKey, filters]);

  // Fetch data when dependencies change or refresh is triggered
  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger]);

  // Function to update a ticket in the cache
  const updateTicketInCache = useCallback((ticketId: string, updates: Partial<Ticket>) => {
    const cachedData = getCachedData<TicketListData>(cacheKey);
    if (!cachedData) return;

    const updatedData = {
      ...cachedData,
      tickets: cachedData.tickets.map(ticket =>
        ticket.id === ticketId ? { ...ticket, ...updates } : ticket
      )
    };

    setCachedData(cacheKey, updatedData, CACHE_TTL.MEDIUM);
    setData(updatedData);
  }, [cacheKey]);

  // Function to invalidate cache
  const invalidateCache = useCallback(() => {
    cache.delete(cacheKey);
    fetchData();
  }, [cacheKey, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    updateTicketInCache,
    invalidateCache
  };
}

// Utility function to clear all cache
export const clearProjectCache = () => {
  cache.clear();
};

// Utility function to clear cache for specific project
export const clearProjectCacheForProject = (organizationId: string, projectId: string) => {
  const keysToDelete: string[] = [];
  
  cache.forEach((_, key) => {
    if (key.includes(`organizationId:${organizationId}`) && key.includes(`projectId:${projectId}`)) {
      keysToDelete.push(key);
    }
  });
  
  keysToDelete.forEach(key => cache.delete(key));
};
