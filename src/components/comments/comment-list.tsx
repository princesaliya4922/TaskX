"use client";

import React from 'react';
import { CommentItem } from './comment-item';
import { Comment, User } from '@/types';

interface CommentListProps {
  comments: Comment[];
  currentUser: User;
  projectMembers: Array<{
    user: {
      id: string;
      name: string;
      email: string;
      avatarUrl?: string;
    };
  }>;
  onAddReply: (parentId: string, content: any, mentions: string[]) => Promise<any>;
  onEditComment: (commentId: string, content: any, mentions: string[]) => Promise<any>;
  onDeleteComment: (commentId: string) => Promise<void>;
  loading?: boolean;
}

export function CommentList({
  comments,
  currentUser,
  projectMembers,
  onAddReply,
  onEditComment,
  onDeleteComment,
  loading = false
}: CommentListProps) {
  if (loading && comments.length === 0) {
    return (
      <div className="space-y-4">
        {/* Loading skeleton */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="flex space-x-3">
              <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>No comments yet. Be the first to comment!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          currentUser={currentUser}
          projectMembers={projectMembers}
          onAddReply={onAddReply}
          onEditComment={onEditComment}
          onDeleteComment={onDeleteComment}
          level={0}
        />
      ))}
    </div>
  );
}
