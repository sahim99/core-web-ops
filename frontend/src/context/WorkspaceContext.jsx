import { createContext, useState } from 'react'

export const WorkspaceContext = createContext(null)

export function WorkspaceProvider({ children }) {
  const [workspace, setWorkspace] = useState(null)

  return (
    <WorkspaceContext.Provider value={{ workspace, setWorkspace }}>
      {children}
    </WorkspaceContext.Provider>
  )
}
