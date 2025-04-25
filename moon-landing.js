#!/usr/bin/env bun

import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

// --- Default Constants ---
// These will be used if the user doesn't provide input or provides invalid input

const DEFAULT_INITIAL_ALTITUDE = 1000.0;      // meters
const DEFAULT_INITIAL_VELOCITY = 50.0;        // m/s (downward)
const DEFAULT_INITIAL_FUEL = 1200.0;      // kg
const DEFAULT_SAFE_LANDING_SPEED = 5.0;         // m/s

// --- Physical Constants (Generally not changed by pilot) ---
const GRAVITY = 1.625;       // m/s^2 (Moon's gravity)
const THRUST_POWER = 0.15;        // Acceleration per thrust percentage point
const FUEL_CONSUMPTION_RATE = 0.1; // Fuel consumed per thrust percentage point per second
const SIMULATION_TICK_RATE_MS = 1000; // How often physics updates (milliseconds)

// ANSI color codes
const COLOR_RESET = "\x1b[0m";
const COLOR_RED = "\x1b[31m";
const COLOR_GREEN = "\x1b[32m";
const COLOR_YELLOW = "\x1b[33m";
const COLOR_BLUE = "\x1b[34m";
const COLOR_PURPLE = "\x1b[35m";
const COLOR_CYAN = "\x1b[36m";
const COLOR_WHITE = "\x1b[37m";
const BOLD = "\x1b[1m";

// --- LunarLander Class ---

class LunarLander {
  // Constructor now accepts initial parameters
  constructor(initialAltitude, initialVelocity, initialFuel, safeLandingSpeed) {
    this.altitude = initialAltitude;
    this.velocity = initialVelocity; // Positive means downward
    this.fuel = initialFuel;
    this.safeLandingSpeed = safeLandingSpeed; // Store the mission-specific safe speed
    this.thrust = 0; // Percentage (0-100)
    this.landed = false;
    this.crashed = false;
    this.outOfFuel = false;
    this.lastUpdateTime = Date.now(); // For calculating dt
    this.impactVelocity = null; // Store velocity at impact
  }

  // updatePhysics calculates the lander's state based on time delta.
  updatePhysics() {
    if (this.landed || this.crashed) {
      return; // No physics updates after landing/crashing
    }

    const now = Date.now();
    const dt = (now - this.lastUpdateTime) / 1000.0; // Delta time in seconds
    this.lastUpdateTime = now;

    // Calculate acceleration
    let thrustAccel = 0.0;
    let fuelConsumed = 0.0;

    if (this.fuel > 0) {
      thrustAccel = this.thrust * THRUST_POWER;
      fuelConsumed = this.thrust * FUEL_CONSUMPTION_RATE * dt;
      this.fuel -= fuelConsumed;
      if (this.fuel <= 0) {
        this.fuel = 0;
        this.outOfFuel = true;
        this.thrust = 0; // Automatically cut thrust when fuel runs out
      }
    } else if (!this.outOfFuel) {
      this.outOfFuel = true;
      this.thrust = 0; // Ensure thrust is off
    }

    const netAccel = GRAVITY - thrustAccel; // Gravity pulls down, thrust pushes up

    // Update velocity and altitude
    this.velocity += netAccel * dt;
    this.altitude -= this.velocity * dt; // Subtract because positive velocity is downward

    // Check for landing/crash
    if (this.altitude <= 0) {
      this.altitude = 0; // Don't go below ground
      this.impactVelocity = this.velocity; // Store impact velocity *before* potentially resetting it

      // Use the mission-specific safe landing speed
      if (this.impactVelocity <= this.safeLandingSpeed) {
        this.landed = true;
      } else {
        this.crashed = true;
      }
      // Stop velocity and thrust on contact
      this.velocity = 0;
      this.thrust = 0;
    }
  }

  // setThrust safely sets the thrust percentage.
  setThrust(newThrust) {
    if (this.landed || this.crashed) {
      this.thrust = 0; // No thrust after landing/crash
      return;
    }
    // Clamp thrust between 0 and 100
    let clampedThrust = Math.max(0, Math.min(100, newThrust));

    // Cannot apply thrust if out of fuel
    if (this.fuel <= 0) {
      clampedThrust = 0;
    }
    this.thrust = clampedThrust;
  }

  // getStatus returns a formatted string of the lander's current state.
  getStatus() {
    const velocityDirection = this.velocity > 0 ? "(DOWN)" : (this.velocity < 0 ? "( UP )" : "( ---)");
    const fuelStatus = this.outOfFuel ? `${COLOR_RED}(EMPTY)${COLOR_RESET}` : "";
    // Color velocity based on the mission's safe speed
    const velocityColor = this.velocity > this.safeLandingSpeed ? COLOR_RED : COLOR_GREEN;

    return `
${COLOR_BLUE}--- Lunar Lander Status ---${COLOR_RESET}
ALTITUDE: ${this.altitude.toFixed(1).padStart(8)} m
VELOCITY: ${velocityColor}${Math.abs(this.velocity).toFixed(1).padStart(8)} m/s ${velocityDirection.padEnd(6)}${COLOR_RESET}
FUEL:     ${this.fuel.toFixed(0).padStart(8)} kg ${fuelStatus}
THRUST:   ${this.thrust.toFixed(0).padStart(8)} %
${COLOR_BLUE}---------------------------${COLOR_RESET}`;
  }
}

// --- Helper Functions ---

// clearScreen clears the terminal screen.
function clearScreen() {
  process.stdout.write("\x1b[H\x1b[2J");
}

// Function to get numeric input with validation and default
async function getNumericInput(rl, prompt, defaultValue) {
    const answer = await rl.question(`${prompt} (default: ${defaultValue}): `);
    const value = parseFloat(answer);
    if (isNaN(value) || answer.trim() === '') {
        console.log(`${COLOR_YELLOW}Invalid input, using default value: ${defaultValue}${COLOR_RESET}`);
        return defaultValue;
    }
    // Basic validation: altitude/fuel should be non-negative, speed can be anything (though positive down is typical)
    if ((prompt.includes("Altitude") || prompt.includes("Fuel")) && value < 0) {
         console.log(`${COLOR_YELLOW}Value cannot be negative, using default value: ${defaultValue}${COLOR_RESET}`);
         return defaultValue;
    }
     if (prompt.includes("Safe Landing Speed") && value <= 0) {
         console.log(`${COLOR_YELLOW}Safe speed must be positive, using default value: ${defaultValue}${COLOR_RESET}`);
         return defaultValue;
    }
    return value;
}

// getInitialParameters asks the pilot for mission settings.
async function getInitialParameters(rl) {
    clearScreen();
    console.log(`\n${COLOR_CYAN}${BOLD}--- MISSION PARAMETER SETUP ---${COLOR_RESET}`);
    console.log("Please define the initial conditions for this landing attempt.");

    const altitude = await getNumericInput(rl, "Initial Altitude (m)", DEFAULT_INITIAL_ALTITUDE);
    const velocity = await getNumericInput(rl, "Initial Downward Velocity (m/s)", DEFAULT_INITIAL_VELOCITY);
    const fuel = await getNumericInput(rl, "Initial Fuel (kg)", DEFAULT_INITIAL_FUEL);
    const safeSpeed = await getNumericInput(rl, "Maximum Safe Landing Speed (m/s)", DEFAULT_SAFE_LANDING_SPEED);

    console.log(`${COLOR_GREEN}Parameters accepted.${COLOR_RESET}`);
    await Bun.sleep(1500); // Pause to review parameters

    return { altitude, velocity, fuel, safeSpeed };
}


// startCountdown displays the launch countdown sequence.
async function startCountdown() {
  clearScreen();
  console.log(`\n${COLOR_CYAN}${BOLD}INITIALIZING LUNAR DESCENT SEQUENCE${COLOR_RESET}`);
  await Bun.sleep(1500);

  for (let i = 3; i >= 0; i--) {
    clearScreen();
    if (i > 0) {
      console.log(`\n${COLOR_YELLOW}${i}...${COLOR_RESET}`);
    } else {
      console.log(`\n${COLOR_RED}${BOLD}IGNITION!!!${COLOR_RESET}`);
    }
    await Bun.sleep(1000);
  }

  clearScreen();
  console.log(`\n${COLOR_GREEN}${BOLD}🚀 LUNAR DESCENT INITIATED 🚀${COLOR_RESET}\n`);
  await Bun.sleep(1500);
}

// displayFinalReport shows the outcome of the landing attempt.
// Now accepts safeLandingSpeed to display the correct limit
async function displayFinalReport(lander, safeLandingSpeed) {
    clearScreen(); // Clear one last time for final message
    console.log(COLOR_PURPLE + "--- Landing Report ---" + COLOR_RESET);

    // Use impactVelocity if available, otherwise current velocity (might be 0 if landed/crashed)
    const finalVelocity = lander.impactVelocity ?? lander.velocity;
    const finalVelocityDirection = finalVelocity > 0 ? "(DOWN)" : (finalVelocity < 0 ? "( UP )" : "( ---)");
    const finalFuelStatus = lander.outOfFuel ? `${COLOR_RED}(EMPTY)${COLOR_RESET}` : "";
    const finalStatus = `
ALTITUDE: ${lander.altitude.toFixed(1).padStart(8)} m
VELOCITY: ${Math.abs(finalVelocity).toFixed(1).padStart(8)} m/s ${finalVelocityDirection.padEnd(6)} (at impact)
FUEL:     ${lander.fuel.toFixed(0).padStart(8)} kg ${finalFuelStatus}
THRUST:   ${lander.thrust.toFixed(0).padStart(8)} % (final)`;

    console.log(finalStatus);
    console.log(COLOR_PURPLE + "----------------------" + COLOR_RESET);
    await Bun.sleep(500); // Pause for effect

    if (lander.landed) {
        console.log(`\n${COLOR_CYAN}${BOLD}CONTACT LIGHT!${COLOR_RESET}`);
        await Bun.sleep(1000); // Dramatic pause
        console.log(`${COLOR_GREEN}${BOLD}SUCCESSFUL LANDING! The Eagle has landed!${COLOR_RESET}`);
        console.log(`Final Velocity: ${finalVelocity.toFixed(2)} m/s (Limit: ${safeLandingSpeed.toFixed(1)} m/s)`);
        console.log(`Fuel Remaining: ${lander.fuel.toFixed(0)} kg`);
    } else if (lander.crashed) {
        console.log(`\n${COLOR_CYAN}${BOLD}CONTACT LIGHT!${COLOR_RESET}`);
        await Bun.sleep(1000); // Dramatic pause
        // Use the mission-specific safe landing speed in the message
        console.log(`${COLOR_RED}${BOLD}CRASH! Landing velocity (${Math.abs(finalVelocity).toFixed(1)} m/s) exceeded safe limit (${safeLandingSpeed.toFixed(1)} m/s)!${COLOR_RESET}`);
        console.log(`Fuel Remaining: ${lander.fuel.toFixed(0)} kg`);
    } else {
        // This case happens if interrupted before landing
        console.log(`\n${COLOR_YELLOW}Simulation ended before landing.${COLOR_RESET}`);
    }

    console.log("\nExiting simulation.");
}


// --- Main Game Logic ---

async function moonLanding() {
  let intervalId = null; // To store the interval timer ID
  let gameRunning = true;
  const rl = readline.createInterface({ input, output });

  // --- Get Parameters Before Launch ---
  const { altitude, velocity, fuel, safeSpeed } = await getInitialParameters(rl);
  const lander = new LunarLander(altitude, velocity, fuel, safeSpeed); // Use pilot's parameters

  // Handle Ctrl+C gracefully
  const handleInterrupt = async () => {
    if (!gameRunning) return; // Prevent double execution if already stopping
    console.log("\nInterrupt received, stopping simulation.");
    gameRunning = false;
    if (intervalId) clearInterval(intervalId);
    rl.close(); // Close readline interface
    // Display final report even on interrupt, passing the safeSpeed
    await displayFinalReport(lander, safeSpeed);
    process.exit(0);
  };
  process.on('SIGINT', handleInterrupt);

  await startCountdown();

  clearScreen();
  console.log(`${COLOR_WHITE}INPUT THRUST PERCENTAGE (0-100), then press ENTER${COLOR_RESET}`);
  // Use the mission-specific safe speed in the goal message
  console.log(`${COLOR_WHITE}GOAL: Land with velocity <= ${safeSpeed.toFixed(1)} m/s${COLOR_RESET}\n`);
  console.log(lander.getStatus()); // Initial status

  // Function to ask for input
  const askForThrust = async () => {
    if (!gameRunning) return; // Don't ask if game stopped

    try {
        // Add a check here to ensure rl is not closed before questioning
        if (rl.closed) return;
        const answer = await rl.question(`Enter thrust (0-100): `);
        if (!gameRunning || rl.closed) return; // Check again after await

        const thrustInput = parseInt(answer, 10);

        if (!isNaN(thrustInput)) {
            lander.setThrust(thrustInput);
        } else if (answer.trim() !== '') { // Ignore empty input, reprompt for invalid
            console.log(`${COLOR_RED}Invalid input. Please enter a number.${COLOR_RESET}`);
        }
        // Ask again immediately after processing, only if game is still running
        if (gameRunning && !rl.closed) {
           askForThrust(); // Recursive call to keep asking
        }
    } catch (err) {
        // Handle potential errors like readline closing unexpectedly
        if (gameRunning && !rl.closed) { // Only log error if game was supposed to be running
            console.error("\nError reading input:", err.message);
            // Trigger graceful shutdown similar to SIGINT
            await handleInterrupt();
        } else if (!rl.closed) {
            // If game stopped but rl isn't closed yet, close it.
            rl.close();
        }
    }
  };

  // Start the input loop
  askForThrust();

  // --- Main Simulation Loop ---
  lander.lastUpdateTime = Date.now(); // Initialize time for first dt calculation
  intervalId = setInterval(async () => {
    if (!gameRunning) {
      clearInterval(intervalId);
      if (!rl.closed) rl.close(); // Ensure readline is closed
      return;
    }

    lander.updatePhysics();

    // Clear previous status and input prompt line before drawing new status
    clearScreen();
    console.log(lander.getStatus());

    if (lander.outOfFuel && lander.thrust > 0) {
        // This condition might not be hit often if thrust is auto-set to 0 when fuel runs out
        console.log(`${COLOR_YELLOW}${BOLD}FUEL EMPTY! Thrust ineffective.${COLOR_RESET}`);
    }

    // Check game over conditions
    if (lander.landed || lander.crashed) {
      gameRunning = false; // Signal to stop
      clearInterval(intervalId);
      if (!rl.closed) rl.close(); // Stop asking for input
      await displayFinalReport(lander, safeSpeed); // Show the final report, passing safeSpeed
      process.exit(0); // Exit cleanly
    }

    // Re-display the input prompt area after clearing and printing status
    // (readline handles the cursor position for the active prompt)

  }, SIMULATION_TICK_RATE_MS);
}

moonLanding().catch(err => {
    // Catch any top-level unhandled errors
    console.error("An unexpected error occurred:", err);
    process.exit(1);
});
