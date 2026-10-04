import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import GlassFilterDefs from './GlassFilterDefs.jsx'
import BarreProgression from './components/BarreProgression.jsx'
import ToastZone from './components/ToastZone.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GlassFilterDefs />
    <BarreProgression />
    <ToastZone />
    <App />
  </React.StrictMode>,
)
