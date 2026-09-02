-- ============================================================================
-- Migration: 20260820000002_seed_dummy_data.sql
-- Project: YouBuddy — All-in-One Engineering Student Platform
-- Description: Inserts realistic dummy data for Universities, Academic Years,
--              Streams, Subjects, Topics (PDFs), Feed Posts, and MCQ Options.
--              Safe & Idempotent (can be re-run without duplicate key errors).
-- ============================================================================

-- 0. Ensure author_name column exists on posts for easy display attribution
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS author_name TEXT DEFAULT 'YouBuddy';

-- Optional: Allow anonymous inserts to posts during development/admin use if no custom auth user is logged in
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'posts' AND policyname = 'Allow public insert for dev'
  ) THEN
    CREATE POLICY "Allow public insert for dev" ON public.posts FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'mcq_options' AND policyname = 'Allow public mcq options insert for dev'
  ) THEN
    CREATE POLICY "Allow public mcq options insert for dev" ON public.mcq_options FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'post_views' AND policyname = 'Allow public post views insert for dev'
  ) THEN
    CREATE POLICY "Allow public post views insert for dev" ON public.post_views FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'mcq_responses' AND policyname = 'Allow public mcq responses insert for dev'
  ) THEN
    CREATE POLICY "Allow public mcq responses insert for dev" ON public.mcq_responses FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- ============================================================================
-- 1. SEED UNIVERSITIES
-- ============================================================================
INSERT INTO public.universities (id, name, short_code, logo_url, display_order, is_active)
VALUES
  ('11111111-1111-1111-1111-111111111101', 'Dr. Babasaheb Ambedkar Technological University', 'DBATU', '', 1, true),
  ('11111111-1111-1111-1111-111111111102', 'Punyashlok Ahilyadevi Holkar Solapur University', 'PAHSU', '', 2, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  short_code = EXCLUDED.short_code,
  display_order = EXCLUDED.display_order;

-- ============================================================================
-- 2. SEED ACADEMIC YEARS
-- ============================================================================
INSERT INTO public.academic_years (id, university_id, name, year_number, has_streams, display_order)
VALUES
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', 'First Year', 1, false, 1),
  ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111101', 'Second Year', 2, true, 2),
  ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111101', 'Third Year', 3, true, 3),
  ('22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111101', 'Fourth Year', 4, true, 4),
  ('22222222-2222-2222-2222-222222222205', '11111111-1111-1111-1111-111111111102', 'First Year', 1, false, 1),
  ('22222222-2222-2222-2222-222222222206', '11111111-1111-1111-1111-111111111102', 'Second Year', 2, true, 2)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year_number = EXCLUDED.year_number,
  has_streams = EXCLUDED.has_streams;

-- ============================================================================
-- 3. SEED STREAMS / BRANCHES
-- ============================================================================
INSERT INTO public.streams (id, year_id, name, code, display_order)
VALUES
  ('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222202', 'Computer Science & Engineering', 'SY CSE', 1),
  ('33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222202', 'Electronics & Telecommunication', 'SY ENTC', 2),
  ('33333333-3333-3333-3333-333333333303', '22222222-2222-2222-2222-222222222202', 'Artificial Intelligence & Data Science', 'SY AI & DS', 3),
  ('33333333-3333-3333-3333-333333333304', '22222222-2222-2222-2222-222222222203', 'Computer Science & Engineering', 'TY CSE', 1),
  ('33333333-3333-3333-3333-333333333305', '22222222-2222-2222-2222-222222222206', 'Computer Science & Engineering', 'SY CSE', 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code;

-- ============================================================================
-- 4. SEED SUBJECTS
-- ============================================================================
INSERT INTO public.subjects (id, year_id, stream_id, name, code, group_name, units_count, display_order)
VALUES
  -- First Year DBATU (Group A)
  ('44444444-4444-4444-4444-444444444401', '22222222-2222-2222-2222-222222222201', NULL, 'Engineering Mathematics I', '24AF1000BS101', 'Group A', 5, 1),
  ('44444444-4444-4444-4444-444444444402', '22222222-2222-2222-2222-222222222201', NULL, 'Engineering Chemistry', '24AF1CHEBS102', 'Group A', 5, 2),
  ('44444444-4444-4444-4444-444444444403', '22222222-2222-2222-2222-222222222201', NULL, 'Engineering Mechanics', '24AF1EMES104', 'Group A', 5, 3),
  ('44444444-4444-4444-4444-444444444404', '22222222-2222-2222-2222-222222222201', NULL, 'Programming for Problem Solving', '24AF1000ES106', 'Group A', 5, 4),
  -- First Year DBATU (Group B)
  ('44444444-4444-4444-4444-444444444405', '22222222-2222-2222-2222-222222222201', NULL, 'Engineering Mathematics II', '24AF2000BS201', 'Group B', 5, 1),
  ('44444444-4444-4444-4444-444444444406', '22222222-2222-2222-2222-222222222201', NULL, 'Engineering Physics', '24AF2PHYBS202', 'Group B', 5, 2),
  ('44444444-4444-4444-4444-444444444407', '22222222-2222-2222-2222-222222222201', NULL, 'Basic Electrical & Electronics', '24AF2BEES203', 'Group B', 5, 3),
  -- Second Year DBATU CSE
  ('44444444-4444-4444-4444-444444444408', '22222222-2222-2222-2222-222222222202', '33333333-3333-3333-3333-333333333301', 'Data Structures & Algorithms', 'BTCOC302', NULL, 5, 1),
  ('44444444-4444-4444-4444-444444444409', '22222222-2222-2222-2222-222222222202', '33333333-3333-3333-3333-333333333301', 'Discrete Mathematics', 'BTBSC301', NULL, 5, 2),
  ('44444444-4444-4444-4444-444444444410', '22222222-2222-2222-2222-222222222202', '33333333-3333-3333-3333-333333333301', 'Object Oriented Programming Java', 'BTCOC303', NULL, 5, 3)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  group_name = EXCLUDED.group_name;

-- ============================================================================
-- 5. SEED TOPICS & PDF NOTES
-- ============================================================================
INSERT INTO public.topics (id, subject_id, title, unit_number, description, pdf_url, file_size_bytes, page_count, display_order)
VALUES
  (
    '55555555-5555-5555-5555-555555555501',
    '44444444-4444-4444-4444-444444444401',
    'Unit 1: Linear Algebra & Matrices',
    1,
    'Rank of matrix, Normal form, System of linear equations, Eigenvalues and Eigenvectors.',
    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    2450000,
    32,
    1
  ),
  (
    '55555555-5555-5555-5555-555555555502',
    '44444444-4444-4444-4444-444444444401',
    'Unit 2: Differential Calculus',
    2,
    'Successive differentiation, Leibnitz theorem, Taylor and Maclaurin expansions.',
    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    3120000,
    45,
    2
  ),
  (
    '55555555-5555-5555-5555-555555555503',
    '44444444-4444-4444-4444-444444444408',
    'Unit 1: Introduction to Data Structures & Arrays',
    1,
    'Asymptotic notations, Big-O, Array representations, Sparse matrices.',
    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    1850000,
    28,
    1
  ),
  (
    '55555555-5555-5555-5555-555555555504',
    '44444444-4444-4444-4444-444444444408',
    'Unit 2: Stacks and Queues',
    2,
    'Stack ADT, Infix to Postfix conversion, Queue ADT, Circular queue, Priority queue.',
    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    2900000,
    38,
    2
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  pdf_url = EXCLUDED.pdf_url;

-- ============================================================================
-- 6. SEED FEED POSTS (Live Supabase Feed Data)
-- ============================================================================
INSERT INTO public.posts (
  id,
  type,
  is_pinned,
  title,
  content,
  media_url,
  thumbnail_url,
  author_name,
  extra_data,
  is_published,
  created_at
)
VALUES
  -- 1. Pinned Announcement
  (
    '66666666-6666-6666-6666-666666666601',
    'pinned_announcement',
    true,
    'Welcome to YouBuddy — Live Supabase Feed!',
    'Welcome to YouBuddy! This live feed is loaded directly from your Supabase database in real-time. Check back regularly for syllabus updates, notes, exam timetables, and interactive study challenges.',
    NULL,
    NULL,
    'YouBuddy Official',
    '{"author_role": "Platform Admin", "badge": "Official"}'::jsonb,
    true,
    NOW()
  ),

  -- 2. Study Tip
  (
    '66666666-6666-6666-6666-666666666602',
    'study_tip',
    false,
    'The Feynman Technique: Master Any Complex Concept',
    'Engineering problems can look intimidating, but breaking them down into smaller steps makes them much easier to grasp. Try explaining a complex concept in plain, simple language as if teaching a beginner. If you get stuck or use jargon, review the source material and simplify again!',
    NULL,
    NULL,
    'Academic Excellence Team',
    '{"author_role": "Engineering Mentor"}'::jsonb,
    true,
    NOW() - INTERVAL '1 hour'
  ),

  -- 3. YouTube Educational Video
  (
    '66666666-6666-6666-6666-666666666603',
    'youtube_video',
    false,
    'The Secret Backbone: How the Internet Actually Works',
    'A visual deep dive into submarine cables, DNS servers, BGP routing, and TCP/IP packets powering the modern web.',
    'https://www.youtube.com/watch?v=x3c1ih2NJEg',
    'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=1200&auto=format&fit=crop&q=80',
    'Engineering Tech Hub',
    '{"youtube_video_id": "x3c1ih2NJEg", "duration": "14:20"}'::jsonb,
    true,
    NOW() - INTERVAL '3 hours'
  ),

  -- 4. Interactive MCQ Challenge (Aptitude)
  (
    '66666666-6666-6666-6666-666666666604',
    'mcq',
    false,
    'Aptitude Series Challenge: What Comes Next?',
    'Look closely at this number sequence: 12, 11, 13, 12, 14, 13, ...
What number should come next in this series?',
    NULL,
    NULL,
    'Daily Aptitude Drill',
    '{"category": "Quantitative Aptitude", "difficulty": "Medium"}'::jsonb,
    true,
    NOW() - INTERVAL '5 hours'
  ),

  -- 5. Interactive MCQ Challenge (Computer Science / Data Structures)
  (
    '66666666-6666-6666-6666-666666666605',
    'mcq',
    false,
    'Computer Science MCQ: Hash Table Time Complexity',
    'In the average case, what is the time complexity to search for an element in a Hash Table with good distribution?',
    NULL,
    NULL,
    'CS Faculty Forum',
    '{"category": "Data Structures", "difficulty": "Easy"}'::jsonb,
    true,
    NOW() - INTERVAL '8 hours'
  ),

  -- 6. Image Post (Visual Revision Cheat Sheet)
  (
    '66666666-6666-6666-6666-666666666606',
    'image',
    false,
    'Data Structures Complexity & Operations Cheat Sheet',
    'Quick visual summary of average and worst-case time complexities for Arrays, Linked Lists, Stacks, Queues, and Binary Search Trees.',
    'https://images.unsplash.com/photo-1516116211227-bbc141e24748?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1516116211227-bbc141e24748?w=1200&auto=format&fit=crop&q=80',
    'Computer Science Dept',
    '{"tags": ["DSA", "Revision", "CheatSheet"]}'::jsonb,
    true,
    NOW() - INTERVAL '12 hours'
  ),

  -- 7. Second YouTube Lecture
  (
    '66666666-6666-6666-6666-666666666607',
    'youtube_video',
    false,
    'Harvard CS50: Understanding Pointers & Memory',
    'Master pointer arithmetic, memory allocation (malloc/free), and buffer management in this legendary lecture from CS50.',
    'https://www.youtube.com/watch?v=2w-2S355bxg',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80',
    'Harvard CS50 Series',
    '{"youtube_video_id": "2w-2S355bxg", "duration": "24:10"}'::jsonb,
    true,
    NOW() - INTERVAL '1 day'
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  media_url = EXCLUDED.media_url,
  thumbnail_url = EXCLUDED.thumbnail_url,
  author_name = EXCLUDED.author_name,
  extra_data = EXCLUDED.extra_data,
  is_pinned = EXCLUDED.is_pinned,
  is_published = EXCLUDED.is_published;

-- ============================================================================
-- 7. SEED MCQ OPTIONS (Linked to MCQ Posts)
-- ============================================================================
INSERT INTO public.mcq_options (
  id,
  post_id,
  option_letter,
  option_text,
  is_correct,
  explanation,
  display_order
)
VALUES
  -- Options for Aptitude Series Challenge ('66666666-6666-6666-6666-666666666604')
  (
    '77777777-7777-7777-7777-777777777701',
    '66666666-6666-6666-6666-666666666604',
    'A',
    '10',
    false,
    'Incorrect. The pattern subtracts 1 then adds 2 alternately.',
    1
  ),
  (
    '77777777-7777-7777-7777-777777777702',
    '66666666-6666-6666-6666-666666666604',
    'B',
    '16',
    false,
    'Incorrect. After 13, we add 2 to obtain 15.',
    2
  ),
  (
    '77777777-7777-7777-7777-777777777703',
    '66666666-6666-6666-6666-666666666604',
    'C',
    '13',
    false,
    'Incorrect. 13 is the current number in the series.',
    3
  ),
  (
    '77777777-7777-7777-7777-777777777704',
    '66666666-6666-6666-6666-666666666604',
    'D',
    '15',
    true,
    'Correct! The sequence alternates -1 and +2: 12 - 1 = 11, 11 + 2 = 13, 13 - 1 = 12, 12 + 2 = 14, 14 - 1 = 13, 13 + 2 = 15.',
    4
  ),

  -- Options for Hash Table Time Complexity ('66666666-6666-6666-6666-666666666605')
  (
    '77777777-7777-7777-7777-777777777705',
    '66666666-6666-6666-6666-666666666605',
    'A',
    'O(1)',
    true,
    'Correct! A well-distributed hash table performs searches, insertions, and deletions in O(1) constant average time.',
    1
  ),
  (
    '77777777-7777-7777-7777-777777777706',
    '66666666-6666-6666-6666-666666666605',
    'B',
    'O(n)',
    false,
    'Incorrect. O(n) is the worst-case scenario when collisions cause all keys to chain into a single bucket.',
    2
  ),
  (
    '77777777-7777-7777-7777-777777777707',
    '66666666-6666-6666-6666-666666666605',
    'C',
    'O(log n)',
    false,
    'Incorrect. O(log n) is the search complexity for balanced Binary Search Trees, not hash tables.',
    3
  ),
  (
    '77777777-7777-7777-7777-777777777708',
    '66666666-6666-6666-6666-666666666605',
    'D',
    'O(n log n)',
    false,
    'Incorrect. O(n log n) is standard for efficient sorting algorithms like Merge Sort and Quick Sort.',
    4
  )
ON CONFLICT (id) DO UPDATE SET
  option_text = EXCLUDED.option_text,
  is_correct = EXCLUDED.is_correct,
  explanation = EXCLUDED.explanation;

-- Refresh schema cache notice
COMMENT ON TABLE public.posts IS 'YouBuddy live feed posts seeded from 20260820000002_seed_dummy_data.sql';
