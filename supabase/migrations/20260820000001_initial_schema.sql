-- ============================================================================
-- Migration: 20260820000001_initial_schema.sql
-- Project: YouBuddy — All-in-One Engineering Student App
-- Description: Initial schema setup including tables for universities, academic
--              years, streams, profiles, subjects, topics (PDFs), feed posts,
--              MCQ options & responses, and post_views for smart seen-tracking.
--              Includes RLS policies, triggers, and RPC functions.
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2. UNIVERSITIES, ACADEMIC YEARS & STREAMS
-- ============================================================================

-- Universities Table
CREATE TABLE IF NOT EXISTS public.universities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    short_code TEXT,
    logo_url TEXT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Academic Years Table
CREATE TABLE IF NOT EXISTS public.academic_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    year_number INT NOT NULL CHECK (year_number BETWEEN 1 AND 6),
    has_streams BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_uni_year UNIQUE (university_id, year_number)
);

-- Streams / Branches Table
CREATE TABLE IF NOT EXISTS public.streams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_year_stream UNIQUE (year_id, code)
);

-- ============================================================================
-- 3. PROFILES & USER ACADEMIC CONTEXT
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL DEFAULT 'Engineering Student',
    avatar_url TEXT,
    bio TEXT,
    headline TEXT,
    selected_university_id UUID REFERENCES public.universities(id) ON DELETE SET NULL,
    selected_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
    selected_stream_id UUID REFERENCES public.streams(id) ON DELETE SET NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Helper to check if current authenticated user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = TRUE
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Trigger to auto-create public.profiles on new user signup in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    FALSE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 4. SUBJECTS, TOPICS & NOTES (PDFs)
-- ============================================================================

-- Subjects Table
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    stream_id UUID REFERENCES public.streams(id) ON DELETE CASCADE, -- NULL if common across year
    name TEXT NOT NULL,
    code TEXT,
    group_name TEXT, -- e.g. 'Group A', 'Group B', or NULL
    units_count INT DEFAULT 5,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Topics & PDF references Table
CREATE TABLE IF NOT EXISTS public.topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    unit_number INT,
    description TEXT,
    pdf_url TEXT NOT NULL, -- Supabase Storage URL or path
    file_size_bytes BIGINT,
    page_count INT,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. FEED POSTS & MCQs
-- ============================================================================

-- Feed Posts Table
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN (
        'pinned_announcement',
        'study_tip',
        'youtube_video',
        'mcq',
        'image',
        'video_link'
    )),
    is_pinned BOOLEAN DEFAULT FALSE,
    title TEXT NOT NULL,
    content TEXT,
    media_url TEXT,
    thumbnail_url TEXT,
    extra_data JSONB DEFAULT '{}'::jsonb,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MCQ Options Table
CREATE TABLE IF NOT EXISTS public.mcq_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    option_letter TEXT NOT NULL,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    explanation TEXT,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MCQ User Responses Table
CREATE TABLE IF NOT EXISTS public.mcq_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    option_id UUID NOT NULL REFERENCES public.mcq_options(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_correct BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_user_mcq UNIQUE (post_id, user_id)
);

-- ============================================================================
-- 6. FEED "SEEN" TRACKING TABLE & ALGORITHM
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.post_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    interaction_type TEXT NOT NULL DEFAULT 'impression' CHECK (interaction_type IN (
        'impression',
        'click',
        'mcq_vote',
        'video_play',
        'expanded'
    )),
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_user_post_view UNIQUE (user_id, post_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_posts_pinned_created ON public.posts(is_pinned DESC, created_at DESC) WHERE is_published = TRUE;
CREATE INDEX IF NOT EXISTS idx_post_views_user_post ON public.post_views(user_id, post_id);
CREATE INDEX IF NOT EXISTS idx_subjects_lookup ON public.subjects(year_id, stream_id);
CREATE INDEX IF NOT EXISTS idx_topics_subject ON public.topics(subject_id, display_order);

-- ============================================================================
-- 7. SMART FEED RETRIEVAL & SEEN RPC FUNCTIONS
-- ============================================================================

-- Function: Mark a post as seen for the logged-in user
CREATE OR REPLACE FUNCTION public.mark_post_seen(
    p_post_id UUID,
    p_interaction_type TEXT DEFAULT 'impression'
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.post_views (user_id, post_id, interaction_type, viewed_at)
    VALUES (auth.uid(), p_post_id, p_interaction_type, NOW())
    ON CONFLICT (user_id, post_id) 
    DO UPDATE SET 
        interaction_type = EXCLUDED.interaction_type,
        viewed_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get personalized feed for user
CREATE OR REPLACE FUNCTION public.get_user_feed(
    p_limit INT DEFAULT 10,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    type TEXT,
    is_pinned BOOLEAN,
    title TEXT,
    content TEXT,
    media_url TEXT,
    thumbnail_url TEXT,
    extra_data JSONB,
    created_at TIMESTAMPTZ,
    author_name TEXT,
    author_avatar TEXT,
    is_seen BOOLEAN,
    user_selected_option_id UUID
) AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    RETURN QUERY
    WITH pinned_posts AS (
        SELECT 
            p.id, p.type, p.is_pinned, p.title, p.content, p.media_url, p.thumbnail_url, p.extra_data, p.created_at,
            COALESCE(pr.full_name, 'YouBuddy') as author_name,
            pr.avatar_url as author_avatar,
            (pv.id IS NOT NULL) as is_seen,
            mr.option_id as user_selected_option_id,
            1 as priority_tier,
            p.created_at as sort_time
        FROM public.posts p
        LEFT JOIN public.profiles pr ON p.author_id = pr.id
        LEFT JOIN public.post_views pv ON pv.post_id = p.id AND pv.user_id = v_user_id
        LEFT JOIN public.mcq_responses mr ON mr.post_id = p.id AND mr.user_id = v_user_id
        WHERE p.is_published = TRUE AND p.is_pinned = TRUE
    ),
    unseen_posts AS (
        SELECT 
            p.id, p.type, p.is_pinned, p.title, p.content, p.media_url, p.thumbnail_url, p.extra_data, p.created_at,
            COALESCE(pr.full_name, 'YouBuddy') as author_name,
            pr.avatar_url as author_avatar,
            FALSE as is_seen,
            mr.option_id as user_selected_option_id,
            2 as priority_tier,
            p.created_at as sort_time
        FROM public.posts p
        LEFT JOIN public.profiles pr ON p.author_id = pr.id
        LEFT JOIN public.post_views pv ON pv.post_id = p.id AND pv.user_id = v_user_id
        LEFT JOIN public.mcq_responses mr ON mr.post_id = p.id AND mr.user_id = v_user_id
        WHERE p.is_published = TRUE 
          AND p.is_pinned = FALSE
          AND pv.id IS NULL
    ),
    recycled_seen_posts AS (
        SELECT 
            p.id, p.type, p.is_pinned, p.title, p.content, p.media_url, p.thumbnail_url, p.extra_data, p.created_at,
            COALESCE(pr.full_name, 'YouBuddy') as author_name,
            pr.avatar_url as author_avatar,
            TRUE as is_seen,
            mr.option_id as user_selected_option_id,
            3 as priority_tier,
            pv.viewed_at as sort_time
        FROM public.posts p
        LEFT JOIN public.profiles pr ON p.author_id = pr.id
        INNER JOIN public.post_views pv ON pv.post_id = p.id AND pv.user_id = v_user_id
        LEFT JOIN public.mcq_responses mr ON mr.post_id = p.id AND mr.user_id = v_user_id
        WHERE p.is_published = TRUE 
          AND p.is_pinned = FALSE
    ),
    combined_feed AS (
        SELECT * FROM pinned_posts
        UNION ALL
        SELECT * FROM unseen_posts
        UNION ALL
        SELECT * FROM recycled_seen_posts
    )
    SELECT 
        cf.id, cf.type, cf.is_pinned, cf.title, cf.content, cf.media_url, cf.thumbnail_url, cf.extra_data,
        cf.created_at, cf.author_name, cf.author_avatar, cf.is_seen, cf.user_selected_option_id
    FROM combined_feed cf
    ORDER BY cf.priority_tier ASC, cf.sort_time DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcq_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcq_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;

-- 1. Profiles
CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL USING (public.is_admin());

-- 2. Universities, Years, Streams (Public read, Admin write)
CREATE POLICY "Universities viewable by everyone" ON public.universities FOR SELECT USING (true);
CREATE POLICY "Admins can manage universities" ON public.universities FOR ALL USING (public.is_admin());

CREATE POLICY "Years viewable by everyone" ON public.academic_years FOR SELECT USING (true);
CREATE POLICY "Admins can manage years" ON public.academic_years FOR ALL USING (public.is_admin());

CREATE POLICY "Streams viewable by everyone" ON public.streams FOR SELECT USING (true);
CREATE POLICY "Admins can manage streams" ON public.streams FOR ALL USING (public.is_admin());

-- 3. Subjects & Topics (Public read, Admin write)
CREATE POLICY "Subjects viewable by everyone" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Admins can manage subjects" ON public.subjects FOR ALL USING (public.is_admin());

CREATE POLICY "Topics viewable by everyone" ON public.topics FOR SELECT USING (true);
CREATE POLICY "Admins can manage topics" ON public.topics FOR ALL USING (public.is_admin());

-- 4. Posts & MCQ Options (Public read, Admin write)
CREATE POLICY "Posts viewable by everyone" ON public.posts FOR SELECT USING (is_published = true OR public.is_admin());
CREATE POLICY "Admins can manage posts" ON public.posts FOR ALL USING (public.is_admin());

CREATE POLICY "MCQ options viewable by everyone" ON public.mcq_options FOR SELECT USING (true);
CREATE POLICY "Admins can manage MCQ options" ON public.mcq_options FOR ALL USING (public.is_admin());

-- 5. MCQ Responses (User owns responses)
CREATE POLICY "Users can view own MCQ responses" ON public.mcq_responses FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users can submit MCQ response" ON public.mcq_responses FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. Post Views (User owns views)
CREATE POLICY "Users can view own post views" ON public.post_views FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users can insert own post views" ON public.post_views FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own post views" ON public.post_views FOR UPDATE USING (auth.uid() = user_id);
