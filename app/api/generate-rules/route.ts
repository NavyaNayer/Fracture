'use server'

import OpenAI from 'openai'
import { z } from 'zod'

const RuleSchema = z.object({
  rules: z.array(
    z.object({
      name: z.string().describe('Name of the interaction rule'),
      description: z.string().describe('How this rule governs particle behavior'),
      forceMultiplier: z.number().describe('Strength of the force (-1.0 to 1.0)'),
      rangeMultiplier: z.number().describe('How far the force reaches (0.1 to 2.0)'),
      colors: z.array(z.string()).describe('Array of 2-3 hex colors for this rule'),
    })
  ),
  shapeMutations: z.array(
    z.object({
      type: z.string().describe('Transformation type: "spiral", "wave", "vortex", "cascade", "bloom"'),
      intensity: z.number().describe('Effect strength (0.1 to 1.0)'),
      duration: z.number().describe('How long before mutation (in frames, 60-300)'),
    })
  ),
  emergenceTheme: z.string().describe('Overall aesthetic direction for this canvas generation'),
})

export async function POST(req: Request) {
  try {
    const { 
      iteration = 0, 
      breakingStats = null,
      currentEntropy = 0,
      currentParticleCount = 0,
      currentEnergy = 0
    } = await req.json()
    
    // Random variation instead of predictable alternation
    const forceRandom = Math.random()
    const forceStyle = forceRandom > 0.66 ? 'explosive' : forceRandom > 0.33 ? 'magnetic' : 'chaotic'
    
    const forceGuidance = forceStyle === 'explosive'
      ? 'EXPLOSIVE: forceMultiplier -0.8 to -1.0, structures SHATTER instantly like glass'
      : forceStyle === 'magnetic'
      ? 'MAGNETIC: forceMultiplier 0.7 to 1.0, structures CLING together like magnets'
      : 'CHAOTIC: forceMultiplier -0.3 to 0.3, structures break UNPREDICTABLY'
    
    const motionStyle = ['slow drift', 'violent spin', 'falling', 'floating upward', 'sideways slide', 'spiral collapse'][Math.floor(Math.random() * 6)]
    const breakPattern = ['instant explosion', 'gradual dissolution', 'wave propagation', 'center implosion', 'random scatter', 'chain reaction'][Math.floor(Math.random() * 6)]
    
    const physicsGuidance = `Create ${2 + Math.floor(Math.random() * 3)} phases showing: ${motionStyle} → ${breakPattern}. Make it WILDLY different from typical patterns.`

    // Build feedback context if stats available
    const feedbackContext = breakingStats ? `

🔄 SYSTEM FEEDBACK (Adaptive Rules):
- ${breakingStats.totalParticlesBroken} particles have broken since last evolution
- ${breakingStats.structuresBroken} structures collapsed
- Current entropy: ${(currentEntropy * 100).toFixed(1)}%
- Particle count: ${currentParticleCount}
- System energy: ${(currentEnergy * 100).toFixed(1)}%

${currentEntropy > 0.7 ? '⚠️ HIGH ENTROPY - System highly chaotic, consider stabilizing' : ''}
${currentEntropy < 0.3 ? '⚠️ LOW ENTROPY - System too stable, consider adding chaos' : ''}
${currentParticleCount < 30 ? '⚠️ LOW PARTICLES - Structures breaking too easily, increase resistance' : ''}
${currentParticleCount > 150 ? '⚠️ HIGH PARTICLES - Structures too resilient, increase fragility' : ''}

Adapt your rules based on this feedback. The system should self-regulate toward the edge of chaos.` : ''

    const timestamp = Date.now()
    const randomSeed = Math.floor(Math.random() * 1000000)
    
    const styles = ['explode', 'dissolve', 'float', 'shatter', 'implode', 'drift', 'spin', 'reform']
    const pickedStyle = styles[Math.floor(Math.random() * styles.length)]
    
    const prompt = `Generate physics rules for drawable particle structures. Seed: ${randomSeed}. Style: ${pickedStyle}.${feedbackContext}

${forceGuidance}

Create 3 rules with 2-3 breaking phases each.

IMPORTANT: Keep response under 1000 tokens. Use concise descriptions.

JSON structure (REQUIRED):
{
  "rules": [
    {
      "name": "Rule Name",
      "description": "Brief description",
      "forceMultiplier": -1.0 to 1.0,
      "rangeMultiplier": 0.1 to 2.0,
      "breakingSequence": [
        {
          "duration": 5-30,
          "physics": {
            "structureVelocityX": -6 to 6,
            "structureVelocityY": -6 to 6,
            "structureRotation": -2 to 2,
            "velocityX": -8 to 8,
            "velocityY": -8 to 8,
            "rotationSpeed": -5 to 5,
            "separationForce": 0 to 12,
            "magneticForce": -8 to 8,
            "turbulence": 0 to 3,
            "energyGlow": 0 to 2,
            "decayRate": 0 to 0.3
          },
          "description": "Phase name"
        }
      ],
      "colors": ["#hex1", "#hex2"]
    }
  ],
  "shapeMutations": [{"type": "vortex", "intensity": 0.5, "duration": 150}],
  "emergenceTheme": "Brief theme"
}`

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Generate unique physics rules for particle systems. Keep responses concise and valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 1,
      max_tokens: 2000
    })

    const result = completion.choices[0].message.content
    if (!result) {
      throw new Error('No response from OpenAI')
    }

    let parsedRules
    try {
      parsedRules = JSON.parse(result)
    } catch (parseError) {
      console.error('[API] JSON Parse Error:', parseError)
      console.error('[API] Raw response:', result?.substring(0, 200))
      // Return fallback rules with randomness
      return Response.json({
        rules: [{
          name: 'Chaotic Energy',
          description: 'Explosive particle dynamics',
          forceMultiplier: -0.7 + Math.random() * 0.4,
          rangeMultiplier: 0.6 + Math.random() * 0.6,
          breakingSequence: [{
            duration: 8 + Math.floor(Math.random() * 6),
            physics: {
              structureVelocityX: 0,
              structureVelocityY: 0,
              structureRotation: 0,
              velocityX: (Math.random() - 0.5) * 8,
              velocityY: (Math.random() - 0.5) * 8,
              rotationSpeed: (Math.random() - 0.5) * 4,
              separationForce: 6 + Math.random() * 4,
              magneticForce: 0,
              turbulence: Math.random() * 2,
              energyGlow: 1 + Math.random(),
              decayRate: 0.05 + Math.random() * 0.1
            },
            description: 'Explosive scatter'
          }],
          colors: ['#06b6d4', '#ec4899']
        }],
        shapeMutations: [{type: 'vortex', intensity: 0.7, duration: 150}],
        emergenceTheme: 'Chaotic breakdown and reformation'
      })
    }
    
    return Response.json(parsedRules)
  } catch (error) {
    console.error('[v0] Rule generation error:', error)
    return Response.json({ error: 'Failed to generate rules from AI' }, { status: 500 })
  }
}
