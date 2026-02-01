export interface DrawingState {
  isDrawing: boolean
  brushSize: number
  brushColor: string
  opacity: number
}

export interface Point {
  x: number
  y: number
}

export function drawBrush(
  ctx: CanvasRenderingContext2D,
  point: Point,
  state: DrawingState
) {
  ctx.fillStyle = state.brushColor
  ctx.globalAlpha = state.opacity
  ctx.beginPath()
  ctx.arc(point.x, point.y, state.brushSize, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1
}

export function drawLine(
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  state: DrawingState
) {
  ctx.strokeStyle = state.brushColor
  ctx.globalAlpha = state.opacity
  ctx.lineWidth = state.brushSize * 2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.lineTo(to.x, to.y)
  ctx.stroke()
  ctx.globalAlpha = 1
}

export function drawGlowingBrush(
  ctx: CanvasRenderingContext2D,
  point: Point,
  state: DrawingState
) {
  // Draw outer glow
  const gradient = ctx.createRadialGradient(
    point.x,
    point.y,
    0,
    point.x,
    point.y,
    state.brushSize * 3
  )
  gradient.addColorStop(0, hexToRgba(state.brushColor, state.opacity * 0.8))
  gradient.addColorStop(1, hexToRgba(state.brushColor, 0))

  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(
    point.x,
    point.y,
    state.brushSize * 3,
    0,
    Math.PI * 2
  )
  ctx.fill()

  // Draw core
  ctx.fillStyle = state.brushColor
  ctx.globalAlpha = state.opacity
  ctx.beginPath()
  ctx.arc(point.x, point.y, state.brushSize, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1
}

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function smoothPath(points: Point[]): Point[] {
  if (points.length < 3) return points

  const smooth: Point[] = []
  for (let i = 0; i < points.length - 2; i++) {
    const p0 = points[i]
    const p1 = points[i + 1]
    const p2 = points[i + 2]

    // Catmull-Rom curve
    for (let t = 0; t < 1; t += 0.2) {
      const t2 = t * t
      const t3 = t2 * t
      const q =
        0.5 *
        (2 * p1.x +
          (-p0.x + p2.x) * t +
          (2 * p0.x - 5 * p1.x + 4 * p2.x) * t2 +
          (-p0.x + 3 * p1.x - 3 * p2.x + p2.x) * t3)
      const r =
        0.5 *
        (2 * p1.y +
          (-p0.y + p2.y) * t +
          (2 * p0.y - 5 * p1.y + 4 * p2.y) * t2 +
          (-p0.y + 3 * p1.y - 3 * p2.y + p2.y) * t3)

      smooth.push({ x: q, y: r })
    }
  }

  return smooth
}
