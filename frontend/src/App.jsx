import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Button } from "@/components/ui/button"
import Signup from './pages/Signup'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    <div className="flex min-h-svh flex-col items-center justify-center">
      <Signup />
    </div>

    </>
  )
}

export default App