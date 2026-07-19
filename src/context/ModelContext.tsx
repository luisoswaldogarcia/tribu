import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { OpenCodeModel, Executor } from '../types'
import { fallbackModels, kiroFallbackModels } from '../data'

interface ModelContextValue {
  models: OpenCodeModel[]
  loading: boolean
  getModelsForExecutor: (executor: Executor) => OpenCodeModel[]
}

const ModelContext = createContext<ModelContextValue | null>(null)

export function ModelProvider({ children }: { children: ReactNode }) {
  const [opencodeModels, setOpencodeModels] = useState<OpenCodeModel[]>(fallbackModels)
  const [kiroModels, setKiroModels] = useState<OpenCodeModel[]>(kiroFallbackModels)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!window.electronAPI) {
      setLoading(false)
      return
    }
    window.electronAPI.getModels().then((result) => {
      if (result) {
        if (result.opencode && result.opencode.length > 0) {
          setOpencodeModels(result.opencode)
        }
        if (result.kiro && result.kiro.length > 0) {
          setKiroModels(result.kiro)
        }
      }
      setLoading(false)
    })
  }, [])

  const getModelsForExecutor = (executor: Executor): OpenCodeModel[] => {
    return executor === 'kiro-cli' ? kiroModels : opencodeModels
  }

  const models = opencodeModels

  return (
    <ModelContext.Provider value={{ models, loading, getModelsForExecutor }}>
      {children}
    </ModelContext.Provider>
  )
}

export function useModels() {
  const ctx = useContext(ModelContext)
  if (!ctx) throw new Error('useModels must be used inside ModelProvider')
  return ctx
}
