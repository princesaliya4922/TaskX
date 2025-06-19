# OAuth Setup Guide

This guide explains how to set up Google and GitHub OAuth authentication for TrackX.

## Current Status

- ✅ **Email/Password Authentication**: Fully working
- ⚠️ **OAuth Authentication**: Requires configuration
- ✅ **Demo Accounts**: Available for testing

## Demo Accounts

You can test the application immediately using these demo accounts:

- **Admin**: `john@example.com` / `password123`
- **Member**: `jane@example.com` / `password123`
- **Member**: `mike@example.com` / `password123`

## Setting up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
7. Copy the Client ID and Client Secret
8. Add to your `.env.local`:
   ```
   GOOGLE_CLIENT_ID="your_google_client_id"
   GOOGLE_CLIENT_SECRET="your_google_client_secret"
   ```

## Setting up GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the application details:
   - **Application name**: TrackX
   - **Homepage URL**: `http://localhost:3000` (development)
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Click "Register application"
5. Copy the Client ID and generate a Client Secret
6. Add to your `.env.local`:
   ```
   GITHUB_CLIENT_ID="your_github_client_id"
   GITHUB_CLIENT_SECRET="your_github_client_secret"
   ```

## After Configuration

1. Restart your development server: `npm run dev`
2. The OAuth buttons will now work properly
3. Users can sign in with Google or GitHub accounts

## Error Handling

The application gracefully handles OAuth configuration issues:
- Shows helpful error messages when OAuth providers aren't configured
- Provides fallback to email/password authentication
- Displays demo account information for testing

## Security Notes

- Never commit OAuth secrets to version control
- Use different OAuth apps for development and production
- Regularly rotate your OAuth secrets
- Monitor OAuth usage in your provider dashboards
