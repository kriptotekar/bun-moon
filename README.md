# Bun Lunar Lander Simulation 🚀🌕

A simple, text-based lunar landing simulation game written in JavaScript and designed to run with the [Bun runtime](https://bun.sh/). Test your piloting skills by safely landing a lunar module on the moon!

## Description

This script simulates the final descent phase of a lunar landing. You control the lander's thrust to counteract gravity and slow down for a soft touchdown. Manage your fuel carefully and watch your velocity!

## Features

*   **Physics Simulation:** Basic physics model including lunar gravity, thrust acceleration, and fuel consumption.
*   **Real-time Updates:** Game state updates at a regular interval (`SIMULATION_TICK_RATE_MS`).
*   **User Input:** Control the lander's thrust percentage via interactive console input.
*   **Customizable Missions:** Set initial altitude, velocity, fuel, and the maximum safe landing speed before each attempt.
*   **State Tracking:** Monitors altitude, velocity, fuel, and landing/crash status.
*   **Colorized Output:** Uses ANSI color codes for better readability and status indication (e.g., velocity warnings, fuel empty).
*   **Graceful Exit:** Handles Ctrl+C interrupts to show a final report.
*   **Cross-Platform:** Uses standard ANSI escape codes for screen clearing and colors.

## Requirements

*   Bun (v1.0 or later recommended)

## How to Run

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd <your-repo-directory>
    ```
2.  **Make the script executable (optional but recommended):**
    ```bash
    chmod +x moon-landing.js
    ```
3.  **Run the script using Bun:**
    ```bash
    bun run moon-landing.js
    ```
    *Or, if you made it executable:*
    ```bash
    ./moon-landing.js
    ```

## Gameplay

1.  **Parameter Setup:** Before launch, you'll be prompted to enter the mission parameters:
    *   Initial Altitude (meters)
    *   Initial Downward Velocity (m/s)
    *   Initial Fuel (kg)
    *   Maximum Safe Landing Speed (m/s) - *This defines your target!*
    *(You can press Enter to accept the default values)*
2.  **Countdown:** A brief countdown sequence will initiate the descent.
3.  **Control Thrust:** The simulation will start, displaying the lander's status (Altitude, Velocity, Fuel, Thrust). You will be prompted to enter a thrust percentage (0-100).
    *   Enter a number between 0 and 100 and press Enter.
    *   Higher thrust counteracts gravity more but consumes fuel faster.
    *   Lower thrust conserves fuel but allows gravity to increase your downward speed.
4.  **Monitor Status:** Keep an eye on your altitude and velocity. The velocity will be colored:
    *   **Green:** Velocity is at or below the safe landing speed you defined.
    *   **Red:** Velocity is higher than the safe landing speed.
5.  **Objective:** Land the module (`Altitude <= 0`) with a final `Velocity` less than or equal to the `Maximum Safe Landing Speed` you set *before* running out of fuel.
6.  **Outcome:**
    *   **Successful Landing:** You landed safely within the velocity limit.
    *   **Crash:** You hit the surface too fast!
    *   **Out of Fuel:** Your engine cuts out if fuel reaches zero. Landing safely becomes much harder!
    *   **Interrupted:** If you press Ctrl+C, the simulation ends.

## License
MIT

