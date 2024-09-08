import React, { ReactNode } from "react"
import { Database } from "./lib/rxdb"

// eslint-disable-next-line react-refresh/only-export-components
export const databaseContext = React.createContext<Database | null>(null)

export function DatabaseProvider({
  children,
  db
}: {
  children: ReactNode
  db: Database
}) {
  return (
    <databaseContext.Provider value={db}>
      {db ? children : null}
    </databaseContext.Provider>
  )
}
