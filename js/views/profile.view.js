// ============================================================================
// YouBuddy — LinkedIn-Style Profile View & Editor
// ============================================================================

import { authService } from '../services/auth.service.js';
import { notesService } from '../services/notes.service.js';
import { dbService } from '../supabase-client.js';
import { ICONS, renderIcon } from '../icons.js';

export class ProfileView {
  constructor(container, onOpenUniversityModal) {
    this.container = container;
    this.onOpenUniversityModal = onOpenUniversityModal;
  }

  async render() {
    const user = authService.getUser();
    const context = await notesService.getActiveContextDetails();
    const db = dbService.getDb();
    
    const userInitial = (user.full_name || 'E')[0].toUpperCase();
    const viewsCount = Object.keys(db.post_views?.[user.id] || {}).length;
    const mcqsCount = Object.keys(db.mcq_responses?.[user.id] || {}).length;
    const notesCount = (db.topics || []).length;

    this.container.innerHTML = `
      <div class="profile-container">
        <!-- Cover Banner -->
        <div class="profile-cover-banner"></div>

        <!-- Main Profile Info Card -->
        <div class="profile-main-card">
          <div class="profile-avatar-row">
            <div class="profile-avatar-large">
              ${user.avatar_url ? `<img src="${user.avatar_url}" alt="${user.full_name}"/>` : userInitial}
            </div>
            <button class="btn btn-outline btn-sm" id="btn-edit-profile">
              ${renderIcon('edit', '', '14')}
              <span>Edit Profile</span>
            </button>
          </div>

          <div class="profile-details-group">
            <h1 class="profile-name">${this.escapeHtml(user.full_name || 'Engineering Student')}</h1>
            <p class="profile-headline">${this.escapeHtml(user.headline || 'B.Tech Engineering Student')}</p>
            ${user.bio ? `<p class="profile-bio">${this.escapeHtml(user.bio)}</p>` : ''}
          </div>
        </div>

        <!-- Academic Info Card -->
        <div class="profile-section-card">
          <div class="profile-section-title">
            ${renderIcon('university', '', '18')}
            <span>Academic Credentials</span>
            <button class="btn btn-sm btn-secondary" id="btn-change-profile-uni" style="margin-left: auto;">
              Change
            </button>
          </div>
          <div class="academic-info-grid">
            <div class="academic-info-item">
              <div class="academic-item-icon">${renderIcon('university', '', '18')}</div>
              <div class="academic-item-content">
                <span class="academic-item-label">University</span>
                <span class="academic-item-value">${this.escapeHtml(context.university.name)}</span>
              </div>
            </div>
            <div class="academic-info-item">
              <div class="academic-item-icon">${renderIcon('calendar', '', '18')}</div>
              <div class="academic-item-content">
                <span class="academic-item-label">Academic Year</span>
                <span class="academic-item-value">${this.escapeHtml(context.year.name)}</span>
              </div>
            </div>
            ${context.stream ? `
              <div class="academic-info-item">
                <div class="academic-item-icon">${renderIcon('branch', '', '18')}</div>
                <div class="academic-item-content">
                  <span class="academic-item-label">Branch / Stream</span>
                  <span class="academic-item-value">${this.escapeHtml(context.stream.name)} (${context.stream.code})</span>
                </div>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Student Activity Stats -->
        <div class="profile-stats-row">
          <div class="stat-box">
            <span class="stat-number">${viewsCount}</span>
            <span class="stat-label">Feed Views</span>
          </div>
          <div class="stat-box">
            <span class="stat-number">${mcqsCount}</span>
            <span class="stat-label">MCQs Solved</span>
          </div>
          <div class="stat-box">
            <span class="stat-number">${notesCount}</span>
            <span class="stat-label">Notes Listed</span>
          </div>
        </div>

        <!-- Admin Access Quick Banner -->
        <div class="profile-section-card" style="display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="color: var(--accent-color);">${renderIcon('shield', '', '20')}</div>
            <div>
              <div style="font-weight: 700; font-size: 0.95rem;">Admin Privileges</div>
              <div style="font-size: 0.8rem; color: var(--text-muted);">
                ${user.is_admin ? 'Active Administrator Access' : 'Standard Student Account'}
              </div>
            </div>
          </div>
          <button class="btn btn-sm ${user.is_admin ? 'btn-primary' : 'btn-secondary'}" id="btn-toggle-admin-role">
            ${user.is_admin ? 'Admin Enabled' : 'Enable Admin'}
          </button>
        </div>
      </div>
    `;

    // Event Handlers
    this.container.querySelector('#btn-edit-profile').addEventListener('click', () => {
      this.openEditModal();
    });

    this.container.querySelector('#btn-change-profile-uni').addEventListener('click', () => {
      if (this.onOpenUniversityModal) this.onOpenUniversityModal();
    });

    this.container.querySelector('#btn-toggle-admin-role').addEventListener('click', () => {
      authService.setAdminMode(!user.is_admin);
      this.render();
    });
  }

  openEditModal() {
    const user = authService.getUser();
    const modalId = 'edit-profile-modal';
    let modal = document.getElementById(modalId);
    if (!modal) {
      modal = document.createElement('div');
      modal.id = modalId;
      modal.className = 'modal-backdrop';
      modal.innerHTML = `
        <div class="modal-dialog">
          <div class="modal-header">
            <h3 class="modal-title">Edit Profile</h3>
            <button class="icon-btn" id="close-edit-modal-btn" aria-label="Close">${renderIcon('close')}</button>
          </div>
          <div class="modal-body">
            <form id="edit-profile-form">
              <div class="form-group">
                <label class="form-label" for="profile-edit-name">Full Name</label>
                <input class="form-control" type="text" id="profile-edit-name" required value="${this.escapeHtml(user.full_name || '')}"/>
              </div>
              <div class="form-group">
                <label class="form-label" for="profile-edit-headline">Headline</label>
                <input class="form-control" type="text" id="profile-edit-headline" placeholder="e.g. B.Tech Computer Science | Developer" value="${this.escapeHtml(user.headline || '')}"/>
              </div>
              <div class="form-group">
                <label class="form-label" for="profile-edit-bio">About / Bio</label>
                <textarea class="form-control" id="profile-edit-bio" rows="3" placeholder="Tell other students about yourself...">${this.escapeHtml(user.bio || '')}</textarea>
              </div>
              <div class="modal-footer" style="padding-left: 0; padding-right: 0; margin-top: 16px;">
                <button type="button" class="btn btn-secondary" id="btn-cancel-profile">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.querySelector('#close-edit-modal-btn').addEventListener('click', () => modal.classList.remove('open'));
      modal.querySelector('#btn-cancel-profile').addEventListener('click', () => modal.classList.remove('open'));
      
      modal.querySelector('#edit-profile-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const updatedName = modal.querySelector('#profile-edit-name').value;
        const updatedHeadline = modal.querySelector('#profile-edit-headline').value;
        const updatedBio = modal.querySelector('#profile-edit-bio').value;

        authService.updateProfile({
          full_name: updatedName,
          headline: updatedHeadline,
          bio: updatedBio
        });

        modal.classList.remove('open');
        this.render();
      });
    }

    setTimeout(() => modal.classList.add('open'), 10);
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
