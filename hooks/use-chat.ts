'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './use-auth'
import { createClient } from '@/lib/supabase/client'
import { Conversation, Message } from '@/lib/types'

export function useChat() {
  const { user, profile } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const supabase = createClient()

  // Charger les conversations
  const loadConversations = useCallback(async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          farmer:profiles!conversations_farmer_id_fkey(*),
          buyer:profiles!conversations_buyer_id_fkey(*)
        `)
        .or(`farmer_id.eq.${user.id},buyer_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false })

      if (error) throw error

      // Ajouter l'utilisateur opposé pour faciliter l'affichage
      const conversationsWithOtherUser = data?.map(conv => ({
        ...conv,
        other_user: conv.farmer_id === user.id ? conv.buyer : conv.farmer
      })) || []

      setConversations(conversationsWithOtherUser)
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  // Charger les messages d'une conversation
  const loadMessages = useCallback(async (conversationId: string, page = 0) => {
    if (!conversationId) return

    try {
      const from = page * 50
      const to = from + 49

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles(*)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw error

      if (page === 0) {
        setMessages(data || [])
      } else {
        setMessages(prev => [...(data || []), ...prev])
      }

      setHasMore((data?.length || 0) === 50)
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }, [supabase])

  // Créer ou récupérer une conversation
  const getOrCreateConversation = useCallback(async (otherUserId: string): Promise<Conversation | null> => {
    if (!user) return null

    try {
      // Vérifier si une conversation existe déjà
      const { data: existingConversation, error: checkError } = await supabase
        .from('conversations')
        .select(`
          *,
          farmer:profiles!conversations_farmer_id_fkey(*),
          buyer:profiles!conversations_buyer_id_fkey(*)
        `)
        .or(`and(farmer_id.eq.${user.id},buyer_id.eq.${otherUserId}),and(farmer_id.eq.${otherUserId},buyer_id.eq.${user.id})`)
        .single()

      if (!checkError && existingConversation) {
        // Conversation existe déjà
        const convWithOtherUser = {
          ...existingConversation,
          other_user: existingConversation.farmer_id === user.id ? existingConversation.buyer : existingConversation.farmer
        }
        setCurrentConversation(convWithOtherUser)
        await loadMessages(existingConversation.id)
        return convWithOtherUser
      }

      // Créer une nouvelle conversation
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          farmer_id: profile?.role === 'farmer' ? user.id : otherUserId,
          buyer_id: profile?.role === 'buyer' ? user.id : otherUserId
        })
        .select(`
          *,
          farmer:profiles!conversations_farmer_id_fkey(*),
          buyer:profiles!conversations_buyer_id_fkey(*)
        `)
        .single()

      if (createError) throw createError

      const convWithOtherUser = {
        ...newConversation,
        other_user: newConversation.farmer_id === user.id ? newConversation.buyer : newConversation.farmer
      }

      setCurrentConversation(convWithOtherUser)
      setConversations(prev => [convWithOtherUser, ...prev])
      return convWithOtherUser
    } catch (error) {
      console.error('Error creating conversation:', error)
      return null
    }
  }, [user, profile, supabase, loadMessages])

  // Envoyer un message
  const sendMessage = useCallback(async (content: string, messageType: 'text' | 'image' | 'location' = 'text', imageUrl?: string) => {
    if (!currentConversation || !user || !content.trim()) return

    setSending(true)

    try {
      const newMessage = {
        conversation_id: currentConversation.id,
        sender_id: user.id,
        content: content.trim(),
        message_type: messageType,
        image_url: imageUrl || null,
        is_read: false
      }

      // Optimistic update
      const optimisticMessage: Message = {
        ...newMessage,
        id: `temp-${Date.now()}`,
        created_at: new Date().toISOString(),
        sender: profile!
      }

      setMessages(prev => [...prev, optimisticMessage])

      // Envoyer le message
      const { data, error } = await supabase
        .from('messages')
        .insert(newMessage)
        .select(`
          *,
          sender:profiles(*)
        `)
        .single()

      if (error) throw error

      // Remplacer le message optimiste par le vrai message
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticMessage.id ? data : msg
      ))

      // Mettre à jour la dernière conversation
      await loadConversations()

    } catch (error) {
      console.error('Error sending message:', error)
      // Retirer le message optimiste en cas d'erreur
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')))
    } finally {
      setSending(false)
    }
  }, [currentConversation, user, profile, supabase, loadConversations])

  // Marquer les messages comme lus
  const markAsRead = useCallback(async (conversationId: string) => {
    if (!user) return

    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('is_read', false)
        .neq('sender_id', user.id)

      // Mettre à jour le compteur local
      setConversations(prev => prev.map(conv =>
        conv.id === conversationId ? { ...conv, unread_count: 0 } : conv
      ))
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }, [user, supabase])

  // Écouter les nouveaux messages en temps réel
  useEffect(() => {
    if (!currentConversation) return

    const channel = supabase
      .channel(`conversation-${currentConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${currentConversation.id}`
        },
        async (payload) => {
          const newMessage = payload.new as Message

          // Récupérer les infos de l'expéditeur
          const { data: sender } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newMessage.sender_id)
            .single()

          const messageWithSender: Message = {
            ...newMessage,
            sender: sender || undefined
          }

          setMessages(prev => [...prev, messageWithSender])

          // Si le message n'est pas de moi, marquer comme lu automatiquement
          if (newMessage.sender_id !== user?.id) {
            await supabase
              .from('messages')
              .update({ is_read: true })
              .eq('id', newMessage.id)
          }

          // Recharger les conversations pour mettre à jour le dernier message
          await loadConversations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentConversation, user, supabase, loadConversations])

  // Écouter les nouvelles conversations
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations',
          filter: `or(farmer_id.eq.${user.id},buyer_id.eq.${user.id})`
        },
        async (payload) => {
          const newConversation = payload.new as Conversation

          // Récupérer les infos des utilisateurs
          const { data: fullConversation } = await supabase
            .from('conversations')
            .select(`
              *,
              farmer:profiles!conversations_farmer_id_fkey(*),
              buyer:profiles!conversations_buyer_id_fkey(*)
            `)
            .eq('id', newConversation.id)
            .single()

          if (fullConversation) {
            const convWithOtherUser = {
              ...fullConversation,
              other_user: fullConversation.farmer_id === user.id ? fullConversation.buyer : fullConversation.farmer
            }

            setConversations(prev => [convWithOtherUser, ...prev])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  // Charger les conversations au montage
  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  return {
    conversations,
    currentConversation,
    messages,
    loading,
    sending,
    hasMore,
    loadMessages,
    getOrCreateConversation,
    sendMessage,
    markAsRead,
    setCurrentConversation
  }
}
