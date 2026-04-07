<template>
  <div class="flex flex-col items-center p-5 font-mono">
    <div class="grid grid-cols-16 grid-rows-16 gap-0 border-4 border-black mb-5" style="grid-template-columns: repeat(16, 25px); grid-template-rows: repeat(16, 25px);">
      <div
        v-for="(tile, index) in tilesData"
        :key="index"
        class="w-[25px] h-[25px] flex items-center justify-center text-xs font-bold relative"
        :class="{
          'bg-gray-800 text-white border-0': tile.isBloat,
          'bg-black border border-black': tile.isPillar,
          'bg-gray-100 border border-black': tile.isFloor
        }"
      >
        <div v-if="tile.isBloat && isCenterTile(tile)" class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white font-bold text-xs drop-shadow-lg">
          <div class="text-xl font-bold text-white drop-shadow-lg">
            {{ getDirectionSymbol() }}
          </div>
        </div>
      </div>
    </div>

    <div class="w-full max-w-md">
      <label class="flex flex-col gap-2">
        <span class="text-sm font-medium text-center">Speed ({{ msPerTick }}ms per tick)</span>
        <input
          type="range"
          :value="msPerTick"
          @input="emit('update:msPerTick', parseInt($event.target.value))"
          min="0"
          max="600"
          step="50"
          :disabled="isRunning"
          class="w-full h-2 bg-gradient-to-r from-green-400 via-yellow-400 to-red-400 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed slider"
        />
        <div class="flex justify-between text-xs text-gray-600">
          <span>0ms (Instant)</span>
          <span>600ms (Slow)</span>
        </div>
      </label>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  direction: {
    type: String,
    default: 'right'
  },
  msPerTick: {
    type: Number,
    default: 600
  },
  isRunning: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:msPerTick'])

const tilesData = ref([])

// Check if tile is the center of the 5x5 bloat area
const isCenterTile = (tile) => {
  // Find all bloat tiles
  const bloatTiles = tilesData.value.filter(t => t.isBloat)
  if (bloatTiles.length === 0) return false

  // Get bloat position (top-left corner)
  const bloatPos = { x: bloatTiles[0].x, y: bloatTiles[0].y }

  // Center of 5x5 area is at (x+2, y+2)
  const centerX = bloatPos.x + 2
  const centerY = bloatPos.y + 2

  return tile.x === centerX && tile.y === centerY
}

// Get arrow character for direction
const getDirectionSymbol = () => {
  switch (props.direction) {
    case 'right': return '>'
    case 'down': return 'v'
    case 'left': return '<'
    case 'up': return '^'
    default: return '>'
  }
}

// Initialize with empty grid
const initializeEmptyGrid = () => {
  const GRID_SIZE = 16
  const PILLAR_SIZE = 6
  const newTiles = []

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const tile = {
        x,
        y,
        isBloat: false,
        isPillar: false,
        isFloor: false
      }

      // Center pillar (6x6)
      const pillarStart = Math.floor((GRID_SIZE - PILLAR_SIZE) / 2)
      const pillarEnd = pillarStart + PILLAR_SIZE - 1

      if (x >= pillarStart && x <= pillarEnd && y >= pillarStart && y <= pillarEnd) {
        tile.isPillar = true
      } else {
        tile.isFloor = true
      }

      newTiles.push(tile)
    }
  }

  tilesData.value = newTiles
  console.log('Initialized grid with', newTiles.length, 'tiles')
}

// Method to update tiles
function updateTiles(newTiles) {
  if (newTiles && Array.isArray(newTiles)) {
    tilesData.value = [...newTiles]
  }
}

// Expose method to parent
defineExpose({
  updateTiles
})

onMounted(() => {
  initializeEmptyGrid()
})
</script>

<style scoped>
/* Custom styles for grid sizing that can't be handled by Tailwind */
.grid {
  grid-template-columns: repeat(16, 25px);
  grid-template-rows: repeat(16, 25px);
}

/* Custom slider styling */
.slider::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  border: 3px solid #3b82f6;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  border: 3px solid #3b82f6;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

.slider::-moz-range-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.slider:disabled::-webkit-slider-thumb {
  background: #9ca3af;
  border-color: #6b7280;
  cursor: not-allowed;
  transform: scale(1);
}

.slider:disabled::-moz-range-thumb {
  background: #9ca3af;
  border-color: #6b7280;
  cursor: not-allowed;
  transform: scale(1);
}
</style>
