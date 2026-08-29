# Aura Workspace

Build a premium interactive prototype for a product called "Workspace Health Intelligence (WHI)."



IMPORTANT:

This is not a generic admin dashboard. Design it like a futuristic health-tech startup product. The experience should feel innovative, polished, and memorable for a hackathon judging demo.



Product concept:

Workspace Health Intelligence monitors a person's working environment and ergonomic conditions to estimate workspace health and provide actionable improvements.



Core idea:

Instead of showing only sensor numbers, the system explains WHY workspace health changes and what action the user should take.



Target users:

Students, programmers, gamers, remote workers, and professionals who spend long hours at desks.



Create a complete interactive website prototype with:



## Main Dashboard



The first screen should immediately show:



- Large animated Workspace Health Score (0-100)

- A dynamic 3D/animated visual representation of workspace health

- Current status:

  - Excellent

  - Good

  - Needs Improvement

  - Poor



The score should visually react when sensor values change.



Example:

Score decreases smoothly when conditions worsen.



Do not use simple cards everywhere.

Use:

- depth

- animations

- glassmorphism or futuristic health-tech style

- smooth transitions

- interactive elements

- modern typography





## Sensor Simulation Panel



Since hardware is not connected yet, create a realistic simulation mode.



Add controls:



1. Screen Distance Simulator

- Slider/button to move user closer or farther from screen

- Values:

  - Too close

  - Optimal

  - Too far



2. Lighting Simulator

- Slider:

  - Dark environment

  - Normal lighting

  - Bright lighting



3. Temperature Simulator

- Slider:

  - Cold

  - Comfortable

  - Hot



4. Humidity Simulator

- Slider:

  - Dry

  - Comfortable

  - High humidity





When these values change:

- Health score changes

- Visual environment changes

- Recommendations update

- Explanation updates





## Reasoning / Intelligence Layer (Most Important Feature)



Create a section called:



"Why did my workspace score change?"



This should be the main differentiator.



Example:



"Your workspace score decreased by 18 points because:

- Screen distance reduced from 60cm to 30cm

- Lighting dropped below recommended level



Suggested actions:

- Move your screen farther away

- Increase desk lighting

- Follow the 20-20-20 eye break rule"



Make it feel like an AI workspace coach.





## Recommendations



Create actionable recommendations:



Examples:



Eye strain:

"Your screen distance is low. Maintain a comfortable viewing distance."



Lighting:

"Increase ambient lighting to reduce eye fatigue."



Temperature:

"Your workspace temperature may affect comfort and concentration."



Break reminder:

"Time for a 20-20-20 eye break."



Use icons and animations.





## 20-20-20 Rule Feature



Add a productivity wellness timer.



After a configurable work session:



Show:



"Eye Recovery Break"



20 seconds countdown



Animation explaining:

Look 20 feet away for 20 seconds.





## Workspace Visualization



Create an interactive 3D workspace scene:



Include:

- desk

- monitor

- person/avatar

- lighting

- environment effects



When distance changes:

- avatar moves closer/farther



When lighting changes:

- workspace lighting changes



When temperature changes:

- environment visualization changes



This should make the demo memorable.





## Analytics Section



Include:



- Health score history

- Environment trends

- Session summary



Example:



"Your 2-hour session"



Average score: 78



Main issues:

- Low lighting

- Frequent close-screen periods





## Technical Structure



For now:

- Use simulated sensor data only

- No authentication

- No login

- No unnecessary pages



Prepare the structure so real sensors can later replace simulation values.



Architecture idea:

Sensors → NodeMCU → Firebase → Website



But currently use simulated inputs.





## Design Requirements



Avoid:

- generic AI dashboard layouts

- excessive cards

- boring tables



Create:

- startup-quality UI

- interactive storytelling

- smooth animations

- 3D/futuristic but professional design

- memorable hackathon presentation experience



The final product should make a judge understand the problem within 10 seconds and feel the intelligence of the system through interaction.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://ergonomic-glow.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9a7b49fd-0dc2-4fbd-80c9-042ee3fa2541).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
