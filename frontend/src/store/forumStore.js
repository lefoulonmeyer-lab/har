import { create } from 'zustand';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const useForumStore = create((set, get) => ({
  categories: [],
  topics: [],
  currentTopic: null,
  posts: [],
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  
  // Categories
  fetchCategories: async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      set({ categories: response.data });
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  },
  
  // Topics
  fetchTopics: async (categoryId = null, page = 1) => {
    set({ isLoading: true });
    try {
      const params = new URLSearchParams({ page: page.toString() });
      if (categoryId) params.append('category_id', categoryId);
      
      const response = await axios.get(`${API}/topics?${params}`);
      set({ topics: response.data.topics, isLoading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      console.error('Error fetching topics:', error);
    }
  },
  
  fetchTopic: async (topicId) => {
    set({ isLoading: true });
    try {
      const response = await axios.get(`${API}/topics/${topicId}`, {
        withCredentials: true
      });
      set({ currentTopic: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      console.error('Error fetching topic:', error);
    }
  },
  
  createTopic: async (data) => {
    try {
      const response = await axios.post(`${API}/topics`, data, {
        withCredentials: true
      });
      const topics = get().topics;
      set({ topics: [response.data, ...topics] });
      return response.data;
    } catch (error) {
      console.error('Error creating topic:', error);
      throw error;
    }
  },
  
  // Posts
  fetchPosts: async (topicId, page = 1) => {
    try {
      const response = await axios.get(`${API}/posts?topic_id=${topicId}&page=${page}`);
      set({ posts: response.data.posts });
      return response.data;
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  },
  
  createPost: async (data) => {
    try {
      const response = await axios.post(`${API}/posts`, data, {
        withCredentials: true
      });
      const posts = get().posts;
      set({ posts: [...posts, response.data] });
      return response.data;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  },
  
  likePost: async (postId) => {
    try {
      const response = await axios.post(`${API}/posts/${postId}/like`, {}, {
        withCredentials: true
      });
      const posts = get().posts.map(p => {
        if (p.post_id === postId) {
          return { ...p, like_count: response.data.like_count };
        }
        return p;
      });
      set({ posts });
      return response.data;
    } catch (error) {
      console.error('Error liking post:', error);
      throw error;
    }
  },
  
  // Notifications
  fetchNotifications: async () => {
    try {
      const response = await axios.get(`${API}/notifications`, {
        withCredentials: true
      });
      set({ 
        notifications: response.data.notifications,
        unreadCount: response.data.unread_count
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  },
  
  markAllRead: async () => {
    try {
      await axios.post(`${API}/notifications/read-all`, {}, {
        withCredentials: true
      });
      const notifications = get().notifications.map(n => ({ ...n, is_read: true }));
      set({ notifications, unreadCount: 0 });
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  },
  
  // Search
  search: async (query, type = 'all') => {
    try {
      const response = await axios.get(`${API}/search?q=${encodeURIComponent(query)}&type=${type}`);
      return response.data;
    } catch (error) {
      console.error('Error searching:', error);
      throw error;
    }
  },
  
  // Stats
  fetchStats: async () => {
    try {
      const response = await axios.get(`${API}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  },
  
  // Report
  createReport: async (data) => {
    try {
      const response = await axios.post(`${API}/reports`, data, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      console.error('Error creating report:', error);
      throw error;
    }
  },
  
  // Clear
  clearCurrentTopic: () => set({ currentTopic: null, posts: [] })
}));
