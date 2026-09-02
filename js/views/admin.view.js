// ============================================================================
// YouBuddy — Admin Panel View (Post Builder, MCQ Creator, Curriculum Manager)
// ============================================================================

import { adminService } from '../services/admin.service.js';
import { feedService } from '../services/feed.service.js';
import { notesService } from '../services/notes.service.js';
import { dbService } from '../supabase-client.js';
import { ICONS, renderIcon } from '../icons.js';

export class AdminView {
  constructor(container, onBackToFeed) {
    this.container = container;
    this.onBackToFeed = onBackToFeed;
    this.activeTab = 'create_post';
    this.selectedPostType = 'study_tip';
    this.youtubeAutoData = null;
  }

  async render() {
    this.container.innerHTML = `
      <div class="admin-container">
        <div class="admin-header">
          <div>
            <h1 style="font-size: 1.3rem; font-weight: 800; color: var(--text-primary);">Admin Dashboard</h1>
            <div style="font-size: 0.8rem; color: var(--text-muted);">Manage feed posts, MCQs & academic syllabus</div>
          </div>
          <span class="admin-badge">${renderIcon('shield', '', '13')} Admin</span>
        </div>

        <!-- Admin Tabs -->
        <div class="admin-tabs">
          <button class="admin-tab-btn ${this.activeTab === 'create_post' ? 'active' : ''}" data-tab="create_post">
            Create Post
          </button>
          <button class="admin-tab-btn ${this.activeTab === 'manage_posts' ? 'active' : ''}" data-tab="manage_posts">
            Manage Posts
          </button>
          <button class="admin-tab-btn ${this.activeTab === 'curriculum' ? 'active' : ''}" data-tab="curriculum">
            Curriculum & PDFs
          </button>
        </div>

        <!-- Tab Content Area -->
        <div id="admin-tab-content"></div>
      </div>
    `;

    this.container.querySelectorAll('.admin-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeTab = btn.getAttribute('data-tab');
        this.render();
      });
    });

    const contentArea = this.container.querySelector('#admin-tab-content');
    if (this.activeTab === 'create_post') {
      await this.renderCreatePostTab(contentArea);
    } else if (this.activeTab === 'manage_posts') {
      await this.renderManagePostsTab(contentArea);
    } else if (this.activeTab === 'curriculum') {
      await this.renderCurriculumTab(contentArea);
    }
  }

  async renderCreatePostTab(container) {
    container.innerHTML = `
      <div class="admin-card">
        <h2 class="admin-card-title">Select Post Type</h2>
        <div class="post-type-grid">
          <div class="post-type-choice ${this.selectedPostType === 'pinned_announcement' ? 'active' : ''}" data-type="pinned_announcement">
            <span style="color: var(--accent-color);">${renderIcon('pin', '', '20')}</span>
            <span>Pinned Announcement</span>
          </div>
          <div class="post-type-choice ${this.selectedPostType === 'study_tip' ? 'active' : ''}" data-type="study_tip">
            <span style="color: var(--accent-color);">${renderIcon('studyTip', '', '20')}</span>
            <span>Study Tip</span>
          </div>
          <div class="post-type-choice ${this.selectedPostType === 'youtube_video' ? 'active' : ''}" data-type="youtube_video">
            <span style="color: var(--accent-color);">${renderIcon('youtube', '', '20')}</span>
            <span>YouTube Video</span>
          </div>
          <div class="post-type-choice ${this.selectedPostType === 'mcq' ? 'active' : ''}" data-type="mcq">
            <span style="color: var(--accent-color);">${renderIcon('mcq', '', '20')}</span>
            <span>MCQ Challenge</span>
          </div>
          <div class="post-type-choice ${this.selectedPostType === 'image' ? 'active' : ''}" data-type="image">
            <span style="color: var(--accent-color);">${renderIcon('image', '', '20')}</span>
            <span>Image Post</span>
          </div>
          <div class="post-type-choice ${this.selectedPostType === 'video_link' ? 'active' : ''}" data-type="video_link">
            <span style="color: var(--accent-color);">${renderIcon('videoLink', '', '20')}</span>
            <span>Video Link</span>
          </div>
        </div>

        <form id="admin-post-form">
          <!-- Common Fields -->
          <div class="form-group">
            <label class="form-label" for="post-form-title">Post Title</label>
            <input type="text" class="form-control" id="post-form-title" required placeholder="Enter post title..."/>
          </div>

          <!-- YouTube Specific Auto-Fetch Section -->
          ${this.selectedPostType === 'youtube_video' ? `
            <div class="form-group">
              <label class="form-label" for="post-form-yt-url">YouTube Video URL</label>
              <div class="url-fetch-row">
                <input type="url" class="form-control" id="post-form-yt-url" placeholder="https://www.youtube.com/watch?v=... or youtu.be/..." required/>
                <button type="button" class="btn btn-secondary btn-sm" id="btn-fetch-yt">
                  ${renderIcon('refresh', '', '14')}
                  <span>Fetch Info</span>
                </button>
              </div>
              <small style="color: var(--text-muted); font-size: 0.75rem; margin-top: 4px;">
                Auto-pulls video title and clean thumbnail with custom overlay.
              </small>
            </div>
            <div id="yt-preview-area" class="hidden"></div>
          ` : ''}

          <!-- MCQ Specific Section -->
          ${this.selectedPostType === 'mcq' ? `
            <div class="form-group">
              <label class="form-label">Multiple Choice Options (Select the correct answer)</label>
              <div class="mcq-admin-options">
                <div class="mcq-admin-option-row">
                  <input type="radio" name="mcq_correct" value="A" class="mcq-radio-correct" checked/>
                  <input type="text" class="form-control" id="mcq-opt-A" placeholder="Option A text..." required/>
                </div>
                <div class="mcq-admin-option-row">
                  <input type="radio" name="mcq_correct" value="B" class="mcq-radio-correct"/>
                  <input type="text" class="form-control" id="mcq-opt-B" placeholder="Option B text..." required/>
                </div>
                <div class="mcq-admin-option-row">
                  <input type="radio" name="mcq_correct" value="C" class="mcq-radio-correct"/>
                  <input type="text" class="form-control" id="mcq-opt-C" placeholder="Option C text..." required/>
                </div>
                <div class="mcq-admin-option-row">
                  <input type="radio" name="mcq_correct" value="D" class="mcq-radio-correct"/>
                  <input type="text" class="form-control" id="mcq-opt-D" placeholder="Option D text..." required/>
                </div>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label" for="mcq-form-explanation">Solution Explanation</label>
              <textarea class="form-control" id="mcq-form-explanation" rows="2" placeholder="Explain the step-by-step reasoning..."></textarea>
            </div>
          ` : ''}

          <!-- Media Link for Image/Video Link -->
          ${(this.selectedPostType === 'image' || this.selectedPostType === 'video_link') ? `
            <div class="form-group">
              <label class="form-label" for="post-form-media-url">Media / Resource URL</label>
              <input type="url" class="form-control" id="post-form-media-url" placeholder="https://... image or video link" required/>
            </div>
          ` : ''}

          <!-- Content / Body -->
          <div class="form-group">
            <label class="form-label" for="post-form-content">Body / Description Text</label>
            <textarea class="form-control" id="post-form-content" rows="4" placeholder="Write content details here..."></textarea>
          </div>

          <button type="submit" class="btn btn-primary btn-block" style="margin-top: 20px;">
            ${renderIcon('plus', '', '16')}
            <span>Publish Post to Feed</span>
          </button>
        </form>
      </div>
    `;

    // Post Type Grid Listeners
    container.querySelectorAll('.post-type-choice').forEach(choice => {
      choice.addEventListener('click', () => {
        this.selectedPostType = choice.getAttribute('data-type');
        this.renderCreatePostTab(container);
      });
    });

    // YouTube Fetch Info Handler
    const fetchYtBtn = container.querySelector('#btn-fetch-yt');
    if (fetchYtBtn) {
      fetchYtBtn.addEventListener('click', async () => {
        const urlInput = container.querySelector('#post-form-yt-url');
        const previewArea = container.querySelector('#yt-preview-area');
        const titleInput = container.querySelector('#post-form-title');

        if (!urlInput.value) {
          alert('Please enter a YouTube link first.');
          return;
        }

        try {
          fetchYtBtn.disabled = true;
          fetchYtBtn.innerHTML = `<span>Fetching...</span>`;

          const info = await feedService.fetchYouTubeInfo(urlInput.value);
          this.youtubeAutoData = info;

          if (!titleInput.value) {
            titleInput.value = info.title;
          }

          previewArea.className = 'live-preview-box';
          previewArea.innerHTML = `
            <div class="live-preview-label">Live Preview (Custom Accent Play Button):</div>
            <div class="video-preview-wrapper" style="margin-top: 0;">
              <img class="video-thumbnail" src="${info.thumbnail}" alt="Preview" onerror="this.src='${info.fallbackThumbnail}'"/>
              <div class="custom-play-overlay">
                ${ICONS.customPlay}
              </div>
            </div>
          `;
        } catch (err) {
          alert(err.message || 'Could not fetch YouTube details.');
        } finally {
          fetchYtBtn.disabled = false;
          fetchYtBtn.innerHTML = `${renderIcon('refresh', '', '14')} <span>Fetch Info</span>`;
        }
      });
    }

    // Submit Form Handler
    const form = container.querySelector('#admin-post-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const title = container.querySelector('#post-form-title').value;
      const content = container.querySelector('#post-form-content').value;
      let mediaUrl = null;
      let options = null;

      if (this.selectedPostType === 'youtube_video') {
        mediaUrl = container.querySelector('#post-form-yt-url').value;
      } else if (this.selectedPostType === 'image' || this.selectedPostType === 'video_link') {
        mediaUrl = container.querySelector('#post-form-media-url').value;
      } else if (this.selectedPostType === 'mcq') {
        const correctOptLetter = container.querySelector('input[name="mcq_correct"]:checked').value;
        const explanation = container.querySelector('#mcq-form-explanation').value;

        options = ['A', 'B', 'C', 'D'].map(letter => {
          return {
            option_letter: letter,
            option_text: container.querySelector(`#mcq-opt-${letter}`).value,
            is_correct: letter === correctOptLetter,
            explanation: explanation
          };
        });
      }

      await adminService.createPost({
        type: this.selectedPostType,
        is_pinned: this.selectedPostType === 'pinned_announcement',
        title: title,
        content: content,
        media_url: mediaUrl,
        options: options
      });

      alert('Post successfully published to feed!');
      if (this.onBackToFeed) this.onBackToFeed();
    });
  }

  async renderManagePostsTab(container) {
    const db = dbService.getDb();
    const posts = db.posts || [];

    const postsHtml = posts.map(p => `
      <div class="admin-item-row" data-post-id="${p.id}">
        <div class="admin-item-info">
          <div class="admin-item-title">${this.escapeHtml(p.title)}</div>
          <div class="admin-item-subtitle">
            <span class="badge badge-accent">${p.type}</span>
            ${p.is_pinned ? '<span class="badge" style="background: #FEF3C7; color: #92400E;">PINNED</span>' : ''}
          </div>
        </div>
        <div class="admin-item-actions">
          <button class="icon-btn btn-delete-post" data-post-id="${p.id}" title="Delete Post" style="color: var(--color-error);">
            ${renderIcon('trash', '', '18')}
          </button>
        </div>
      </div>
    `).join('');

    container.innerHTML = `
      <div class="admin-card">
        <h2 class="admin-card-title">Manage Published Feed Posts (${posts.length})</h2>
        <div class="admin-items-list">
          ${posts.length > 0 ? postsHtml : '<p style="color: var(--text-muted); text-align: center; padding: 20px;">No posts published yet.</p>'}
        </div>
      </div>
    `;

    container.querySelectorAll('.btn-delete-post').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-post-id');
        if (confirm('Are you sure you want to delete this post?')) {
          await adminService.deletePost(id);
          this.renderManagePostsTab(container);
        }
      });
    });
  }

  async renderCurriculumTab(container) {
    const unis = await notesService.getUniversities();
    const db = dbService.getDb();
    const subjects = db.subjects || [];

    container.innerHTML = `
      <div class="admin-card" style="margin-bottom: 20px;">
        <h2 class="admin-card-title">Quick Add Subject</h2>
        <form id="add-subject-form">
          <div class="form-group">
            <label class="form-label">University & Year</label>
            <select class="form-control" id="add-sub-year" required>
              <option value="year-dbatu-1">DBATU — First Year</option>
              <option value="year-dbatu-2">DBATU — Second Year</option>
              <option value="year-solapur-1">PAHSU — First Year</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Subject Name</label>
            <input type="text" class="form-control" id="add-sub-name" placeholder="e.g. Applied Mathematics" required/>
          </div>
          <div class="form-group">
            <label class="form-label">Subject Code (Optional)</label>
            <input type="text" class="form-control" id="add-sub-code" placeholder="e.g. BTBS301"/>
          </div>
          <div class="form-group">
            <label class="form-label">Group / Division (e.g. Group A, Group B)</label>
            <input type="text" class="form-control" id="add-sub-group" placeholder="Leave blank if common"/>
          </div>
          <button type="submit" class="btn btn-primary btn-block">Add Subject</button>
        </form>
      </div>

      <div class="admin-card">
        <h2 class="admin-card-title">Add Topic Notes & PDF Link</h2>
        <form id="add-topic-form">
          <div class="form-group">
            <label class="form-label">Select Subject</label>
            <select class="form-control" id="add-topic-subject" required>
              ${subjects.map(s => `<option value="${s.id}">${this.escapeHtml(s.name)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Topic / Unit Title</label>
            <input type="text" class="form-control" id="add-topic-title" placeholder="e.g. Unit 1: Matrices & Linear Equations" required/>
          </div>
          <div class="form-group">
            <label class="form-label">PDF Notes URL (Supabase Storage URL or Public PDF)</label>
            <input type="url" class="form-control" id="add-topic-pdf" placeholder="https://..." value="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" required/>
          </div>
          <button type="submit" class="btn btn-primary btn-block">Upload & Attach PDF Note</button>
        </form>
      </div>
    `;

    // Add Subject Listener
    container.querySelector('#add-subject-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const yearId = container.querySelector('#add-sub-year').value;
      const name = container.querySelector('#add-sub-name').value;
      const code = container.querySelector('#add-sub-code').value;
      const group = container.querySelector('#add-sub-group').value;

      await adminService.createSubject({
        year_id: yearId,
        name,
        code,
        group_name: group || null
      });

      alert(`Subject "${name}" successfully added!`);
      this.renderCurriculumTab(container);
    });

    // Add Topic Listener
    container.querySelector('#add-topic-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const subId = container.querySelector('#add-topic-subject').value;
      const title = container.querySelector('#add-topic-title').value;
      const pdfUrl = container.querySelector('#add-topic-pdf').value;

      await adminService.createTopic({
        subject_id: subId,
        title,
        pdf_url: pdfUrl
      });

      alert(`Topic "${title}" with PDF attached!`);
    });
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
