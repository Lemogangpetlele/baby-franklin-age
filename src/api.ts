// Baby Franklin Promo Studio - Agent API Client
// All requests are routed through this backend worker.
// Token is stored in localStorage under 'BF_TOKEN'.
export const BASE_URL = "https://baby-franklin-agent.loejgrim777.workers.dev";

import { Post, Rollout, Remix, ApiError } from './types.ts';

export class AppError extends Error {
  isAuthError: boolean;
  isBusyError: boolean;

  constructor(message: string, isAuthError = false, isBusyError = false) {
    super(message);
    this.name = 'AppError';
    this.isAuthError = isAuthError;
    this.isBusyError = isBusyError;
  }
}

export function getToken(): string {
  try {
    return localStorage.getItem('BF_TOKEN')?.trim() || '';
  } catch {
    return '';
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem('BF_TOKEN', token.trim());
  } catch (err) {
    console.error('Failed to store token:', err);
  }
}

export function getWebhook(): string {
  try {
    return localStorage.getItem('BF_WEBHOOK')?.trim() || '';
  } catch {
    return '';
  }
}

export function setWebhook(url: string): void {
  try {
    localStorage.setItem('BF_WEBHOOK', url.trim());
  } catch (err) {
    console.error('Failed to store webhook:', err);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  if (!token) {
    throw new AppError('access token required. please enter your token in settings.', true, false);
  }

  const url = `${BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  if (options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err: any) {
    throw new AppError(
      'network connection failed. check your internet and try again.',
      false,
      false
    );
  }

  // Handle specific status codes as per specifications
  if (response.status === 401) {
    throw new AppError('the token is wrong. check your access token in settings.', true, false);
  }

  if (response.status === 429 || response.status === 500 || response.status === 503) {
    throw new AppError('the ai is busy. try again in a minute.', false, true);
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    if (!response.ok) {
      throw new AppError(`request failed with status ${response.status}.`, false, false);
    }
    throw new AppError('received invalid json from agent server.', false, false);
  }

  if (!response.ok) {
    const errorMsg = data?.error || `request failed (${response.status})`;
    throw new AppError(errorMsg, false, false);
  }

  return data as T;
}

// GET / -> array of recent posts, newest first
export async function getRecentPosts(): Promise<Post[]> {
  const data = await request<Post[] | { posts?: Post[] }>('/');
  if (Array.isArray(data)) {
    return data;
  }
  if (data && Array.isArray((data as any).posts)) {
    return (data as any).posts;
  }
  return [];
}

// POST /generate -> body { "pillar"?: string, "idea"?: string } -> one Post
export async function generateDrop(params: { pillar?: string; idea?: string }): Promise<Post> {
  const body: Record<string, string> = {};
  if (params.pillar && params.pillar.trim() !== '' && params.pillar !== 'Auto') {
    body.pillar = params.pillar.trim();
  }
  if (params.idea && params.idea.trim() !== '') {
    body.idea = params.idea.trim();
  }

  const data = await request<Post>('/generate', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  return data;
}

// POST /rollout -> body { "song": string, "vibe": string, "lyric": string, "release_date": "YYYY-MM-DD" } -> Rollout
export async function generateRollout(params: {
  song: string;
  vibe: string;
  lyric: string;
  release_date: string;
}): Promise<Rollout> {
  const data = await request<Rollout>('/rollout', {
    method: 'POST',
    body: JSON.stringify(params),
  });

  return data;
}

// POST /remix -> body { "lyric": string } -> Remix (exactly 5 hooks)
export async function remixLyric(params: { lyric: string }): Promise<Remix> {
  const data = await request<Remix>('/remix', {
    method: 'POST',
    body: JSON.stringify(params),
  });

  return data;
}

// Send to Phone (Webhook integration)
export async function sendToPhone(post: Post): Promise<{ success: boolean; message: string }> {
  const webhookUrl = getWebhook();
  if (!webhookUrl) {
    throw new AppError('no webhook configured. please add your discord or automation url in settings.', false, false);
  }

  const isDiscord = webhookUrl.toLowerCase().includes('discord.com');

  if (isDiscord) {
    // Format friendly clean text under 1900 chars
    const lines: string[] = [];
    lines.push(`**Baby Franklin Drop** · *${post.pillar || 'Drop'}*`);
    if (post.topic) {
      lines.push(`Topic: ${post.topic}`);
    }
    lines.push('');

    if (post.tiktok?.hook) {
      lines.push(`**TikTok / Reel Hook (First 3s):**`);
      lines.push(`> "${post.tiktok.hook}"`);
      if (post.tiktok.shot) lines.push(`*Visual:* ${post.tiktok.shot}`);
      if (post.tiktok.audio) lines.push(`*Audio:* ${post.tiktok.audio}`);
      if (post.tiktok.caption) lines.push(`*Caption:* ${post.tiktok.caption}`);
      lines.push('');
    }

    if (post.x_post) {
      lines.push(`**X / Twitter:**`);
      lines.push(post.x_post);
      lines.push('');
    }

    if (post.instagram) {
      lines.push(`**Instagram:**`);
      if (post.instagram.slides && post.instagram.slides.length > 0) {
        lines.push(`Slides: ${post.instagram.slides.map((s, idx) => `[${idx + 1}] ${s}`).join(' · ')}`);
      }
      if (post.instagram.caption) lines.push(`Caption: ${post.instagram.caption}`);
      if (post.instagram.tags && post.instagram.tags.length > 0) {
        lines.push(`Tags: ${post.instagram.tags.join(' ')}`);
      }
      lines.push('');
    }

    if (post.fan_prompt) {
      lines.push(`**Pinned Fan Question:**`);
      lines.push(`"${post.fan_prompt}"`);
    }

    let content = lines.join('\n').trim();
    if (content.length > 1850) {
      content = content.slice(0, 1845) + '...';
    }

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });

    if (!res.ok) {
      throw new AppError(`discord webhook responded with ${res.status}`, false, false);
    }

    return { success: true, message: 'sent to discord channel' };
  } else {
    // Send full Post as JSON
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(post),
    });

    if (!res.ok) {
      throw new AppError(`webhook responded with status ${res.status}`, false, false);
    }

    return { success: true, message: 'sent to webhook' };
  }
}
