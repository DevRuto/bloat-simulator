<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import BloatRoom from './components/BloatRoom.vue'
import { BloatSimulation } from './composables/useBloatSimulation.js'

const simulation = new BloatSimulation()
const tiles = ref(simulation.getTiles())
const isRunning = ref(false)
const tickInterval = ref(null)
const updateInterval = ref(null)

const debugInfo = ref({
  bloatPosition: { x: 0, y: 0 },
  isRunning: false,
  validPositions: 0,
  currentTick: 0,
  isWalking: true,
  isRunningState: false,
  turnCooldown: 0,
  canFall: false,
  direction: 'right'
})

const bloatRoomRef = ref(null)

// Animation controls
const startSimulation = () => {
  if (!isRunning.value) {
    isRunning.value = true
    // Process ticks every 600ms (0.6 seconds per tick)
    tickInterval.value = setInterval(() => {
      const result = simulation.processTick()
      if (result.shouldReset) {
        // resetSimulation()
        pauseSimulation()
      }
    }, 600)
  }
}

const pauseSimulation = () => {
  isRunning.value = false
  if (tickInterval.value) {
    clearInterval(tickInterval.value)
    tickInterval.value = null
  }
}

const resetSimulation = () => {
  pauseSimulation()
  simulation.resetState()
  updateTiles()
}

// Update tiles when simulation changes
const updateTiles = () => {
  const newTiles = simulation.getTiles()
  const simState = simulation.getSimulationState()

  // Force reactivity by creating new arrays
  tiles.value = [...newTiles]

  debugInfo.value = {
    bloatPosition: { ...simulation.bloatPosition },
    isRunning: isRunning.value,
    currentTick: simState.currentTick,
    isWalking: simState.isWalking,
    isRunningState: simState.isRunningState,
    turnCooldown: simState.turnCooldown,
    canFall: simState.canFall,
    direction: simState.direction
  }

  // Update BloatRoom component
  if (bloatRoomRef.value) {
    bloatRoomRef.value.updateTiles(newTiles)
  }
}

// Set up interval to update tiles during animation
const startWithUpdates = () => {
  startSimulation()
  updateInterval.value = setInterval(updateTiles, 100)
}

const pauseWithUpdates = () => {
  pauseSimulation()
  if (updateInterval.value) {
    clearInterval(updateInterval.value)
    updateInterval.value = null
  }
}

onMounted(() => {
  updateTiles() // Initial update
})

onUnmounted(() => {
  pauseWithUpdates()
})
</script>

<template>
  <div class="app">
    <div class="main-content">
      <BloatRoom ref="bloatRoomRef" />
      <div class="controls">
        <button @click="startWithUpdates">Start</button>
        <button @click="pauseWithUpdates">Pause</button>
        <button @click="resetSimulation">Reset</button>
      </div>
    </div>

    <div class="debug-box">
      <h3>Debug Info</h3>
      <div class="debug-item">
        <strong>Bloat Position:</strong> ({{ debugInfo.bloatPosition.x }}, {{ debugInfo.bloatPosition.y }})
      </div>
      <div class="debug-item">
        <strong>Status:</strong> {{ debugInfo.isRunning ? 'Running' : 'Paused' }}
      </div>
      <div class="debug-item">
        <strong>Current Tick:</strong> {{ debugInfo.currentTick }}
      </div>
      <div class="debug-item">
        <strong>Direction:</strong> {{ debugInfo.direction.toUpperCase() }}
      </div>
      <div class="debug-item">
        <strong>Speed:</strong> Walking (1 tile/tick)
      </div>
      <div class="debug-item">
        <strong>Turn Cooldown:</strong> {{ debugInfo.turnCooldown }}t
      </div>
      <div class="debug-item">
        <strong>Can Fall:</strong> {{ debugInfo.canFall ? 'Yes (39-51t)' : 'No' }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 20px;
  gap: 30px;
}

.main-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.debug-box {
  background-color: #f5f5f5;
  border: 2px solid #333;
  border-radius: 8px;
  padding: 15px;
  min-width: 200px;
  font-family: 'Courier New', monospace;
}

.debug-box h3 {
  margin: 0 0 10px 0;
  color: #333;
  border-bottom: 1px solid #333;
  padding-bottom: 5px;
}

.debug-item {
  margin: 8px 0;
  font-size: 12px;
  line-height: 1.4;
}

.controls {
  display: flex;
  gap: 10px;
}

.controls button {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: bold;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.controls button:hover {
  background-color: #45a049;
}

.controls button:active {
  background-color: #3d8b40;
}
</style>
