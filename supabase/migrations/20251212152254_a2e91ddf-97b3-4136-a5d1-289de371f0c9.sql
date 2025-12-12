-- Create imported_streams table
CREATE TABLE public.imported_streams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source_url TEXT NOT NULL,
  platform TEXT NOT NULL,
  video_id TEXT,
  title TEXT,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  metadata JSONB,
  status TEXT NOT NULL DEFAULT 'imported',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create processing_jobs table
CREATE TABLE public.processing_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  stream_id UUID REFERENCES public.imported_streams(id) ON DELETE CASCADE,
  source_video_url TEXT NOT NULL,
  clip_start_time NUMERIC NOT NULL,
  clip_end_time NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  output_url TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.imported_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_jobs ENABLE ROW LEVEL SECURITY;

-- RLS policies for imported_streams
CREATE POLICY "Users can view their own imported streams" 
ON public.imported_streams FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own imported streams" 
ON public.imported_streams FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own imported streams" 
ON public.imported_streams FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own imported streams" 
ON public.imported_streams FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for processing_jobs
CREATE POLICY "Users can view their own processing jobs" 
ON public.processing_jobs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own processing jobs" 
ON public.processing_jobs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own processing jobs" 
ON public.processing_jobs FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own processing jobs" 
ON public.processing_jobs FOR DELETE USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_imported_streams_updated_at
BEFORE UPDATE ON public.imported_streams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_processing_jobs_updated_at
BEFORE UPDATE ON public.processing_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();