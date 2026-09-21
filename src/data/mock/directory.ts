/** Member + venture directory. Populated in prompt 6. */
export interface DirectoryEntry {
  id: string
  name: string
  venture: string
  role: string
  major?: string
  photo?: string
}

export const directory: DirectoryEntry[] = []
