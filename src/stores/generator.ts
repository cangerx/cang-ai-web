import { create } from 'zustand'

export type GenerateMode = 'text' | 'image' | 'reverse'

interface GeneratorState {
  mode: GenerateMode
  model: string
  size: string
  quality: string
  count: number
  prompt: string
  files: File[]
  activeTaskId: string | null
  generating: boolean
  setMode: (mode: GenerateMode) => void
  setModel: (model: string) => void
  setSize: (size: string) => void
  setQuality: (quality: string) => void
  setCount: (count: number) => void
  setPrompt: (prompt: string) => void
  setFiles: (files: File[]) => void
  setActiveTaskId: (id: string | null) => void
  setGenerating: (v: boolean) => void
  reset: () => void
}

export const useGeneratorStore = create<GeneratorState>((set) => ({
  mode: 'text',
  model: '',
  size: 'auto',
  quality: 'medium',
  count: 1,
  prompt: '',
  files: [],
  activeTaskId: null,
  generating: false,

  setMode: (mode) => set({ mode }),
  setModel: (model) => set({ model }),
  setSize: (size) => set({ size }),
  setQuality: (quality) => set({ quality }),
  setCount: (count) => set({ count }),
  setPrompt: (prompt) => set({ prompt }),
  setFiles: (files) => set({ files }),
  setActiveTaskId: (id) => set({ activeTaskId: id }),
  setGenerating: (v) => set({ generating: v }),
  reset: () => set({ prompt: '', files: [], activeTaskId: null, generating: false }),
}))
