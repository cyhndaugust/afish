import { useState } from 'react'
import { CreateView } from './views/CreateView'
import { OceanView } from './views/OceanView'
import { hasDrawn, rememberFish } from './storage'
import type { Fish } from './types'

export default function App() {
  // 画过鱼的人（本机记录）刷新后直接进大海，不再要求重新绘制
  const [view, setView] = useState<'create' | 'ocean'>(hasDrawn() ? 'ocean' : 'create')
  const [myFish, setMyFish] = useState<Fish | null>(null)

  if (view === 'ocean') {
    return (
      <OceanView
        myFish={myFish}
        onAddFish={() => {
          setMyFish(null)
          setView('create')
        }}
      />
    )
  }

  return (
    <CreateView
      // 已经画过的人才能中途返回大海
      canReturn={hasDrawn()}
      onCancel={() => setView('ocean')}
      onDone={(fish) => {
        rememberFish(fish)
        setMyFish(fish)
        setView('ocean')
      }}
    />
  )
}
