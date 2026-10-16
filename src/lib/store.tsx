import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'

export interface Toast {
  id: number
  message: string
}

interface StoreValue {
  saved: string[]
  compare: string[]
  toggleSave: (id: string, name: string) => void
  toggleCompare: (id: string, name: string) => void
  clearCompare: () => void
  toasts: Toast[]
  toast: (message: string) => void
}

const StoreContext = createContext<StoreValue | null>(null)

const load = (key: string): string[] => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<string[]>(() => load('havenly:saved'))
  const [compare, setCompare] = useState<string[]>(() => load('havenly:compare'))
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    localStorage.setItem('havenly:saved', JSON.stringify(saved))
  }, [saved])

  useEffect(() => {
    localStorage.setItem('havenly:compare', JSON.stringify(compare))
  }, [compare])

  const toast = useCallback((message: string) => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, message }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600)
  }, [])

  const toggleSave = useCallback(
    (id: string, name: string) => {
      setSaved((prev) => {
        if (prev.includes(id)) {
          toast(`Removed “${name}” from Saved`)
          return prev.filter((x) => x !== id)
        }
        toast(`Saved “${name}” to your shortlist`)
        return [...prev, id]
      })
    },
    [toast],
  )

  const toggleCompare = useCallback(
    (id: string, name: string) => {
      setCompare((prev) => {
        if (prev.includes(id)) {
          toast(`Removed “${name}” from Compare`)
          return prev.filter((x) => x !== id)
        }
        if (prev.length >= 3) {
          toast('You can compare up to 3 places at a time')
          return prev
        }
        toast(`Added “${name}” to Compare`)
        return [...prev, id]
      })
    },
    [toast],
  )

  const clearCompare = useCallback(() => setCompare([]), [])

  return (
    <StoreContext.Provider value={{ saved, compare, toggleSave, toggleCompare, clearCompare, toasts, toast }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
