// ============================================================================
// YouBuddy — Choose University Modal & Context Selector
// ============================================================================

import { notesService } from '../services/notes.service.js';
import { authService } from '../services/auth.service.js';
import { ICONS, renderIcon } from '../icons.js';

export class UniversityModal {
  constructor(onContextSelected) {
    this.onContextSelected = onContextSelected;
    this.modalEl = null;
    this.searchQuery = '';
    this.expandedUniId = null;
    this.expandedYearId = null;
    this.init();
  }

  init() {
    let el = document.getElementById('university-selector-modal');
    if (!el) {
      el = document.createElement('div');
      el.id = 'university-selector-modal';
      el.className = 'modal-backdrop';
      document.body.appendChild(el);
    }
    this.modalEl = el;
  }

  async open() {
    await this.render();
    setTimeout(() => this.modalEl.classList.add('open'), 10);
  }

  close() {
    this.modalEl.classList.remove('open');
  }

  async render() {
    const unis = await notesService.getUniversities();
    const user = authService.getUser();

    const filteredUnis = unis.filter(u => 
      u.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      (u.short_code && u.short_code.toLowerCase().includes(this.searchQuery.toLowerCase()))
    );

    this.modalEl.innerHTML = `
      <div class="modal-dialog" style="max-height: 90vh;">
        <div class="modal-header">
          <h3 class="modal-title">Select Your University</h3>
          <button class="icon-btn close-uni-modal-btn" aria-label="Close">
            ${renderIcon('close')}
          </button>
        </div>
        <div class="modal-body" style="padding-bottom: 24px;">
          <!-- Search Bar -->
          <div class="search-container">
            <div class="search-icon-wrapper">${renderIcon('search', '', '16')}</div>
            <input type="text" class="search-input" id="uni-search-input" placeholder="Search universities..." value="${this.escapeHtml(this.searchQuery)}"/>
          </div>

          <!-- Universities List -->
          <div id="uni-accordion-list" style="display: flex; flex-direction: column; gap: 8px;">
            ${filteredUnis.length > 0 ? '' : '<p style="color: var(--text-muted); text-align: center; padding: 20px;">No universities found.</p>'}
          </div>
        </div>
      </div>
    `;

    // Close button listeners
    this.modalEl.querySelector('.close-uni-modal-btn').addEventListener('click', () => this.close());
    this.modalEl.addEventListener('click', (e) => {
      if (e.target === this.modalEl) this.close();
    });

    // Search listener
    const searchInput = this.modalEl.querySelector('#uni-search-input');
    searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.renderAccordion(filteredUnis);
    });

    await this.renderAccordion(filteredUnis);
  }

  async renderAccordion(unis) {
    const listContainer = this.modalEl.querySelector('#uni-accordion-list');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    for (const uni of unis) {
      const isExpanded = this.expandedUniId === uni.id;
      const uniCard = document.createElement('div');
      uniCard.style.cssText = 'border: 1px solid var(--border-medium); border-radius: var(--radius-md); overflow: hidden; background: var(--bg-primary);';

      let yearsHtml = '';
      if (isExpanded) {
        const years = await notesService.getAcademicYears(uni.id);
        yearsHtml = `<div style="background: var(--bg-secondary); border-top: 1px solid var(--border-medium); padding: 8px 12px; display: flex; flex-direction: column; gap: 6px;">`;

        for (const yr of years) {
          const isYearExpanded = this.expandedYearId === yr.id;
          const streams = yr.has_streams ? await notesService.getStreams(yr.id) : [];

          yearsHtml += `
            <div style="background: var(--bg-primary); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); overflow: hidden;">
              <div class="year-item-header" data-uni-id="${uni.id}" data-year-id="${yr.id}" data-has-streams="${yr.has_streams}" style="padding: 10px 12px; display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
                <span style="font-weight: 600; font-size: 0.9rem;">${this.escapeHtml(yr.name)}</span>
                <span style="color: var(--accent-color); font-size: 0.8rem;">
                  ${yr.has_streams ? (isYearExpanded ? renderIcon('chevronUp', '', '16') : renderIcon('chevronDown', '', '16')) : 'Select →'}
                </span>
              </div>
          `;

          if (yr.has_streams && isYearExpanded) {
            yearsHtml += `<div style="padding: 6px 12px 10px 24px; display: flex; flex-direction: column; gap: 4px; border-top: 1px solid var(--border-subtle); background: var(--bg-hover);">`;
            streams.forEach(st => {
              yearsHtml += `
                <div class="stream-item-btn" data-uni-id="${uni.id}" data-year-id="${yr.id}" data-stream-id="${st.id}" style="padding: 8px 10px; border-radius: var(--radius-sm); background: var(--bg-primary); border: 1px solid var(--border-subtle); font-size: 0.85rem; font-weight: 600; cursor: pointer; color: var(--text-primary); display: flex; justify-content: space-between;">
                  <span>${this.escapeHtml(st.name)}</span>
                  <span style="color: var(--accent-color);">${this.escapeHtml(st.code)}</span>
                </div>
              `;
            });
            yearsHtml += `</div>`;
          }

          yearsHtml += `</div>`;
        }

        yearsHtml += `</div>`;
      }

      uniCard.innerHTML = `
        <div class="uni-header-row" data-uni-id="${uni.id}" style="padding: 12px 14px; display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
          <div>
            <div style="font-weight: 700; font-size: 0.95rem; color: var(--text-primary);">${this.escapeHtml(uni.name)}</div>
            ${uni.short_code ? `<div style="font-size: 0.75rem; color: var(--accent-color); font-weight: 700;">${this.escapeHtml(uni.short_code)}</div>` : ''}
          </div>
          <div style="color: var(--accent-color);">
            ${isExpanded ? renderIcon('chevronUp', '', '18') : renderIcon('chevronDown', '', '18')}
          </div>
        </div>
        ${yearsHtml}
      `;

      listContainer.appendChild(uniCard);
    }

    // Attach click listeners
    listContainer.querySelectorAll('.uni-header-row').forEach(row => {
      row.addEventListener('click', () => {
        const id = row.getAttribute('data-uni-id');
        this.expandedUniId = this.expandedUniId === id ? null : id;
        this.expandedYearId = null;
        this.renderAccordion(unis);
      });
    });

    listContainer.querySelectorAll('.year-item-header').forEach(header => {
      header.addEventListener('click', () => {
        const uniId = header.getAttribute('data-uni-id');
        const yearId = header.getAttribute('data-year-id');
        const hasStreams = header.getAttribute('data-has-streams') === 'true';

        if (hasStreams) {
          this.expandedYearId = this.expandedYearId === yearId ? null : yearId;
          this.renderAccordion(unis);
        } else {
          // Direct select for year without separate streams (e.g. First Year)
          this.selectContext(uniId, yearId, null);
        }
      });
    });

    listContainer.querySelectorAll('.stream-item-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const uniId = btn.getAttribute('data-uni-id');
        const yearId = btn.getAttribute('data-year-id');
        const streamId = btn.getAttribute('data-stream-id');
        this.selectContext(uniId, yearId, streamId);
      });
    });
  }

  selectContext(uniId, yearId, streamId) {
    authService.updateAcademicContext(uniId, yearId, streamId);
    this.close();
    if (this.onContextSelected) {
      this.onContextSelected();
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
