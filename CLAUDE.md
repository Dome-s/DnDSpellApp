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
│   ├── SpellList.js    # Main spell list component with filters
│   └── SpellList.css   # Styles for spell list
├── data/               # JSON data files
│   ├── Spells_*.json   # Spell definitions by sourcebook
│   └── Sources.json    # Class availability mapping
├── utils/              # Utility functions
│   ├── spellParsers.js # Parse spell text (dice, saves, damage types)
│   └── spellFilters.js # Filter spells by criteria
├── hooks/              # Custom React hooks
│   └── useLocalStorage.js # Persist state to localStorage
├── constants/          # App constants
│   └── spellConstants.js  # Spell levels, types, filter options
├── App.js             # Root component - combines spell data
└── index.js           # App entry point
```

### Data Structure
- **Spell Data**: JSON files in `src/data/` directory (`Spells_PHB.json`, `Spells_XGE.json`, etc.)
  - Each spell has: name, level, school, time, range, components, duration, entries (description text), damage/saving throw info
  - Spell descriptions contain special syntax like `{@damage 1d6}` and `{@dice 2d6}` that gets parsed in the UI
- **Class Data**: `Sources.json` maps spells to available classes by sourcebook
  - Structure: `{ "SourceBook": { "SpellName": { "class": [{ "name": "ClassName", "source": "PHB" }] } } }`

### Component Architecture
- `App.js`: Combines all spell JSON files from `data/` into a single array and passes to SpellList component
- `SpellList.js`: Main component containing:
  - **State Management**: Multiple filter states (level, class, type, concentration, action, radius, attack type, component) + search + favorites
  - **localStorage Integration**: Uses `useLocalStorage` hook to persist liked spells across sessions
  - **Filtering Logic**: Complex multi-criteria filtering using utility functions from `utils/spellParsers.js`
  - **Render**: Filter controls + liked spells info box + scrollable spell cards with collapsible details

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

## Source Book Abbreviations
- PHB = Player's Handbook
- XGE = Xanathar's Guide to Everything
- TCE = Tasha's Cauldron of Everything
- FTD = Fizban's Treasury of Dragons
- IDROTF = Icewind Dale: Rime of the Frostmaiden
- TDCSR = Tal'Dorei Campaign Setting Reborn
- SCC = Strixhaven: A Curriculum of Chaos
