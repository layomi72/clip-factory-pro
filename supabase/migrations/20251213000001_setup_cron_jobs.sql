-- Set up cron jobs for automated posting
-- This uses pg_cron extension (already enabled in previous migration)

-- Cron job to process scheduled posts every 2 hours
SELECT cron.schedule(
  'process-scheduled-posts',
  '0 */2 * * *',  -- Every 2 hours
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/process-scheduled-posts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Optional: Cleanup old processing jobs (runs daily at 3 AM)
SELECT cron.schedule(
  'cleanup-processing-jobs',
  '0 3 * * *',  -- Daily at 3 AM
  $$
  DELETE FROM public.processing_jobs
  WHERE status IN ('completed', 'failed')
  AND created_at < NOW() - INTERVAL '7 days';
  $$
);

-- Optional: Cleanup old videos from R2 (runs daily at 4 AM)
-- Note: This would need to call an Edge Function that deletes from R2
-- For now, we'll just log that cleanup should happen
SELECT cron.schedule(
  'cleanup-old-videos',
  '0 4 * * *',  -- Daily at 4 AM
  $$
  -- This would call an Edge Function to delete old videos from R2
  -- Implementation depends on your cleanup strategy
  SELECT 1;
  $$
);

