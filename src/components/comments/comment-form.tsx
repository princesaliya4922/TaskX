"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RichTextEditor } from '@/components/ui/rich-text-editor';

interface CommentFormProps {
  onSubmit: (content: any, mentions: string[]) => Promise<any>;
  projectMembers: Array<{
    user: {
      id: string;
      name: string;
      email: string;
      avatarUrl?: string;
    };
  }>;
  placeholder?: string;
  submitText?: string;
  initialContent?: any;
  onCancel?: () => void;
  isReply?: boolean;
  className?: string;
  replyToUser?: {
    id: string;
    name: string;
  };
}

export function CommentForm({
  onSubmit,
  projectMembers,
  placeholder = "Write a comment...",
  submitText = "Comment",
  initialContent = "",
  onCancel,
  isReply = false,
  className = "",
  replyToUser
}: CommentFormProps) {
  const [content, setContent] = useState(initialContent);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract mentions from rich text content
  const extractMentions = (richContent: any): string[] => {
    const mentions: string[] = [];

    if (typeof richContent === 'object' && richContent?.content) {
      function findMentions(node: any) {
        if (node.type === 'mention' && node.attrs?.id) {
          mentions.push(node.attrs.id);
        }
        if (node.content && Array.isArray(node.content)) {
          node.content.forEach(findMentions);
        }
      }

      if (Array.isArray(richContent.content)) {
        richContent.content.forEach(findMentions);
      }
    }

    return mentions;
  };

  // Check if content has meaningful text
  const hasContent = (richContent: any): boolean => {
    if (typeof richContent === 'string') {
      return richContent.trim().length > 0;
    }

    if (typeof richContent === 'object' && richContent?.content) {
      // Check if there's any text content in the rich text
      function hasText(node: any): boolean {
        if (node.type === 'text' && node.text && node.text.trim()) {
          return true;
        }
        if (node.type === 'image') {
          return true; // Images count as content
        }
        if (node.content && Array.isArray(node.content)) {
          return node.content.some(hasText);
        }
        return false;
      }

      if (Array.isArray(richContent.content)) {
        return richContent.content.some(hasText);
      }
    }

    return false;
  };

  const handleSubmit = async () => {
    if (!hasContent(content)) {
      setError('Please enter some content');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const mentions = extractMentions(content);
      await onSubmit(content, mentions);
      setContent(""); // Reset form
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setContent(initialContent);
    setError(null);
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Rich Text Editor */}
      <div className="relative">
        <RichTextEditor
          content={content}
          onChange={setContent}
          placeholder={placeholder}
          className={`min-h-[100px] ${isReply ? 'min-h-[80px]' : ''}`}
          style={{
            backgroundColor: '#2c2c34',
            borderColor: '#44474a',
            color: '#b6c2cf'
          }}
          projectMembers={projectMembers.map(member => ({
            id: member.user.id,
            name: member.user.name,
            email: member.user.email,
            avatarUrl: member.user.avatarUrl
          }))}
          autoMention={replyToUser}
        />
        
        {/* Error message */}
        {error && (
          <div className="mt-2 text-sm text-red-400">
            {error}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex justify-end space-x-2">
        {onCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-300 hover:bg-gray-800"
          >
            Cancel
          </Button>
        )}
        
        <Button
          onClick={handleSubmit}
          disabled={!hasContent(content) || isSubmitting}
          size="sm"
          className="text-white font-medium"
          style={{ 
            backgroundColor: '#579dff',
            opacity: (!hasContent(content) || isSubmitting) ? 0.5 : 1
          }}
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = '#4c8ce8';
            }
          }}
          onMouseLeave={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = '#579dff';
            }
          }}
        >
          {isSubmitting ? 'Submitting...' : submitText}
        </Button>
      </div>
    </div>
  );
}
