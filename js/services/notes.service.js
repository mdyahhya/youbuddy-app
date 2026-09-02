// ============================================================================
// YouBuddy — Academic Notes & Curriculum Service
// ============================================================================

import { dbService } from '../supabase-client.js';
import { authService } from './auth.service.js';

class NotesService {
  async getUniversities() {
    const unis = await dbService.getTable('universities');
    return (unis || []).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  }

  async getAcademicYears(universityId) {
    const years = await dbService.getTable('academic_years');
    return (years || [])
      .filter(y => y.university_id === universityId)
      .sort((a, b) => (a.year_number || 0) - (b.year_number || 0));
  }

  async getStreams(yearId) {
    const streams = await dbService.getTable('streams');
    return (streams || [])
      .filter(s => s.year_id === yearId)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  }

  async getSubjects(yearId, streamId = null) {
    const subjects = await dbService.getTable('subjects');
    return (subjects || [])
      .filter(s => {
        if (s.year_id !== yearId) return false;
        if (streamId) {
          return s.stream_id === streamId || s.stream_id === null;
        }
        return true;
      })
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  }

  async getTopics(subjectId) {
    const topics = await dbService.getTable('topics');
    return (topics || [])
      .filter(t => t.subject_id === subjectId)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  }

  async getActiveContextDetails() {
    const user = authService.getUser();
    const uniId = user?.selected_university_id || 'uni-dbatu';
    const yearId = user?.selected_year_id || 'year-dbatu-1';
    const streamId = user?.selected_stream_id || null;

    const unis = await this.getUniversities();
    const years = await this.getAcademicYears(uniId);
    const streams = await this.getStreams(yearId);

    const activeUni = unis.find(u => u.id === uniId) || unis[0] || { name: 'DBATU', short_code: 'DBATU' };
    const activeYear = years.find(y => y.id === yearId) || years[0] || { name: 'First Year', year_number: 1, has_streams: false };
    const activeStream = streamId ? streams.find(s => s.id === streamId) : null;

    return {
      university: activeUni,
      year: activeYear,
      stream: activeStream,
      contextString: `${activeUni.short_code || activeUni.name} • ${activeYear.name}${activeStream ? ' • ' + activeStream.code : ''}`
    };
  }
}

export const notesService = new NotesService();
