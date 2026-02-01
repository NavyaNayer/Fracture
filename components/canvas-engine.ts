// Canvas engine with particle physics and emergent behavior
export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  ax: number
  ay: number
  mass: number
  radius: number
  color: string
  age: number
  decayRate: number
  energy: number
}

export interface Rule {
  name: string
  description: string
  forceMultiplier: number
  rangeMultiplier: number
  breakingSequence?: Array<{
    duration: number
    physics: {
      structureVelocityX?: number
      structureVelocityY?: number
      structureRotation?: number
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

export interface ShapeMutation {
  type: string
  intensity: number
  duration: number
  progress: number
}

export interface ParticleStructure {
  particles: Particle[]
  bonds: { a: number; b: number; restLength: number; stiffness: number }[]
  color: string
  integrity: number // 0-1, breaks when < 0.2
  breakingPhase: number // Which phase of the sequence we're in
  breakingAge: number // Frames since breaking started
}

export class EmergentCanvas {
  private particles: Particle[] = []
  private rules: Rule[] = []
  private mutations: ShapeMutation[] = []
  private structures: ParticleStructure[] = []
  private frameCount = 0
  private entropy = 0
  private readonly width: number
  private readonly height: number
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private ghostTraces: Array<{x: number, y: number, color: string, alpha: number}> = []
  private particleTrails: Map<string, Array<{x: number, y: number}>> = new Map()
  private lastSurpriseEvent = 0

  constructor(width: number, height: number) {
    this.width = width
    this.height = height
    // Initialize with default rules to prevent undefined errors
    this.initializeDefaultRules()
  }

  private initializeDefaultRules() {
    this.rules = [
      {
        name: 'Attraction',
        description: 'Particles attract each other',
        forceMultiplier: 0.8,
        rangeMultiplier: 1.2,
        colors: ['#06b6d4', '#0ea5e9'],
      },
      {
        name: 'Repulsion',
        description: 'Particles repel each other',
        forceMultiplier: -0.6,
        rangeMultiplier: 0.8,
        colors: ['#8b5cf6', '#a78bfa'],
      },
      {
        name: 'Orbital',
        description: 'Particles orbit around center',
        forceMultiplier: 0.5,
        rangeMultiplier: 1.5,
        colors: ['#ec4899', '#f472b6'],
      },
    ]
  }

  setCanvas(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d', { alpha: true, willReadFrequently: true })
  }

  initializeParticles(count: number, ruleColors: string[][]) {
    this.particles = []
    const allColors = ruleColors.flat()

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const distance = Math.random() * Math.min(this.width, this.height) * 0.2
      const centerX = this.width / 2
      const centerY = this.height / 2

      this.particles.push({
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        ax: 0,
        ay: 0,
        mass: 1 + Math.random() * 2,
        radius: 1.5 + Math.random() * 3,
        color: allColors[Math.floor(Math.random() * allColors.length)],
        age: 0,
        decayRate: 0.995 + Math.random() * 0.002,
        energy: 1,
      })
    }
  }

  setRules(rules: Rule[]) {
    this.rules = rules
  }

  setMutations(mutations: any[]) {
    this.mutations = mutations.map((m) => ({
      ...m,
      progress: 0,
    }))
  }

  // Drawing capability - spawn particles from user input
  spawnParticlesAtPoint(x: number, y: number, count: number = 20, color?: string) {
    const useColor = color || this.rules[Math.floor(Math.random() * this.rules.length)]?.colors[0] || '#06b6d4'
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5
      const speed = 2 + Math.random() * 4
      
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        ax: 0,
        ay: 0,
        mass: 0.8 + Math.random() * 1.2,
        radius: 2 + Math.random() * 2,
        color: useColor,
        age: 0,
        decayRate: 0.992 + Math.random() * 0.005,
        energy: 1,
      })
    }
  }

  // Draw a line by spawning particles along it
  drawLine(fromX: number, fromY: number, toX: number, toY: number, color?: string) {
    const distance = Math.hypot(toX - fromX, toY - fromY)
    const steps = Math.ceil(distance / 5)
    
    for (let i = 0; i <= steps; i++) {
      const t = steps === 0 ? 0 : i / steps
      const x = fromX + (toX - fromX) * t
      const y = fromY + (toY - fromY) * t
      this.spawnParticlesAtPoint(x, y, 5, color)
    }
  }

  // Create a bonded structure from drawing that can break apart
  createStructureFromLine(fromX: number, fromY: number, toX: number, toY: number, color?: string) {
    const useColor = color || this.rules[Math.floor(Math.random() * this.rules.length)]?.colors[0] || '#06b6d4'
    const distance = Math.hypot(toX - fromX, toY - fromY)
    
    // ADAPTIVE: Use rules to vary structure properties
    const avgForceMultiplier = this.rules.length > 0 
      ? this.rules.reduce((sum, r) => sum + r.forceMultiplier, 0) / this.rules.length 
      : 0.5
    const avgRangeMultiplier = this.rules.length > 0
      ? this.rules.reduce((sum, r) => sum + r.rangeMultiplier, 0) / this.rules.length
      : 1.0
    
    // Spacing varies based on range multiplier (wider range = looser structures)
    const spacing = 5 + avgRangeMultiplier * 4 // Range: 5-11px
    const count = Math.max(2, Math.floor(distance / spacing))
    
    // Bond stiffness varies based on force multiplier
    // Attractive forces (positive) = stronger bonds, repulsive (negative) = weaker bonds
    const baseStiffness = 0.3 + Math.abs(avgForceMultiplier) * 0.4 // Range: 0.3-0.7
    
    // Particle mass varies with force multiplier
    const particleMass = 1.5 + avgForceMultiplier * 0.8 // Varies by rule
    
    const structureParticles: Particle[] = []
    const bonds: { a: number; b: number; restLength: number; stiffness: number }[] = []
    
    // Create particles along the line
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1)
      const x = fromX + (toX - fromX) * t
      const y = fromY + (toY - fromY) * t
      
      const particle: Particle = {
        x,
        y,
        vx: 0,
        vy: 0,
        ax: 0,
        ay: 0,
        mass: particleMass,
        radius: 2.5 + Math.random() * 1,
        color: useColor,
        age: 0,
        decayRate: 0.998 + Math.random() * 0.002,
        energy: 1,
      }
      
      structureParticles.push(particle)
      this.particles.push(particle)
      
      // Bond to previous particle with varied stiffness
      if (i > 0) {
        bonds.push({
          a: structureParticles.length - 2,
          b: structureParticles.length - 1,
          restLength: spacing,
          stiffness: baseStiffness + (Math.random() - 0.5) * 0.1, // Add slight variation
        })
      }
    }
    
    // Create the structure with initial integrity based on rules
    // Stronger forces = more stable initial structures
    const initialIntegrity = 0.8 + Math.min(Math.abs(avgForceMultiplier) * 0.2, 0.2)
    
    if (structureParticles.length > 1) {
      this.structures.push({
        particles: structureParticles,
        bonds,
        color: useColor,
        integrity: initialIntegrity,
        breakingPhase: 0,
        breakingAge: 0,
      })
    }
  }

  // Paint a brush stroke with varied intensity
  paintBrush(x: number, y: number, brushSize: number = 30, intensity: number = 1, color?: string) {
    const particleCount = Math.floor(intensity * 10)
    const useColor = color || this.rules[Math.floor(Math.random() * this.rules.length)]?.colors[0] || '#06b6d4'
    
    for (let i = 0; i < particleCount; i++) {
      const offsetX = (Math.random() - 0.5) * brushSize
      const offsetY = (Math.random() - 0.5) * brushSize
      const px = x + offsetX
      const py = y + offsetY
      
      this.spawnParticlesAtPoint(px, py, 3, useColor)
    }
  }

  // Get current particle positions for drawing if needed
  getParticles() {
    return this.particles
  }

  private applyForces() {
    // Reset accelerations
    for (const p of this.particles) {
      p.ax = 0
      p.ay = 0
    }

    // Apply gravity to center
    const centerX = this.width / 2
    const centerY = this.height / 2
    const gravityStrength = 0.02

    for (const p of this.particles) {
      const dx = centerX - p.x
      const dy = centerY - p.y
      const dist = Math.hypot(dx, dy)

      if (dist > 1) {
        p.ax += (dx / dist) * gravityStrength * 0.5
        p.ay += (dy / dist) * gravityStrength * 0.5
      }
    }

    // Apply rule-based forces (particle interactions)
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const p1 = this.particles[i]
        const p2 = this.particles[j]

        const dx = p2.x - p1.x
        const dy = p2.y - p1.y
        const distSq = dx * dx + dy * dy
        const dist = Math.sqrt(distSq)

        if (dist < 1) continue

        // Pick a random rule for this interaction (with fallback)
        if (this.rules.length === 0) continue
        const rule = this.rules[Math.floor(Math.random() * this.rules.length)]
        const maxRange = 150 * (rule?.rangeMultiplier || 1)
        const force = ((rule?.forceMultiplier || 0.5) * 50) / (distSq + 1)

        if (dist < maxRange) {
          const fx = (dx / dist) * force
          const fy = (dy / dist) * force

          p1.ax -= fx / p1.mass
          p1.ay -= fy / p1.mass
          p2.ax += fx / p2.mass
          p2.ay += fy / p2.mass
        }
      }
    }

    // Entropy-driven random perturbations (system becomes more chaotic over time)
    const perturbation = Math.min(this.entropy * 0.1, 0.5)
    for (const p of this.particles) {
      p.ax += (Math.random() - 0.5) * perturbation
      p.ay += (Math.random() - 0.5) * perturbation
    }
  }

  private updateParticles(deltaTime: number = 1) {
    for (const p of this.particles) {
      // Update velocity with damping
      p.vx = (p.vx + p.ax) * 0.98
      p.vy = (p.vy + p.ay) * 0.98

      // Update position
      p.x += p.vx * deltaTime
      p.y += p.vy * deltaTime

      // Decay energy and apply decay
      p.energy *= p.decayRate
      p.age++

      // Boundary wrapping with some friction
      if (p.x < -50) p.x = this.width + 50
      if (p.x > this.width + 50) p.x = -50
      if (p.y < -50) p.y = this.height + 50
      if (p.y > this.height + 50) p.y = -50

      // Occasional mutation events (particles can "reset")
      if (Math.random() < 0.002 && p.age > 500) {
        p.vx *= 0.3
        p.vy *= 0.3
        p.energy = Math.random() * 0.5 + 0.5
        p.age = 0
      }
    }

    // Remove dead particles and occasionally create new ones
    if (this.particles.length > 50 && Math.random() < 0.1) {
      this.particles = this.particles.filter((p) => p.energy > 0.1)
    }

    // Birth new particles near center (emergence)
    if (Math.random() < 0.05 && this.particles.length < 200) {
      const angle = Math.random() * Math.PI * 2
      const distance = Math.random() * 50
      this.particles.push({
        x: this.width / 2 + Math.cos(angle) * distance,
        y: this.height / 2 + Math.sin(angle) * distance,
        vx: Math.random() - 0.5,
        vy: Math.random() - 0.5,
        ax: 0,
        ay: 0,
        mass: 1,
        radius: 2,
        color: this.rules[0]?.colors[0] || '#06b6d4',
        age: 0,
        decayRate: 0.994,
        energy: 1,
      })
    }
  }

  private applyMutations() {
    for (const mutation of this.mutations) {
      mutation.progress++
      if (mutation.progress > mutation.duration) {
        mutation.progress = 0
      }

      const progress = mutation.progress / mutation.duration
      const intensity = mutation.intensity * (1 - Math.abs(progress - 0.5) * 2)

      switch (mutation.type) {
        case 'spiral': {
          for (const p of this.particles) {
            const angle = Math.atan2(p.y - this.height / 2, p.x - this.width / 2)
            p.vx += Math.cos(angle + Math.PI / 2) * intensity * 0.3
            p.vy += Math.sin(angle + Math.PI / 2) * intensity * 0.3
            break
          }
          break
        }
        case 'wave': {
          for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i]
            const wavePhase = (i / this.particles.length + progress) * Math.PI * 2
            p.y += Math.sin(wavePhase) * intensity * 2
            break
          }
          break
        }
        case 'vortex': {
          const centerX = this.width / 2
          const centerY = this.height / 2
          for (const p of this.particles) {
            const dx = p.x - centerX
            const dy = p.y - centerY
            const dist = Math.hypot(dx, dy)
            if (dist > 1) {
              const angle = Math.atan2(dy, dx)
              p.vx = Math.cos(angle + intensity * 0.2) * (dist * 0.01)
              p.vy = Math.sin(angle + intensity * 0.2) * (dist * 0.01)
            }
          }
          break
        }
        case 'cascade': {
          for (const p of this.particles) {
            if (p.y < this.height / 2) {
              p.vy += intensity * 0.5
            }
          }
          break
        }
        case 'bloom': {
          const centerX = this.width / 2
          const centerY = this.height / 2
          for (const p of this.particles) {
            const dx = p.x - centerX
            const dy = p.y - centerY
            const dist = Math.hypot(dx, dy)
            if (dist > 1) {
              p.vx += (dx / dist) * intensity * 0.5
              p.vy += (dy / dist) * intensity * 0.5
            }
          }
          break
        }
      }
    }
  }

  private updateStructures() {
    // Calculate adaptive breaking parameters based on current rules
    const avgForceMultiplier = this.rules.length > 0 
      ? this.rules.reduce((sum, r) => sum + r.forceMultiplier, 0) / this.rules.length 
      : 0.5
    const avgRangeMultiplier = this.rules.length > 0
      ? this.rules.reduce((sum, r) => sum + r.rangeMultiplier, 0) / this.rules.length
      : 1.0
    
    // EXTREME breaking threshold variation (0.1 to 1.2)
    // Attractive (+1.0) = almost unbreakable steel
    // Repulsive (-1.0) = shatters instantly like glass
    const breakingThreshold = 0.5 + avgForceMultiplier * 0.7
    
    // EXTREME integrity loss variation
    // Short range (0.1) = dies in 1-2 frames (instant)
    // Long range (2.0) = fades slowly over 20+ frames
    const integrityLossRate = 0.15 / Math.max(avgRangeMultiplier, 0.1)
    
    // Get AI-generated breaking sequence with EXECUTABLE physics
    const breakingSequence = this.rules[0]?.breakingSequence || [
      { 
        duration: 15, 
        physics: {
          structureVelocityX: 0, structureVelocityY: 0, structureRotation: 0,
          velocityX: 0, velocityY: 0, rotationSpeed: 0, separationForce: 5, 
          magneticForce: 0, turbulence: 0.5, energyGlow: 1.0, decayRate: 0.1
        },
        description: "explosive scatter" 
      }
    ]
    
    // Apply bond forces to keep structures together
    for (const structure of this.structures) {
      // Get AI-generated breaking sequence
      const breakingSequence = this.rules[0]?.breakingSequence || [
        { 
          duration: 15, 
          physics: {
            structureVelocityX: 0, structureVelocityY: 0, structureRotation: 0,
            velocityX: 0, velocityY: 0, rotationSpeed: 0, separationForce: 5, 
            magneticForce: 0, turbulence: 0.5, energyGlow: 1.0, decayRate: 0.1
          },
          description: "explosive scatter" 
        }
      ]
      
      // Determine current phase once per structure
      let currentPhase = breakingSequence[0]
      if (structure.integrity < 1.0) {
        let accumulatedDuration = 0
        for (let i = 0; i < breakingSequence.length; i++) {
          accumulatedDuration += breakingSequence[i].duration
          if (structure.breakingAge <= accumulatedDuration) {
            currentPhase = breakingSequence[i]
            structure.breakingPhase = i
            break
          }
        }
      }
      
      const physics = currentPhase.physics
      
      // Calculate center for structure-wide operations
      const centerX = structure.particles.reduce((sum, p) => sum + p.x, 0) / structure.particles.length
      const centerY = structure.particles.reduce((sum, p) => sum + p.y, 0) / structure.particles.length
      
      // APPLY STRUCTURE-WIDE MOVEMENT ONCE (before breaking particles)
      if (structure.integrity < 1.0) {
        if (physics.structureVelocityX !== undefined && physics.structureVelocityX !== 0) {
          structure.particles.forEach(p => p.vx += physics.structureVelocityX! * 0.1)
        }
        if (physics.structureVelocityY !== undefined && physics.structureVelocityY !== 0) {
          structure.particles.forEach(p => p.vy += physics.structureVelocityY! * 0.1)
        }
        if (physics.structureRotation !== undefined && physics.structureRotation !== 0) {
          structure.particles.forEach(p => {
            const angle = Math.atan2(p.y - centerY, p.x - centerX)
            const dist = Math.hypot(p.x - centerX, p.y - centerY)
            p.vx += Math.cos(angle + Math.PI / 2) * physics.structureRotation! * dist * 0.01
            p.vy += Math.sin(angle + Math.PI / 2) * physics.structureRotation! * dist * 0.01
          })
        }
      }
      
      for (const bond of structure.bonds) {
        const pA = structure.particles[bond.a]
        const pB = structure.particles[bond.b]
        
        if (!pA || !pB) continue
        
        const dx = pB.x - pA.x
        const dy = pB.y - pA.y
        const distance = Math.hypot(dx, dy)
        
        if (distance === 0) continue
        
        const strain = Math.abs(distance - bond.restLength) / bond.restLength
        
        // ADAPTIVE: Break bond based on rule-specific threshold
        if (strain > breakingThreshold) {
          structure.integrity -= integrityLossRate
          structure.breakingAge++
          
          // Determine which phase we're in based on accumulated duration
          let accumulatedDuration = 0
          let currentPhase = breakingSequence[0]
          for (let i = 0; i < breakingSequence.length; i++) {
            accumulatedDuration += breakingSequence[i].duration
            if (structure.breakingAge <= accumulatedDuration) {
              currentPhase = breakingSequence[i]
              structure.breakingPhase = i
              break
            }
          }
          
          // EXECUTE AI'S PHYSICS DIRECTLY - no interpretation needed!
          const physics = currentPhase.physics
          
          // Calculate center for positional effects
          const centerX = structure.particles.reduce((sum, p) => sum + p.x, 0) / structure.particles.length
          const centerY = structure.particles.reduce((sum, p) => sum + p.y, 0) / structure.particles.length
          
          // STRUCTURE-WIDE MOVEMENT (AI decides if structure moves as one piece)
          // REMOVED FROM HERE - moved to before bond loop to apply once per structure
          
          // Energy boost from AI
          pA.energy = Math.min(pA.energy + physics.energyGlow, 2.5)
          pB.energy = Math.min(pB.energy + physics.energyGlow, 2.5)
          
          // Accelerate decay if AI wants it
          if (physics.decayRate > 0) {
            pA.decayRate *= (1 - physics.decayRate)
            pB.decayRate *= (1 - physics.decayRate)
          }
          
          // 1. Directional velocity (AI's exact values for individual particles)
          const turbulenceX = (Math.random() - 0.5) * physics.turbulence * 2
          const turbulenceY = (Math.random() - 0.5) * physics.turbulence * 2
          pA.vx += physics.velocityX + turbulenceX
          pA.vy += physics.velocityY + turbulenceY
          pB.vx += physics.velocityX + turbulenceX
          pB.vy += physics.velocityY + turbulenceY
          
          // 2. Rotational force (AI's exact spin speed)
          if (physics.rotationSpeed !== 0) {
            const angleA = Math.atan2(pA.y - centerY, pA.x - centerX)
            const angleB = Math.atan2(pB.y - centerY, pB.x - centerX)
            pA.vx += Math.cos(angleA + Math.PI / 2) * physics.rotationSpeed
            pA.vy += Math.sin(angleA + Math.PI / 2) * physics.rotationSpeed
            pB.vx += Math.cos(angleB + Math.PI / 2) * physics.rotationSpeed
            pB.vy += Math.sin(angleB + Math.PI / 2) * physics.rotationSpeed
          }
          
          // 3. Separation force (AI's exact explosion strength)
          if (physics.separationForce > 0) {
            const separationAngle = Math.atan2(dy, dx)
            pA.vx -= Math.cos(separationAngle) * physics.separationForce
            pA.vy -= Math.sin(separationAngle) * physics.separationForce
            pB.vx += Math.cos(separationAngle) * physics.separationForce
            pB.vy += Math.sin(separationAngle) * physics.separationForce
          }
          
          // 4. Magnetic force (AI's exact implosion/explosion)
          if (physics.magneticForce !== 0) {
            const toCenterDx = centerX - pA.x
            const toCenterDy = centerY - pA.y
            pA.vx += toCenterDx * physics.magneticForce * 0.01
            pA.vy += toCenterDy * physics.magneticForce * 0.01
            pB.vx += (centerX - pB.x) * physics.magneticForce * 0.01
            pB.vy += (centerY - pB.y) * physics.magneticForce * 0.01
          }
          
          continue
        }
        
        // Apply spring force (already using bond.stiffness from adaptive creation)
        const force = (distance - bond.restLength) * bond.stiffness
        const fx = (dx / distance) * force
        const fy = (dy / distance) * force
        
        pA.vx += fx / pA.mass
        pA.vy += fy / pA.mass
        pB.vx -= fx / pB.mass
        pB.vy -= fy / pB.mass
      }
    }
    
    // EXTREME survival threshold variation (0.0 to 0.5)
    // Repulsive = dies immediately
    // Attractive = survives at near-zero integrity
    const minIntegrity = avgForceMultiplier > 0 
      ? 0.5 - avgForceMultiplier * 0.5  // Attractive: 0.0-0.5
      : 0.4  // Repulsive: instant death
    
    // Remove broken structures
    this.structures = this.structures.filter(s => s.integrity > minIntegrity)
  }

  update() {
    this.frameCount++
    this.entropy = Math.min(this.entropy + 0.0005, 1)

    this.applyForces()
    this.updateStructures()
    this.updateParticles()
    this.applyMutations()
    
    // Rare surprise events (5% chance per second = ~0.08% per frame at 60fps)
    if (Math.random() < 0.0008 && this.frameCount - this.lastSurpriseEvent > 300) {
      this.triggerSurpriseEvent()
      this.lastSurpriseEvent = this.frameCount
    }
    
    // Update ghost traces alpha
    this.ghostTraces = this.ghostTraces
      .map(g => ({ ...g, alpha: g.alpha * 0.99 }))
      .filter(g => g.alpha > 0.01)
  }
  // Public method to manually trigger a surprise event
  forceSurpriseEvent() {
    console.log('🎯 Force Surprise Event called!')
    if (!this.ctx) {
      console.warn('⚠️ No canvas context!')
      return
    }
    
    // Create a random shape at a random position
    const shapes = ['square', 'circle', 'triangle', 'pentagon', 'hexagon', 'star']
    const shape = shapes[Math.floor(Math.random() * shapes.length)]
    
    const x = Math.random() * (this.width - 200) + 100
    const y = Math.random() * (this.height - 200) + 100
    const size = 80 + Math.random() * 60
    
    // Create particles for the shape
    const shapeParticles: Particle[] = []
    const colors = this.rules.flatMap(r => r.colors)
    const color = colors[Math.floor(Math.random() * colors.length)] || '#ff00ff'
    
    let points: Array<{x: number, y: number}> = []
    
    switch(shape) {
      case 'square':
        for (let i = 0; i < 20; i++) {
          for (let j = 0; j < 20; j++) {
            points.push({ x: x + (i / 20) * size, y: y + (j / 20) * size })
          }
        }
        break
      case 'circle':
        for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
          for (let r = 0; r < size / 2; r += 3) {
            points.push({
              x: x + Math.cos(angle) * r,
              y: y + Math.sin(angle) * r
            })
          }
        }
        break
      case 'triangle':
        for (let i = 0; i < 400; i++) {
          const px = Math.random()
          const py = Math.random()
          if (px + py < 1) {
            points.push({
              x: x + px * size,
              y: y + py * size
            })
          }
        }
        break
      case 'pentagon':
      case 'hexagon':
      case 'star':
        const sides = shape === 'pentagon' ? 5 : shape === 'hexagon' ? 6 : 5
        const angleStep = (Math.PI * 2) / sides
        for (let angle = 0; angle < Math.PI * 2; angle += 0.08) {
          for (let r = 0; r < size / 2; r += 3) {
            const factor = shape === 'star' && Math.floor(angle / angleStep) % 2 === 1 ? 0.5 : 1
            points.push({
              x: x + Math.cos(angle) * r * factor,
              y: y + Math.sin(angle) * r * factor
            })
          }
        }
        break
    }
    
    // Create particles from points
    points.forEach(point => {
      shapeParticles.push({
        x: point.x,
        y: point.y,
        vx: 0,
        vy: 0,
        ax: 0,
        ay: 0,
        mass: 1,
        radius: 2,
        color: color,
        age: 0,
        decayRate: 0.01,
        energy: 1
      })
    })
    
    // Add particles to the canvas
    this.particles.push(...shapeParticles)
    
    // Create a structure that will immediately break
    const bonds: Array<{a: number, b: number, restLength: number, stiffness: number}> = []
    const startIdx = this.particles.length - shapeParticles.length
    for (let i = 0; i < shapeParticles.length - 1; i++) {
      const pA = shapeParticles[i]
      const pB = shapeParticles[i + 1]
      const dist = Math.hypot(pB.x - pA.x, pB.y - pA.y)
      bonds.push({ a: i, b: i + 1, restLength: dist, stiffness: 0.5 })
    }
    
    const structure: ParticleStructure = {
      particles: shapeParticles,
      bonds: bonds,
      color: color,
      integrity: 1.0,
      breakingPhase: 0,
      breakingAge: 0
    }
    
    this.structures.push(structure)
    
    // Trigger immediate breaking with explosion
    setTimeout(() => {
      shapeParticles.forEach(p => {
        const angle = Math.random() * Math.PI * 2
        const speed = 5 + Math.random() * 10
        p.vx = Math.cos(angle) * speed
        p.vy = Math.sin(angle) * speed
        p.energy = 2
      })
      structure.integrity = 0
    }, 100)
    
    console.log(`✅ Spawned ${shape} with ${shapeParticles.length} particles at (${Math.floor(x)}, ${Math.floor(y)})`)
    this.lastSurpriseEvent = this.frameCount
  }
  
  
  private triggerSurpriseEvent() {
    const events = [
      () => {
        // SUPERNOVA: Random particle explodes, pushing others away
        if (this.particles.length === 0) return
        const star = this.particles[Math.floor(Math.random() * this.particles.length)]
        this.particles.forEach(p => {
          const dx = p.x - star.x
          const dy = p.y - star.y
          const dist = Math.hypot(dx, dy)
          if (dist < 200 && dist > 0) {
            const force = 50 / dist
            p.vx += (dx / dist) * force
            p.vy += (dy / dist) * force
          }
        })
        console.log('💥 SURPRISE EVENT: Supernova!')
      },
      () => {
        // QUANTUM TUNNELING: Random particles teleport
        const count = Math.min(10, Math.floor(this.particles.length * 0.1))
        for (let i = 0; i < count; i++) {
          const p = this.particles[Math.floor(Math.random() * this.particles.length)]
          if (p) {
            p.x = Math.random() * this.width
            p.y = Math.random() * this.height
          }
        }
        console.log('🌀 SURPRISE EVENT: Quantum Tunneling!')
      },
      () => {
        // GRAVITY INVERSION: Flip all velocities
        this.particles.forEach(p => {
          p.vx *= -1.5
          p.vy *= -1.5
        })
        console.log('🔄 SURPRISE EVENT: Gravity Inversion!')
      },
      () => {
        // COLOR SHIFT: All particles change color randomly
        const colors = this.rules.flatMap(r => r.colors)
        if (colors.length > 0) {
          this.particles.forEach(p => {
            p.color = colors[Math.floor(Math.random() * colors.length)]
          })
        }
        console.log('🎨 SURPRISE EVENT: Color Shift!')
      }
    ]
    
    const event = events[Math.floor(Math.random() * events.length)]
    event()
  }

  render() {
    if (!this.ctx || !this.canvas) return

    // Clear with fade trail effect for motion blur
    this.ctx.fillStyle = 'rgba(10, 14, 39, 0.15)'
    this.ctx.fillRect(0, 0, this.width, this.height)
    
    // Render ghost traces (memory from previous evolutions)
    this.ghostTraces.forEach(ghost => {
      this.ctx!.fillStyle = `${ghost.color}${Math.floor(ghost.alpha * 255).toString(16).padStart(2, '0')}`
      this.ctx!.fillRect(ghost.x - 0.5, ghost.y - 0.5, 1, 1)
    })

    // Draw structure bonds
    for (const structure of this.structures) {
      this.ctx.strokeStyle = `${structure.color}${Math.floor(structure.integrity * 100).toString(16).padStart(2, '0')}`
      this.ctx.lineWidth = 2
      this.ctx.lineCap = 'round'
      
      for (const bond of structure.bonds) {
        const pA = structure.particles[bond.a]
        const pB = structure.particles[bond.b]
        
        if (!pA || !pB) continue
        
        this.ctx.beginPath()
        this.ctx.moveTo(pA.x, pA.y)
        this.ctx.lineTo(pB.x, pB.y)
        this.ctx.stroke()
      }
    }

    // Draw particles with glowing effects
    for (const p of this.particles) {
      // Skip particles without valid color
      if (!p.color || typeof p.color !== 'string' || !p.color.startsWith('#')) {
        p.color = '#06b6d4' // Fallback color
      }
      
      const opacity = p.energy * 0.8
      const radius = p.radius * p.energy

      // Glow effect
      const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * 3)
      gradient.addColorStop(0, `${p.color}${Math.floor(opacity * 100).toString(16).padStart(2, '0')}`)
      gradient.addColorStop(0.6, `${p.color}${Math.floor(opacity * 50).toString(16).padStart(2, '0')}`)
      gradient.addColorStop(1, `${p.color}00`)

      this.ctx.fillStyle = gradient
      this.ctx.beginPath()
      this.ctx.arc(p.x, p.y, radius * 3, 0, Math.PI * 2)
      this.ctx.fill()

      // Core particle
      this.ctx.fillStyle = `${p.color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`
      this.ctx.beginPath()
      this.ctx.arc(p.x, p.y, radius, 0, Math.PI * 2)
      this.ctx.fill()
    }

    // Draw entropy indicator at bottom
    const entropyColor = `hsl(${this.entropy * 60}, 100%, 50%)`
    this.ctx.fillStyle = entropyColor
    this.ctx.globalAlpha = 0.3
    this.ctx.fillRect(0, this.height - 4, this.width * Math.min(this.entropy, 1), 4)
    this.ctx.globalAlpha = 1
  }

  getState() {
    return {
      frameCount: this.frameCount,
      entropy: this.entropy,
      particleCount: this.particles.length,
      averageEnergy: this.particles.reduce((sum, p) => sum + p.energy, 0) / this.particles.length,
    }
  }
  
  // Save current particles as ghost traces before evolution
  captureGhostTraces() {
    // Sample every 3rd particle to avoid overwhelming the array
    this.particles.forEach((p, i) => {
      if (i % 3 === 0) {
        this.ghostTraces.push({
          x: p.x,
          y: p.y,
          color: p.color,
          alpha: 0.3
        })
      }
    })
    // Limit ghost traces to 5000 points
    if (this.ghostTraces.length > 5000) {
      this.ghostTraces = this.ghostTraces.slice(-5000)
    }
  }

  clearCanvas() {
    // Clear all particles and structures
    this.particles = []
    this.structures = []
    this.frameCount = 0
    // Keep entropy (system memory)
    // Keep ghost traces (memory across resets!)
    
    // Clear visual canvas
    if (this.ctx) {
      this.ctx.fillStyle = '#0a0e27'
      this.ctx.fillRect(0, 0, this.width, this.height)
    }
  }
}
