"use client";

import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MoreHorizontal, Reply, Edit, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RichTextDisplay } from '@/components/ui/rich-text-display';
import { CommentForm } from './comment-form';
import { Comment, User } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CommentItemProps {
  comment: Comment;
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
  level: number;
}

export function CommentItem({
  comment,
  currentUser,
  projectMembers,
  onAddReply,
  onEditComment,
  onDeleteComment,
  level
}: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAuthor = comment.author.id === currentUser.id;
  const hasReplies = comment.replies && comment.replies.length > 0;
  const replyCount = comment._count?.replies || comment.replies?.length || 0;

  // Handle reply submission
  const handleReplySubmit = async (content: any, mentions: string[]) => {
    try {
      await onAddReply(comment.id, content, mentions);
      setShowReplyForm(false);
    } catch (error) {
      throw error; // Let CommentForm handle the error
    }
  };

  // Handle edit submission
  const handleEditSubmit = async (content: any, mentions: string[]) => {
    try {
      await onEditComment(comment.id, content, mentions);
      setIsEditing(false);
    } catch (error) {
      throw error; // Let CommentForm handle the error
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDeleteComment(comment.id);
    } catch (error) {
      console.error('Failed to delete comment:', error);
      alert('Failed to delete comment. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate indentation for nested comments
  const maxLevel = 3; // Maximum nesting level
  const actualLevel = Math.min(level, maxLevel);
  const marginLeft = actualLevel * 24; // 24px per level

  return (
    <div 
      className="group"
      style={{ marginLeft: `${marginLeft}px` }}
    >
      {/* Main Comment */}
      <div className="flex space-x-3">
        {/* Avatar */}
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={comment.author.avatarUrl} />
          <AvatarFallback style={{ backgroundColor: '#44474a', color: '#b6c2cf' }}>
            {comment.author.name?.charAt(0) || comment.author.email.charAt(0)}
          </AvatarFallback>
        </Avatar>

        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-medium text-sm" style={{ color: '#b6c2cf' }}>
              {comment.author.name || comment.author.email}
            </span>
            <span className="text-xs" style={{ color: '#8993a4' }}>
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
            {comment.isEdited && (
              <span className="text-xs" style={{ color: '#8993a4' }}>
                (edited)
              </span>
            )}
          </div>

          {/* Comment Body */}
          {isEditing ? (
            <CommentForm
              onSubmit={handleEditSubmit}
              projectMembers={projectMembers}
              placeholder="Edit your comment..."
              submitText="Save"
              initialContent={comment.content}
              onCancel={() => setIsEditing(false)}
              className="mt-2"
            />
          ) : (
            <div className="prose prose-sm max-w-none" style={{ color: '#b6c2cf' }}>
              <RichTextDisplay
                content={comment.content}
                className="text-sm leading-relaxed"
              />
            </div>
          )}

          {/* Actions */}
          {!isEditing && (
            <div className="flex items-center space-x-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="text-xs h-6 px-2 text-gray-400 hover:text-gray-300 hover:bg-gray-800"
              >
                <Reply className="w-3 h-3 mr-1" />
                Reply
              </Button>

              {hasReplies && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplies(!showReplies)}
                  className="text-xs h-6 px-2 text-gray-400 hover:text-gray-300 hover:bg-gray-800"
                >
                  {showReplies ? (
                    <ChevronDown className="w-3 h-3 mr-1" />
                  ) : (
                    <ChevronRight className="w-3 h-3 mr-1" />
                  )}
                  {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                </Button>
              )}

              {isAuthor && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-6 w-6 p-0 text-gray-400 hover:text-gray-300 hover:bg-gray-800"
                    >
                      <MoreHorizontal className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="start" 
                    className="w-32"
                    style={{ backgroundColor: '#2c2c34', borderColor: '#44474a' }}
                  >
                    <DropdownMenuItem
                      onClick={() => setIsEditing(true)}
                      className="text-sm text-gray-300 hover:bg-gray-700"
                    >
                      <Edit className="w-3 h-3 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="text-sm text-red-400 hover:bg-gray-700"
                    >
                      <Trash2 className="w-3 h-3 mr-2" />
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}

          {/* Reply Form */}
          {showReplyForm && !isEditing && (
            <div className="mt-3">
              <CommentForm
                onSubmit={handleReplySubmit}
                projectMembers={projectMembers}
                placeholder="Write a reply..."
                submitText="Reply"
                onCancel={() => setShowReplyForm(false)}
                isReply={true}
                replyToUser={{
                  id: comment.author.id,
                  name: comment.author.name || comment.author.email
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Replies */}
      {hasReplies && showReplies && !isEditing && (
        <div className="mt-3 space-y-3">
          {comment.replies?.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUser={currentUser}
              projectMembers={projectMembers}
              onAddReply={onAddReply}
              onEditComment={onEditComment}
              onDeleteComment={onDeleteComment}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
