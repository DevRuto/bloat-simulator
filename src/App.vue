<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import BloatRoom from './components/BloatRoom.vue'
import { BloatSimulation } from './composables/useBloatSimulation.js'

// Get query parameters
const urlParams = new URLSearchParams(window.location.search)
const turnDirection = ref(urlParams.get('turnDirection') || 'clockwise')
const positionOffset = ref(parseInt(urlParams.get('positionOffset')) || -5)
const msPerTick = ref(parseInt(urlParams.get('msPerTick')) || 600)
let simulation = new BloatSimulation(turnDirection.value, positionOffset.value)
const tiles = ref(simulation.getTiles())
const isRunning = ref(false)
const tickInterval = ref(null)
const updateInterval = ref(null)

const debugInfo = ref({
  bloatPosition: { x: 0, y: 0 },
  isRunning: false,
  currentTick: 0,
  isWalking: true,
  isRunningState: false,
  turnCooldown: 0,
  canFall: false,
  direction: 'right',
  turnDirection: turnDirection.value,
  positionOffset: positionOffset.value,
  msPerTick: msPerTick.value
})

const bloatRoomRef = ref(null)

// Update URL with current settings
const updateURL = () => {
  const params = new URLSearchParams()

  if (turnDirection.value !== 'clockwise') {
    params.set('turnDirection', turnDirection.value)
  }
  if (positionOffset.value !== 0) {
    params.set('positionOffset', positionOffset.value.toString())
  }
  if (msPerTick.value !== 600) {
    params.set('msPerTick', msPerTick.value.toString())
  }

  const newURL = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname
  window.history.replaceState({}, '', newURL)
}

// Toggle turn direction between clockwise and counterclockwise
const toggleTurnDirection = () => {
  turnDirection.value = turnDirection.value === 'clockwise' ? 'counterclockwise' : 'clockwise'
  recreateSimulation()
}

// Recreate simulation with new settings
const recreateSimulation = () => {
  const wasRunning = isRunning.value
  pauseSimulation()
  simulation = new BloatSimulation(turnDirection.value, positionOffset.value)
  updateTiles()
  updateURL()
  if (wasRunning) {
    startSimulation()
  }
}

// Update URL when speed changes
const updateSpeedURL = () => {
  const params = new URLSearchParams(window.location.search)

  if (msPerTick.value !== 600) {
    params.set('msPerTick', msPerTick.value.toString())
  } else {
    params.delete('msPerTick')
  }

  const newURL = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname
  window.history.replaceState({}, '', newURL)
}
const startSimulation = () => {
  if (!isRunning.value) {
    isRunning.value = true
    // Process ticks every msPerTick milliseconds
    tickInterval.value = setInterval(() => {
      const result = simulation.processTick()
      if (result.shouldReset) {
        // resetSimulation()
        pauseSimulation()
      }
    }, msPerTick.value)
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
    direction: simState.direction,
    turnDirection: turnDirection.value,
    positionOffset: positionOffset.value,
    msPerTick: msPerTick.value
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
  <div class="flex flex-row items-start p-8 gap-8">
    <div class="flex flex-row gap-8 items-start">
      <div class="flex flex-col gap-5 items-center">
        <BloatRoom ref="bloatRoomRef" :direction="debugInfo.direction" />

        <div class="flex flex-col gap-4 p-4 bg-gray-100 rounded-lg border-2 border-gray-300 w-full max-w-md">
          <div class="flex gap-4 items-end justify-center">
            <label class="flex flex-col gap-2">
              <span class="text-sm font-medium">Turn Direction:</span>
              <div class="flex items-center gap-2">
                <span class="text-sm" :class="{ 'text-gray-400': isRunning }">Counter</span>
                <button
                  @click="toggleTurnDirection"
                  :disabled="isRunning"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  :class="turnDirection === 'clockwise' ? 'bg-blue-600' : 'bg-gray-300'"
                >
                  <span
                    class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                    :class="turnDirection === 'clockwise' ? 'translate-x-6' : 'translate-x-1'"
                  />
                </button>
                <span class="text-sm" :class="{ 'text-gray-400': isRunning }">Clockwise</span>
              </div>
            </label>
            <label class="flex flex-col gap-1 text-sm font-medium">
              Position Offset (tiles from start):
              <input
                type="number"
                v-model.number="positionOffset"
                @change="recreateSimulation"
                placeholder="0"
                :disabled="isRunning"
                class="p-2 border border-gray-300 rounded text-sm min-w-32 disabled:opacity-50 disabled:cursor-not-allowed"
              >
            </label>
          </div>
          <div class="flex gap-2 justify-center">
            <button @click="startWithUpdates" :disabled="isRunning" class="px-4 py-2 border border-gray-300 rounded bg-white cursor-pointer text-sm transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Start</button>
            <button @click="pauseWithUpdates" :disabled="!isRunning" class="px-4 py-2 border border-gray-300 rounded bg-white cursor-pointer text-sm transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Pause</button>
            <button @click="resetSimulation" class="px-4 py-2 border border-gray-300 rounded bg-white cursor-pointer text-sm transition-colors hover:bg-gray-50">Reset</button>
          </div>
        </div>
      </div>

      <div class="bg-gray-100 border-2 border-gray-800 rounded-lg p-4 min-w-48 font-mono">
        <h3 class="mt-0 mb-2.5 text-center text-gray-800">Debug Info</h3>
        <div class="mb-1.5 text-sm leading-relaxed">
          <strong class="text-black">Bloat Position:</strong> ({{ debugInfo.bloatPosition.x }}, {{ debugInfo.bloatPosition.y }})
        </div>
        <div class="mb-1.5 text-sm leading-relaxed">
          <strong class="text-black">Status:</strong> {{ debugInfo.isRunning ? 'Running' : 'Paused' }}
        </div>
        <div class="mb-1.5 text-sm leading-relaxed">
          <strong class="text-black">Current Tick:</strong> {{ debugInfo.currentTick }}
        </div>
        <div class="mb-1.5 text-sm leading-relaxed">
          <strong class="text-black">Direction:</strong> {{ debugInfo.direction.toUpperCase() }}
        </div>
        <div class="mb-1.5 text-sm leading-relaxed">
          <strong class="text-black">Turn Direction:</strong> {{ debugInfo.turnDirection }}
        </div>
        <div class="mb-1.5 text-sm leading-relaxed">
          <strong class="text-black">Position Offset:</strong> {{ debugInfo.positionOffset }}
        </div>
        <div class="mb-1.5 text-sm leading-relaxed">
          <strong class="text-black">Speed:</strong> Walking (1 tile/tick)
        </div>
        <div class="mb-1.5 text-sm leading-relaxed">
          <label class="flex flex-col gap-1 text-xs">
            <strong class="text-black">Speed (ms per tick):</strong>
            <input
              type="number"
              v-model.number="msPerTick"
              @change="updateSpeedURL"
              placeholder="600"
              min="50"
              max="5000"
              step="50"
              class="p-1 border border-gray-300 rounded text-xs w-20"
            >
          </label>
        </div>
        <div class="mb-1.5 text-sm leading-relaxed">
          <strong class="text-black">Turn Cooldown:</strong> {{ debugInfo.turnCooldown }}t
        </div>
        <div class="mb-1.5 text-sm leading-relaxed">
          <strong class="text-black">Can Fall:</strong> {{ debugInfo.canFall ? 'Yes (39-51t)' : 'No' }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom styles that can't be replaced with Tailwind */
</style>
