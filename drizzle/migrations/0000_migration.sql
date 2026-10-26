CREATE TABLE public.stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname text NOT NULL CHECK (char_length(nickname) BETWEEN 1 AND 30),
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 120),
  body text NOT NULL CHECK (char_length(body) BETWEEN 10 AND 4000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  nickname text NOT NULL CHECK (char_length(nickname) BETWEEN 1 AND 30),
  verdict text NOT NULL CHECK (verdict IN ('fair','unfair','both','unsure')),
  body text NOT NULL CHECK (char_length(body) BETWEEN 2 AND 1500),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.stories TO anon, authenticated;
GRANT SELECT, INSERT ON public.feedback TO anon, authenticated;
GRANT ALL ON public.stories TO service_role;
GRANT ALL ON public.feedback TO service_role;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read stories" ON public.stories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "post stories" ON public.stories FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "read feedback" ON public.feedback FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "post feedback" ON public.feedback FOR INSERT TO anon, authenticated WITH CHECK (true);

INSERT INTO public.stories (nickname, title, body) VALUES
('quietfox','My best friend sat with someone else at lunch','We always sit together. Today she sat with a new girl and didn''t even wave at me. I ignored her texts after school. Was I wrong to ignore her?'),
('pixelbean','Brother read my journal','My little brother read my journal and told my mom something private. I yelled at him and said I hated him. Now he won''t talk to me.');
INSERT INTO public.feedback (story_id, nickname, verdict, body)
SELECT id, 'sunnyday', 'both', 'It makes sense you felt left out, but maybe ask her about it instead of ignoring her. She might have been trying to be kind to the new girl.' FROM public.stories WHERE nickname='quietfox';