#!/usr/bin/env bun

class LunarLander {
  constructor() {
    this.altitude = 1000
    this.velocity = 50
    this.fuel = 1200
    this.thrust = 0
    this.gravity = 1.625
    this.engineOn = false
  }

  updatePhysics() {
    // Calculate acceleration
    const thrustAccel = (this.thrust * 0.1) * (this.fuel > 0 ? 1 : 0)
    const netAccel = this.gravity - thrustAccel
    
    // Update velocity and altitude
    this.velocity += netAccel
    this.altitude -= this.velocity
    
    // Fuel
    if (this.fuel > 0) {
      this.fuel = Math.max(0, this.fuel - (this.thrust * 0.1))
    }
    
    // Prevent negative altitude
    this.altitude = Math.max(0, this.altitude)
  }

  getStatus() {
    return `
ALTITUDE: ${this.altitude.toFixed(1)} m
VELOCITY: ${this.velocity.toFixed(1)} m/s
FUEL:     ${Math.round(this.fuel)} kg
THRUST:   ${this.thrust}%
`
  }
}

async function startCountdown() {
  console.log(`\n\x1b[36mINITIALIZING LAUNCH SEQUENCE\x1b[0m`)
  await Bun.sleep(1000)
  
  for (
    let i = 3;
    i >= 0;
    i--
  ) {
    if (i > 0) {
      console.log(`\x1b[33m${i}...\x1b[0m`)  // Yellow countdown
    } else {
      console.log(`\x1b[31m\x1b[1mIGNITION!!!\x1b[0m`)  // Red bold ignition
    }
    await Bun.sleep(1000)
  }
  
  console.log(`\x1b[32m🚀 LUNAR DESCENT INITIATED\x1b[0m\n`)
  await Bun.sleep(500)
}

async function moonLanding() {
  const lander = new LunarLander()
  let gameOver = false
  
  console.log(`Apollo Lunar Landing Simulation`)
  console.log(`--------------------------------`)
  
  // Add rocket startup sequence
  await startCountdown()
  
  console.log(`CONTROL TRANSFERED TO PILOT`)
  console.log(`INPUT THRUST PERCENTAGE (0-100)`)
  console.log(`GOAL: Land at less than 5 m/s\n`)


  while (!gameOver) {
    console.log(lander.getStatus())
    
    const input = await prompt(`Enter thrust percentage: `)
    const parsedInput = Math.min(100, Math.max(0, parseInt(input) || 0))
    lander.thrust = parsedInput
    
    lander.updatePhysics()

    // Check landing conditions
    if (lander.altitude <= 0) {
      gameOver = true
      console.log(`\nCONTACT LIGHT!`)
      
      if (lander.velocity < 5) {
        console.log(`\x1b[32mSUCCESSFUL LANDING!\x1b[0m`)
        console.log(`${Math.round(lander.fuel)} kg fuel remaining`)
      } else {
        console.log(`\x1b[31mCRASH! TOO FAST!\x1b[0m`)
      }
    } else if (lander.fuel <= 0 && lander.thrust > 0) {
      console.log(`\x1b[33mFUEL OUT!\x1b[0m`)
    }
  }
}

// touchdown will be written ... in next version
moonLanding()