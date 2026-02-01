'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface ControlPanelProps {
  isRunning: boolean
  onToggleRun: () => void
  onEvolve: () => void
  onReset: () => void
  onSurprise: () => void
  isLoading: boolean
  iteration: number
  frameCount: number
  entropy: number
  particleCount: number
  averageEnergy: number
}

export function ControlPanel({
  isRunning,
  onToggleRun,
  onEvolve,
  onReset,
  onSurprise,
  isLoading,
  iteration,
  frameCount,
  entropy,
  particleCount,
  averageEnergy,
}: ControlPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  return (
    <div className="bg-black/90 backdrop-blur-xl px-6 py-4 shadow-2xl">
      {/* Main controls - Improved hierarchy */}
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <Button
            onClick={onToggleRun}
            className={`${
              isRunning 
                ? 'bg-cyan-600 hover:bg-cyan-700 shadow-lg shadow-cyan-500/40' 
                : 'bg-slate-600 hover:bg-slate-700'
            } text-white font-bold px-6 py-2.5 text-sm transition-all duration-300 border-0 h-auto`}
          >
            {isRunning ? '⏸ Pause' : '▶ Play'}
          </Button>
          <Button
            onClick={onEvolve}
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-purple-500/40 border-0 h-auto"
          >
            {isLoading ? '⚡ Evolving...' : '✨ Evolve'}
          </Button>
          <Button
            onClick={onSurprise}
            disabled={isLoading}
            className="bg-pink-500 hover:bg-pink-600 text-white font-bold px-6 py-2.5 text-sm disabled:opacity-50 transition-all duration-300 shadow-lg shadow-pink-500/40 border-0 h-auto"
            title="Trigger a random surprise event instantly"
          >
            ⚡ Surprise Me
          </Button>
          <Button
            onClick={onReset}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-2.5 text-sm transition-all duration-300 shadow-lg shadow-orange-500/40 border-0 h-auto"
          >
            🔄 Reset
          </Button>
        </div>

        {/* Compact status - remove duplicates */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/60 rounded-lg border border-green-700/40">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
            <span className="text-green-400 font-mono font-bold">ACTIVE</span>
          </div>

          <div className="px-3 py-2 bg-slate-900/60 rounded-lg border border-purple-700/40">
            <span className="text-slate-400 text-[10px]">ITERATION</span>
            <span className="text-purple-400 font-mono font-bold ml-2">{iteration}</span>
          </div>
          
          <Button
            onClick={() => setShowAdvanced(!showAdvanced)}
            variant="outline"
            className="border border-cyan-500/50 bg-black/40 text-cyan-300 hover:bg-cyan-500/20 hover:text-cyan-100 hover:border-cyan-400 font-semibold px-3 py-1.5 text-xs transition-all duration-300 h-auto"
          >
            {showAdvanced ? '− Stats' : '+ Stats'}
          </Button>
        </div>
      </div>

      {/* Advanced stats - Only show when expanded */}
      {showAdvanced && (
        <div className="grid grid-cols-4 gap-2 text-xs mt-3 pt-3 border-t border-slate-800">
          <div className="space-y-0.5 bg-black/40 rounded-md p-2 border border-blue-500/30">
            <p className="text-blue-400 font-semibold text-[10px]">FRAME</p>
            <p className="font-mono text-blue-300 font-bold text-xs">{frameCount}</p>
          </div>
          <div className="space-y-0.5 bg-black/40 rounded-md p-2 border border-red-500/30">
            <p className="text-red-400 font-semibold text-[10px]">ENTROPY</p>
            <p className={`font-mono font-bold text-xs ${
              entropy > 0.7 ? 'text-red-400' : entropy > 0.4 ? 'text-yellow-400' : 'text-green-400'
            }`}>
              {(entropy * 100).toFixed(1)}%
            </p>
          </div>
          <div className="space-y-0.5 bg-black/40 rounded-md p-2 border border-pink-500/30">
            <p className="text-pink-400 font-semibold text-[10px]">PARTICLES</p>
            <p className="font-mono text-pink-300 font-bold text-xs">{particleCount}</p>
          </div>
          <div className="space-y-0.5 bg-black/40 rounded-md p-2 border border-orange-500/30">
            <p className="text-orange-400 font-semibold text-[10px]">ENERGY</p>
            <p className="font-mono text-orange-300 font-bold text-xs">{(averageEnergy * 100).toFixed(0)}%</p>
          </div>
        </div>
      )}

    </div>
  )
}
