'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface OnboardingScreenProps {
  onComplete: () => void
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [particles, setParticles] = useState<Array<{
    id: number
    x: number
    y: number
    vx: number
    vy: number
    size: number
    opacity: number
  }>>([])

  useEffect(() => {
    // Generate breaking particles from center
    const centerX = 50
    const centerY = 50
    const newParticles = Array.from({ length: 60 }, (_, i) => {
      const angle = (Math.PI * 2 * i) / 60
      const speed = 2 + Math.random() * 3
      return {
        id: i,
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 4,
        opacity: 0.8 + Math.random() * 0.2
      }
    })
    setParticles(newParticles)

    // Auto-complete onboarding after animation
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onComplete(), 800) // Wait for fade out
    }, 3500)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Animate particles
  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(prev => 
        prev.map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          opacity: p.opacity - 0.01
        })).filter(p => p.opacity > 0)
      )
    }, 50)

    return () => clearInterval(interval)
  }, [])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#0a0e27] via-[#1a1f3a] to-[#0a0e27]"
        >
          {/* Animated particles background */}
          <div className="absolute inset-0 overflow-hidden">
            {particles.map(particle => (
              <motion.div
                key={particle.id}
                className="absolute rounded-full bg-cyan-400"
                style={{
                  left: `${particle.x}%`,
                  top: `${particle.y}%`,
                  width: `${particle.size}px`,
                  height: `${particle.size}px`,
                  opacity: particle.opacity,
                  boxShadow: '0 0 10px rgba(6, 182, 212, 0.8)',
                }}
              />
            ))}
          </div>

          {/* Main content */}
          <div className="relative z-10 text-center px-8">
            <motion.div
              initial={{ scale: 1, opacity: 1 }}
              animate={{ 
                scale: [1, 1.05, 0.95, 1.1, 0.9, 1],
                opacity: [1, 0.9, 1, 0.85, 1, 0.8]
              }}
              transition={{ 
                duration: 2,
                times: [0, 0.2, 0.4, 0.6, 0.8, 1],
                ease: "easeInOut"
              }}
            >
              <h1 className="text-7xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                FRACTURE
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="relative"
            >
              <motion.p 
                className="text-2xl md:text-3xl text-cyan-300/90 font-light tracking-wide"
                animate={{
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                Where breaking makes it more beautiful
              </motion.p>
            </motion.div>

            {/* Loading indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="mt-12"
            >
              <div className="flex items-center justify-center gap-2">
                <motion.div
                  className="w-2 h-2 rounded-full bg-cyan-400"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: 0
                  }}
                />
                <motion.div
                  className="w-2 h-2 rounded-full bg-purple-400"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: 0.2
                  }}
                />
                <motion.div
                  className="w-2 h-2 rounded-full bg-pink-400"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: 0.4
                  }}
                />
              </div>
              <p className="text-cyan-400/60 text-sm mt-4">Initializing physics engine...</p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
