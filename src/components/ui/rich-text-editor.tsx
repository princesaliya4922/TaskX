"use client";

import React, { useCallback, useState, useEffect } from "react";
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
import Placeholder from "@tiptap/extension-placeholder";
import Mention from "@tiptap/extension-mention";
import { useDropzone } from "react-dropzone";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Highlighter,
  CheckSquare,
  Upload,
  Type,
  Minus,
  ChevronDown,
  MoreHorizontal,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// Mention List Component
class MentionList {
  items: any[];
  command: any;
  selectedIndex: number;
  element: HTMLElement | null;

  constructor(props: any) {
    this.items = props.items;
    this.command = props.command;
    this.selectedIndex = 0;
    this.element = null;
  }

  updateProps(props: any) {
    this.items = props.items;
    this.command = props.command;
    this.selectedIndex = 0;
    this.render();
  }

  render(element?: HTMLElement) {
    if (element) {
      this.element = element;
    }

    if (!this.element) return;

    this.element.innerHTML = '';

    if (this.items.length === 0) {
      const noResults = document.createElement('div');
      noResults.className = 'text-gray-400 text-sm p-2';
      noResults.textContent = 'No users found';
      this.element.appendChild(noResults);
      return;
    }

    this.items.forEach((item, index) => {
      const button = document.createElement('button');
      button.className = `w-full text-left p-2 rounded hover:bg-gray-700 flex items-center gap-2 ${
        index === this.selectedIndex ? 'bg-gray-700' : ''
      }`;

      const avatar = document.createElement('div');
      avatar.className = 'w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs';
      avatar.textContent = item.name.charAt(0).toUpperCase();

      const info = document.createElement('div');
      info.innerHTML = `
        <div class="text-sm text-gray-200">${item.name}</div>
        <div class="text-xs text-gray-400">${item.email}</div>
      `;

      button.appendChild(avatar);
      button.appendChild(info);

      button.addEventListener('click', () => {
        this.selectItem(index);
      });

      this.element.appendChild(button);
    });
  }

  onKeyDown({ event }: { event: KeyboardEvent }) {
    if (event.key === 'ArrowUp') {
      this.upHandler();
      return true;
    }

    if (event.key === 'ArrowDown') {
      this.downHandler();
      return true;
    }

    if (event.key === 'Enter') {
      this.enterHandler();
      return true;
    }

    return false;
  }

  upHandler() {
    this.selectedIndex = ((this.selectedIndex + this.items.length) - 1) % this.items.length;
    this.render();
  }

  downHandler() {
    this.selectedIndex = (this.selectedIndex + 1) % this.items.length;
    this.render();
  }

  enterHandler() {
    this.selectItem(this.selectedIndex);
  }

  selectItem(index: number) {
    const item = this.items[index];
    if (item) {
      this.command({ id: item.id, label: item.name });
    }
  }

  destroy() {
    // Cleanup if needed
  }
}

interface RichTextEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  editable?: boolean;
  projectMembers?: Array<{
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  }>;
}

export function RichTextEditor({
  content = "",
  onChange,
  placeholder = "Start typing...",
  className,
  editable = true,
  projectMembers = [],
}: RichTextEditorProps) {
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
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
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-400 underline cursor-pointer hover:text-blue-300",
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
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
      Mention.configure({
        HTMLAttributes: {
          class: "mention bg-blue-600 text-white px-1 py-0.5 rounded text-sm",
        },
        suggestion: {
          items: ({ query }) => {
            return projectMembers
              .filter(member =>
                (member.name && member.name.toLowerCase().includes(query.toLowerCase())) ||
                (member.email && member.email.toLowerCase().includes(query.toLowerCase()))
              )
              .slice(0, 5);
          },
          render: () => {
            let component: any;
            let popup: any;

            return {
              onStart: (props: any) => {
                component = new MentionList(props);
                popup = document.createElement('div');
                popup.className = 'mention-popup bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-2 z-50 max-h-48 overflow-y-auto fixed';
                popup.style.position = 'fixed';
                popup.style.zIndex = '9999';
                popup.style.minWidth = '200px';
                document.body.appendChild(popup);
                component.render(popup);

                // Position the popup
                const { range } = props;
                if (range) {
                  const { from } = range;
                  const start = editor?.view.coordsAtPos(from);
                  if (start) {
                    popup.style.left = `${start.left}px`;
                    popup.style.top = `${start.bottom + 5}px`;
                  }
                }
              },
              onUpdate: (props: any) => {
                component.updateProps(props);

                // Reposition the popup
                const { range } = props;
                if (range && popup) {
                  const { from } = range;
                  const start = editor?.view.coordsAtPos(from);
                  if (start) {
                    popup.style.left = `${start.left}px`;
                    popup.style.top = `${start.bottom + 5}px`;
                  }
                }
              },
              onKeyDown: (props: any) => {
                return component.onKeyDown(props);
              },
              onExit: () => {
                if (popup) {
                  popup.remove();
                }
                component?.destroy();
              },
            };
          },
        },
      }),
    ],
    content,
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    onCreate: ({ editor }) => {
      // Ensure there's always a paragraph after images
      editor.on('update', () => {
        const { state } = editor;
        const { doc } = state;

        doc.descendants((node, pos) => {
          if (node.type.name === 'image') {
            const nextPos = pos + node.nodeSize;
            const nextNode = doc.nodeAt(nextPos);

            if (!nextNode || nextNode.type.name !== 'paragraph') {
              editor.chain().focus(nextPos).insertContent('<p></p>').run();
            }
          }
        });
      });
    },
  });

  // Add click handler for images to open modal
  useEffect(() => {
    if (!editor) return;

    const handleImageClick = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'IMG') {
        event.preventDefault();
        const src = target.getAttribute('src');
        if (src) {
          setSelectedImage(src);
        }
      }
    };

    const editorElement = editor.view.dom;
    editorElement.addEventListener('click', handleImageClick);

    return () => {
      editorElement.removeEventListener('click', handleImageClick);
    };
  }, [editor]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file && file.type.startsWith("image/")) {
        const formData = new FormData();
        formData.append("file", file);

        try {
          const response = await fetch("/api/upload/image", {
            method: "POST",
            body: formData,
          });

          if (response.ok) {
            const { url } = await response.json();
            console.log('Image uploaded via drag & drop:', url);

            // Insert image with proper positioning
            if (editor) {
              // Insert image using insertContent
              editor.chain()
                .focus()
                .insertContent(`<p><img src="${url}" alt="Uploaded image" class="max-w-sm h-auto rounded-lg my-2 block cursor-pointer hover:opacity-80 transition-opacity" /></p><p></p>`)
                .run();
            }
          } else {
            console.error('Failed to upload image via drag & drop:', response.statusText);
          }
        } catch (error) {
          console.error("Error uploading image via drag & drop:", error);
        }
      }
    },
    [editor]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
    multiple: false,
    noClick: true,
  });

  const addImage = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const formData = new FormData();
        formData.append('file', file);

        try {
          const response = await fetch('/api/upload/image', {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            const { url } = await response.json();
            console.log('Image uploaded successfully:', url);

            // Insert image with proper positioning
            if (editor) {
              // Insert image using insertContent
              editor.chain()
                .focus()
                .insertContent(`<p><img src="${url}" alt="Uploaded image" class="max-w-sm h-auto rounded-lg my-2 block cursor-pointer hover:opacity-80 transition-opacity" /></p><p></p>`)
                .run();
            }
          } else {
            console.error('Failed to upload image:', response.statusText);
          }
        } catch (error) {
          console.error('Error uploading image:', error);
        }
      }
    };
    input.click();
  }, [editor]);

  const setLink = useCallback(() => {
    if (linkUrl) {
      editor?.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl("");
      setShowLinkInput(false);
    }
  }, [editor, linkUrl]);

  const addTable = useCallback(() => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  if (!editor) {
    return (
      <div className={cn("h-32 bg-gray-800 border border-gray-700 rounded animate-pulse", className)} />
    );
  }

  // Jira-style dropdown components
  const TextStyleDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-3 text-gray-400 hover:text-gray-200 hover:bg-gray-700 flex items-center gap-1"
        >
          <Type className="h-4 w-4" />
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-gray-800 border-gray-700">
        <DropdownMenuItem
          onClick={() => {
            editor?.chain().focus().setParagraph().run();
          }}
          className="text-gray-200 hover:bg-gray-700"
        >
          Normal text
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            editor?.chain().focus().toggleHeading({ level: 1 }).run();
          }}
          className="text-gray-200 hover:bg-gray-700"
        >
          <Heading1 className="h-4 w-4 mr-2" />
          Heading 1
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            editor?.chain().focus().toggleHeading({ level: 2 }).run();
          }}
          className="text-gray-200 hover:bg-gray-700"
        >
          <Heading2 className="h-4 w-4 mr-2" />
          Heading 2
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            editor?.chain().focus().toggleHeading({ level: 3 }).run();
          }}
          className="text-gray-200 hover:bg-gray-700"
        >
          <Heading3 className="h-4 w-4 mr-2" />
          Heading 3
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-gray-700" />
        <DropdownMenuItem
          onClick={() => {
            editor?.chain().focus().toggleBold().run();
          }}
          className="text-gray-200 hover:bg-gray-700"
        >
          <Bold className="h-4 w-4 mr-2" />
          Bold
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            editor?.chain().focus().toggleItalic().run();
          }}
          className="text-gray-200 hover:bg-gray-700"
        >
          <Italic className="h-4 w-4 mr-2" />
          Italic
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            editor?.chain().focus().toggleUnderline().run();
          }}
          className="text-gray-200 hover:bg-gray-700"
        >
          <UnderlineIcon className="h-4 w-4 mr-2" />
          Underline
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            editor?.chain().focus().toggleStrike().run();
          }}
          className="text-gray-200 hover:bg-gray-700"
        >
          <Strikethrough className="h-4 w-4 mr-2" />
          Strikethrough
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            editor?.chain().focus().toggleCode().run();
          }}
          className="text-gray-200 hover:bg-gray-700"
        >
          <Code className="h-4 w-4 mr-2" />
          Inline code
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const MoreOptionsDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-3 text-gray-400 hover:text-gray-200 hover:bg-gray-700 flex items-center gap-1"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-gray-800 border-gray-700">
        <DropdownMenuItem
          onClick={() => {
            editor?.chain().focus().toggleBlockquote().run();
          }}
          className="text-gray-200 hover:bg-gray-700"
        >
          <Quote className="h-4 w-4 mr-2" />
          Quote
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            editor?.chain().focus().setHorizontalRule().run();
          }}
          className="text-gray-200 hover:bg-gray-700"
        >
          <Minus className="h-4 w-4 mr-2" />
          Divider
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-gray-700" />
        <DropdownMenuItem
          onClick={() => {
            editor?.chain().focus().setTextAlign('left').run();
          }}
          className="text-gray-200 hover:bg-gray-700"
        >
          <AlignLeft className="h-4 w-4 mr-2" />
          Align left
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            editor?.chain().focus().setTextAlign('center').run();
          }}
          className="text-gray-200 hover:bg-gray-700"
        >
          <AlignCenter className="h-4 w-4 mr-2" />
          Align center
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            editor?.chain().focus().setTextAlign('right').run();
          }}
          className="text-gray-200 hover:bg-gray-700"
        >
          <AlignRight className="h-4 w-4 mr-2" />
          Align right
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const TextColorDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-3 text-gray-400 hover:text-gray-200 hover:bg-gray-700 flex items-center gap-1"
        >
          <Palette className="h-4 w-4" />
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-gray-800 border-gray-700">
        <DropdownMenuItem
          onClick={() => {
            editor?.chain().focus().setColor('#ffffff').run();
          }}
          className="text-gray-200 hover:bg-gray-700"
        >
          <div className="w-4 h-4 bg-white rounded mr-2"></div>
          White
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            editor?.chain().focus().setColor('#ef4444').run();
          }}
          className="text-gray-200 hover:bg-gray-700"
        >
          <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
          Red
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            editor?.chain().focus().setColor('#3b82f6').run();
          }}
          className="text-gray-200 hover:bg-gray-700"
        >
          <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
          Blue
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            editor?.chain().focus().setColor('#10b981').run();
          }}
          className="text-gray-200 hover:bg-gray-700"
        >
          <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
          Green
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            editor?.chain().focus().setColor('#f59e0b').run();
          }}
          className="text-gray-200 hover:bg-gray-700"
        >
          <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
          Yellow
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-gray-700" />
        <DropdownMenuItem
          onClick={() => {
            editor?.chain().focus().toggleHighlight().run();
          }}
          className="text-gray-200 hover:bg-gray-700"
        >
          <Highlighter className="h-4 w-4 mr-2" />
          Highlight
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const ListDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-3 text-gray-400 hover:text-gray-200 hover:bg-gray-700 flex items-center gap-1"
        >
          <List className="h-4 w-4" />
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-gray-800 border-gray-700">
        <DropdownMenuItem
          onClick={() => {
            editor?.chain().focus().toggleBulletList().run();
          }}
          className="text-gray-200 hover:bg-gray-700"
        >
          <List className="h-4 w-4 mr-2" />
          Bullet list
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            editor?.chain().focus().toggleOrderedList().run();
          }}
          className="text-gray-200 hover:bg-gray-700"
        >
          <ListOrdered className="h-4 w-4 mr-2" />
          Numbered list
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            editor?.chain().focus().toggleTaskList().run();
          }}
          className="text-gray-200 hover:bg-gray-700"
        >
          <CheckSquare className="h-4 w-4 mr-2" />
          Task list
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const InsertDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-3 text-gray-400 hover:text-gray-200 hover:bg-gray-700 flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-gray-800 border-gray-700">
        <DropdownMenuItem
          onClick={() => {
            addImage();
          }}
          className="text-gray-200 hover:bg-gray-700"
        >
          <ImageIcon className="h-4 w-4 mr-2" />
          Image
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            setShowLinkInput(true);
          }}
          className="text-gray-200 hover:bg-gray-700"
        >
          <LinkIcon className="h-4 w-4 mr-2" />
          Link
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            addTable();
          }}
          className="text-gray-200 hover:bg-gray-700"
        >
          <TableIcon className="h-4 w-4 mr-2" />
          Table
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (!editable) {
    return (
      <div className={cn("prose prose-sm max-w-none text-gray-300", className)}>
        <EditorContent editor={editor} />
      </div>
    );
  }

  return (
    <div className={cn("border border-gray-700 rounded-lg bg-gray-800 overflow-hidden", className)}>
      {/* Jira-style Toolbar */}
      <div className="border-b border-gray-700 bg-gray-800 p-2">
        <div className="flex items-center gap-1">
          <TextStyleDropdown />
          <MoreOptionsDropdown />
          <TextColorDropdown />
          <ListDropdown />
          <InsertDropdown />

          <Separator orientation="vertical" className="h-6 bg-gray-600 mx-2" />

          {/* Undo/Redo */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              editor?.chain().focus().undo().run();
            }}
            disabled={!editor?.can().undo()}
            title="Undo (Ctrl+Z)"
            className="h-8 w-8 p-0 text-gray-400 hover:text-gray-200 hover:bg-gray-700 disabled:opacity-50"
          >
            <Undo className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              editor?.chain().focus().redo().run();
            }}
            disabled={!editor?.can().redo()}
            title="Redo (Ctrl+Y)"
            className="h-8 w-8 p-0 text-gray-400 hover:text-gray-200 hover:bg-gray-700 disabled:opacity-50"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Link Popup */}
      <Popover open={showLinkInput} onOpenChange={setShowLinkInput}>
        <PopoverTrigger asChild>
          <div style={{ display: 'none' }} />
        </PopoverTrigger>
        <PopoverContent className="w-80 bg-gray-800 border-gray-700">
          <div className="flex gap-2">
            <Input
              placeholder="Enter URL"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setLink();
                }
              }}
              className="bg-gray-700 border-gray-600 text-gray-200"
            />
            <Button onClick={setLink} size="sm" className="bg-blue-600 hover:bg-blue-700">
              Add
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Editor Content */}
      <div
        {...getRootProps()}
        className={cn(
          "relative",
          isDragActive && "bg-gray-700/50"
        )}
      >
        <input {...getInputProps()} />

        <EditorContent
          editor={editor}
          className={cn(
            "prose prose-sm max-w-none p-4 focus:outline-none min-h-[200px]",
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
            "[&_img]:!max-w-32 [&_img]:h-auto [&_img]:cursor-pointer [&_img]:rounded-lg",
            "prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline hover:prose-a:text-blue-300",
            // Task list styles
            "[&_.ProseMirror]:focus:outline-none",
            "[&_ul[data-type='taskList']]:list-none [&_ul[data-type='taskList']]:pl-0",
            "[&_li[data-type='taskItem']]:flex [&_li[data-type='taskItem']]:items-start [&_li[data-type='taskItem']]:gap-2",
            "[&_li[data-type='taskItem']>label]:flex [&_li[data-type='taskItem']>label]:items-center [&_li[data-type='taskItem']>label]:gap-2",
            "[&_li[data-type='taskItem']>label>input]:mt-0 [&_li[data-type='taskItem']>label>input]:mr-2",
            "[&_li[data-type='taskItem']>div]:flex-1",
            // Better spacing
            "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
            // Placeholder styles
            "[&_.ProseMirror>p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror>p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror>p.is-editor-empty:first-child::before]:text-gray-500 [&_.ProseMirror>p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror>p.is-editor-empty:first-child::before]:h-0"
          )}
        />

        {isDragActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800/80 rounded">
            <div className="text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-blue-400" />
              <p className="text-sm text-gray-300">Drop image here to upload</p>
            </div>
          </div>
        )}
      </div>

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
