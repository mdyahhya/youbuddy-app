// ============================================================================
// YouBuddy — Home Feed View (Instagram-Style Vertical Feed)
// ============================================================================

import { feedService } from '../services/feed.service.js';
import { ICONS, renderIcon } from '../icons.js';

export class FeedView {
  constructor(container) {
    this.container = container;
  }

  async render() {
    this.container.innerHTML = `
      <div class="feed-container">
        <div class="feed-header-bar">
          <div class="feed-status-pill">
            <span class="feed-status-dot"></span>
            <span>Live Feed</span>
          </div>
          <button class="icon-btn btn-refresh-feed" title="Refresh Feed">
            ${renderIcon('refresh', '', '16')}
          </button>
        </div>
        <div id="feed-posts-list">
          <div class="spinner"></div>
        </div>
      </div>
    `;

    this.container.querySelector('.btn-refresh-feed').addEventListener('click', () => {
      this.loadPosts();
    });

    await this.loadPosts();
  }

  async loadPosts() {
    const listEl = this.container.querySelector('#feed-posts-list');
    if (!listEl) return;

    try {
      const { posts, isExhausted, isNotConfigured } = await feedService.getFeedPosts();
      
      if (isNotConfigured) {
        listEl.innerHTML = `
          <div class="feed-exhaustion-box" style="border: 2px dashed var(--accent-border); padding: 32px 20px; background: var(--accent-light); border-radius: var(--radius-lg); margin: 16px;">
            <div style="color: var(--accent-color);">${renderIcon('shield', '', '36')}</div>
            <h3 style="font-weight: 700; margin-top: 10px; color: var(--accent-hover);">Supabase Backend Required</h3>
            <p style="font-size: 0.88rem; color: var(--text-secondary); margin: 8px 0 16px;">
              Hardcoded posts have been removed. Configure your live Supabase credentials in the Admin Panel to fetch real-time feed posts.
            </p>
            <button class="btn btn-primary btn-sm" id="btn-goto-db-config" style="margin: 0 auto;">
              Open Supabase Settings
            </button>
          </div>
        `;
        const btn = listEl.querySelector('#btn-goto-db-config');
        if (btn) {
          btn.addEventListener('click', () => {
            if (window.youBuddyApp) window.youBuddyApp.switchTab('admin');
            else window.location.href = 'admin.html';
          });
        }
        return;
      }

      if (!posts || posts.length === 0) {
        listEl.innerHTML = `
          <div class="feed-exhaustion-box" style="padding: 32px 20px; text-align: center;">
            <div style="color: var(--accent-color);">${renderIcon('home', '', '32')}</div>
            <p style="font-weight: 700; margin-top: 8px;">No posts found in Supabase.</p>
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">
              Run the SQL migration <code style="background: var(--bg-hover); padding: 2px 6px; border-radius: 4px;">20260820000002_seed_dummy_data.sql</code> in your Supabase SQL Editor, or create new posts from the Admin Panel.
            </p>
          </div>
        `;
        return;
      }

      listEl.innerHTML = posts.map(post => this.renderPostCard(post)).join('');

      if (isExhausted) {
        const exhaustNotice = document.createElement('div');
        exhaustNotice.className = 'feed-exhaustion-box';
        exhaustNotice.innerHTML = `
          <div style="color: var(--accent-color);">${renderIcon('check', '', '24')}</div>
          <p style="font-weight: 600;">You're all caught up!</p>
          <p style="font-size: 0.82rem;">Showing previously seen posts while you wait for new updates.</p>
        `;
        listEl.appendChild(exhaustNotice);
      }

      // Attach event listeners for post interactions
      this.attachPostListeners(listEl);

      // Initialize IntersectionObserver for auto seen tracking
      const cardElements = listEl.querySelectorAll('.post-card');
      feedService.setupFeedIntersectionObserver(cardElements);

    } catch (err) {
      console.error('[FeedView error]:', err);
      listEl.innerHTML = `<p style="padding: 20px; color: var(--color-error); text-align: center;">Failed to load feed posts.</p>`;
    }
  }

  renderPostCard(post) {
    const authorInitial = (post.author_name || 'Y')[0].toUpperCase();
    const formattedDate = this.formatDate(post.created_at);

    let specificContentHtml = '';

    switch (post.type) {
      case 'pinned_announcement':
        specificContentHtml = `
          <div class="pinned-badge-strip">
            ${renderIcon('pin', '', '13')}
            <span>Pinned Announcement</span>
          </div>
          <h2 class="post-title">${this.escapeHtml(post.title)}</h2>
          <div class="post-body">${this.escapeHtml(post.content || '')}</div>
        `;
        break;

      case 'study_tip':
        specificContentHtml = `
          <div class="study-tip-tag">
            ${renderIcon('studyTip', '', '14')}
            <span>Study Tip</span>
          </div>
          <h2 class="post-title">${this.escapeHtml(post.title)}</h2>
          <div class="post-body">${this.escapeHtml(post.content || '')}</div>
        `;
        break;

      case 'youtube_video':
        const videoId = post.extra_data?.youtube_video_id || feedService.parseYouTubeId(post.media_url);
        const thumbUrl = post.thumbnail_url || (videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '');
        specificContentHtml = `
          <h2 class="post-title">${this.escapeHtml(post.title)}</h2>
          ${post.content ? `<div class="post-body" style="margin-bottom: 8px;">${this.escapeHtml(post.content)}</div>` : ''}
          <div class="video-preview-wrapper" data-video-id="${videoId}" data-post-id="${post.id}">
            <img class="video-thumbnail" src="${thumbUrl}" alt="Video Thumbnail" loading="lazy" onerror="this.src='https://img.youtube.com/vi/${videoId}/hqdefault.jpg'"/>
            <div class="custom-play-overlay">
              ${ICONS.customPlay}
            </div>
          </div>
          <div class="video-action-bar">
            <button class="btn-video-fullscreen" data-video-id="${videoId}">
              ${renderIcon('fullscreen', '', '14')}
              <span>Expand Landscape</span>
            </button>
          </div>
        `;
        break;

      case 'mcq':
        const options = post.options || [];
        const userResp = post.user_response;
        const isAnswered = !!userResp;
        const optionsHtml = options.map(opt => {
          let btnClass = 'mcq-option-btn';
          let iconHtml = '';

          if (isAnswered) {
            if (opt.id === userResp.option_id) {
              btnClass += userResp.is_correct ? ' selected-correct' : ' selected-incorrect';
              iconHtml = userResp.is_correct ? renderIcon('check', '', '16') : renderIcon('cross', '', '16');
            } else if (opt.is_correct) {
              btnClass += ' highlight-correct';
              iconHtml = renderIcon('check', '', '16');
            }
          }

          return `
            <button class="${btnClass}" data-post-id="${post.id}" data-option-id="${opt.id}" ${isAnswered ? 'disabled' : ''}>
              <span class="mcq-option-letter">${opt.option_letter}</span>
              <span class="mcq-option-text">${this.escapeHtml(opt.option_text)}</span>
              ${iconHtml ? `<span style="margin-left: auto;">${iconHtml}</span>` : ''}
            </button>
          `;
        }).join('');

        let explanationHtml = '';
        if (isAnswered) {
          const correctOpt = options.find(o => o.is_correct);
          const explanationText = correctOpt?.explanation || 'Great job!';
          explanationHtml = `
            <div class="mcq-explanation-box ${userResp.is_correct ? 'correct' : 'incorrect'}">
              <div class="mcq-explanation-title">
                ${userResp.is_correct ? renderIcon('check', '', '16') + ' Correct!' : renderIcon('cross', '', '16') + ' Incorrect'}
              </div>
              <div>${this.escapeHtml(explanationText)}</div>
            </div>
          `;
        }

        specificContentHtml = `
          <h2 class="post-title">${this.escapeHtml(post.title)}</h2>
          <div class="post-body">${this.escapeHtml(post.content || '')}</div>
          <div class="mcq-container">
            ${optionsHtml}
          </div>
          ${explanationHtml}
        `;
        break;

      case 'image':
        specificContentHtml = `
          <h2 class="post-title">${this.escapeHtml(post.title)}</h2>
          ${post.content ? `<div class="post-body">${this.escapeHtml(post.content)}</div>` : ''}
          ${post.media_url ? `
            <div class="post-image-wrapper">
              <img src="${post.media_url}" alt="${this.escapeHtml(post.title)}" loading="lazy"/>
            </div>
          ` : ''}
        `;
        break;

      case 'video_link':
        specificContentHtml = `
          <h2 class="post-title">${this.escapeHtml(post.title)}</h2>
          <div class="post-body">${this.escapeHtml(post.content || '')}</div>
          <a class="post-video-link-card" href="${post.media_url}" target="_blank" rel="noopener noreferrer" data-post-id="${post.id}">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="color: var(--accent-color);">${renderIcon('videoLink', '', '20')}</div>
              <span style="font-weight: 600; font-size: 0.9rem;">Watch External Video</span>
            </div>
            ${renderIcon('externalLink', '', '16')}
          </a>
        `;
        break;
    }

    const cardClass = `post-card ${post.type === 'pinned_announcement' ? 'post-pinned' : ''} ${post.type === 'study_tip' ? 'post-study-tip' : ''}`;

    return `
      <article class="${cardClass}" data-post-id="${post.id}">
        <header class="post-header">
          <div class="post-author-info">
            <div class="post-author-avatar">
              ${post.author_avatar ? `<img src="${post.author_avatar}" alt="${post.author_name}"/>` : authorInitial}
            </div>
            <div class="post-author-meta">
              <span class="post-author-name">${this.escapeHtml(post.author_name || 'YouBuddy')}</span>
              <span class="post-author-role">${post.extra_data?.author_role || 'Academic Team'}</span>
            </div>
          </div>
          <span class="post-timestamp">${formattedDate}</span>
        </header>
        ${specificContentHtml}
      </article>
    `;
  }

  attachPostListeners(container) {
    // 1. YouTube Inline Player Trigger
    container.querySelectorAll('.video-preview-wrapper').forEach(preview => {
      preview.addEventListener('click', () => {
        const videoId = preview.getAttribute('data-video-id');
        const postId = preview.getAttribute('data-post-id');
        if (!videoId) return;

        feedService.markPostSeen(postId, 'video_play');

        preview.innerHTML = `
          <div class="video-iframe-container">
            <iframe 
              src="https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0&modestbranding=1" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              allowfullscreen>
            </iframe>
          </div>
        `;
      });
    });

    // 2. YouTube Fullscreen Landscape Expand Button
    container.querySelectorAll('.btn-video-fullscreen').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const videoId = btn.getAttribute('data-video-id');
        const card = btn.closest('.post-card');
        const preview = card?.querySelector('.video-preview-wrapper');
        const postId = card?.getAttribute('data-post-id');

        if (postId) feedService.markPostSeen(postId, 'video_play');

        if (preview) {
          preview.innerHTML = `
            <div class="video-iframe-container" id="fs-video-${videoId}">
              <iframe 
                src="https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0&modestbranding=1" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowfullscreen>
              </iframe>
            </div>
          `;

          const elem = preview.querySelector('iframe');
          if (elem.requestFullscreen) {
            elem.requestFullscreen();
          } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
          }
          if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(() => {});
          }
        }
      });
    });

    // 3. MCQ Option Click Listener
    container.querySelectorAll('.mcq-option-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const postId = btn.getAttribute('data-post-id');
        const optionId = btn.getAttribute('data-option-id');
        if (!postId || !optionId) return;

        await feedService.submitMCQAnswer(postId, optionId);
        await this.loadPosts(); // Re-render to update UI with feedback and explanation
      });
    });

    // 4. External Video Link Click
    container.querySelectorAll('.post-video-link-card').forEach(link => {
      link.addEventListener('click', () => {
        const postId = link.getAttribute('data-post-id');
        if (postId) feedService.markPostSeen(postId, 'click');
      });
    });
  }

  formatDate(dateString) {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  }

  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
