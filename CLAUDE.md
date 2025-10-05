# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a D&D 5e spell reference application built with React and Electron. It aggregates spells from multiple sourcebooks (PHB, Xanathar's Guide, Tasha's Cauldron, etc.) and provides a filterable, searchable interface with localStorage-based favorites.

## Commands

### Development
- `npm start` - Start React dev server on http://localhost:3000
- `npm test` - Run tests in watch mode
- `npm run build` - Build production React app to `build/` folder

### Electron (Desktop App)
- `npm run electron-start` - Run Electron app in development (starts React dev server + Electron)
- `npm run electron-build` - Build Electron executable
- `npm run electron-build-and-run` - Build React app and create Electron executable

### Deployment
- `npm run deploy` - Deploy to GitHub Pages (adds CNAME, builds, deploys to gh-pages branch)

## Architecture

### Project Structure
```
src/
├── components/          # React components
│   ├── SpellList.tsx   # Main spell list component with filters (TypeScript)
│   ├── SpellList.css   # Legacy styles (being replaced by Tailwind)
│   └── ui/             # shadcn/ui components (Radix Primitives + Tailwind)
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── select.tsx
│       ├── checkbox.tsx
│       ├── dialog.tsx
│       ├── badge.tsx
│       └── scroll-area.tsx
├── data/               # JSON data files
│   ├── Spells_*.json   # Spell definitions by sourcebook
│   └── Sources.json    # Class availability mapping
├── lib/                # Shared utilities
│   └── utils.ts        # cn() helper for Tailwind class merging
├── utils/              # Utility functions
│   ├── spellParsers.js # Parse spell text (dice, saves, damage types)
│   └── spellFilters.js # Filter spells by criteria
├── hooks/              # Custom React hooks
│   └── useLocalStorage.js # Persist state to localStorage
├── constants/          # App constants
│   └── spellConstants.js  # Spell levels, types, filter options
├── App.js             # Root component - combines spell data
├── index.js           # App entry point
└── index.css          # Global styles with Tailwind directives
```

### Data Structure
- **Spell Data**: JSON files in `src/data/` directory (`Spells_PHB.json`, `Spells_XGE.json`, etc.)
  - Each spell has: name, level, school, time, range, components, duration, entries (description text), damage/saving throw info
  - Spell descriptions contain special syntax like `{@damage 1d6}` and `{@dice 2d6}` that gets parsed in the UI
- **Class Data**: `Sources.json` maps spells to available classes by sourcebook
  - Structure: `{ "SourceBook": { "SpellName": { "class": [{ "name": "ClassName", "source": "PHB" }] } } }`

### Component Architecture
- `App.js`: Combines all spell JSON files from `data/` into a single array and passes to SpellList component
- `SpellList.tsx`: Main component (TypeScript) containing:
  - **State Management**: Multiple filter states (level, class, type, concentration, action, radius, attack type, component) + search + favorites
  - **localStorage Integration**: Uses `useLocalStorage` hook to persist liked spells across sessions
  - **Filtering Logic**: Complex multi-criteria filtering using utility functions from `utils/spellParsers.js`
  - **Render**: Filter controls + liked spells info box + scrollable spell cards with expandable modal
  - **UI Components**: Uses shadcn/ui components built on Radix Primitives for accessible, composable UI elements

### Utility Functions
- **spellParsers.js**: Text parsing and spell categorization
  - `extractDiceNotation()`: Extracts damage dice notation (e.g., "1d6 fire damage")
  - `extractSaveNotation()`: Extracts saving throw requirements
  - `testDmgType()`, `testHealingType()`, `testUtilityType()`: Categorize spell types
  - `testAttackRole()`, `testSavingThrow()`: Detect attack mechanics
  - `stripFormattingTags()`: Remove special formatting from text
- **spellFilters.js**: Filter spell lists by multiple criteria
  - `filterSpells()`: Apply all filter criteria to spell array
  - `extractAvailableClasses()`: Get unique class list from spell data

### Custom Hooks
- **useLocalStorage**: Syncs React state with localStorage, automatically persisting changes

### Constants
- **spellConstants.js**: Centralized constants for spell levels (0-9), filter options (types, actions, etc.), and sourcebook abbreviations

### Key Implementation Details
- **Spell Categorization**: Damage spells detected via regex `/\d+d\d+\s+(\w+\s+)?damage/i`, healing via `HL` tag, utility is anything else
- **Special Text Parsing**: Spell descriptions use format `{@tag content}` which gets stripped to plain text via regex
- **Level Filtering Edge Case**: Spell levels are 0-indexed in data but displayed as 0-9, so filter uses `spell.level === selectedLevel - 1`
- **Component Filtering**: Filter shows spells that DON'T have selected component (inverse logic)

### Electron Integration
- Entry point: `public/electron.js`
- Development: Loads from localhost:3000 with DevTools
- Production: Loads from `build/index.html`
- Window size: 800x600 default

## UI Component System

### Technology Stack
- **Tailwind CSS v3**: Utility-first CSS framework for rapid styling
- **Radix UI Primitives**: Unstyled, accessible component primitives
- **shadcn/ui**: Pre-built components combining Radix UI + Tailwind CSS
- **class-variance-authority (cva)**: Type-safe component variants
- **tailwind-merge**: Smart class merging utility
- **clsx**: Conditional class name utility

### shadcn/ui Components
All UI components are located in `src/components/ui/` and follow shadcn/ui conventions:

- **Button** (`button.tsx`): Variant-based button component with slots
  - Variants: default, destructive, outline, secondary, ghost, link
  - Sizes: default, sm, lg, icon
- **Card** (`card.tsx`): Container component with Header, Title, Description, Content, Footer sub-components
- **Input** (`input.tsx`): Styled text input with focus states
- **Select** (`select.tsx`): Full-featured select dropdown built on Radix Select primitive
  - Includes trigger, content, item, group, label, separator components
- **Checkbox** (`checkbox.tsx`): Accessible checkbox with visual indicator
- **Dialog** (`dialog.tsx`): Modal dialog with overlay, close button, header, footer
- **Badge** (`badge.tsx`): Small label component with variant support
- **ScrollArea** (`scroll-area.tsx`): Custom scrollbar component

### Styling Guidelines

#### Tailwind Configuration
- Dark theme optimized with CSS variables in `index.css`
- Custom color palette: background, foreground, card, primary, secondary, muted, accent, destructive
- Border radius controlled via `--radius` CSS variable
- All components use HSL color format for easy theming

#### Component Styling Patterns
1. **Use `cn()` utility** from `lib/utils.ts` to merge Tailwind classes safely
   ```tsx
   import { cn } from "../../lib/utils"
   className={cn("base-classes", conditionalClass && "conditional-classes", className)}
   ```

2. **Variant-based components** use `class-variance-authority`
   ```tsx
   const variants = cva("base-classes", {
     variants: { variant: { default: "...", outline: "..." } },
     defaultVariants: { variant: "default" }
   })
   ```

3. **Dark theme approach**: All components assume dark background, use semi-transparent whites/blacks
   - Cards: `bg-card/80 backdrop-blur-xl border-border/50`
   - Inputs: `bg-background border-input focus:ring-ring`
   - Text: `text-foreground`, `text-muted-foreground`, `text-secondary-foreground`

4. **Accessibility**: All interactive components use Radix primitives with built-in ARIA attributes

#### When Adding New Components
1. Create component file in `src/components/ui/`
2. Import and extend Radix primitive (if applicable)
3. Style with Tailwind utility classes
4. Use `cn()` for class merging
5. Export component and any sub-components
6. Add TypeScript types for props

#### Custom Styling
- **Avoid inline styles** - use Tailwind utility classes
- **Avoid custom CSS files** - migrate to Tailwind classes in `index.css` or component files
- **Keep SpellList.css** for legacy compatibility during transition, but prefer Tailwind for new features

## Fluid Simulation

### Overview
Interactive WebGL2-based Eulerian fluid simulation with real-time rendering. Uses incompressible Navier-Stokes equations solved via projection method with pressure-velocity coupling.

### Architecture

**Location**: `src/components/FluidSim/`

**Key Files**:
- `FluidSimulation.tsx` - Main React component implementing the simulation loop
- `webgl-utils.ts` - WebGL2 utilities (FBO creation, program compilation, float texture support detection)
- `shaders.ts` - GLSL ES 3.0 shaders for all simulation passes
- `AmbientRimLight.tsx` - Visual effect component that samples canvas edges for ambient lighting

### Component Structure

```
src/components/FluidSim/
├── FluidSimulation.tsx    # Main simulation component
├── AmbientRimLight.tsx    # Edge-sampling rim light effect
├── webgl-utils.ts         # WebGL2 helper functions
├── shaders.ts             # All GLSL shaders
└── index.js               # Barrel export
```

### Simulation Pipeline

The simulation runs each frame in this order:

1. **Splat Pass** - Add dye color and velocity force on mouse/touch input
2. **Advect Dye** - Transport dye field along velocity field (semi-Lagrangian advection)
3. **Advect Velocity** - Self-advect velocity field with dissipation
4. **Buoyancy** - Apply upward/downward force based on dye density
5. **Boundary Enforcement** - Apply no-slip boundary conditions at edges
6. **Divergence Computation** - Calculate divergence of velocity field
7. **Pressure Solve** - Iterative Jacobi method to solve Poisson equation for pressure
8. **Projection** - Subtract pressure gradient from velocity to make it divergence-free
9. **Final Boundary Enforcement** - Re-apply boundaries after projection
10. **Display** - Render dye texture to screen

### Shaders

All shaders use GLSL ES 3.0 (`#version 300 es`):

- `baseVertexShader` - Shared vertex shader for fullscreen quad rendering
- `splatShader` - Adds dye/velocity at mouse position with Gaussian falloff
- `advectDyeShader` - Semi-Lagrangian advection for dye transport
- `advectVelocityShader` - Semi-Lagrangian advection for velocity with dissipation
- `buoyancyShader` - Applies buoyancy force based on dye density
- `boundaryShader` - Enforces no-slip boundary conditions
- `divergenceShader` - Computes divergence using central differences
- `jacobiShader` - Single Jacobi iteration for pressure solve
- `projectionShader` - Subtracts pressure gradient from velocity
- `displayShader` - Simple passthrough for rendering to screen

### Props

```typescript
interface FluidSimulationProps {
  width?: number;           // Simulation resolution width (default: 1024)
  height?: number;          // Simulation resolution height (default: 720)
  dissipation?: number;     // Dye dissipation rate (default: 0.01)
  velDissipation?: number;  // Velocity dissipation rate (default: 0.1)
  velocityScale?: number;   // Velocity multiplier (default: 200)
  splatRadius?: number;     // Mouse splat radius (default: 0.3)
  splatSpeed?: number;      // Velocity force multiplier (default: 20)
  splatColor?: [r, g, b, a];// Initial dye color (default: [1, 0.4, 0.1, 1])
  buoyancy?: number;        // Buoyancy force strength (default: -4)
  jacobiIterations?: number;// Pressure solver iterations (default: 120)
  className?: string;       // CSS class for canvas
  style?: React.CSSProperties;
  canvasRef?: React.RefObject<HTMLCanvasElement>; // External canvas ref for AmbientRimLight
}
```

### WebGL2 Requirements

- **Float Textures**: Requires `EXT_color_buffer_float` extension
- **Texture Formats**: Uses `RGBA16F` or `RGBA32F` for high precision
- **Format Detection**: `webgl-utils.ts` detects best available float format
- **Fallback**: Shows error message if float textures unsupported

### Framebuffer Objects (FBOs)

Uses double-buffered FBOs for ping-pong rendering:
- **dye** - RGBA float texture for dye color
- **velocity** - RG float texture for velocity field (2-channel)
- **pressure** - R float texture for pressure field (1-channel)
- **divergence** - R float texture for divergence (single-use, no swap)

Each FBO has `.read`, `.write`, and `.swap()` for efficient buffer switching.

### Performance Optimizations

- Resolution configurable (lower = faster, higher = more detail)
- Velocity uses RG format instead of RGBA (2x memory savings)
- Pressure uses R format instead of RGBA (4x memory savings)
- Jacobi iterations adjustable (more = accurate, fewer = faster)
- Uses `requestAnimationFrame` with delta time for smooth rendering

### AmbientRimLight Component

Visual enhancement that samples canvas edges to create ambient glow effect:

**Props**:
- `canvasRef` - Reference to FluidSimulation canvas
- `sampleRate` - Sampling frequency in ms (default: 50, higher = slower updates)
- `segmentSize` - Edge segment size in pixels (default: 25, larger = fewer samples)

**Implementation**:
- Uses `gl.readPixels()` to sample canvas edges
- Creates gradient divs around canvas perimeter
- Averages pixel colors per segment for smooth effect
- Optimized with configurable sampling rate and batch sampling

### Common Adjustments

**For Better Performance**:
- Reduce `width`/`height` (e.g., 512x360)
- Lower `jacobiIterations` (e.g., 60)
- Increase `sampleRate` for AmbientRimLight (e.g., 100ms)
- Increase `segmentSize` for AmbientRimLight (e.g., 50px)

**For Higher Quality**:
- Increase `width`/`height` (e.g., 1920x1080)
- Increase `jacobiIterations` (e.g., 200)
- Lower `dissipation` (slower fade, more detail)
- Lower `sampleRate` (smoother rim light, more CPU)

**For Different Fluid Behavior**:
- `buoyancy` - Positive floats up, negative sinks down
- `velDissipation` - Higher = viscous fluid, lower = watery
- `splatRadius` - Larger = broader strokes
- `splatSpeed` - Higher = more force, more turbulence

### Browser Compatibility

- Chrome 56+ (WebGL2 support)
- Firefox 51+ (WebGL2 support)
- Safari 15+ (WebGL2 support)
- Edge 79+ (Chromium-based)

Older browsers show error message about float texture support.

## Source Book Abbreviations
- PHB = Player's Handbook
- XGE = Xanathar's Guide to Everything
- TCE = Tasha's Cauldron of Everything
- FTD = Fizban's Treasury of Dragons
- IDROTF = Icewind Dale: Rime of the Frostmaiden
- TDCSR = Tal'Dorei Campaign Setting Reborn
- SCC = Strixhaven: A Curriculum of Chaos
