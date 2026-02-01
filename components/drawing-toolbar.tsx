'use client'

import { DrawingState } from './drawing-utils'
import { Button } from '@/components/ui/button'

interface DrawingToolbarProps {
  drawingState: DrawingState
  onDrawingStateChange: (state: Partial<DrawingState>) => void
  isDrawMode: boolean
  onToggleDrawMode: () => void
  onClearCanvas: () => void
}

const BRUSH_COLORS = [
  '#06b6d4', // cyan
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f97316', // orange
  '#10b981', // green
  '#fbbf24', // amber
  '#3b82f6', // blue
  '#ef4444', // red
]

export function DrawingToolbar({
  drawingState,
  onDrawingStateChange,
  isDrawMode,
  onToggleDrawMode,
  onClearCanvas,
}: DrawingToolbarProps) {
  return (
    <div className="flex items-center gap-4 bg-slate-900/60 border border-slate-800 rounded-lg p-3 backdrop-blur">
      {/* Draw Mode Toggle */}
      <Button
        onClick={onToggleDrawMode}
        className={`${
          isDrawMode
            ? 'bg-cyan-600 hover:bg-cyan-700'
            : 'bg-slate-700 hover:bg-slate-600'
        } text-white text-sm`}
      >
        {isDrawMode ? '✏️ Drawing' : '👁️ Viewing'}
      </Button>

      {/* Brush Size Slider */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-slate-400 whitespace-nowrap">Size:</label>
        <input
          type="range"
          min="2"
          max="50"
          value={drawingState.brushSize}
          onChange={(e) =>
            onDrawingStateChange({ brushSize: Number(e.target.value) })
          }
          className="w-24 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
        />
        <span className="text-xs text-slate-400 w-6 text-right">
          {drawingState.brushSize}
        </span>
      </div>

      {/* Opacity Slider */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-slate-400 whitespace-nowrap">Opacity:</label>
        <input
          type="range"
          min="0.2"
          max="1"
          step="0.1"
          value={drawingState.opacity}
          onChange={(e) =>
            onDrawingStateChange({ opacity: Number(e.target.value) })
          }
          className="w-20 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
        />
        <span className="text-xs text-slate-400 w-6 text-right">
          {Math.round(drawingState.opacity * 100)}%
        </span>
      </div>

      {/* Color Picker */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-slate-400">Color:</label>
        <div className="flex gap-1">
          {BRUSH_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => onDrawingStateChange({ brushColor: color })}
              className={`w-6 h-6 rounded border-2 transition-all ${
                drawingState.brushColor === color
                  ? 'border-white scale-110'
                  : 'border-slate-700 hover:border-slate-500'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Custom Color Input */}
      <input
        type="color"
        value={drawingState.brushColor}
        onChange={(e) => onDrawingStateChange({ brushColor: e.target.value })}
        className="w-8 h-8 rounded cursor-pointer"
        title="Custom color"
      />

      {/* Clear Button */}
      <Button
        onClick={onClearCanvas}
        className="bg-red-900 hover:bg-red-800 text-white text-sm ml-auto"
      >
        Clear Canvas
      </Button>
    </div>
  )
}
