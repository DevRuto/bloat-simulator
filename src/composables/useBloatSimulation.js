// Bloat room simulation logic
export const GRID_SIZE = 16
export const BLOAT_SIZE = 5
export const PILLAR_SIZE = 6

export class BloatSimulation {
  constructor(turnDirection = 'clockwise', positionOffset = 0) {
    this.tiles = []
    this.bloatPosition = { x: 0, y: 0 }
    this.currentTick = 0
    this.isWalking = true
    this.isRunningState = false
    this.turnCooldown = 0
    this.canFall = false
    this.direction = 'right'
    this.turnDirection = turnDirection // 'clockwise' or 'counterclockwise'
    this.positionOffset = positionOffset
    this.initializeGrid()
  }

  // Initialize the grid
  initializeGrid() {
    const newTiles = []

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const tile = {
          x,
          y,
          isBloat: false,
          isPillar: false,
          isFloor: false,
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

    this.tiles = newTiles

    // Set initial position based on turn direction and offset
    if (this.turnDirection === 'clockwise') {
      // Start at top-left corner
      this.bloatPosition = { x: 0, y: 0 }
      this.direction = 'right'
    } else {
      // Start at top-right corner
      this.bloatPosition = { x: GRID_SIZE - BLOAT_SIZE, y: 0 }
      this.direction = 'left'
    }

    // Apply position offset
    this.applyPositionOffset()

    this.updateBloatPosition()
  }

  // Apply position offset along the perimeter
  applyPositionOffset() {
    if (this.positionOffset < 0) {
      this.turnDirection = this.turnDirection === 'clockwise' ? 'counterclockwise' : 'clockwise'
      this.turnClockwise()
      this.turnClockwise()
      this.turnClockwise()
    }
    for (let i = 0; i < Math.abs(this.positionOffset); i++) {
      this.moveBloatStep()
    }
    if (this.positionOffset < 0) {
      this.turnClockwise()
      this.turnClockwise()
      this.turnDirection = this.turnDirection === 'clockwise' ? 'counterclockwise' : 'clockwise'
    }
  }

  // Update direction based on current position and turn direction
  updateDirectionForPosition() {
    const validPositions = this.getValidBloatPositions()
    const currentIndex = validPositions.findIndex(
      (pos) => pos.x === this.bloatPosition.x && pos.y === this.bloatPosition.y,
    )

    if (currentIndex !== -1 && validPositions.length > 1) {
      // Get next position based on turn direction
      let nextIndex
      if (this.turnDirection === 'clockwise') {
        nextIndex = (currentIndex + 1) % validPositions.length
      } else {
        nextIndex = currentIndex === 0 ? validPositions.length - 1 : currentIndex - 1
      }

      const nextPos = validPositions[nextIndex]

      // Determine direction to next position
      if (nextPos.x > this.bloatPosition.x) this.direction = 'right'
      else if (nextPos.x < this.bloatPosition.x) this.direction = 'left'
      else if (nextPos.y > this.bloatPosition.y) this.direction = 'down'
      else if (nextPos.y < this.bloatPosition.y) this.direction = 'up'
    }
  }

  // Update bloat position on the grid
  updateBloatPosition() {
    // Clear previous bloat position
    this.tiles.forEach((tile) => (tile.isBloat = false))

    // Set new bloat position (5x5 area)
    for (let dy = 0; dy < BLOAT_SIZE; dy++) {
      for (let dx = 0; dx < BLOAT_SIZE; dx++) {
        const x = this.bloatPosition.x + dx
        const y = this.bloatPosition.y + dy

        if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
          const tileIndex = y * GRID_SIZE + x
          if (this.tiles[tileIndex] && !this.tiles[tileIndex].isPillar) {
            this.tiles[tileIndex].isBloat = true
          }
        }
      }
    }
  }

  // Get valid bloat positions (outside the pillar)
  getValidBloatPositions() {
    const positions = []
    const pillarStart = Math.floor((GRID_SIZE - PILLAR_SIZE) / 2)
    const pillarEnd = pillarStart + PILLAR_SIZE - 1

    // Top edge
    for (let x = 0; x <= GRID_SIZE - BLOAT_SIZE; x++) {
      if (x + BLOAT_SIZE - 1 < pillarStart || x > pillarEnd) {
        positions.push({ x, y: 0 })
      }
    }

    // Bottom edge
    for (let x = 0; x <= GRID_SIZE - BLOAT_SIZE; x++) {
      if (x + BLOAT_SIZE - 1 < pillarStart || x > pillarEnd) {
        positions.push({ x, y: GRID_SIZE - BLOAT_SIZE })
      }
    }

    // Left edge
    for (let y = 0; y <= GRID_SIZE - BLOAT_SIZE; y++) {
      if (y + BLOAT_SIZE - 1 < pillarStart || y > pillarEnd) {
        positions.push({ x: 0, y })
      }
    }

    // Right edge
    for (let y = 0; y <= GRID_SIZE - BLOAT_SIZE; y++) {
      if (y + BLOAT_SIZE - 1 < pillarStart || y > pillarEnd) {
        positions.push({ x: GRID_SIZE - BLOAT_SIZE, y })
      }
    }

    return positions
  }

  // Check if position is valid (within bounds and not in pillar)
  isValidPosition(x, y) {
    if (x < 0 || x > GRID_SIZE - BLOAT_SIZE || y < 0 || y > GRID_SIZE - BLOAT_SIZE) {
      return false
    }

    // Check if any part of bloat would overlap with pillar
    const pillarStart = Math.floor((GRID_SIZE - PILLAR_SIZE) / 2)
    const pillarEnd = pillarStart + PILLAR_SIZE - 1

    for (let dy = 0; dy < BLOAT_SIZE; dy++) {
      for (let dx = 0; dx < BLOAT_SIZE; dx++) {
        const checkX = x + dx
        const checkY = y + dy

        if (
          checkX >= pillarStart &&
          checkX <= pillarEnd &&
          checkY >= pillarStart &&
          checkY <= pillarEnd
        ) {
          return false
        }
      }
    }

    return true
  }

  // Move bloat one tile in current direction
  moveBloatStep() {
    const stepSize = this.isRunningState ? 2 : 1
    let newX = this.bloatPosition.x
    let newY = this.bloatPosition.y
    let moved = false

    // Try to move in current direction
    for (let i = 0; i < stepSize; i++) {
      let nextX = newX
      let nextY = newY

      switch (this.direction) {
        case 'right':
          nextX += 1
          break
        case 'down':
          nextY += 1
          break
        case 'left':
          nextX -= 1
          break
        case 'up':
          nextY -= 1
          break
      }

      // Check if next position is valid
      if (this.isValidPosition(nextX, nextY)) {
        newX = nextX
        newY = nextY
        moved = true
      } else {
        // Hit boundary or pillar, turn clockwise and try to continue
        this.turnClockwise()

        // Try to move in new direction for remaining steps
        for (let j = i; j < stepSize; j++) {
          let retryX = newX
          let retryY = newY

          switch (this.direction) {
            case 'right':
              retryX += 1
              break
            case 'down':
              retryY += 1
              break
            case 'left':
              retryX -= 1
              break
            case 'up':
              retryY -= 1
              break
          }

          if (this.isValidPosition(retryX, retryY)) {
            newX = retryX
            newY = retryY
            moved = true
          } else {
            // If still can't move, break out
            break
          }
        }
        break
      }
    }

    if (moved) {
      this.bloatPosition.x = newX
      this.bloatPosition.y = newY
      this.updateBloatPosition()
    }
  }

  // Turn direction based on turnDirection setting
  turnClockwise() {
    if (this.turnDirection === 'clockwise') {
      // Clockwise: right -> down -> left -> up -> right
      switch (this.direction) {
        case 'right':
          this.direction = 'down'
          break
        case 'down':
          this.direction = 'left'
          break
        case 'left':
          this.direction = 'up'
          break
        case 'up':
          this.direction = 'right'
          break
      }
    } else {
      // Counterclockwise: right -> up -> left -> down -> right
      switch (this.direction) {
        case 'right':
          this.direction = 'up'
          break
        case 'up':
          this.direction = 'left'
          break
        case 'left':
          this.direction = 'down'
          break
        case 'down':
          this.direction = 'right'
          break
      }
    }
  }

  // Check if bloat is flinchable based on position
  isFlinchable() {
    const { x, y } = this.bloatPosition
    const gridSize = GRID_SIZE
    const bloatSize = BLOAT_SIZE

    // Check if bloat is in corner or 1 tile away from corner
    // Corners are: (0,0), (gridSize-bloatSize,0), (0,gridSize-bloatSize), (gridSize-bloatSize,gridSize-bloatSize)
    const corners = [
      { x: 0, y: 0 },
      { x: gridSize - bloatSize, y: 0 },
      { x: 0, y: gridSize - bloatSize },
      { x: gridSize - bloatSize, y: gridSize - bloatSize },
    ]

    // Check if bloat is in any corner or 1 tile away from any corner
    for (const corner of corners) {
      const xDiff = Math.abs(x - corner.x)
      const yDiff = Math.abs(y - corner.y)

      // If bloat is in corner (0,0) or 1 tile away (0,1) or (1,0) or (1,1)
      if (xDiff <= 1 && yDiff <= 1) {
        return false
      }
    }

    return true
  }

  // Process a single tick
  processTick() {
    this.currentTick++

    // Update turn cooldown
    if (this.turnCooldown > 0) {
      this.turnCooldown--
    }

    // Check if bloat can fall (always falls on tick 47 unless turned in last 5 ticks)
    if (this.currentTick >= 39) {
      this.canFall = true

      // Always fall on tick 47 if can fall or 1/4 chance and hasn't turned in last 5 ticks
      if (this.turnCooldown < 27 && (Math.random() < 1 / 4 || this.currentTick === 47)) {
        // Bloat falls - reset simulation
        return { shouldReset: true, flinchable: this.isFlinchable() }
      }

      // Fall if past tick 47 and hasn't turned in last 5 ticks
      if (this.turnCooldown < 27 && this.currentTick >= 47) {
        // Bloat falls - reset simulation
        return { shouldReset: true, flinchable: this.isFlinchable() }
      }
    }

    // 1/16 chance to turn if off cooldown
    if (this.turnCooldown === 0 && Math.random() < 1 / 16) {
      this.turnCooldown = 32
    }

    // Move bloat
    this.moveBloatStep()

    return { shouldReset: false }
  }

  // Get current tiles state
  getTiles() {
    return [...this.tiles] // Return copy to ensure reactivity
  }

  // Get simulation state
  getSimulationState() {
    return {
      currentTick: this.currentTick,
      isWalking: this.isWalking,
      isRunningState: this.isRunningState,
      turnCooldown: this.turnCooldown,
      canFall: this.canFall,
      direction: this.direction,
      flinchable: this.isFlinchable(),
    }
  }

  // Reset simulation state
  resetState() {
    this.currentTick = 0
    this.isWalking = true
    this.isRunningState = false
    this.turnCooldown = 0
    this.canFall = false
    this.initializeGrid()
  }
}
