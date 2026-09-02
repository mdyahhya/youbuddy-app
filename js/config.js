// ============================================================================
// YouBuddy — Configuration & Initial Seed Data
// ============================================================================

export const CONFIG = {
  // Supabase project credentials (can also be configured via Admin Panel UI & stored in localStorage)
  SUPABASE_URL: localStorage.getItem("youbuddy_supabase_url") || "https://nstbirdzdcbspiccbslz.supabase.co",
  SUPABASE_ANON_KEY: localStorage.getItem("youbuddy_supabase_anon_key") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zdGJpcmR6ZGNic3BpY2Nic2x6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNjI2NzEsImV4cCI6MjEwMzkzODY3MX0.jOdrAkIlbtxUKQhoXczU4wD5Ht3CFBCY0Blqbv55tIo",
  
  // App Theming & Identity
  APP_NAME: "YouBuddy",
  ACCENT_COLOR: "#0B3D91",
  VERSION: "1.0.0",

  // Feed Seen Tracking Thresholds
  SEEN_INTERSECTION_THRESHOLD: 0.5, // 50% card visibility
  SEEN_TIME_THRESHOLD_MS: 1500,     // 1.5 seconds dwell time
};

export function getSupabaseCredentials() {
  const url = localStorage.getItem("youbuddy_supabase_url") || CONFIG.SUPABASE_URL;
  const key = localStorage.getItem("youbuddy_supabase_anon_key") || CONFIG.SUPABASE_ANON_KEY;
  const isConfigured = !!(url && key && !url.includes("your-supabase-project") && !key.includes("your-supabase-anon-key"));
  return { url, key, isConfigured };
}


// Initial Seed Data for Instant Launch & Offline/Local Previews
export const SEED_DATA = {
  universities: [
    {
      id: "uni-dbatu",
      name: "Dr. Babasaheb Ambedkar Technological University",
      short_code: "DBATU",
      logo_url: "",
      display_order: 1,
      is_active: true
    },
    {
      id: "uni-solapur",
      name: "Punyashlok Ahilyadevi Holkar Solapur University",
      short_code: "PAHSU",
      logo_url: "",
      display_order: 2,
      is_active: true
    }
  ],
  academic_years: [
    { id: "year-dbatu-1", university_id: "uni-dbatu", name: "First Year", year_number: 1, has_streams: false, display_order: 1 },
    { id: "year-dbatu-2", university_id: "uni-dbatu", name: "Second Year", year_number: 2, has_streams: true, display_order: 2 },
    { id: "year-dbatu-3", university_id: "uni-dbatu", name: "Third Year", year_number: 3, has_streams: true, display_order: 3 },
    { id: "year-dbatu-4", university_id: "uni-dbatu", name: "Fourth Year", year_number: 4, has_streams: true, display_order: 4 },
    { id: "year-solapur-1", university_id: "uni-solapur", name: "First Year", year_number: 1, has_streams: false, display_order: 1 },
    { id: "year-solapur-2", university_id: "uni-solapur", name: "Second Year", year_number: 2, has_streams: true, display_order: 2 }
  ],
  streams: [
    { id: "stream-dbatu-cse", year_id: "year-dbatu-2", name: "Computer Science & Engineering", code: "SY CSE", display_order: 1 },
    { id: "stream-dbatu-entc", year_id: "year-dbatu-2", name: "Electronics & Telecommunication", code: "SY ENTC", display_order: 2 },
    { id: "stream-dbatu-aids", year_id: "year-dbatu-2", name: "Artificial Intelligence & Data Science", code: "SY AI & DS", display_order: 3 },
    { id: "stream-dbatu-ty-cse", year_id: "year-dbatu-3", name: "Computer Science & Engineering", code: "TY CSE", display_order: 1 },
    { id: "stream-solapur-cse", year_id: "year-solapur-2", name: "Computer Science & Engineering", code: "SY CSE", display_order: 1 }
  ],
  subjects: [
    // DBATU First Year (Group A)
    { id: "sub-1", year_id: "year-dbatu-1", stream_id: null, name: "Engineering Mathematics I", code: "24AF1000BS101", group_name: "Group A", units_count: 5, display_order: 1 },
    { id: "sub-2", year_id: "year-dbatu-1", stream_id: null, name: "Engineering Chemistry", code: "24AF1CHEBS102", group_name: "Group A", units_count: 5, display_order: 2 },
    { id: "sub-3", year_id: "year-dbatu-1", stream_id: null, name: "Engineering Mechanics", code: "24AF1EMES104", group_name: "Group A", units_count: 5, display_order: 3 },
    { id: "sub-4", year_id: "year-dbatu-1", stream_id: null, name: "Programming for Problem Solving", code: "24AF1000ES106", group_name: "Group A", units_count: 5, display_order: 4 },
    { id: "sub-5", year_id: "year-dbatu-1", stream_id: null, name: "Communication Skills", code: "24AF1000VS109", group_name: "Group A", units_count: 5, display_order: 5 },
    // DBATU First Year (Group B)
    { id: "sub-6", year_id: "year-dbatu-1", stream_id: null, name: "Engineering Mathematics II", code: "24AF2000BS201", group_name: "Group B", units_count: 5, display_order: 1 },
    { id: "sub-7", year_id: "year-dbatu-1", stream_id: null, name: "Engineering Physics", code: "24AF2PHYBS202", group_name: "Group B", units_count: 5, display_order: 2 },
    { id: "sub-8", year_id: "year-dbatu-1", stream_id: null, name: "Basic Electrical & Electronics", code: "24AF2BEES203", group_name: "Group B", units_count: 5, display_order: 3 },
    // DBATU Second Year CSE
    { id: "sub-9", year_id: "year-dbatu-2", stream_id: "stream-dbatu-cse", name: "Data Structures & Algorithms", code: "BTCOC302", group_name: null, units_count: 5, display_order: 1 },
    { id: "sub-10", year_id: "year-dbatu-2", stream_id: "stream-dbatu-cse", name: "Discrete Mathematics", code: "BTBSC301", group_name: null, units_count: 5, display_order: 2 },
    { id: "sub-11", year_id: "year-dbatu-2", stream_id: "stream-dbatu-cse", name: "Object Oriented Programming Java", code: "BTCOC303", group_name: null, units_count: 5, display_order: 3 },
    { id: "sub-12", year_id: "year-dbatu-2", stream_id: "stream-dbatu-cse", name: "Digital Logic & Computer Architecture", code: "BTCOC304", group_name: null, units_count: 5, display_order: 4 }
  ],
  topics: [
    {
      id: "top-1",
      subject_id: "sub-1",
      title: "Unit 1: Linear Algebra & Matrices",
      unit_number: 1,
      description: "Rank of matrix, Normal form, System of linear equations, Eigenvalues and Eigenvectors.",
      pdf_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      file_size_bytes: 2450000,
      page_count: 32,
      display_order: 1
    },
    {
      id: "top-2",
      subject_id: "sub-1",
      title: "Unit 2: Differential Calculus",
      unit_number: 2,
      description: "Successive differentiation, Leibnitz theorem, Taylor and Maclaurin expansions.",
      pdf_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      file_size_bytes: 3120000,
      page_count: 45,
      display_order: 2
    },
    {
      id: "top-3",
      subject_id: "sub-9",
      title: "Unit 1: Introduction to Data Structures & Arrays",
      unit_number: 1,
      description: "Asymptotic notations, Big-O, Array representations, Sparse matrices.",
      pdf_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      file_size_bytes: 1850000,
      page_count: 28,
      display_order: 1
    },
    {
      id: "top-4",
      subject_id: "sub-9",
      title: "Unit 2: Stacks and Queues",
      unit_number: 2,
      description: "Stack ADT, Infix to Postfix conversion, Queue ADT, Circular queue, Priority queue.",
      pdf_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      file_size_bytes: 2900000,
      page_count: 38,
      display_order: 2
    }
  ],
  posts: [],
  default_user: {
    id: "user-default-1",
    full_name: "Engineering Student",
    headline: "B.Tech Computer Science | Tech & Code Enthusiast",
    bio: "Passionate about learning data structures, cloud architectures, and software engineering. Constantly building projects and learning new tech stacks.",
    selected_university_id: "uni-dbatu",
    selected_year_id: "year-dbatu-1",
    selected_stream_id: null,
    is_admin: true
  }
};
