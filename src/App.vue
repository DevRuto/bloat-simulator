<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import BloatRoom from './components/BloatRoom.vue'
import { BloatSimulation } from './composables/useBloatSimulation.js'

const turnDirection = ref('clockwise')
const positionOffset = ref(0)
let simulation = new BloatSimulation(turnDirection.value, positionOffset.value)
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
  direction: 'right',
  turnDirection: 'clockwise',
  positionOffset: 0
})

const bloatRoomRef = ref(null)

// Recreate simulation with new settings
const recreateSimulation = () => {
  const wasRunning = isRunning.value
  pauseSimulation()
  simulation = new BloatSimulation(turnDirection.value, positionOffset.value)
  updateTiles()
  if (wasRunning) {
    startSimulation()
  }
}

// Animation controls
const startSimulation = () => {
  if (!isRunning.value) {
    isRunning.value = true
    // Process ticks every 600ms (0.6 seconds per tick)
    tickInterval.value = setInterval(() => {
      const result = simulation.processTick()
      if (result.shouldReset) {
        resetSimulation()
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
    validPositions: simulation.getValidBloatPositions().length,
    currentTick: simState.currentTick,
    isWalking: simState.isWalking,
    isRunningState: simState.isRunningState,
    turnCooldown: simState.turnCooldown,
    canFall: simState.canFall,
    direction: simState.direction,
    turnDirection: turnDirection.value,
    positionOffset: positionOffset.value
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
      <div class="grid-container">
        <BloatRoom ref="bloatRoomRef" />

        <div class="controls">
          <div class="control-group">
            <label>
              Turn Direction:
              <select v-model="turnDirection" @change="recreateSimulation">
                <option value="clockwise">Clockwise</option>
                <option value="counterclockwise">Counterclockwise</option>
              </select>
            </label>
            <label>
              Position Offset:
              <input
                type="number"
                v-model.number="positionOffset"
                @change="recreateSimulation"
                placeholder="0"
              >
            </label>
          </div>
          <div class="button-group">
            <button @click="startWithUpdates" :disabled="isRunning">Start</button>
            <button @click="pauseWithUpdates" :disabled="!isRunning">Pause</button>
            <button @click="resetSimulation">Reset</button>
          </div>
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
          <strong>Turn Direction:</strong> {{ debugInfo.turnDirection }}
        </div>
        <div class="debug-item">
          <strong>Position Offset:</strong> {{ debugInfo.positionOffset }}
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
        <div class="debug-item">
          <strong>Valid Positions:</strong> {{ debugInfo.validPositions }}
        </div>
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
  flex-direction: row;
  gap: 30px;
  align-items: flex-start;
}

.grid-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 8px;
  border: 2px solid #ddd;
  width: 100%;
  max-width: 400px;
}

.control-group {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  justify-content: center;
}

.control-group label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.9rem;
  font-weight: 500;
}

.control-group select,
.control-group input {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.9rem;
  min-width: 120px;
}

.button-group {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.button-group button {
  padding: 0.5rem 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.button-group button:hover:not(:disabled) {
  background-color: #f0f0f0;
}

.button-group button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  margin-top: 0;
  margin-bottom: 10px;
  text-align: center;
  color: #333;
}

.debug-item {
  margin-bottom: 5px;
  font-size: 0.85rem;
  line-height: 1.3;
}

.debug-item strong {
  color: #000;
}
</style>
