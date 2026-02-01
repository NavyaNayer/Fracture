'use client'

import { useState } from 'react'

interface BrushColorPickerProps {
  currentColor: string
  onColorChange: (color: string) => void
  isDrawMode: boolean
}

const PRESET_COLORS = [
  '#06b6d4', // cyan
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f97316', // orange
  '#10b981', // green
  '#fbbf24', // amber
  '#3b82f6', // blue
  '#ef4444', // red
]

export function BrushColorPicker({
  currentColor,
  onColorChange,
  isDrawMode,
}: BrushColorPickerProps) {
  const [showCustom, setShowCustom] = useState(false)

  if (!isDrawMode) return null

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-400">Brush Color:</span>
      
      {/* Preset colors */}
      <div className="flex gap-2">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => {
              onColorChange(color)
              setShowCustom(false)
            }}
            className={`w-6 h-6 rounded border-2 transition-transform hover:scale-110 ${
              currentColor === color
                ? 'border-white scale-110'
                : 'border-slate-700'
            }`}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>

      {/* Custom color input */}
      <div className="relative">
        <button
          onClick={() => setShowCustom(!showCustom)}
          className="px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-slate-300"
        >
          Custom
        </button>
        {showCustom && (
          <div className="absolute top-full mt-2 left-0 z-50">
            <input
              type="color"
              value={currentColor}
              onChange={(e) => onColorChange(e.target.value)}
              className="w-12 h-12 cursor-pointer rounded"
            />
          </div>
        )}
      </div>
    </div>
  )
}
