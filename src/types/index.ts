// Database enums
export enum MemberRole {
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
}

export enum TicketType {
  BUG = "BUG",
  TASK = "TASK",
  STORY = "STORY",
  EPIC = "EPIC",
}

export enum TicketStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  IN_REVIEW = "IN_REVIEW",
  ON_HOLD = "ON_HOLD",
  READY_TO_DEPLOY = "READY_TO_DEPLOY",
  REVIEW_PROD = "REVIEW_PROD",
  DONE = "DONE",
}

export enum Priority {
  HIGHEST = "HIGHEST",
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
  LOWEST = "LOWEST",
}

export enum Area {
  DEVELOPMENT = "DEVELOPMENT",
  DESIGN = "DESIGN",
  PRODUCT = "PRODUCT",
  RESEARCH = "RESEARCH",
}

export enum SprintStatus {
  PLANNED = "PLANNED",
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
}

export enum ActivityType {
  TICKET_CREATED = "TICKET_CREATED",
  TICKET_UPDATED = "TICKET_UPDATED",
  TICKET_ASSIGNED = "TICKET_ASSIGNED",
  TICKET_STATUS_CHANGED = "TICKET_STATUS_CHANGED",
  COMMENT_ADDED = "COMMENT_ADDED",
  ATTACHMENT_ADDED = "ATTACHMENT_ADDED",
  SPRINT_CHANGED = "SPRINT_CHANGED",
}

export enum NotificationType {
  MENTION = "MENTION",
  ASSIGNMENT = "ASSIGNMENT",
  COMMENT = "COMMENT",
  DUE_DATE_REMINDER = "DUE_DATE_REMINDER",
  STATUS_CHANGE = "STATUS_CHANGE",
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Organization types
export interface Organization {
  id: string;
  name: string;
  slug: string;
  ticketPrefix: string;
  description?: string;
  logoUrl?: string;
  ownerId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  owner?: User;
  members?: OrganizationMember[];
  _count?: {
    tickets: number;
    members: number;
    sprints: number;
  };
}

export interface OrganizationMember {
  id: string;
  userId: string;
  organizationId: string;
  role: MemberRole;
  joinedAt: Date;
  user: User;
}

// Project types
export interface Project {
  id: string;
  name: string;
  key: string;
  description?: string;
  organizationId: string;
  leadId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  organization: Organization;
  lead?: User;
  tickets?: Ticket[];
  sprints?: Sprint[];
  _count?: {
    tickets: number;
    sprints: number;
  };
}

// Ticket types
export interface Ticket {
  id: string;
  ticketNumber: number;
  ticketId: string;
  title: string;
  description?: any;
  type: TicketType;
  status: TicketStatus;
  priority: Priority;
  area: Area;
  storyPoints?: number;
  dueDate?: Date;
  organizationId: string;
  projectId?: string;
  reporterId: string;
  assigneeId?: string;
  sprintId?: string;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
  reporter: User;
  assignee?: User;
  project?: Project;
  sprint?: Sprint;
  parent?: Ticket;
  children?: Ticket[];
  comments?: Comment[];
  attachments?: Attachment[];
  labels?: TicketLabel[];
  activities?: Activity[];
  _count?: {
    comments: number;
    attachments: number;
    children: number;
  };
}

// Sprint types
export interface Sprint {
  id: string;
  name: string;
  organizationId: string;
  startDate: Date;
  endDate: Date;
  goal?: string;
  status: SprintStatus;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  tickets?: Ticket[];
  _count?: {
    tickets: number;
  };
}

// Comment types
export interface Comment {
  id: string;
  content: any;
  ticketId: string;
  authorId: string;
  parentId?: string;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
  author: User;
  parent?: Comment;
  replies?: Comment[];
  mentions?: Mention[];
  _count?: {
    replies: number;
  };
}

// Other types
export interface Label {
  id: string;
  name: string;
  color: string;
  organizationId: string;
  createdAt: Date;
}

export interface TicketLabel {
  ticketId: string;
  labelId: string;
  ticket: Ticket;
  label: Label;
}

export interface Mention {
  id: string;
  commentId: string;
  userId: string;
  createdAt: Date;
  user: User;
}

export interface Attachment {
  id: string;
  filename: string;
  url: string;
  size: number;
  mimeType: string;
  ticketId: string;
  uploadedById: string;
  createdAt: Date;
}

export interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  metadata?: any;
  ticketId: string;
  userId: string;
  createdAt: Date;
  user: User;
}

export interface Invitation {
  id: string;
  email: string;
  organizationId: string;
  role: MemberRole;
  token: string;
  expiresAt: Date;
  acceptedAt?: Date;
  createdAt: Date;
  organization: Organization;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: any;
  userId: string;
  isRead: boolean;
  createdAt: Date;
}
