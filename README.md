# Smart Bookmark App

A bookmark manager built with Next.js, Supabase, and Tailwind CSS.

## Live Demo
https://smart-bookmarks-steel.vercel.app

## Tech Stack
- Next.js 14 (App Router)
- Supabase (Auth, Database, Realtime)
- Tailwind CSS
- Vercel (Deployment)



## Problems I Ran Into

### Bookmarks Not Updating in Real-time
**Problem:**
After adding a bookmark it only appeared after
refreshing the page. The Supabase real-time
subscription was not reflecting the new bookmark
in the UI instantly.

**What I tried first:**
Used the basic insert without getting data back:
```js
const { error } = await supabase
  .from('bookmarks')
  .insert([newBookmark])
```
This saved to the database correctly but the
UI did not update until the page was refreshed.

**Solution:**
Updated the `addBookmark` function to use `.select()`
to get the inserted data back from Supabase and
manually update the React state immediately:
```js
const { data, error } = await supabase
  .from('bookmarks')
  .insert([newBookmark])
  .select()

if (!error && data) {
  setBookmarks(prev => [data[0], ...prev])
  setTitle('')
  setUrl('')
}
```
This way the UI updates instantly without waiting
for the real-time subscription to fire.

