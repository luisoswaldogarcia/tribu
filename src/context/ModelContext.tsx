import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { OpenCodeModel } from '../types'
import { fallbackModels } from '../data'

interface ModelContextValue {
  models: OpenCodeModel[]
  loading: boolean
}

const ModelContext = createContext<ModelContextValue | null>(null)

export function ModelProvider({ children }: { children: ReactNode }) {
  const [models, setModels] = useState<OpenCodeModel[]>(fallbackModels)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!window.electronAPI) {
      setLoading(false)
      return
    }
    window.electronAPI.getModels().then((result) => {
      if (result && result.length > 0) {
        setModels(result)
      }
      setLoading(false)
    })
  }, [])

  return (
    <ModelContext.Provider value={{ models, loading }}>
      {children}
    </ModelContext.Provider>
  )
}

export function useModels() {
  const ctx = useContext(ModelContext)
  if (!ctx) throw new Error('useModels must be used inside ModelProvider')
  return ctx
}
