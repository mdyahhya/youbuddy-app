// ============================================================================
// YouBuddy — Feed Service (Smart Seen-Tracking & Post Retrieval)
// ============================================================================

import { dbService } from '../supabase-client.js';
import { authService } from './auth.service.js';
import { CONFIG } from '../config.js';

class FeedService {
  constructor() {
    this.observer = null;
    this.dwellTimers = new Map();
    this.seenPostsSession = new Set();
  }

  /**
   * Smart Feed Algorithm:
   * 1. Fetches live posts directly from Supabase (including nested mcq_options).
   * 2. Pinned active announcements ALWAYS on top.
   * 3. Unseen posts for this user, newest-first.
   * 4. Recycled seen posts when unseen pool is exhausted (least recently seen first).
   * 5. Absolutely NO hardcoded fallback posts.
   */
  async getFeedPosts() {
    const user = authService.getUser();
    const userId = user?.id || 'guest';
    const db = dbService.getDb();

    // Check if live Supabase is configured
    if (!dbService.isLiveConfigured) {
      return {
        posts: [],
        unseenCount: 0,
        isExhausted: false,
        isNotConfigured: true
      };
    }

    let allPosts = [];
    try {
      allPosts = await dbService.getFeedPostsWithMCQ();
    } catch (err) {
      console.error('[FeedService] Failed to fetch posts from Supabase:', err);
      throw err;
    }

    // Cache posts for fast lookup during MCQ interactions
    this.cachedPosts = allPosts;

    const postViews = db.post_views || {};
    const userViews = postViews[userId] || {};
    const mcqResponses = db.mcq_responses || {};
    const userResponses = mcqResponses[userId] || {};

    // 1. Pinned Posts
    const pinnedPosts = allPosts.filter(p => p.is_pinned);

    // 2. Unseen Posts (non-pinned)
    const unseenPosts = allPosts
      .filter(p => !p.is_pinned && !userViews[p.id])
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // 3. Recycled Seen Posts (non-pinned)
    const recycledPosts = allPosts
      .filter(p => !p.is_pinned && userViews[p.id])
      .sort((a, b) => {
        const timeA = new Date(userViews[a.id]?.viewed_at || 0).getTime();
        const timeB = new Date(userViews[b.id]?.viewed_at || 0).getTime();
        return timeA - timeB; // Oldest seen first
      });

    // Attach MCQ options and user answer state
    const processPost = (post, isSeen) => {
      const options = post.options || post.mcq_options || [];
      return {
        ...post,
        options,
        is_seen: isSeen,
        user_response: userResponses[post.id] || null
      };
    };

    const finalPosts = [
      ...pinnedPosts.map(p => processPost(p, !!userViews[p.id])),
      ...unseenPosts.map(p => processPost(p, false)),
      ...recycledPosts.map(p => processPost(p, true))
    ];

    return {
      posts: finalPosts,
      unseenCount: unseenPosts.length,
      isExhausted: unseenPosts.length === 0 && recycledPosts.length > 0,
      isNotConfigured: false
    };
  }

  /**
   * Mark a post as seen by user with interaction type
   */
  markPostSeen(postId, interactionType = 'impression') {
    const user = authService.getUser();
    const userId = user?.id || 'guest';
    const db = dbService.getDb();
    
    if (!db.post_views) db.post_views = {};
    if (!db.post_views[userId]) db.post_views[userId] = {};

    db.post_views[userId][postId] = {
      viewed_at: new Date().toISOString(),
      interaction_type: interactionType
    };

    dbService.saveDb(db);
    this.seenPostsSession.add(postId);

    // Also call Supabase RPC if live
    if (dbService.isLiveConfigured && dbService.client) {
      dbService.client.rpc('mark_post_seen', {
        p_post_id: postId,
        p_interaction_type: interactionType
      }).catch(err => console.error('[Supabase mark_post_seen error]:', err));
    }
  }

  /**
   * Setup IntersectionObserver for auto-impression tracking
   */
  setupFeedIntersectionObserver(postElements) {
    if (this.observer) {
      this.observer.disconnect();
    }

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const postId = entry.target.getAttribute('data-post-id');
        if (!postId) return;

        if (entry.isIntersecting && entry.intersectionRatio >= CONFIG.SEEN_INTERSECTION_THRESHOLD) {
          // Start dwell timer (1.5s)
          if (!this.dwellTimers.has(postId)) {
            const timer = setTimeout(() => {
              this.markPostSeen(postId, 'impression');
              this.dwellTimers.delete(postId);
            }, CONFIG.SEEN_TIME_THRESHOLD_MS);
            this.dwellTimers.set(postId, timer);
          }
        } else {
          // Cancel timer if user quickly scrolled past
          if (this.dwellTimers.has(postId)) {
            clearTimeout(this.dwellTimers.get(postId));
            this.dwellTimers.delete(postId);
          }
        }
      });
    }, {
      threshold: [0.5]
    });

    postElements.forEach(el => this.observer.observe(el));
  }

  /**
   * Submit an MCQ answer
   */
  async submitMCQAnswer(postId, optionId) {
    const user = authService.getUser();
    const userId = user?.id || 'guest';
    const db = dbService.getDb();
    
    const post = (this.cachedPosts || []).find(p => p.id === postId) || (db.posts || []).find(p => p.id === postId);
    const options = post?.options || post?.mcq_options || (db.mcq_options || []).filter(o => o.post_id === postId);
    const selectedOption = options.find(o => o.id === optionId);

    if (!selectedOption) return null;

    const isCorrect = !!selectedOption.is_correct;
    const responseData = {
      option_id: optionId,
      is_correct: isCorrect,
      answered_at: new Date().toISOString()
    };

    if (!db.mcq_responses) db.mcq_responses = {};
    if (!db.mcq_responses[userId]) db.mcq_responses[userId] = {};
    db.mcq_responses[userId][postId] = responseData;
    dbService.saveDb(db);

    // Mark post seen on interaction
    this.markPostSeen(postId, 'mcq_vote');

    return {
      selectedOption,
      isCorrect,
      explanation: selectedOption.explanation || (options.find(o => o.is_correct)?.explanation)
    };
  }

  /**
   * YouTube Helper: Parse Video ID & Auto-fetch Info
   */
  parseYouTubeId(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  async fetchYouTubeInfo(url) {
    const videoId = this.parseYouTubeId(url);
    if (!videoId) {
      throw new Error("Invalid YouTube URL. Please provide a valid youtube.com or youtu.be link.");
    }

    let title = "YouTube Video";
    try {
      const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.title) title = data.title;
      }
    } catch (e) {
      console.warn("Could not auto-fetch YouTube title:", e);
    }

    const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    return {
      videoId,
      title,
      thumbnail,
      fallbackThumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    };
  }
}

export const feedService = new FeedService();
