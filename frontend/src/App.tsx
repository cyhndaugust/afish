import { useState } from 'react'
import { CreateView } from './views/CreateView'
import { OceanView } from './views/OceanView'
import type { Fish } from './types'

export default function App() {
  const [myFish, setMyFish] = useState<Fish | null>(null)
  const [inOcean, setInOcean] = useState(false)

  if (inOcean) {
    return <OceanView myFish={myFish} onBack={() => setInOcean(false)} />
  }
  return (
    <CreateView
      onDone={(fish) => {
        setMyFish(fish)
        setInOcean(true)
      }}
    />
  )
}
