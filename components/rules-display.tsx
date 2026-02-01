'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'

interface Rule {
  name: string
  description: string
  forceMultiplier: number
  rangeMultiplier: number
  breakingSequence?: Array<{
    duration: number
    physics: {
      velocityX: number
      velocityY: number
      rotationSpeed: number
      separationForce: number
      magneticForce: number
      turbulence: number
      energyGlow: number
      decayRate: number
    }
    description: string
  }>
  colors: string[]
}

interface ShapeMutation {
  type: string
  intensity: number
  duration: number
}

interface RulesDisplayProps {
  rules?: Rule[]
  mutations?: ShapeMutation[]
  emergenceTheme?: string
  isLoading?: boolean
  isAutoEvolving?: boolean
}

export function RulesDisplay({
  rules = [],
  mutations = [],
  emergenceTheme = '',
  isLoading = false,
  isAutoEvolving = false,
}: RulesDisplayProps) {
  const [expandedRule, setExpandedRule] = useState<number | null>(null)

  return (
    <div className="w-full max-w-md space-y-4">
      {/* Header with enhanced design */}
      <div className="relative overflow-hidden rounded-lg border border-cyan-500/40 bg-slate-950 p-5 shadow-2xl">
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-cyan-500/5 animate-pulse" />
        
        {/* Glowing border effect */}
        <div className="absolute inset-0 rounded-lg shadow-[inset_0_0_20px_rgba(6,182,212,0.2)]" />
        
        <div className="relative space-y-3">
          {/* Main title */}
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500 shadow-lg shadow-cyan-500/50">
              <span className="text-xl">⚛️</span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-black tracking-tight text-cyan-300 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">
                PHYSICS RULES
              </h2>
              <div className="h-1 w-32 bg-cyan-500 rounded-full mt-1" />
            </div>
          </div>
          
          {/* Status indicator */}
          <div className="flex items-center gap-1 px-2 py-1 bg-black/40 rounded-lg border border-cyan-500/20 backdrop-blur-sm">
            <div className="flex items-center gap-1 flex-1">
              {isLoading ? (
                isAutoEvolving ? (
                  <>
                    <div className="relative">
                      <span className="inline-block w-1.5 h-1.5 bg-purple-500 rounded-full animate-ping absolute" />
                      <span className="inline-block w-1.5 h-1.5 bg-purple-400 rounded-full" />
                    </div>
                    <span className="text-xs font-mono text-purple-300">System self-evolving...</span>
                  </>
                ) : (
                  <>
                    <div className="relative">
                      <span className="inline-block w-1.5 h-1.5 bg-cyan-500 rounded-full animate-ping absolute" />
                      <span className="inline-block w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                    </div>
                    <span className="text-xs font-mono text-cyan-300">Generating rules...</span>
                  </>
                )
              ) : (
                <>
                  <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                  <span className="text-xs font-mono text-green-400 font-bold">{rules.length} Active Rules</span>
                  <span className="text-xs text-slate-500">• AI Generated</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Compact theme display */}
      {emergenceTheme && (
        <div className="relative overflow-hidden border border-purple-500/30 bg-purple-950/40 px-3 py-2.5 rounded-lg">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-purple-500" />
          <div className="flex items-center gap-2">
            <span className="text-lg">🎨</span>
            <p className="text-xs text-purple-200 line-clamp-1">"{emergenceTheme}"</p>
          </div>
        </div>
      )}

      {/* Rules with enhanced design */}
      <div className="space-y-1.5">
        {rules.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-sm bg-black/40 rounded-lg border border-slate-700/50">
            {isLoading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                <p>Consulting AI...</p>
              </div>
            ) : '⚠ No rules loaded'}
          </div>
        ) : (
          rules.map((rule, idx) => (
            <div key={idx} className="group">
              <button
                onClick={() => setExpandedRule(expandedRule === idx ? null : idx)}
                className="w-full text-left px-4 py-3.5 rounded-lg border-2 border-cyan-500/30 hover:border-cyan-400 bg-gradient-to-br from-black/70 to-cyan-950/30 hover:from-black/90 hover:to-cyan-950/50 transition-all duration-300 shadow-lg hover:shadow-cyan-500/20 relative overflow-hidden"
              >
                {/* Animated background on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-md">{idx === 0 ? '⚡' : idx === 1 ? '🔮' : '✨'}</span>
                      <p className="text-sm font-bold text-cyan-300 group-hover:text-cyan-100 transition-colors">
                        {rule.name}
                      </p>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{rule.description}</p>
                    
                    {/* Force/Range badges */}
                    <div className="flex gap-2 mt-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                        rule.forceMultiplier > 0.3 ? 'bg-green-500/20 text-green-400' :
                        rule.forceMultiplier < -0.3 ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        F: {rule.forceMultiplier > 0 ? '+' : ''}{rule.forceMultiplier.toFixed(2)}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-blue-500/20 text-blue-400">
                        R: {rule.rangeMultiplier.toFixed(2)}x
                      </span>
                    </div>
                  </div>
                  
                  {/* Color swatches */}
                  <div className="flex gap-1.5 ml-3 flex-shrink-0">
                    {rule.colors?.map((color, i) => (
                      <div
                        key={i}
                        className="w-5 h-5 rounded-md border-2 border-white/40 shadow-lg group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Expand indicator */}
                <div className="absolute bottom-2 right-2 text-xs text-slate-500 group-hover:text-cyan-400 transition-colors">
                  {expandedRule === idx ? '▲' : '▼'}
                </div>
              </button>

              {/* Expanded details with better layout */}
              {expandedRule === idx && (
                <div className="mt-2 px-4 py-3 bg-gradient-to-br from-slate-900/80 to-slate-950/80 rounded-lg border border-slate-700/50 space-y-3 text-xs backdrop-blur-sm">
                  
                  {/* Breaking Sequence - Featured prominently */}
                  {rule.breakingSequence && rule.breakingSequence.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 pb-2 border-b border-purple-500/30">
                        <span className="text-lg">💥</span>
                        <p className="text-purple-400 font-bold">Breaking Physics (AI Generated)</p>
                      </div>
                      <div className="space-y-2">
                        {rule.breakingSequence.map((phase, i) => (
                          <div key={i} className="bg-black/50 p-3 rounded-lg border border-purple-500/30 hover:border-purple-400/50 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded font-mono font-bold text-[10px]">
                                  PHASE {i + 1}
                                </span>
                                <span className="text-slate-400 text-[10px]">{phase.duration} frames</span>
                              </div>
                              <span className="text-slate-300 text-[10px] italic max-w-[150px] truncate">{phase.description}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-[10px]">
                              <div className="bg-cyan-500/10 p-1.5 rounded">
                                <div className="text-slate-500 mb-0.5">Velocity</div>
                                <div className="text-cyan-400 font-mono">{phase.physics.velocityX.toFixed(1)}, {phase.physics.velocityY.toFixed(1)}</div>
                              </div>
                              <div className="bg-orange-500/10 p-1.5 rounded">
                                <div className="text-slate-500 mb-0.5">Separation</div>
                                <div className="text-orange-400 font-mono">{phase.physics.separationForce.toFixed(1)}</div>
                              </div>
                              <div className="bg-pink-500/10 p-1.5 rounded">
                                <div className="text-slate-500 mb-0.5">Magnetic</div>
                                <div className="text-pink-400 font-mono">{phase.physics.magneticForce.toFixed(1)}</div>
                              </div>
                              <div className="bg-purple-500/10 p-1.5 rounded">
                                <div className="text-slate-500 mb-0.5">Rotation</div>
                                <div className="text-purple-400 font-mono">{phase.physics.rotationSpeed.toFixed(1)}</div>
                              </div>
                              <div className="bg-yellow-500/10 p-1.5 rounded">
                                <div className="text-slate-500 mb-0.5">Turbulence</div>
                                <div className="text-yellow-400 font-mono">{phase.physics.turbulence.toFixed(1)}</div>
                              </div>
                              <div className="bg-blue-500/10 p-1.5 rounded">
                                <div className="text-slate-500 mb-0.5">Energy</div>
                                <div className="text-blue-400 font-mono">{phase.physics.energyGlow.toFixed(1)}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Mutations with modern design */}
      {mutations.length > 0 && (
        <div className="pt-3 border-t border-slate-800/50 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌀</span>
            <p className="text-xs font-bold text-amber-400">Active Mutations: {mutations.length}</p>
          </div>
          <div className="grid gap-2">
            {mutations.map((mutation, idx) => (
              <div
                key={idx}
                className="px-3 py-2 bg-gradient-to-r from-amber-950/40 to-orange-950/40 border border-amber-700/40 rounded-lg text-xs hover:border-amber-500/60 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-300 uppercase">{mutation.type}</span>
                    <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded text-[10px]">
                      {(mutation.intensity * 100).toFixed(0)}%
                    </span>
                  </div>
                  <span className="text-amber-500/80 text-[10px]">{mutation.duration}f</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
