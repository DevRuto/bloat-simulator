#!/usr/bin/env node

import { BloatSimulation } from './src/composables/useBloatSimulation.js'
import { Player } from './src/composables/usePlayer.js'

// Simulation parameters
const SIM_CONFIG = {
  turnDirection: 'clockwise',     // 'clockwise' or 'counterclockwise'
  positionOffset: -3,              // Position offset along perimeter
  maxTicks: 60,                 // Maximum number of ticks
  simulationCount: 100_000             // Number of simulations to run
}

/* Re-entry start positions */

// Mage start position
const MAGE_START_POSITIONS = {
  'START_DEFAULT': {
    'clockwise': {
      x: 6,
      y: 11
    },
    'counterclockwise': {
      x: 5,
      y: 11
    }
  }
}

// Range start positions
const RANGE_START_POSITIONS = {
  'START_2_PAST': {
    'clockwise': {
      x: 11,
      y: 2
    },
    'counterclockwise': {
      x: 0,
      y: 2
    }
  },
  'START_3_PAST': {
    'clockwise': {
      x: 11,
      y: 3
    },
    'counterclockwise': {
      x: 0,
      y: 3
    }
  }
}

const MAGE_START_FLAG = 'START_DEFAULT';
const RANGE_START_FLAG = 'START_3_PAST';

// Position offset descriptions
const OFFSET_DESCRIPTIONS = {
  "-3": "Modified baller entry",
  "-4": "Standard baller entry",
  "-5": "8-fly entry - aligned with pillar",
}

// Tick fix descriptions
const TICK_FIXES = {
  32: '6 Scy',
  31: '6 Scy',
  30: '1 claw + 5 Scy',
  29: '2 claw + 4 Scy',
  28: 'Chally + 4 Scy',
  27: '5 Scy'
}
// const TICK_FIXES = {
//   32: '6 Scythe + 1 Chally',
//   31: '6 Scythe + 1 Chally',
//   30: '1 Claw + 5 Scythe + 1 Chally',
//   29: '1 Claw + 1 Claw Scratch + 4 Scythe + 1 Chally',
//   28: '1 Chally + 4 Scythe + 1 Chally',
//   27: '5 Scyhte + 1 chally'
// }

async function runSimulation() {
  const simulation = new BloatSimulation(SIM_CONFIG.turnDirection, SIM_CONFIG.positionOffset)

  const magePlayer = new Player('Mager')
  const rangePlayer = new Player('Ranger')

  let totalTicks = 0

  while (totalTicks < SIM_CONFIG.maxTicks) {
    // Process tick
    const result = simulation.processTick()
    totalTicks++

    if (!magePlayer.isActive) {
      // Check if bloat position matches any mage start position
      const mageStartPositions = MAGE_START_POSITIONS[MAGE_START_FLAG][SIM_CONFIG.turnDirection]
      const positionMatches = mageStartPositions.x === simulation.bloatPosition.x
                            && mageStartPositions.y === simulation.bloatPosition.y

      if (positionMatches) {
        magePlayer.start(totalTicks)
      }
    }

    if (!rangePlayer.isActive) {
      // Check if bloat position matches any range start position
      const rangeStartPositions = RANGE_START_POSITIONS[RANGE_START_FLAG][SIM_CONFIG.turnDirection]
      const positionMatches = rangeStartPositions.x === simulation.bloatPosition.x
                            && rangeStartPositions.y === simulation.bloatPosition.y

      if (positionMatches) {
        rangePlayer.start(totalTicks)
      }
    }

    if (magePlayer.processTick(simulation.bloatPosition)) {
      magePlayer.scytheHit()
    }
    if (rangePlayer.processTick(simulation.bloatPosition)) {
      rangePlayer.scytheHit()
    }

    if (result.shouldReset) {
      // Bloat will get up in 32 ticks
      // Determine what tick the player should have attacked to hit the bloat
      var mageTick = 32 - magePlayer.attackCooldown;
      var rangeTick = 32 - rangePlayer.attackCooldown;
      return {
        totalTicks: totalTicks,
        mageTick: mageTick,
        rangeTick: rangeTick,
        flinchable: result.flinchable
      };
    }
  }

  return { totalTicks: -1, mageTick: -1, rangeTick: -1, flinchable: false };
}

// Main execution
async function main() {
  try {
    console.log(`Running ${SIM_CONFIG.simulationCount} simulations...`)

    const results = []

    for (let i = 1; i <= SIM_CONFIG.simulationCount; i++) {
      const result = await runSimulation()
      results.push(result)
    }

    // Summary statistics
    console.log('')
    console.log('=== SUMMARY ===')

    // Filter out -1 results (no bloat fall) and get unique tick counts
    const fallTicks = results.filter(r => r.totalTicks !== -1)
    const uniqueFallTicks = [...new Set(fallTicks.map(r => r.totalTicks))]

    const offsetDesc = OFFSET_DESCRIPTIONS[SIM_CONFIG.positionOffset.toString()] || 'N/A'
    console.log(`Turn Direction: ${SIM_CONFIG.turnDirection}`)
    console.log(`Position Offset: ${SIM_CONFIG.positionOffset} (${offsetDesc})`)

    if (uniqueFallTicks.length > 0) {
      console.log('')
      console.log('Tick | Count   | Flinchable | Mage Tick | Mage Fix          | Range Tick | Range Fix')
      console.log('-----|---------|------------|-----------|-------------------|------------|-------------')

      const tickCounts = {}
      const tickFlinchable = {}
      const mageTicks = {}
      const rangeTicks = {}

      fallTicks.forEach(result => {
        const { totalTicks, flinchable, mageTick, rangeTick } = result
        const tick = totalTicks
        tickCounts[tick] = (tickCounts[tick] || 0) + 1

        // Track if any result for this tick was flinchable
        if (!(tick in tickFlinchable)) {
          tickFlinchable[tick] = flinchable
        } else if (tickFlinchable[tick] !== 'mixed' && tickFlinchable[tick] !== flinchable) {
          tickFlinchable[tick] = 'mixed'
        }

        // Track mage/range ticks (only set once)
        if (!(tick in mageTicks)) {
          mageTicks[tick] = mageTick
        }

        if (!(tick in rangeTicks)) {
          rangeTicks[tick] = rangeTick
        }
      })

      const formatStatus = (value) =>
        value === true ? 'Yes' : value === 'mixed' ? 'Mixed' : 'No'

      const formatFix = (tick, width) =>
        (TICK_FIXES[tick] ?? 'Unknown').padEnd(width)

      Object.entries(tickCounts)
      .sort(([, a], [, b]) => b - a)
      .forEach(([tick, count]) => {
        const mageTick = mageTicks[tick]
        const rangeTick = rangeTicks[tick]

        console.log(
          [
            tick.padStart(4),
            count.toLocaleString().padStart(7),
            formatStatus(tickFlinchable[tick]).padStart(10),
            mageTick.toString().padStart(9),
            formatFix(mageTick, 17),
            rangeTick.toString().padStart(10),
            formatFix(rangeTick, 11),
          ].join(' | ')
        )
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
