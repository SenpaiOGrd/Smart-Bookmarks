'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [bookmarks, setBookmarks] = useState([])
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const unsubscribeRef = useRef(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
      } else {
        setUser(user)
        fetchBookmarks(user.id)
        unsubscribeRef.current = subscribeToBookmarks(user.id)
      }
      setLoading(false)
    }
    getUser()

    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current()
    }
  }, [])

  const fetchBookmarks = async (userId) => {
    const { data } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (data) setBookmarks(data)
  }

  const subscribeToBookmarks = (userId) => {
    const channel = supabase
      .channel(`bookmarks-channel-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookmarks',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          setBookmarks(prev => {
            if (prev.some(b => b.id === payload.new.id)) return prev
            return [payload.new, ...prev]
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookmarks',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          setBookmarks(prev => prev.map(b => (b.id === payload.new.id ? payload.new : b)))
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'bookmarks'
        },
        (payload) => {
          // DELETE payloads often only include the primary key in payload.old.
          // Removing by id is safe because state only contains this user's bookmarks.
          setBookmarks(prev => prev.filter(b => b.id !== payload.old.id))
        }
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }

  const addBookmark = async (e) => {
    e.preventDefault()
    if (!title || !url) return
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`
    const { data, error } = await supabase
      .from('bookmarks')
      .insert([{
        title,
        url: normalizedUrl,
        user_id: user.id
      }])
      .select('*')
      .single()
    if (!error) {
      if (data) {
        // Instant UI update; realtime will also deliver INSERT in some setups.
        setBookmarks(prev => {
          if (prev.some(b => b.id === data.id)) return prev
          return [data, ...prev]
        })
      }
      setTitle('')
      setUrl('')
    }
  }

  const deleteBookmark = async (id) => {
    // Optimistic UI: remove immediately so it feels realtime.
    setBookmarks(prev => prev.filter(b => b.id !== id))

    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', id)

    if (error && user?.id) {
      // If the delete failed, resync.
      fetchBookmarks(user.id)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <header className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔖</span>
            <h1 className="text-xl font-bold text-gray-800">Smart Bookmarks</h1>
          </div>
          <div className="flex items-center gap-3">
            <img
              src={user?.user_metadata?.avatar_url}
              alt="avatar"
              className="w-8 h-8 rounded-full"
            />
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-red-500 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Add New Bookmark
          </h2>
          <form onSubmit={addBookmark} className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Title (e.g. Google)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="URL (e.g. google.com)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              + Add Bookmark
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            My Bookmarks ({bookmarks.length})
          </h2>

          {bookmarks.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-gray-400">No bookmarks yet. Add your first one!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {bookmarks.map((bookmark) => (
                <div
                  key={bookmark.id}
                  className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${bookmark.url}&sz=32`}
                      alt=""
                      className="w-6 h-6 rounded"
                    />
                    <div className="overflow-hidden">
                      <a
                        href={bookmark.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-gray-800 hover:text-blue-500 transition-colors block truncate"
                      >
                        {bookmark.title}
                      </a>
                      <p className="text-xs text-gray-400 truncate">{bookmark.url}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteBookmark(bookmark.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors ml-2 text-lg"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}