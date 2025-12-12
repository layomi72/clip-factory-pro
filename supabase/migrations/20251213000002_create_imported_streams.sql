-- Create imported_streams table to store imported videos
CREATE TABLE public.imported_streams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source_url TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('youtube', 'twitch', 'tiktok')),
  video_id TEXT, -- Platform-specific video ID
  title TEXT,
  description TEXT,
  thumbnail_url TEXT,
  duration_seconds FLOAT,
  metadata JSONB, -- Store additional platform-specific data
  status TEXT NOT NULL DEFAULT 'imported' CHECK (status IN ('imported', 'downloading', 'downloaded', 'failed')),
  downloaded_url TEXT, -- URL to downloaded video file (R2 or local)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.imported_streams ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own imported streams"
ON public.imported_streams FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own imported streams"
ON public.imported_streams FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own imported streams"
ON public.imported_streams FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own imported streams"
ON public.imported_streams FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_imported_streams_updated_at
BEFORE UPDATE ON public.imported_streams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for efficient querying
CREATE INDEX idx_imported_streams_user_id ON public.imported_streams(user_id);
CREATE INDEX idx_imported_streams_platform ON public.imported_streams(platform);
CREATE INDEX idx_imported_streams_status ON public.imported_streams(status);
CREATE INDEX idx_imported_streams_created_at ON public.imported_streams(created_at DESC);

-- Add foreign key relationship to processing_jobs
ALTER TABLE public.processing_jobs
ADD COLUMN IF NOT EXISTS imported_stream_id UUID REFERENCES public.imported_streams(id) ON DELETE SET NULL;

-- Add index for the foreign key
CREATE INDEX IF NOT EXISTS idx_processing_jobs_imported_stream_id ON public.processing_jobs(imported_stream_id);


