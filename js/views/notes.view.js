// ============================================================================
// YouBuddy — Notes Section View (Subjects -> Topics -> PDF Viewer)
// ============================================================================

import { notesService } from '../services/notes.service.js';
import { authService } from '../services/auth.service.js';
import { ICONS, renderIcon } from '../icons.js';

export class NotesView {
  constructor(container, onOpenUniversityModal) {
    this.container = container;
    this.onOpenUniversityModal = onOpenUniversityModal;
    this.selectedSubject = null;
    this.activeGroup = 'Group A';
  }

  async render() {
    const context = await notesService.getActiveContextDetails();
    const user = authService.getUser();

    this.container.innerHTML = `
      <div class="notes-container">
        <!-- Active Academic Context Bar -->
        <div class="academic-context-card">
          <div class="context-text-group">
            <span class="context-uni-label">${context.university.short_code || context.university.name}</span>
            <span class="context-title">${context.year.name}${context.stream ? ' • ' + context.stream.code : ''}</span>
          </div>
          <button class="btn-change-context" id="btn-change-uni">
            Change
          </button>
        </div>

        <div id="notes-content-area">
          <div class="spinner"></div>
        </div>
      </div>
    `;

    this.container.querySelector('#btn-change-uni').addEventListener('click', () => {
      if (this.onOpenUniversityModal) this.onOpenUniversityModal();
    });

    await this.renderSubjectsList();
  }

  async renderSubjectsList() {
    const contentArea = this.container.querySelector('#notes-content-area');
    if (!contentArea) return;

    const user = authService.getUser();
    const yearId = user?.selected_year_id || 'year-dbatu-1';
    const streamId = user?.selected_stream_id || null;

    const subjects = await notesService.getSubjects(yearId, streamId);

    // Check if subjects have groups (e.g. Group A / Group B in First Year)
    const hasGroups = subjects.some(s => s.group_name);
    let filteredSubjects = subjects;

    if (hasGroups) {
      filteredSubjects = subjects.filter(s => s.group_name === this.activeGroup || !s.group_name);
    }

    let groupTabsHtml = '';
    if (hasGroups) {
      groupTabsHtml = `
        <div class="group-tabs-container" style="margin-bottom: 16px;">
          <button class="group-tab-btn ${this.activeGroup === 'Group A' ? 'active' : ''}" data-group="Group A">
            Group A
          </button>
          <button class="group-tab-btn ${this.activeGroup === 'Group B' ? 'active' : ''}" data-group="Group B">
            Group B
          </button>
        </div>
      `;
    }

    const subjectsHtml = filteredSubjects.length > 0 ? filteredSubjects.map(sub => `
      <div class="subject-card" data-subject-id="${sub.id}">
        <div class="subject-info">
          <div class="subject-name">${this.escapeHtml(sub.name)}</div>
          <div class="subject-meta">
            ${sub.code ? `<span>Code: ${this.escapeHtml(sub.code)}</span> • ` : ''}
            <span>${sub.units_count || 5} Units</span>
          </div>
        </div>
        <div class="subject-chevron">
          ${renderIcon('chevronRight', '', '20')}
        </div>
      </div>
    `).join('') : `
      <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
        <p>No subjects found for this selection.</p>
      </div>
    `;

    contentArea.innerHTML = `
      ${groupTabsHtml}
      <div class="subjects-section-title">
        <span>Curriculum Subjects (${filteredSubjects.length})</span>
      </div>
      <div class="subjects-list" style="margin-top: 12px;">
        ${subjectsHtml}
      </div>
    `;

    // Group Tab Switchers
    contentArea.querySelectorAll('.group-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeGroup = btn.getAttribute('data-group');
        this.renderSubjectsList();
      });
    });

    // Subject Card Click Listeners
    contentArea.querySelectorAll('.subject-card').forEach(card => {
      card.addEventListener('click', () => {
        const subId = card.getAttribute('data-subject-id');
        const sub = subjects.find(s => s.id === subId);
        if (sub) {
          this.selectedSubject = sub;
          this.renderTopicsList(sub);
        }
      });
    });
  }

  async renderTopicsList(subject) {
    const contentArea = this.container.querySelector('#notes-content-area');
    if (!contentArea) return;

    contentArea.innerHTML = `<div class="spinner"></div>`;

    const topics = await notesService.getTopics(subject.id);

    const topicsHtml = topics.length > 0 ? topics.map(t => `
      <div class="topic-item-card">
        <div class="topic-details">
          <div class="topic-title">${this.escapeHtml(t.title)}</div>
          <div class="topic-meta">
            <span>${t.page_count ? t.page_count + ' Pages' : 'PDF Document'}</span>
            ${t.file_size_bytes ? `• <span>${(t.file_size_bytes / (1024 * 1024)).toFixed(1)} MB</span>` : ''}
          </div>
          ${t.description ? `<p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;">${this.escapeHtml(t.description)}</p>` : ''}
        </div>
        <button class="btn-open-pdf" data-pdf-url="${t.pdf_url}" data-topic-title="${this.escapeHtml(t.title)}" data-subject-name="${this.escapeHtml(subject.name)}">
          ${renderIcon('notes', '', '14')}
          <span>View PDF</span>
        </button>
      </div>
    `).join('') : `
      <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
        <p>No topic notes uploaded yet for this subject.</p>
      </div>
    `;

    contentArea.innerHTML = `
      <div class="topics-view-header">
        <button class="btn-back-subjects" id="btn-back-to-subjects">
          ${renderIcon('chevronLeft', '', '22')}
        </button>
        <div>
          <h3 class="topics-header-title">${this.escapeHtml(subject.name)}</h3>
          <div style="font-size: 0.78rem; color: var(--text-muted);">${subject.code ? 'Code: ' + subject.code : 'Syllabus Units'}</div>
        </div>
      </div>
      <div class="topics-list">
        ${topicsHtml}
      </div>
    `;

    contentArea.querySelector('#btn-back-to-subjects').addEventListener('click', () => {
      this.renderSubjectsList();
    });

    contentArea.querySelectorAll('.btn-open-pdf').forEach(btn => {
      btn.addEventListener('click', () => {
        const url = btn.getAttribute('data-pdf-url');
        const title = btn.getAttribute('data-topic-title');
        const subName = btn.getAttribute('data-subject-name');
        this.openPDFViewer(url, title, subName);
      });
    });
  }

  openPDFViewer(pdfUrl, title, subjectName) {
    const modalId = 'pdf-viewer-modal';
    let modal = document.getElementById(modalId);
    if (!modal) {
      modal = document.createElement('div');
      modal.id = modalId;
      modal.className = 'modal-backdrop';
      modal.innerHTML = `
        <div class="modal-dialog pdf-viewer-dialog">
          <div class="pdf-viewer-header">
            <div class="pdf-header-info">
              <span class="pdf-header-title" id="pdf-modal-title">Notes PDF</span>
              <span class="pdf-header-subject" id="pdf-modal-subject">Subject</span>
            </div>
            <div class="pdf-header-actions">
              <a class="btn btn-secondary btn-sm" id="pdf-modal-download" href="#" target="_blank" download>
                ${renderIcon('download', '', '15')}
                <span>Download</span>
              </a>
              <button class="icon-btn" id="pdf-modal-close" aria-label="Close">
                ${renderIcon('close', '', '20')}
              </button>
            </div>
          </div>
          <div class="pdf-frame-container">
            <iframe id="pdf-iframe" src="" title="PDF Viewer"></iframe>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.querySelector('#pdf-modal-close').addEventListener('click', () => {
        modal.classList.remove('open');
        modal.querySelector('#pdf-iframe').src = '';
      });
    }

    modal.querySelector('#pdf-modal-title').textContent = title;
    modal.querySelector('#pdf-modal-subject').textContent = subjectName;
    modal.querySelector('#pdf-modal-download').href = pdfUrl;
    modal.querySelector('#pdf-iframe').src = pdfUrl;

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
