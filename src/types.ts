export interface TikTokContent {
  shot?: string;
  hook?: string;
  audio?: string;
  caption?: string;
}

export interface InstagramContent {
  slides?: string[];
  caption?: string;
  tags?: string[];
}

export interface Post {
  id: string | number;
  created_at?: string;
  pillar?: string;
  topic?: string;
  tiktok?: TikTokContent;
  instagram?: InstagramContent;
  x_post?: string;
  fan_prompt?: string;
}

export interface RolloutDay {
  day: number;
  label?: string;
  date?: string;
  tasks?: string[];
  content_idea?: string;
}

export interface Rollout {
  song: string;
  days: RolloutDay[];
  created_at?: string;
}

export interface RemixHook {
  type: string;
  text: string;
}

export interface Remix {
  hooks: RemixHook[];
}

export type TabId = 'drop' | 'rollout' | 'remix' | 'history';

export interface ApiError {
  message: string;
  isAuthError?: boolean;
  isBusyError?: boolean;
}
