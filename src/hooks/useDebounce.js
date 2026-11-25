// src/hooks/useDebounce.js
// Waits until a value has stopped changing for `delay` milliseconds.
// Used for the search box: we only call the API after the user stops typing,
// instead of on every key press.
//
// Usage: const debouncedSearch = useDebounce(search, 400)

import { useEffect, useState } from 'react'

export default function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    // If the value changes again before the delay ends, cancel the old timer.
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
