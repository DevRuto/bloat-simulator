<template>
  <div class="bloat-room">
    <div class="grid-container">
      <div
        v-for="(tile, index) in tilesData"
        :key="index"
        class="tile"
        :class="{
          'bloat': tile.isBloat,
          'pillar': tile.isPillar,
          'floor': tile.isFloor
        }"
      >
        <div v-if="tile.isBloat && isCenterTile(tile)" class="bloat-entity">
          <div class="direction-indicator">
            {{ getDirectionSymbol() }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, defineProps } from 'vue'

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
.bloat-room {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  font-family: 'Courier New', monospace;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(16, 25px);
  grid-template-rows: repeat(16, 25px);
  gap: 2px;
  /* background-color: #222; */
  border: 3px solid #000;
  margin-bottom: 20px;
}

.tile {
  width: 25px;
  height: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 7px;
  font-weight: bold;
  position: relative;
}

.tile.floor {
  background-color: #f0f0f0;
  border: 2px solid #888;
}

.tile.pillar {
  background-color: #000000;
  border: 2px solid #444;
}

.tile.bloat {
  background-color: #333333;
  border: 2px solid #000000;
  color: white;
}

.bloat-entity {
  font-size: 7px;
  font-weight: bold;
  color: white;
  text-shadow: 1px 1px 2px black;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.direction-indicator {
  font-size: 20px;
  font-weight: bold;
  color: white;
  text-shadow: 2px 2px 4px black;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.direction-indicator.rotate-down {
  transform: translate(-50%, -50%) rotate(90deg);
}

.direction-indicator.rotate-left {
  transform: translate(-50%, -50%) rotate(180deg);
}

.direction-indicator.rotate-up {
  transform: translate(-50%, -50%) rotate(-90deg);
}
</style>
