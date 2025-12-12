-- Create processing_jobs table for video processing queue
CREATE TABLE public.processing_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source_video_url TEXT NOT NULL,
  clip_start_time FLOAT NOT NULL,
  clip_end_time FLOAT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  output_url TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.processing_jobs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own processing jobs"
ON public.processing_jobs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own processing jobs"
ON public.processing_jobs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own processing jobs"
ON public.processing_jobs FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_processing_jobs_updated_at
BEFORE UPDATE ON public.processing_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for efficient querying
CREATE INDEX idx_processing_jobs_status ON public.processing_jobs(status);
CREATE INDEX idx_processing_jobs_user_id ON public.processing_jobs(user_id);

