// ============================================================================
// YouBuddy — Games Section View (Placeholder per Section 3 Spec)
// ============================================================================

import { renderIcon } from '../icons.js';

export class GamesView {
  constructor(container) {
    this.container = container;
  }

  render() {
    this.container.innerHTML = `
      <div style="padding: 48px 24px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh;">
        <div style="width: 72px; height: 72px; border-radius: 50%; background: var(--accent-light); color: var(--accent-color); display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
          ${renderIcon('games', '', '36')}
        </div>
        <h2 style="font-size: 1.4rem; font-weight: 800; color: var(--text-primary); margin-bottom: 8px;">Brain Games & Engineering Puzzles</h2>
        <p style="font-size: 0.95rem; color: var(--text-secondary); max-width: 380px; line-height: 1.6; margin-bottom: 24px;">
          Quick brain teasers, aptitude challenges, and logic games designed for engineering students.
        </p>
        <span class="badge badge-accent">Coming Soon</span>
      </div>
    `;
  }
}
