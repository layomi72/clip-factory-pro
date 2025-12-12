# How to Run Database Migration

## Option 1: Supabase Dashboard (Easiest)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New query**
4. Copy and paste the contents of `supabase/migrations/20251213000002_create_imported_streams.sql`
5. Click **Run** (or press Ctrl+Enter)
6. Verify the migration succeeded (should see "Success" message)

## Option 2: Supabase CLI

If you have Supabase CLI installed:

```bash
# Navigate to project directory
cd clip-factory-pro

# Link to your Supabase project (if not already linked)
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

## Option 3: Direct SQL Connection

If you have direct database access:

```bash
# Using psql
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" -f supabase/migrations/20251213000002_create_imported_streams.sql
```

## Verification

After running the migration, verify it worked:

```sql
-- Check if table exists
SELECT * FROM information_schema.tables 
WHERE table_name = 'imported_streams';

-- Check table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'imported_streams';
```

You should see:
- `imported_streams` table created
- `processing_jobs` table has `imported_stream_id` column
- All indexes and policies created

## Troubleshooting

If migration fails:
- Check for existing table conflicts
- Verify you have proper permissions
- Check Supabase logs for detailed error messages


