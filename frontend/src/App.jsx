import {RouterProvider} from "react-router-dom"
import {router} from "./app.routes.jsx"
import {AuthProvider} from "./features/auth/auth.context.jsx"
import {ThemeProvider} from "./features/theme/ThemeProvider.jsx"


function App() {
  return(
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
