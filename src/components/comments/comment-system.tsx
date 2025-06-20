"use client";

import React, { useState, useEffect } from 'react';
import { CommentList } from './comment-list';
import { CommentForm } from './comment-form';
import { Comment, User } from '@/types';

interface CommentSystemProps {
  ticketId: string;
  organizationId: string;
  projectId: string;
  currentUser: User;
  projectMembers: Array<{
    user: {
      id: string;
      name: string;
      email: string;
      avatarUrl?: string;
    };
  }>;
}

export function CommentSystem({
  ticketId,
  organizationId,
  projectId,
  currentUser,
  projectMembers
}: CommentSystemProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Fetch comments
  const fetchComments = async (pageNum = 1, append = false) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/organizations/${organizationId}/tickets/${ticketId}/comments?page=${pageNum}&limit=20`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }

      const data = await response.json();
      
      if (append) {
        setComments(prev => [...prev, ...data.comments]);
      } else {
        setComments(data.comments);
      }

      setHasMore(data.pagination.page < data.pagination.pages);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch comments');
    } finally {
      setLoading(false);
    }
  };

  // Load more comments
  const loadMore = () => {
    if (!loading && hasMore) {
      fetchComments(page + 1, true);
    }
  };

  // Add new comment
  const handleAddComment = async (content: any, mentions: string[] = []) => {
    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/tickets/${ticketId}/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content,
            mentions,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      const newComment = await response.json();
      
      // Add new comment to the top of the list
      setComments(prev => [newComment, ...prev]);
      
      return newComment;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to add comment');
    }
  };

  // Add reply to comment
  const handleAddReply = async (parentId: string, content: any, mentions: string[] = []) => {
    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/tickets/${ticketId}/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content,
            mentions,
            parentId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to add reply');
      }

      const newReply = await response.json();

      // Add reply to the parent comment
      setComments(prev => prev.map(comment =>
        comment.id === parentId
          ? {
              ...comment,
              replies: [...(comment.replies || []), newReply],
              _count: { ...comment._count, replies: (comment._count?.replies || 0) + 1 }
            }
          : comment
      ));

      return newReply;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to add reply');
    }
  };

  // Edit comment
  const handleEditComment = async (commentId: string, content: any, mentions: string[] = []) => {
    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/tickets/${ticketId}/comments/${commentId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content,
            mentions,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to edit comment');
      }

      const updatedComment = await response.json();
      
      // Update comment in the list
      setComments(prev => prev.map(comment =>
        comment.id === commentId
          ? updatedComment
          : {
              ...comment,
              replies: comment.replies?.map(reply =>
                reply.id === commentId ? updatedComment : reply
              )
            }
      ));
      
      return updatedComment;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to edit comment');
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId: string) => {
    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/tickets/${ticketId}/comments/${commentId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete comment');
      }

      // Remove comment from the list
      setComments(prev => prev.filter(comment => {
        if (comment.id === commentId) {
          return false;
        }
        // Also remove from replies
        comment.replies = comment.replies?.filter(reply => reply.id !== commentId);
        return true;
      }));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete comment');
    }
  };

  // Initial load
  useEffect(() => {
    fetchComments();
  }, [ticketId]);

  if (error) {
    return (
      <div className="p-4 text-center text-red-400">
        <p>Error loading comments: {error}</p>
        <button 
          onClick={() => fetchComments()} 
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Comment Form */}
      <CommentForm
        onSubmit={handleAddComment}
        projectMembers={projectMembers}
        placeholder="Add a comment..."
        submitText="Comment"
      />

      {/* Comments List */}
      <CommentList
        comments={comments}
        currentUser={currentUser}
        projectMembers={projectMembers}
        onAddReply={handleAddReply}
        onEditComment={handleEditComment}
        onDeleteComment={handleDeleteComment}
        loading={loading}
      />

      {/* Load More Button */}
      {hasMore && !loading && (
        <div className="text-center">
          <button
            onClick={loadMore}
            className="px-4 py-2 text-sm text-blue-400 hover:text-blue-300 hover:bg-gray-800 rounded"
          >
            Load more comments
          </button>
        </div>
      )}

      {/* Loading indicator */}
      {loading && comments.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          Loading comments...
        </div>
      )}

      {/* No comments message */}
      {!loading && comments.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          No comments yet. Be the first to comment!
        </div>
      )}
    </div>
  );
}
