'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'

interface SystemMonitorProps {
  frameCount: number
  entropy: number
  particleCount: number
  averageEnergy: number
  iteration: number
  emergenceTheme?: string
}

export function SystemMonitor({
  frameCount,
  entropy,
  particleCount,
  averageEnergy,
  iteration,
  emergenceTheme = '',
}: SystemMonitorProps) {
  const [observation, setObservation] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const lastAnalysisRef = React.useRef(0)

  // Periodically analyze the canvas state
  useEffect(() => {
    const now = Date.now()
    if (now - lastAnalysisRef.current < 10000 || frameCount % 100 !== 0) return

    lastAnalysisRef.current = now

    const analyzeState = async () => {
      try {
        setIsAnalyzing(true)
        const response = await fetch('/api/analyze-state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            frameCount,
            entropy,
            particleCount,
            averageEnergy,
            iteration,
            lastRuleTheme: emergenceTheme,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          setObservation(data.observation)
        }
      } catch (error) {
        console.error('[v0] Analysis error:', error)
      } finally {
        setIsAnalyzing(false)
      }
    }

    analyzeState()
  }, [frameCount, entropy, particleCount, averageEnergy, iteration, emergenceTheme])

  return (
    <Card className="border-slate-700 bg-slate-900/30 p-3 space-y-2">
      {/* Entropy visualization */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">ENTROPY FIELD</span>
          <span className="text-cyan-400 font-mono">{(entropy * 100).toFixed(1)}%</span>
        </div>
        <div className="w-full h-2 bg-slate-800 rounded overflow-hidden">
          <div
            className="h-full bg-cyan-500 transition-all duration-500"
            style={{ width: `${Math.min(entropy * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Energy field */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">ENERGY LEVEL</span>
          <span className="text-green-400 font-mono">{(averageEnergy * 100).toFixed(0)}%</span>
        </div>
        <div className="w-full h-2 bg-slate-800 rounded overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${Math.min(averageEnergy * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Observation from AI */}
      {observation && (
        <div className="pt-2 border-t border-slate-700 space-y-1">
          <p className="text-xs text-slate-500">SYSTEM OBSERVATION</p>
          <p className="text-xs text-slate-300 leading-relaxed italic">{observation}</p>
        </div>
      )}

      {/* Real-time stats */}
      <div className="grid grid-cols-3 gap-2 pt-2 text-xs border-t border-slate-700">
        <div className="text-center">
          <p className="text-slate-500">Particles</p>
          <p className="text-blue-400 font-mono font-bold">{particleCount}</p>
        </div>
        <div className="text-center">
          <p className="text-slate-500">Activity</p>
          <p className="text-purple-400 font-mono font-bold">
            {Math.round((frameCount / (iteration + 1)) % 100)}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-slate-500">Iter</p>
          <p className="text-orange-400 font-mono font-bold">{iteration}</p>
        </div>
      </div>
    </Card>
  )
}

import * as React from 'react'
