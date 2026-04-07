<template>
  <div class="flex flex-col items-center p-5 font-mono">
    <div class="grid grid-cols-16 grid-rows-16 gap-0 border-4 border-black mb-5" style="grid-template-columns: repeat(16, 25px); grid-template-rows: repeat(16, 25px);">
      <div
        v-for="(tile, index) in tilesData"
        :key="index"
        class="w-6 h-6 flex items-center justify-center text-xs font-bold relative"
        :class="{
          'bg-gray-800 border-2 border-black text-white': tile.isBloat,
          'bg-black border-2 border-gray-600': tile.isPillar,
          'bg-gray-100 border-2 border-gray-600': tile.isFloor
        }"
      >
        <div v-if="tile.isBloat && isCenterTile(tile)" class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white font-bold text-xs drop-shadow-lg">
          <div class="text-xl font-bold text-white drop-shadow-lg">
            {{ getDirectionSymbol() }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  direction: {
    type: String,
    default: 'right'
  }
})

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

/* Additional custom styles if needed */
</style>
