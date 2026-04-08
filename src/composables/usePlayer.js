export class Player {
  constructor(id) {
    this.id = id
    this.currentTick = 0
    this.attackCooldown = 0
    this.attackTicks = [] // Track all attack ticks
    this.successfulAttacks = [] // Track successful attacks on bloat
    this.isActive = false
  }

  start(startingTick) {
    this.currentTick = startingTick
    this.isActive = true
  }

  // Process a tick and determine if player attacks
  processTick(bloatPosition) {
    if (!this.isActive) return
    this.currentTick++

    if (this.attackCooldown > 0) {
      this.attackCooldown--
      return false
    }

    if (this.attackCooldown === 0) {
      this.attackTicks.push(this.currentTick)
      this.recordSuccessfulAttack(bloatPosition)
      return true
    }

    return false
  }

  // Record a successful attack on bloat
  recordSuccessfulAttack(bloatPosition) {
    this.successfulAttacks.push({
      tick: this.currentTick,
      bloatPosition: { ...bloatPosition },
    })
  }

  // Get player state
  getPlayerState() {
    return {
      id: this.id,
      currentTick: this.currentTick,
      isActive: this.isActive,
      totalAttacks: this.attackTicks.length,
      attackTicks: [...this.attackTicks],
      successfulAttacks: [...this.successfulAttacks],
    }
  }

  /* Player actions */
  scytheHit() {
    this.attackCooldown = 5
  }

  delayHit(ticks) {
    this.attackCooldown += ticks
  }

  // Reset player state
  reset() {
    this.currentTick = 0
    this.attackTicks = []
    this.successfulAttacks = []
    this.isActive = false
  }
}
