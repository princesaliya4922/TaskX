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
          "prose-headings:font-semibold prose-headings:text-gray-200 prose-headings:mt-4 prose-headings:mb-2",
          "prose-p:text-gray-300 prose-p:leading-relaxed prose-p:my-2",
          "prose-li:text-gray-300 prose-li:my-1",
          "prose-strong:text-gray-200 prose-strong:font-semibold",
          "prose-em:text-gray-300 prose-em:italic",
          "prose-code:text-gray-200 prose-code:bg-gray-700 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm",
          "prose-pre:bg-gray-700 prose-pre:border prose-pre:border-gray-600 prose-pre:rounded-lg prose-pre:p-4",
          "prose-blockquote:text-gray-400 prose-blockquote:border-l-4 prose-blockquote:border-l-blue-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:bg-gray-700/30 prose-blockquote:py-2 prose-blockquote:rounded-r",
          "prose-ul:my-2 prose-ol:my-2",
          "prose-li:marker:text-gray-500",
          "prose-table:border-collapse prose-table:border prose-table:border-gray-600 prose-table:rounded-lg prose-table:overflow-hidden",
          "prose-th:border prose-th:border-gray-600 prose-th:bg-gray-700 prose-th:p-3 prose-th:text-left prose-th:font-semibold prose-th:text-gray-200",
          "prose-td:border prose-td:border-gray-600 prose-td:p-3 prose-td:text-gray-300",
          "prose-img:rounded-lg prose-img:shadow-sm prose-img:border prose-img:border-gray-600 prose-img:!max-w-32 prose-img:h-auto prose-img:cursor-pointer hover:prose-img:opacity-80 prose-img:transition-opacity",
          "[&_img]:!max-w-32 [&_img]:!w-auto [&_img]:h-auto [&_img]:cursor-pointer [&_img]:rounded-lg [&_img]:!important",
          "[&_.ProseMirror_img]:!max-w-32 [&_.ProseMirror_img]:!w-auto [&_.ProseMirror_img]:h-auto",
          "prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline hover:prose-a:text-blue-300",
          // Task list styles
          "[&_.ProseMirror]:focus:outline-none",
          "[&_ul[data-type='taskList']]:list-none [&_ul[data-type='taskList']]:pl-0",
          "[&_li[data-type='taskItem']]:flex [&_li[data-type='taskItem']]:items-start [&_li[data-type='taskItem']]:gap-2",
          "[&_li[data-type='taskItem']>label]:flex [&_li[data-type='taskItem']>label]:items-center [&_li[data-type='taskItem']>label]:gap-2",
          "[&_li[data-type='taskItem']>label>input]:mt-0 [&_li[data-type='taskItem']>label>input]:mr-2",
          "[&_li[data-type='taskItem']>div]:flex-1",
          // Highlight styles
          "[&_mark]:bg-yellow-200 [&_mark]:px-1 [&_mark]:rounded",
          // Better spacing
          "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
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
