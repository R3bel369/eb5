// ─── Shoora EB-5 Avatar Configuration Store ──────────────────────────────────
// Allows customization of both Assistant and Investor avatars in Admin and Chat.

export interface AvatarPreset {
  id: string
  label: string
  title?: string
  url: string
  description?: string
}

export interface AvatarSettings {
  assistantAvatarType: string
  assistantName: string
  assistantTitle: string
  assistantCustomUrl: string
  userAvatarType: string
  userCustomUrl: string
}

export const PRESET_AVATARS: {
  assistant: Record<string, AvatarPreset>
  user: Record<string, AvatarPreset>
} = {
  assistant: {
    advisor_female: {
      id: 'advisor_female',
      label: 'Elena Vance',
      title: 'Senior EB-5 Investment Advisor',
      url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
      description: 'Professional executive portrait in business attire',
    },
    advisor_male: {
      id: 'advisor_male',
      label: 'Marcus Thorne',
      title: 'Managing Director, EB-5 Program',
      url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80',
      description: 'Senior managing advisor portrait in corporate navy suit',
    },
    advisor_sophia: {
      id: 'advisor_sophia',
      label: 'Sophia Laurent',
      title: 'Head of Private Wealth & EB-5',
      url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80',
      description: 'Wealth advisory consultant portrait with warm demeanor',
    },
    advisor_david: {
      id: 'advisor_david',
      label: 'David Sterling',
      title: 'Senior EB-5 Counsel & Strategist',
      url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&q=80',
      description: 'Distinguished immigration attorney and managing director',
    },
    shoora_crest: {
      id: 'shoora_crest',
      label: 'Shoora Gold Crest',
      title: 'Shoora EB-5 Advisory Desk',
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=256&q=80',
      description: 'Official gold abstract architectural emblem',
    },
  },
  user: {
    investor_navy: {
      id: 'investor_navy',
      label: 'Executive Client (Portrait A)',
      url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      description: 'High-net-worth investor profile',
    },
    investor_gold: {
      id: 'investor_gold',
      label: 'Private Client (Portrait B)',
      url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
      description: 'Principal investor profile in executive suit',
    },
    investor_tech: {
      id: 'investor_tech',
      label: 'Global Entrepreneur',
      url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
      description: 'Tech founder and international investor',
    },
    investor_female_exec: {
      id: 'investor_female_exec',
      label: 'Managing Partner Client',
      url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=256&q=80',
      description: 'Corporate executive investor portrait',
    },
  },
}

export const DEFAULT_AVATAR_SETTINGS: AvatarSettings = {
  assistantAvatarType: 'advisor_female',
  assistantName: 'Elena Vance',
  assistantTitle: 'Senior EB-5 Investment Advisor',
  assistantCustomUrl: '',
  userAvatarType: 'investor_navy',
  userCustomUrl: '',
}

const STORAGE_KEY = 'shoora_avatar_config'

export function getAvatarSettings(): AvatarSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return { ...DEFAULT_AVATAR_SETTINGS, ...parsed }
    }
  } catch (err) {
    console.warn('Failed to parse avatar config:', err)
  }
  return DEFAULT_AVATAR_SETTINGS
}

export function saveAvatarSettings(settings: AvatarSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    // Notify components across tabs or pages
    window.dispatchEvent(new Event('shoora_avatar_change'))
  } catch (err) {
    console.error('Failed to save avatar config:', err)
  }
}

export function getAssistantAvatarUrl(settings?: AvatarSettings): string {
  const cfg = settings || getAvatarSettings()
  if (cfg.assistantAvatarType === 'custom' && cfg.assistantCustomUrl) {
    return cfg.assistantCustomUrl
  }
  const preset = PRESET_AVATARS.assistant[cfg.assistantAvatarType]
  return preset?.url || PRESET_AVATARS.assistant.advisor_female.url
}

export function getUserAvatarUrl(settings?: AvatarSettings): string {
  const cfg = settings || getAvatarSettings()
  if (cfg.userAvatarType === 'custom' && cfg.userCustomUrl) {
    return cfg.userCustomUrl
  }
  const preset = PRESET_AVATARS.user[cfg.userAvatarType]
  return preset?.url || PRESET_AVATARS.user.investor_navy.url
}
