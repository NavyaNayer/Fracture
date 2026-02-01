'use client'

import React from "react"

import { useEffect, useRef, useState } from 'react'
import { EmergentCanvas, Rule, ShapeMutation } from './canvas-engine'
import { RulesDisplay } from './rules-display'
import { ControlPanel } from './control-panel'
import { DrawingToolbar } from './drawing-toolbar' // Import DrawingToolbar
import type { Point } from './drawing-utils'
import { Button } from '@/components/ui/button'
import { getAudioEngine } from './sound-effects'

interface CanvasState {
  frameCount: number
  entropy: number
  particleCount: number
  averageEnergy: number
}

interface GeneratedRules {
  rules: Rule[]
  shapeMutations: ShapeMutation[]
  emergenceTheme: string
}

export function InteractiveCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<EmergentCanvas | null>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const [isRunning, setIsRunning] = useState(true)
  const [state, setState] = useState<CanvasState>({
    frameCount: 0,
    entropy: 0,
    particleCount: 0,
    averageEnergy: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isAutoEvolving, setIsAutoEvolving] = useState(false)
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)
  const [iteration, setIteration] = useState(0)
  const [currentRules, setCurrentRules] = useState<GeneratedRules | null>(null)
  const [showRulesPanel, setShowRulesPanel] = useState(true)
  const [isDrawMode, setIsDrawMode] = useState(false)
  const [brushColor, setBrushColor] = useState('#06b6d4')
  const [lastPoint, setLastPoint] = useState<Point | null>(null)
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null)
  const drawingOverlayRef = useRef<HTMLCanvasElement>(null)

  const [drawnPaths, setDrawnPaths] = useState<Array<{points: Point[], color: string}>>([])
  const [currentPath, setCurrentPath] = useState<Point[]>([])
  
  // Auto-evolution tracking
  const [breakingStats, setBreakingStats] = useState({
    totalParticlesBroken: 0,
    structuresBroken: 0,
    lastEntropy: 0,
    lastEnergy: 0
  })
  const [autoEvolveThreshold, setAutoEvolveThreshold] = useState(1000)
  
  // Visual warning state for approaching collapse
  const collapseProgress = breakingStats.totalParticlesBroken / autoEvolveThreshold
  const isNearCollapse = collapseProgress >= 0.75 // Warning at 75%
  const isCritical = collapseProgress >= 0.90 // Critical at 90%
  
  // Collapse animation state
  const [isCollapsing, setIsCollapsing] = useState(false)
  const [lastCriticalSound, setLastCriticalSound] = useState(0)
  const audioEngine = useRef(getAudioEngine())

  // Initialize canvas and rules on mount
  useEffect(() => {
    if (!canvasRef.current) return
    
    // Resume audio context on first interaction
    const resumeAudio = () => {
      audioEngine.current.resume()
      document.removeEventListener('click', resumeAudio)
    }
    document.addEventListener('click', resumeAudio)

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    
    canvas.width = rect.width
    canvas.height = rect.height
    
    // Initialize drawing overlay canvas
    if (drawingOverlayRef.current) {
      drawingOverlayRef.current.width = rect.width
      drawingOverlayRef.current.height = rect.height
    }

    const engine = new EmergentCanvas(canvas.width, canvas.height)
    engine.setCanvas(canvas)
    engineRef.current = engine

    // Generate initial rules from OpenAI
    generateRules(0)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  // Cycle loading messages
  useEffect(() => {
    if (!isLoading) return
    
    const messages = isAutoEvolving ? [
      '✨ Analyzing breaking patterns...',
      '🧬 Evolving physics DNA...',
      '🔮 Consulting the entropy oracle...',
      '⚡ Rewiring particle bonds...',
      '🌊 Simulating chaos waves...',
      '🎨 Painting new reality rules...',
      '🔬 Computing adaptive forces...',
      '💫 Generating emergence patterns...',
    ] : [
      '🤖 Consulting AI...',
      '🎲 Rolling physics dice...',
      '⚙️ Crafting particle rules...',
      '🌌 Designing chaos systems...',
      '✨ Imagining breakage patterns...',
      '🔧 Tuning force multipliers...',
    ]
    
    const interval = setInterval(() => {
      setLoadingMessageIndex(prev => (prev + 1) % messages.length)
    }, 1500) // Change every 1.5 seconds
    
    return () => clearInterval(interval)
  }, [isLoading, isAutoEvolving])

  // Fetch AI-generated rules
  async function generateRules(iter: number, stats?: typeof breakingStats) {
    try {
      setIsLoading(true)
      const response = await fetch('/api/generate-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          iteration: iter,
          breakingStats: stats || breakingStats,
          currentEntropy: state.entropy,
          currentParticleCount: state.particleCount,
          currentEnergy: state.averageEnergy
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[Canvas] API Error:', response.status, errorText)
        throw new Error(`Failed to generate rules: ${response.status}`)
      }

      const data = await response.json()
      console.log('[Canvas] Generated rules:', data)

      setCurrentRules(data)

      if (engineRef.current) {
        const rules: Rule[] = data.rules
        const mutations: ShapeMutation[] = data.shapeMutations || []

        // Capture ghost traces before clearing (memory across resets!)
        if (stats && iter > 0) {
          engineRef.current.captureGhostTraces()
          audioEngine.current.playCollapse() // Dramatic collapse sound
          setIsCollapsing(true)
          setTimeout(() => setIsCollapsing(false), 800)
        }
        
        // Clear canvas if this is auto-evolution (not initial load)
        if (stats && iter > 0) {
          engineRef.current.clearCanvas()
          console.log('[Auto-Evolution] 🧹 Canvas cleared for fresh start')
        }

        engineRef.current.setRules(rules)
        if (mutations.length > 0) {
          engineRef.current.setMutations(mutations)
        }

        // Initialize particles with colors from rules
        const ruleColors = rules.map((r) => r.colors)
        const particleCount = 50 + Math.random() * 100
        engineRef.current.initializeParticles(Math.floor(particleCount), ruleColors)
        
        // Play evolution sound
        audioEngine.current.playEvolution()

        // Calculate and log average multipliers for debugging
        const avgForce = rules.reduce((sum, r) => sum + r.forceMultiplier, 0) / rules.length
        const avgRange = rules.reduce((sum, r) => sum + r.rangeMultiplier, 0) / rules.length
        
        console.log('[Canvas] ===== NEW RULES LOADED =====')
        console.log('[Canvas] Rules:', rules.map(r => ({
          name: r.name,
          force: r.forceMultiplier,
          range: r.rangeMultiplier
        })))
        console.log('[Canvas] AVG Force:', avgForce.toFixed(2), '| AVG Range:', avgRange.toFixed(2))
        console.log('[Canvas] Breaking will be:', 
          avgForce > 0.3 ? '🔗 STEEL (resistant)' : 
          avgForce < -0.3 ? '💥 GLASS (explosive)' : 
          '⚡ CHAOTIC'
        )
        console.log('[Canvas] Theme:', data.emergenceTheme)
      }

      setIteration(iter)
      setIsLoading(false)
      setIsAutoEvolving(false)
    } catch (error) {
      console.error('[Canvas] Error generating rules:', error)
      // Continue with loading state off even on error
      setIsLoading(false)
      setIsAutoEvolving(false)
      
      // Show user-friendly error
      alert('Could not generate new rules. The canvas will continue with current rules.')
    }
  }

  // Handle drawing - spawn particles that will break apart and evolve
  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawMode || !canvasRef.current || !engineRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const point = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    
    setLastPoint(point)
    
    // Spawn initial particles at draw start
    engineRef.current.paintBrush(point.x, point.y, 30, 0.8, brushColor)
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawMode || !canvasRef.current || !lastPoint)
      return

    const rect = canvasRef.current.getBoundingClientRect()
    const currentPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top }

    // Draw solid line on overlay canvas
    const ctx = drawingOverlayRef.current?.getContext('2d')
    if (ctx) {
      ctx.strokeStyle = brushColor
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(lastPoint.x, lastPoint.y)
      ctx.lineTo(currentPoint.x, currentPoint.y)
      ctx.stroke()
    }

    // Track path for later conversion to particles
    setCurrentPath(prev => [...prev, currentPoint])
    setLastPoint(currentPoint)
  }

  function handleMouseUp() {
    if (currentPath.length > 1) {
      setDrawnPaths(prev => [...prev, { points: currentPath, color: brushColor }])
    }
    setLastPoint(null)
    setCurrentPath([])
  }

  function handleMouseLeave() {
    if (currentPath.length > 1) {
      setDrawnPaths(prev => [...prev, { points: currentPath, color: brushColor }])
    }
    setLastPoint(null)
    setCurrentPath([])
  }

  // Handle canvas clicks to spawn particles
  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (isDrawMode || !canvasRef.current || !engineRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Spawn a burst of particles at click location
    if (currentRules) {
      const colors = currentRules.rules.flatMap((r) => r.colors)
      for (let i = 0; i < 15; i++) {
        const angle = (i / 15) * Math.PI * 2
        const speed = 2 + Math.random() * 3
        // We can't directly add particles, so we just show the concept
        console.log('[v0] Particle spawned at', { x, y })
      }
    }
  }

  // Handle clear canvas
  function handleClearCanvas() {
    if (engineRef.current) {
      engineRef.current.clearCanvas()
    }
    setDrawnPaths([])
  }

  // Convert drawn shapes to breakable particle structures
  function handleBreakShapes() {
    if (!engineRef.current) return
    
    // Get the actual particle count BEFORE creating new structures
    const particlesBeforeCreation = engineRef.current.getState().particleCount
    
    drawnPaths.forEach(path => {
      // Convert each path segment to particle structure
      for (let i = 0; i < path.points.length - 1; i++) {
        const from = path.points[i]
        const to = path.points[i + 1]
        engineRef.current!.createStructureFromLine(
          from.x,
          from.y,
          to.x,
          to.y,
          path.color
        )
      }
    })
    
    // Get actual particle count AFTER creation
    const particlesAfterCreation = engineRef.current.getState().particleCount
    const actualNewParticles = particlesAfterCreation - particlesBeforeCreation
    
    // Play breaking sound
    audioEngine.current.playBreak()
    
    // Track breaking event with ACTUAL particle count
    const newStats = {
      totalParticlesBroken: breakingStats.totalParticlesBroken + actualNewParticles,
      structuresBroken: breakingStats.structuresBroken + drawnPaths.length,
      lastEntropy: state.entropy,
      lastEnergy: state.averageEnergy
    }
    setBreakingStats(newStats)
    
    console.log(`[Auto-Evolution] Created: ${actualNewParticles} particles, ${drawnPaths.length} structures. Total: ${newStats.totalParticlesBroken}/${autoEvolveThreshold}`)
    
    // Auto-evolve if threshold reached
    if (newStats.totalParticlesBroken >= autoEvolveThreshold && !isLoading) {
      console.log('🔄 [Auto-Evolution] THRESHOLD REACHED! Generating adaptive rules...')
      
      // Trigger collapse animation
      setIsCollapsing(true)
      
      // Wait for visual effect, then generate new rules
      setTimeout(() => {
        setIsAutoEvolving(true)
        generateRules(iteration + 1, newStats)
        
        // Reset animation after delay
        setTimeout(() => {
          setIsCollapsing(false)
        }, 1000)
      }, 500)
      
      // Reset counter
      setBreakingStats({
        totalParticlesBroken: 0,
        structuresBroken: 0,
        lastEntropy: state.entropy,
        lastEnergy: state.averageEnergy
      })
    }
    
    // Clear the solid drawings
    setDrawnPaths([])
    
    // Clear the overlay canvas to remove solid lines
    if (drawingOverlayRef.current) {
      const ctx = drawingOverlayRef.current.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, drawingOverlayRef.current.width, drawingOverlayRef.current.height)
      }
    }
  }

  // Animation loop
  useEffect(() => {
    if (!isRunning || !engineRef.current || isLoading) return

    const animate = () => {
      engineRef.current!.update()
      engineRef.current!.render()
      setState(engineRef.current!.getState())
      
      // Play critical warning sound when approaching collapse
      if (isCritical && Date.now() - lastCriticalSound > 2000) {
        audioEngine.current.playCriticalWarning()
        setLastCriticalSound(Date.now())
      }
      
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isRunning, isLoading, isCritical, lastCriticalSound])

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Canvas */}
      <div className="relative flex-1 overflow-hidden flex">
        {/* Rules panel */}
        {showRulesPanel && currentRules && (
          <div className="w-80 border-r border-cyan-500/30 bg-black/90 backdrop-blur-xl overflow-y-auto p-6 flex flex-col gap-4 shadow-2xl custom-scrollbar"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#06b6d4 rgba(30, 41, 59, 0.4)'
            }}
          >
            <button
              onClick={() => setShowRulesPanel(false)}
              className="ml-auto text-slate-400 hover:text-cyan-400 text-xl transition-colors hover:rotate-90 duration-300"
            >
              ✕
            </button>
            <RulesDisplay
              rules={currentRules.rules}
              mutations={currentRules.shapeMutations}
              emergenceTheme={currentRules.emergenceTheme}
              isLoading={isLoading}
              isAutoEvolving={isAutoEvolving}
            />
          </div>
        )}

        {/* Canvas area */}
        <div className="flex-1 relative">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950"
          />
          
          {/* Collapse Animation Overlay - FULL SCREEN FLASH */}
          {isCollapsing && (
            <div className="absolute inset-0 pointer-events-none z-[100]">
              <div 
                className="absolute inset-0 bg-white"
                style={{
                  animation: 'collapseFlash 1s ease-out forwards'
                }}
              />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="text-center space-y-4" style={{ animation: 'collapsePulse 0.5s ease-out' }}>
                  <div className="text-8xl">💥</div>
                  <div className="text-4xl font-black text-purple-500 drop-shadow-[0_0_30px_rgba(139,92,246,1)]">
                    SYSTEM COLLAPSE
                  </div>
                  <div className="text-xl text-cyan-400 font-mono">
                    ⚡ Rewriting Physics ⚡
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Collapse Warning Overlay */}
          {isNearCollapse && !isCollapsing && (
            <div 
              className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${
                isCritical ? 'opacity-40' : 'opacity-20'
              }`}
              style={{
                animation: isCritical ? 'pulse 0.5s ease-in-out infinite' : 'pulse 2s ease-in-out infinite',
                boxShadow: `inset 0 0 ${isCritical ? '100px' : '50px'} ${isCritical ? 'rgba(239, 68, 68, 0.5)' : 'rgba(251, 191, 36, 0.3)'}`,
                border: `2px solid ${isCritical ? 'rgba(239, 68, 68, 0.8)' : 'rgba(251, 191, 36, 0.6)'}`,
              }}
            />
          )}
          
          {/* Critical Warning Text */}
          {isCritical && !isCollapsing && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50">
              <div className="text-center space-y-2 animate-pulse">
                <div className="text-6xl">⚠️</div>
                <div className="text-2xl font-black text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,1)]">
                  SYSTEM CRITICAL
                </div>
                <div className="text-sm text-red-300 font-mono">
                  Collapse imminent — {Math.round((1 - collapseProgress) * 100)}% remaining
                </div>
              </div>
            </div>
          )}
          
          <canvas
            ref={drawingOverlayRef}
            onClick={handleCanvasClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            className={`absolute inset-0 h-full w-full pointer-events-auto ${
              isDrawMode ? 'cursor-crosshair' : 'cursor-default'
            }`}
            style={{ pointerEvents: isDrawMode ? 'auto' : 'none' }}
          />

          {/* Overlay info */}
          <div className="pointer-events-none absolute top-0 left-0 right-0 flex items-center justify-between p-4">
            <div className="space-y-2">
              <div className="space-y-1">
                <h1 className="text-3xl font-black text-cyan-400">
                  FRACTURE
                </h1>
                <div className="text-base font-medium text-slate-400 pl-0.5">
                  Where breaking makes it more beautiful.
                </div>
                <div className="flex items-center gap-2">
                  {/* <p className="text-xs text-slate-400 font-mono">
                    {isLoading ? '⚡ Generating rules...' : '✨ System Active'}
                  </p> */}
                  {/* <div className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    state.entropy > 0.7 ? 'bg-red-500/20 text-red-400 animate-pulse' :
                    state.entropy > 0.4 ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {state.entropy > 0.7 ? 'CRITICAL' : state.entropy > 0.4 ? 'UNSTABLE' : 'STABLE'}
                  </div> */}
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 mr-2 border border-cyan-400/40">
                      {isLoading ? '✨ System Active' : '✨ System Active'}
                    </span>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold border ${
                      state.entropy > 0.7 ? 'bg-red-500/20 text-red-400 border-red-400 animate-pulse' :
                      state.entropy > 0.4 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-400' :
                      'bg-green-500/20 text-green-400 border-green-400'
                    }`}>
                      {state.entropy > 0.7 ? 'CRITICAL' : state.entropy > 0.4 ? 'UNSTABLE' : 'STABLE'}
                    </span>
                </div>
              </div>
            </div>
            
            {/* Particle Count Indicator - Prominent Display */}
            <div className="bg-black/60 backdrop-blur-md border rounded-lg p-3 min-w-[140px]"
              style={{
                borderColor: state.particleCount >= 750 ? 'rgba(239, 68, 68, 0.6)' : 
                            state.particleCount >= 500 ? 'rgba(251, 191, 36, 0.6)' : 
                            'rgba(34, 197, 94, 0.6)',
                boxShadow: state.particleCount >= 750 ? '0 0 20px rgba(239, 68, 68, 0.3)' :
                          state.particleCount >= 500 ? '0 0 15px rgba(251, 191, 36, 0.3)' :
                          '0 0 10px rgba(34, 197, 94, 0.2)'
              }}>
              <div className="text-[10px] font-bold mb-1.5"
                style={{
                  color: state.particleCount >= 750 ? '#ef4444' :
                        state.particleCount >= 500 ? '#fbbf24' :
                        '#22c55e'
                }}>
                PARTICLE COUNT
              </div>
              <div className="flex items-baseline gap-1">
                <div className="text-3xl font-black font-mono"
                  style={{
                    color: state.particleCount >= 750 ? '#ef4444' :
                          state.particleCount >= 500 ? '#fbbf24' :
                          '#22c55e',
                    textShadow: state.particleCount >= 750 ? '0 0 10px rgba(239, 68, 68, 0.8)' :
                                state.particleCount >= 500 ? '0 0 10px rgba(251, 191, 36, 0.8)' :
                                '0 0 10px rgba(34, 197, 94, 0.6)'
                  }}>
                  {state.particleCount}
                </div>
                <div className="text-xs font-bold"
                  style={{
                    color: state.particleCount >= 750 ? '#fca5a5' :
                          state.particleCount >= 500 ? '#fde047' :
                          '#86efac'
                  }}>
                  {state.particleCount >= 750 ? 'CRITICAL' :
                   state.particleCount >= 500 ? 'UNSTABLE' :
                   'STABLE'}
                </div>
              </div>
            </div>
            
            <div className="bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-lg p-3 space-y-1.5">
              <div className="text-[10px] text-cyan-400 font-bold mb-1">SYSTEM METRICS</div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
                <div className="text-slate-400">Frame:</div>
                <div className="font-mono text-cyan-300 text-right">{state.frameCount}</div>
                <div className="text-slate-400">Entropy:</div>
                <div className="font-mono text-right">
                  <span className={state.entropy > 0.7 ? 'text-red-400' : state.entropy > 0.4 ? 'text-yellow-400' : 'text-green-400'}>
                    {(state.entropy * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="text-slate-400">Particles:</div>
                <div className="font-mono text-right">
                  <span className={
                    state.particleCount >= 750 ? 'text-red-400' :
                    state.particleCount >= 500 ? 'text-yellow-400' :
                    'text-green-400'
                  }>
                    {state.particleCount}
                  </span>
                </div>
                <div className="text-slate-400">Energy:</div>
                <div className="font-mono text-orange-300 text-right">{(state.averageEnergy * 100).toFixed(0)}%</div>
              </div>
            </div>
          </div>

          {/* Rules panel toggle button */}
          {!showRulesPanel && (
            <button
              onClick={() => setShowRulesPanel(true)}
              className="pointer-events-auto absolute top-16 left-4 px-3 py-1.5 bg-black/60 hover:bg-cyan-500/20 backdrop-blur-md border border-cyan-500/30 hover:border-cyan-500 rounded-md text-xs text-cyan-300 hover:text-cyan-100 transition-all duration-300 shadow-md font-semibold"
            >
              📋 Rules
            </button>
          )}

          {/* Drawing mode toggle and color picker */}
          <div className="pointer-events-auto absolute bottom-4 left-4 flex flex-col gap-2">
            {/* Auto-evolve with progress */}
            <div className="bg-black/70 backdrop-blur-md border border-purple-500/40 rounded-lg p-3 space-y-2 min-w-[240px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔄</span>
                  <span className="text-xs font-bold text-purple-300">Auto-Evolve</span>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-cyan-300">{breakingStats.totalParticlesBroken}/{autoEvolveThreshold}</div>
                  <div className="text-[9px] text-slate-500">particles</div>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 bg-purple-500 transition-all duration-300 rounded-full"
                  style={{ width: `${Math.min(100, (breakingStats.totalParticlesBroken / autoEvolveThreshold) * 100)}%` }}
                />
                {breakingStats.totalParticlesBroken >= autoEvolveThreshold * 0.8 && (
                  <div className="absolute inset-0 bg-purple-500/20 animate-pulse" />
                )}
              </div>
              
              {/* Threshold slider */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-slate-400">Threshold:</span>
                  <span className="text-[10px] text-purple-400 font-mono">{autoEvolveThreshold}</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="3000"
                  step="100"
                  value={autoEvolveThreshold}
                  onChange={(e) => setAutoEvolveThreshold(Number(e.target.value))}
                  className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
            </div>
            
            {/* Drawing controls */}
            <div className="bg-black/70 backdrop-blur-md border border-cyan-500/40 rounded-lg p-2 space-y-2">
              <button
                onClick={() => setIsDrawMode(!isDrawMode)}
                className={`w-full px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 shadow-lg ${
                  isDrawMode
                    ? 'bg-cyan-500 hover:bg-cyan-600 border-2 border-cyan-300 text-white shadow-cyan-500/50'
                    : 'bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 hover:border-cyan-500 text-slate-300 hover:text-cyan-300'
                }`}
              >
                {isDrawMode ? '✏️ Drawing Mode' : '🎨 Enable Drawing'}
              </button>
              
              {/* Color palette - always visible when drawing */}
              {isDrawMode && (
                <div className="flex gap-1.5 flex-wrap">
                  {[
                    '#06b6d4',
                    '#8b5cf6',
                    '#ec4899',
                    '#f97316',
                    '#10b981',
                    '#fbbf24',
                    '#3b82f6',
                    '#ef4444',
                  ].map((color) => (
                    <button
                      key={color}
                      onClick={() => setBrushColor(color)}
                      className={`w-7 h-7 rounded-lg border-2 transition-all duration-200 ${
                        brushColor === color
                          ? 'border-white scale-110 shadow-lg ring-2 ring-white/50'
                          : 'border-slate-500 hover:border-white hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              )}
              
              {/* Break button */}
              {drawnPaths.length > 0 && (
                <button
                  onClick={handleBreakShapes}
                  className="w-full px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 bg-orange-500 hover:bg-orange-600 border-2 border-orange-300 text-white shadow-lg shadow-orange-500/50 animate-pulse"
                >
                  💥 Break Structures ({drawnPaths.length})
                </button>
              )}
            </div>
          </div>

          {/* Loading state */}
          {isLoading && (() => {
            const messages = isAutoEvolving ? [
              '✨ Analyzing breaking patterns...',
              '🧬 Evolving physics DNA...',
              '🔮 Consulting the entropy oracle...',
              '⚡ Rewiring particle bonds...',
              '🌊 Simulating chaos waves...',
              '🎨 Painting new reality rules...',
              '🔬 Computing adaptive forces...',
              '💫 Generating emergence patterns...',
            ] : [
              '🤖 Consulting AI...',
              '🎲 Rolling physics dice...',
              '⚙️ Crafting particle rules...',
              '🌌 Designing chaos systems...',
              '✨ Imagining breakage patterns...',
              '🔧 Tuning force multipliers...',
            ]
            
            return (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-md">
              <div className="text-center space-y-4">
                <div className="relative inline-block">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400 shadow-lg" />
                  <div className="absolute inset-0 h-12 w-12 animate-ping rounded-full border-4 border-cyan-400 opacity-20" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-cyan-300 animate-pulse">
                    {messages[loadingMessageIndex]}
                  </p>
                  <p className="text-xs text-slate-400">
                    {isAutoEvolving ? 'Adaptive system evolution in progress' : 'Generating physics rules'}
                  </p>
                </div>
              </div>
            </div>
            )
          })()}
        </div>
      </div>

      {/* Control Panel */}
      <ControlPanel
        isRunning={isRunning}
        onToggleRun={() => setIsRunning(!isRunning)}
        onEvolve={() => {
          setIsRunning(true)
          generateRules(iteration + 1)
        }}
        onReset={() => {
          if (engineRef.current && currentRules) {
            const ruleColors = currentRules.rules.map((r) => r.colors)
            engineRef.current.initializeParticles(80, ruleColors)
          }
        }}
        onSurprise={() => {
          console.log('🎪 Surprise Me button clicked!')
          if (engineRef.current) {
            console.log('🎯 Calling forceSurpriseEvent...')
            engineRef.current.forceSurpriseEvent()
            const audio = getAudioEngine()
            audio.playSurprise()
            console.log('🔊 Playing surprise sound!')
          } else {
            console.warn('⚠️ Engine ref is null!')
          }
        }}
        isLoading={isLoading}
        iteration={iteration}
        frameCount={state.frameCount}
        entropy={state.entropy}
        particleCount={state.particleCount}
        averageEnergy={state.averageEnergy}
      />
    </div>
  )
}
