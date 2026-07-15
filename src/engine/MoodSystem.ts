export type Mood = 'happy' | 'neutral' | 'shy' | 'sleepy' | 'angry'

export class MoodSystem {
  private mood: Mood = 'neutral'
  private happiness = 70 // 0-100
  private lastInteraction = Date.now()

  getMood(): Mood {
    return this.mood
  }

  getHappiness(): number {
    return this.happiness
  }

  onInteraction(type: 'tap' | 'drag' | 'rapid_tap') {
    this.lastInteraction = Date.now()

    switch (type) {
      case 'tap':
        this.happiness = Math.min(100, this.happiness + 2)
        break
      case 'drag':
        this.happiness = Math.min(100, this.happiness + 5)
        break
      case 'rapid_tap':
        this.happiness = Math.max(0, this.happiness - 15)
        this.mood = 'angry'
        setTimeout(() => { if (this.mood === 'angry') this.updateMood() }, 10000)
        return
    }

    this.updateMood()
  }

  tick() {
    // Happiness decays over time
    const elapsed = Date.now() - this.lastInteraction
    if (elapsed > 60000) {
      this.happiness = Math.max(0, this.happiness - Math.floor(elapsed / 300000))
    }
    this.updateMood()
  }

  private updateMood() {
    if (this.happiness > 80) {
      this.mood = 'happy'
    } else if (this.happiness > 40) {
      this.mood = 'neutral'
    } else if (this.happiness > 20) {
      this.mood = 'shy'
    } else {
      this.mood = 'sleepy'
    }
  }
}
