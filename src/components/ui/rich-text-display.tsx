"use client";

import React, { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface RichTextDisplayProps {
  content?: string;
  className?: string;
  onImageClick?: (src: string) => void;
}

export function RichTextDisplay({
  content = "",
  className,
  onImageClick,
}: RichTextDisplayProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-sm h-auto rounded-lg my-2 block cursor-pointer hover:opacity-80 transition-opacity",
        },
        inline: false,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: "text-blue-400 underline cursor-pointer hover:text-blue-300",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Underline,
      Table.configure({
        resizable: false,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content,
    editable: false,
    immediatelyRender: false,
  });

  // Add click handler for images to open modal
  useEffect(() => {
    const handleImageClick = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'IMG') {
        event.preventDefault();
        event.stopPropagation(); // Prevent parent click handlers
        event.stopImmediatePropagation(); // Stop all other handlers
        const src = target.getAttribute('src');
        if (src) {
          if (onImageClick) {
            onImageClick(src);
          } else {
            setSelectedImage(src);
          }
        }
      }
    };

    // Use document-level event delegation for better reliability
    document.addEventListener('click', handleImageClick, true); // Use capture phase

    return () => {
      document.removeEventListener('click', handleImageClick, true);
    };
  }, [onImageClick]);

  if (!editor) {
    return null;
  }

  // If no content, show placeholder
  if (!content || content.trim() === "" || content === "<p></p>" || content === "<p><br></p>") {
    return (
      <div className={cn("text-gray-500 italic", className)}>
        No description provided
      </div>
    );
  }

  return (
    <div className={cn("", className)}>
      <EditorContent
        editor={editor}
        className={cn(
          "prose prose-sm max-w-none focus:outline-none",
          // Reset default prose styles
          "prose-p:m-0 prose-p:p-0",
          "prose-ul:m-0 prose-ul:p-0 prose-ol:m-0 prose-ol:p-0",
          "prose-li:m-0 prose-li:p-0",
          // Custom spacing and line height - more compact
          "[&_p]:text-gray-300 [&_p]:leading-4 [&_p]:mb-1 [&_p]:last:mb-0",
          "[&_h1]:text-gray-200 [&_h1]:font-semibold [&_h1]:text-lg [&_h1]:leading-5 [&_h1]:mb-2 [&_h1]:mt-3 [&_h1]:first:mt-0",
          "[&_h2]:text-gray-200 [&_h2]:font-semibold [&_h2]:text-base [&_h2]:leading-4 [&_h2]:mb-1 [&_h2]:mt-2 [&_h2]:first:mt-0",
          "[&_h3]:text-gray-200 [&_h3]:font-semibold [&_h3]:text-sm [&_h3]:leading-4 [&_h3]:mb-1 [&_h3]:mt-2 [&_h3]:first:mt-0",
          // Lists with proper formatting - more compact
          "[&_ul]:list-disc [&_ul]:pl-4 [&_ul]:mb-1 [&_ul]:last:mb-0",
          "[&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:mb-1 [&_ol]:last:mb-0",
          "[&_li]:text-gray-300 [&_li]:leading-4 [&_li]:mb-0.5 [&_li]:last:mb-0",
          "[&_li]:marker:text-gray-500",
          "[&_ul_ul]:list-circle [&_ul_ul_ul]:list-square",
          "[&_ul_ul]:mt-1 [&_ol_ol]:mt-1",
          // Text formatting
          "[&_strong]:text-gray-200 [&_strong]:font-semibold",
          "[&_em]:text-gray-300 [&_em]:italic",
          "[&_u]:text-gray-300 [&_u]:underline",
          // Code
          "[&_code]:text-gray-200 [&_code]:bg-gray-700 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm",
          "[&_pre]:bg-gray-700 [&_pre]:border [&_pre]:border-gray-600 [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:mb-2",
          // Blockquotes
          "[&_blockquote]:text-gray-400 [&_blockquote]:border-l-4 [&_blockquote]:border-l-blue-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:bg-gray-700/30 [&_blockquote]:py-2 [&_blockquote]:rounded-r [&_blockquote]:mb-2",
          // Tables
          "[&_table]:border-collapse [&_table]:border [&_table]:border-gray-600 [&_table]:rounded-lg [&_table]:overflow-hidden [&_table]:mb-2",
          "[&_th]:border [&_th]:border-gray-600 [&_th]:bg-gray-700 [&_th]:p-3 [&_th]:text-left [&_th]:font-semibold [&_th]:text-gray-200",
          "[&_td]:border [&_td]:border-gray-600 [&_td]:p-3 [&_td]:text-gray-300",
          // Images - small but readable
          "[&_img]:rounded [&_img]:shadow-sm [&_img]:border [&_img]:border-gray-600 [&_img]:max-w-20 [&_img]:max-h-20 [&_img]:w-auto [&_img]:h-auto [&_img]:cursor-pointer [&_img]:transition-opacity [&_img]:mb-1",
          "[&_img]:hover:opacity-80",
          // Links
          "[&_a]:text-blue-400 [&_a]:no-underline [&_a]:hover:underline [&_a]:hover:text-blue-300",
          // Task list styles
          "[&_ul[data-type='taskList']]:list-none [&_ul[data-type='taskList']]:pl-0",
          "[&_li[data-type='taskItem']]:flex [&_li[data-type='taskItem']]:items-start [&_li[data-type='taskItem']]:gap-2 [&_li[data-type='taskItem']]:mb-1",
          "[&_li[data-type='taskItem']>label]:flex [&_li[data-type='taskItem']>label]:items-center [&_li[data-type='taskItem']>label]:gap-2",
          "[&_li[data-type='taskItem']>label>input]:mt-0 [&_li[data-type='taskItem']>label>input]:mr-2",
          "[&_li[data-type='taskItem']>div]:flex-1",
          // Highlight styles
          "[&_mark]:bg-yellow-200 [&_mark]:text-gray-900 [&_mark]:px-1 [&_mark]:rounded",
          // Remove default margins from first and last elements
          "[&>*:first-child]:mt-0",
          "[&>*:last-child]:mb-0"
        )}
      />

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <img
              src={selectedImage}
              alt="Full size image"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white border-none"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to extract plain text from rich text content for previews
export function extractPlainText(richTextContent: string): string {
  if (!richTextContent) return "";
  
  // Create a temporary div to parse HTML
  if (typeof window !== "undefined") {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = richTextContent;
    return tempDiv.textContent || tempDiv.innerText || "";
  }
  
  // Server-side fallback - basic HTML tag removal
  return richTextContent
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Helper function to truncate rich text content for previews
export function truncateRichText(richTextContent: string, maxLength: number = 150): string {
  const plainText = extractPlainText(richTextContent);
  if (plainText.length <= maxLength) return plainText;
  return plainText.substring(0, maxLength).trim() + "...";
}
