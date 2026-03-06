import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/geist-mono/400.css'
import '@fontsource/geist-mono/500.css'
import '@fontsource/geist-mono/700.css'
import App from './App'
import './styles/globals.css'
import './types'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
