'use client'

import { Message } from '@/lib/types'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import { CheckCheck, Check } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useRef } from 'react'

interface MessageBubbleProps {
  message: Message
  showAvatar?: boolean
  onVisible?: () => void
}

export function MessageBubble({ message, showAvatar = false, onVisible }: MessageBubbleProps) {
  const { user } = useAuth()
  const isOwn = message.sender_id === user?.id
  const bubbleRef = useRef<HTMLDivElement>(null)

  // Observer pour marquer le message comme lu quand il devient visible
  useEffect(() => {
    if (!onVisible || isOwn || message.is_read) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onVisible()
          observer.disconnect()
        }
      },
      { threshold: 0.5 }
    )

    if (bubbleRef.current) {
      observer.observe(bubbleRef.current)
    }

    return () => observer.disconnect()
  }, [isOwn, message.is_read, onVisible])

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const renderMessageContent = () => {
    switch (message.message_type) {
      case 'image':
        return (
          <div className="space-y-2">
            <div className="relative h-48 w-48 rounded-lg overflow-hidden">
              <Image
                src={message.image_url || '/placeholder.jpg'}
                alt="Image message"
                fill
                className="object-cover"
              />
            </div>
            {message.content && (
              <p className="text-sm">{message.content}</p>
            )}
          </div>
        )
      
      case 'location':
        return (
          <div className="space-y-2">
            <div className="bg-gray-100 rounded-lg p-3">
              <p className="font-medium">📍 Localisation</p>
              <p className="text-sm text-gray-600">{message.content}</p>
            </div>
          </div>
        )
      
      default:
        return <p className="whitespace-pre-wrap">{message.content}</p>
    }
  }

  return (
    <div
      ref={bubbleRef}
      className={cn(
        'flex gap-2 max-w-[70%]',
        isOwn ? 'ml-auto flex-row-reverse' : 'mr-auto'
      )}
    >
      {/* Avatar */}
      {showAvatar && !isOwn && (
        <div className="flex-shrink-0">
          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-sm font-medium">
            {message.sender?.full_name?.charAt(0) || 'U'}
          </div>
        </div>
      )}

      {/* Message */}
      <div className={cn(
        'rounded-2xl px-4 py-2 space-y-1',
        isOwn
          ? 'bg-green-500 text-white rounded-br-md'
          : 'bg-gray-100 text-gray-900 rounded-bl-md'
      )}>
        {/* Nom de l'expéditeur (seulement pour les messages des autres) */}
        {showAvatar && !isOwn && message.sender && (
          <p className="text-xs font-medium text-green-600">
            {message.sender.full_name}
          </p>
        )}

        {/* Contenu du message */}
        <div className={cn(
          'text-sm',
          isOwn ? 'text-white' : 'text-gray-900'
        )}>
          {renderMessageContent()}
        </div>

        {/* Timestamp et statut de lecture */}
        <div className={cn(
          'flex items-center gap-1 text-xs',
          isOwn ? 'text-green-100' : 'text-gray-500'
        )}>
          <span>{formatTime(message.created_at)}</span>
          {isOwn && (
            message.is_read ? (
              <CheckCheck className="h-3 w-3" />
            ) : (
              <Check className="h-3 w-3" />
            )
          )}
        </div>
      </div>

      {/* Espace pour aligner les messages */}
      {showAvatar && isOwn && (
        <div className="w-8 flex-shrink-0" />
      )}
    </div>
  )
}
