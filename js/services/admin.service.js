// ============================================================================
// YouBuddy — Admin Panel Management Service (CRUD for Feed & Curriculum)
// ============================================================================

import { dbService } from '../supabase-client.js';
import { feedService } from './feed.service.js';

class AdminService {
  // Feed Posts Management
  async createPost(postData) {
    let extra_data = postData.extra_data || {};
    let thumbnail_url = postData.thumbnail_url || null;

    // Handle YouTube auto extraction if needed
    if (postData.type === 'youtube_video' && postData.media_url) {
      const videoId = feedService.parseYouTubeId(postData.media_url);
      if (videoId) {
        extra_data.youtube_video_id = videoId;
        if (!thumbnail_url) {
          thumbnail_url = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        }
      }
    }

    const postToInsert = {
      type: postData.type,
      is_pinned: !!postData.is_pinned,
      title: postData.title,
      content: postData.content || '',
      media_url: postData.media_url || null,
      thumbnail_url: thumbnail_url,
      extra_data: extra_data,
      is_published: true,
      author_name: postData.author_name || 'YouBuddy Admin'
    };

    const createdPost = await dbService.insertRow('posts', postToInsert);

    // If MCQ, save options
    if (postData.type === 'mcq' && Array.isArray(postData.options)) {
      for (const opt of postData.options) {
        await dbService.insertRow('mcq_options', {
          post_id: createdPost.id,
          option_letter: opt.option_letter,
          option_text: opt.option_text,
          is_correct: !!opt.is_correct,
          explanation: opt.explanation || '',
          display_order: opt.display_order || 0
        });
      }
    }

    return createdPost;
  }

  async deletePost(postId) {
    return await dbService.deleteRow('posts', postId);
  }

  // Curriculum Management
  async createUniversity(uniData) {
    return await dbService.insertRow('universities', {
      name: uniData.name,
      short_code: uniData.short_code || '',
      logo_url: uniData.logo_url || '',
      is_active: true
    });
  }

  async deleteUniversity(uniId) {
    return await dbService.deleteRow('universities', uniId);
  }

  async createSubject(subjectData) {
    return await dbService.insertRow('subjects', {
      year_id: subjectData.year_id,
      stream_id: subjectData.stream_id || null,
      name: subjectData.name,
      code: subjectData.code || '',
      group_name: subjectData.group_name || null,
      units_count: parseInt(subjectData.units_count) || 5
    });
  }

  async deleteSubject(subjectId) {
    return await dbService.deleteRow('subjects', subjectId);
  }

  async createTopic(topicData) {
    return await dbService.insertRow('topics', {
      subject_id: topicData.subject_id,
      title: topicData.title,
      unit_number: parseInt(topicData.unit_number) || 1,
      description: topicData.description || '',
      pdf_url: topicData.pdf_url || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      file_size_bytes: topicData.file_size_bytes || 2500000,
      page_count: topicData.page_count || 30
    });
  }

  async deleteTopic(topicId) {
    return await dbService.deleteRow('topics', topicId);
  }
}

export const adminService = new AdminService();
