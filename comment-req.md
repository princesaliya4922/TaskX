# Jira-like Comment System Implementation with Tiptap

I need to build a comprehensive comment system for a Jira-like project management platform. Please provide a complete implementation with the following requirements:

## Core Requirements

### 1. Comment System with Tiptap Editor
- Rich text editor using Tiptap for comment creation and editing
- Support for basic formatting (bold, italic, lists, etc.)
- Real-time preview of comments
- Comment threading/replies support
- Edit and delete functionality for comment authors

### 2. User Mentions System
- **@mention functionality**: Users can type @ followed by username to mention team members
- **Mention dropdown**: Show filterable list of project members when typing @
- **Mention highlighting**: Mentioned users should be visually highlighted in the comment
- **Mention parsing**: Extract mentioned usernames from comment content
- **Permission check**: Only allow mentioning users who are part of the current project

### 3. Notification System
- **Real-time notifications**: When a user is mentioned, they should receive an immediate notification
- **Notification types**: 
  - New mention in comment
  - Reply to user's comment
  - Comment on ticket user is watching
- **Notification UI**: Toast notifications, notification bell with count, notification panel
- **Notification persistence**: Store notifications in database for offline users
- **Notification actions**: Mark as read, mark all as read, click to navigate

### 4. Navigation & Deep Linking
- **Direct navigation**: Clicking notification should navigate to specific ticket
- **Comment highlighting**: Navigate to and highlight the specific comment that triggered notification
- **URL structure**: Support URLs like `/ticket/123#comment-456`
- **Scroll behavior**: Auto-scroll to highlighted comment
- **Comment permalinks**: Generate shareable links to specific comments

### 5. Image Support in Comments
- **Inline images**: Support drag-and-drop and paste images directly in Tiptap editor
- **Image upload**: Handle image file uploads with progress indicators
- **Image positioning**: Images can be placed anywhere within the comment text
- **Image optimization**: Resize/compress images before upload
- **Image preview**: Click to view full-size images in modal/lightbox
- **Supported formats**: JPG, PNG, GIF, WebP

## Technical Implementation Details

### Frontend Stack
- **Framework**: React with TypeScript
- **Editor**: Tiptap with necessary extensions
- **State Management**: React Query for server state, Zustand/Redux for client state
- **Styling**: Tailwind CSS
- **Notifications**: React Hot Toast or similar
- **Real-time**: WebSocket connection for live updates

### Backend Requirements
- **Database schema** for:
  - Comments table with rich content
  - Mentions table linking users to comments
  - Notifications table with read status
  - File uploads table for images
- **API endpoints** for:
  - CRUD operations for comments
  - User search for mentions
  - Notification management
  - Image upload and serving
- **Real-time WebSocket** for live notifications
- **File storage** for image uploads (local/S3/Cloudinary)

### Tiptap Extensions Needed
```typescript
- @tiptap/extension-mention (for user mentions)
- @tiptap/extension-image (for image support)
- @tiptap/extension-placeholder
- @tiptap/extension-link
- @tiptap/extension-typography
- Custom extensions for notification handling
```

## Step-by-Step Implementation Plan

### Phase 1: Basic Comment System
1. Set up Tiptap editor with basic formatting
2. Create comment CRUD API endpoints
3. Build comment list and form components
4. Implement comment persistence and display

### Phase 2: Mention System
1. Install and configure Tiptap mention extension
2. Create user search API endpoint
3. Build mention dropdown component with user filtering
4. Implement mention parsing and storage
5. Add mention highlighting in rendered comments

### Phase 3: Notification System
1. Design notification database schema
2. Create notification API endpoints
3. Build notification creation logic for mentions
4. Implement WebSocket for real-time notifications
5. Create notification UI components (toast, bell, panel)

### Phase 4: Navigation & Deep Linking
1. Implement comment permalinks and URL routing
2. Add comment highlighting and scroll behavior
3. Create notification click handlers for navigation
4. Test deep linking functionality

### Phase 5: Image Support
1. Configure Tiptap image extension
2. Implement image upload API with storage
3. Add drag-and-drop and paste image functionality
4. Create image preview/lightbox component
5. Add image optimization and validation

## Expected Deliverables

Please provide:
1. **Complete React components** for the comment system
2. **Backend API code** (Node.js/Express or your preferred stack)
3. **Database schema** with migration files
4. **Tiptap configuration** with all necessary extensions
5. **WebSocket setup** for real-time notifications
6. **Testing examples** for key functionality
7. **Documentation** explaining the implementation

## Additional Considerations
- **Security**: Sanitize user input, validate file uploads, prevent XSS
- **Performance**: Implement pagination for comments, lazy loading for images
- **Accessibility**: Ensure keyboard navigation, screen reader support
- **Mobile responsiveness**: Optimize for mobile devices
- **Error handling**: Graceful handling of upload failures, network issues
- **Caching**: Implement appropriate caching strategies for performance

## Success Criteria
- Users can create rich text comments with formatting
- @mentions work smoothly with real-time user search
- Notifications are delivered instantly and persist correctly
- Images can be uploaded and displayed inline seamlessly
- Clicking notifications navigates to correct ticket and comment
- System handles concurrent users and real-time updates
- All functionality works across different browsers and devices

Please provide a production-ready implementation with proper error handling, loading states, and user feedback throughout the entire flow.