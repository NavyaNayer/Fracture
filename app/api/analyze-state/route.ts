'use server'

import OpenAI from 'openai'

export async function POST(req: Request) {
  try {
    const { frameCount, entropy, particleCount, averageEnergy, iteration, lastRuleTheme } =
      await req.json()

    const prompt = `You are analyzing the current state of a generative AI art system. Provide a brief, poetic observation of what's happening in this canvas.

System State:
- Frame: ${frameCount}
- Entropy Level: ${(entropy * 100).toFixed(1)}%
- Active Particles: ${particleCount}
- Average Energy: ${(averageEnergy * 100).toFixed(0)}%
- Iteration: ${iteration}
- Last Theme: ${lastRuleTheme}

Describe in 1-2 sentences:
1. What visual phenomenon is currently dominating the canvas?
2. How would you characterize the overall mood or aesthetic emerging from these patterns?
3. What natural or conceptual process does this most resemble?

Be poetic, brief, and insightful. Focus on emergence and beauty.`

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an artist and philosopher observing emergent systems. Provide brief, evocative observations that capture the essence of what you see. Keep responses to 2-3 sentences maximum.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
    })

    const observation = completion.choices[0].message.content || 'The canvas continues to evolve...'

    return Response.json({
      observation,
      metadata: {
        frameCount,
        entropy,
        particleCount,
        averageEnergy,
        iteration,
      },
    })
  } catch (error) {
    console.error('[v0] State analysis error:', error)
    return Response.json(
      {
        error: 'Failed to analyze state',
        observation: 'The canvas continues to evolve...',
      },
      { status: 500 }
    )
  }
}
