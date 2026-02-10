
CREATE TABLE public.duo_schools (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sector text NOT NULL,
  schools_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  scraped_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.duo_schools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view duo schools"
  ON public.duo_schools FOR SELECT USING (true);

CREATE TRIGGER update_duo_schools_updated_at
  BEFORE UPDATE ON public.duo_schools
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
