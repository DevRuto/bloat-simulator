#!/usr/bin/env node

import { BloatSimulation } from './src/composables/useBloatSimulation.js'

// Position offset descriptions
const OFFSET_DESCRIPTIONS = {
  "-3": "Modified baller entry",
  "-4": "Standard baller entry",
  "-5": "8-fly entry - aligned with pillar",
}

// Simulation parameters
const SIM_CONFIG = {
  turnDirection: 'clockwise',     // 'clockwise' or 'counterclockwise'
  positionOffset: -5,              // Position offset along perimeter
  maxTicks: 60,                 // Maximum number of ticks
  simulationCount: 100000              // Number of simulations to run
}

async function runSimulation() {
  const simulation = new BloatSimulation(SIM_CONFIG.turnDirection, SIM_CONFIG.positionOffset)

  let totalTicks = 0

  while (totalTicks < SIM_CONFIG.maxTicks) {
    // Process tick
    const result = simulation.processTick()
    totalTicks++

    if (result.shouldReset) {
      return totalTicks;
    }
  }

  return -1;
}

// Main execution
async function main() {
  try {
    console.log(`Running ${SIM_CONFIG.simulationCount} simulations...`)

    const results = []

    for (let i = 1; i <= SIM_CONFIG.simulationCount; i++) {
      const result = await runSimulation(i)
      results.push(result)
    }

    // Summary statistics
    console.log('')
    console.log('=== SUMMARY ===')

    // Filter out -1 results (no bloat fall) and get unique tick counts
    const fallTicks = results.filter(r => r !== -1)
    const uniqueFallTicks = [...new Set(fallTicks)]

    const offsetDesc = OFFSET_DESCRIPTIONS[SIM_CONFIG.positionOffset.toString()] || 'N/A'
    console.log(`Turn Direction: ${SIM_CONFIG.turnDirection}`)
    console.log(`Position Offset: ${SIM_CONFIG.positionOffset} (${offsetDesc})`)

    if (uniqueFallTicks.length > 0) {
      console.log('Tick counts when bloat fell:')
      const tickCounts = {}
      fallTicks.forEach(tick => {
        tickCounts[tick] = (tickCounts[tick] || 0) + 1
      })

      Object.entries(tickCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([tick, count]) => {
          console.log(`  Tick ${tick}: ${count} times`)
        })
    }

  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\nSimulation stopped by user.')
  process.exit(0)
})

// Run the simulation
main()
