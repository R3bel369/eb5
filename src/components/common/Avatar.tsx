import { useState, useEffect } from 'react'
import {
  getAvatarSettings, getAssistantAvatarUrl, getUserAvatarUrl,
  type AvatarSettings
} from '../../lib/avatarConfig'
import { cn } from '../../lib/utils'

interface AvatarProps {
  role: 'assistant' | 'user'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showStatus?: boolean
  className?: string
}

export function Avatar({
  role,
  size = 'md',
  showStatus = true,
  className
}: AvatarProps) {
  const [settings, setSettings] = useState<AvatarSettings>(getAvatarSettings())
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    const handleUpdate = () => {
      setSettings(getAvatarSettings())
      setImgError(false)
    }
    window.addEventListener('shoora_avatar_change', handleUpdate)
    return () => window.removeEventListener('shoora_avatar_change', handleUpdate)
  }, [])

  const isAssistant = role === 'assistant'
  const avatarUrl = isAssistant
    ? getAssistantAvatarUrl(settings)
    : getUserAvatarUrl(settings)

  const sizeClasses = {
    sm: 'w-9 h-9 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-20 h-20 text-lg',
  }[size]

  return (
    <div className={cn('relative flex-shrink-0 inline-block', className)}>
      <div className={cn(
        'rounded-full overflow-hidden flex items-center justify-center font-display font-bold shadow-xs transition-transform',
        sizeClasses,
        isAssistant
          ? 'ring-2 ring-gold-400/80 bg-navy-900 text-gold-400'
          : 'ring-2 ring-navy-300/80 bg-navy-800 text-white'
      )}>
        {!imgError && avatarUrl ? (
          <img
            src={avatarUrl}
            alt={isAssistant ? settings.assistantName : 'Investor'}
            className="w-full h-full object-cover object-top"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <span>{isAssistant ? (settings.assistantName[0] || 'S') : 'U'}</span>
        )}
      </div>

      {showStatus && isAssistant && (
        <span
          className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full ring-1 ring-emerald-600/20"
          title="Online & Ready"
        />
      )}
    </div>
  )
}
