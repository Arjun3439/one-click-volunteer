# Supabase Setup for Do Good Dash

This guide will help you set up Supabase for the Do Good Dash application.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - Name: `do-good-dash`
   - Database Password: (choose a strong password)
   - Region: (choose closest to your users)
6. Click "Create new project"

## 2. Set Up Database Schema

1. Go to the SQL Editor in your Supabase dashboard
2. Copy and paste the contents of `supabase-schema.sql` into the editor
3. Click "Run" to execute the SQL

This will create:
- `volunteers` table for volunteer profiles
- `bookings` table for booking management
- Storage bucket for profile photos
- Row Level Security (RLS) policies
- Indexes for better performance

## 3. Configure Storage

1. Go to Storage in your Supabase dashboard
2. You should see the `volunteer-photos` bucket created
3. Go to Settings > Storage
4. Make sure the bucket is public for profile photos

## 4. Get Your Project Credentials

1. Go to Settings > API in your Supabase dashboard
2. Copy the following values:
   - Project URL
   - Anon (public) key

## 5. Set Up Environment Variables

Create a `.env.local` file in your project root:

```env
VITE_SUPABASE_URL=your-project-url-here
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 6. Test the Setup

1. Start your development server: `npm run dev`
2. Navigate to the volunteer profile creation page
3. Try creating a volunteer profile
4. Check your Supabase dashboard to see if the data appears

## 7. Optional: Set Up Authentication

If you want to use Supabase Auth instead of Clerk:

1. Go to Authentication > Settings in Supabase
2. Configure your preferred auth providers
3. Update the app to use Supabase Auth instead of Clerk

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Make sure your domain is added to the allowed origins in Supabase
2. **Storage Upload Fails**: Check that the storage bucket exists and is public
3. **RLS Errors**: Verify that your RLS policies are set up correctly
4. **Environment Variables**: Make sure your `.env.local` file is in the project root

### Database Schema Notes:

- The schema uses snake_case for database columns but converts to camelCase in the app
- RLS policies allow all users to read/write for simplicity (adjust as needed for production)
- The `volunteers` table includes all necessary fields for the volunteer dashboard
- The `bookings` table supports the booking system

## Next Steps

1. Customize the RLS policies for your security requirements
2. Add more sophisticated error handling
3. Implement real-time subscriptions for live updates
4. Add database triggers for automated tasks
