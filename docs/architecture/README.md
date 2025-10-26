# Within the Woodpile - Arkitekturdiagram

Detta dokument beskriver arkitekturen för "Within the Woodpile" spelet, uppdaterat 2025-10-26.

## 📋 Översikt

Projektet följer **Clean Architecture**-principerna med tydlig separation av concerns:

- **Domain Layer (Core)** - Ren business logic, inga externa beroenden
- **Infrastructure Layer** - Integration med browser APIs, storage, audio, i18n
- **Presentation Layer** - Rendering och visuella effekter  
- **Application Layer** - Applikationens entry point och orchestrering
- **Shared Layer** - Typer, interfaces och konstanter

## 🗂️ Tillgängliga Diagram

### 1. **Class Diagrams** (Uppdelade för utskrift)

Klassdiagrammet är uppdelat i **6 separata diagram** för att göra dem läsbara och utskrivbara:

#### 1.1 **Core/Domain Layer** (`class-diagram-1-core.puml`)
**Innehåller:**
- `Game` (huvudklass)
- `GameLoop` (spelloop)
- Managers: `GameStateManager`, `CreatureManager`, `CollisionManager`, `LevelManager`, `HighscoreManager`
- Services: `WoodPileGenerator`, `CollapsePredictionCalculator`, `HighscoreService`, `HighscoreI18nService`

**Focus:** Ren business logic utan externa beroenden

#### 1.2 **Infrastructure Layer** (`class-diagram-2-infrastructure.puml`)
**Innehåller:**
- I18n-system (`I18n`, `TranslationLoader`)
- Input-hantering (`InputHandler`, `GameInputHandler`)
- Storage-system (`StorageService`, `LocalStorageService`, `HighscoreStorageService`, `GameDataRepository`)

**Focus:** Integration med browser APIs

#### 1.3 **Audio System** (`class-diagram-3-audio.puml`)
**Innehåller:**
- `AudioManager` (facade)
- `AudioSettings` (persistence & observers)
- `SoundService` (playback & caching)
- `SoundEvent` enum (26 ljud-events)
- Audio-interfaces och typer

**Focus:** Audio-subsystemets implementation

#### 1.4 **Presentation Layer** (`class-diagram-4-presentation.puml`)
**Innehåller:**
- `BaseRenderer` (abstract base)
- Game renderers: `GameRenderer`, `WoodPieceRenderer`, `UIRenderer`
- Menu renderers: `MenuRenderer`, `LogoRenderer`, `BackgroundRenderer`
- Effects: `WoodCollapseAnimator`, `ScreenShakeManager`, `CollapseParticleSystem`, `MenuParticleSystem`

**Focus:** Rendering och visuella effekter

#### 1.5 **UI Components** (`class-diagram-5-ui.puml`)
**Innehåller:**
- Menu: `MenuButtonManager`
- Highscore: `HighscoreModal`, `HighscoreTable`, `StatisticsPanel`, `AddScoreDialog`
- Settings: `SettingsModal`, `InstructionsModal`

**Focus:** DOM-baserade UI-komponenter

#### 1.6 **Types & Shared** (`class-diagram-6-types.puml`)
**Innehåller:**
- Core types: `Position`, `WoodPiece`, `GameState`
- Enums: `CreatureType`, `GameMode`, `AppState`, `Language`, `AudioCategory`, `SoundEvent`
- Highscore types: `HighscoreEntry`, `Statistics`
- Audio types: `AudioConfig`, `VolumeSettings`
- Rendering types: `MenuButton`, `Particle`

**Focus:** Delade typer och interfaces

**Användning:**
```bash
# Generera alla diagram
plantuml class-diagram-1-core.puml
plantuml class-diagram-2-infrastructure.puml
plantuml class-diagram-3-audio.puml
plantuml class-diagram-4-presentation.puml
plantuml class-diagram-5-ui.puml
plantuml class-diagram-6-types.puml

# Eller alla samtidigt
plantuml class-diagram-*.puml
```

> **💡 Tips för utskrift:** Varje diagram är optimerat för A4-utskrift med `dpi 150` och innehåller 100-150 rader vardera.

### 2. **Component Diagram** (`component-diagram-2025.puml`)
Visar systemets komponenter och deras beroenden enligt Clean Architecture.

**Visar:**
- Lagring i lager (Domain, Infrastructure, Presentation, Application)
- Beroenderiktning (alltid inåt mot Domain)
- Browser API-integration
- Barrel exports och modulsystem

**Användning:**
```bash
plantuml component-diagram-2025.puml
```

### 3. **Data Flow Diagram** (`dataflow-diagram-2025.puml`)
Visar hur data flödar genom systemet vid olika scenarier.

**Scenarios:**
- App-initialisering
- Meny till spel-övergång
- Spelloop (input, rendering, state updates)
- Creature-interaktion
- Game over och highscore
- Språkbyte
- Audio-kontroll

**Användning:**
```bash
plantuml dataflow-diagram-2025.puml
```

### 4. **Audio System Diagram** (`audio-system-diagram.puml`)
Detaljerad vy av audio-systemets arkitektur.

**Visar:**
- AudioManager (facade)
- AudioSettings (persistence & observers)
- SoundService (playback & caching)
- SoundEvent enum (alla ljud i spelet)
- Integration med Web Audio API
- LocalStorage-persistens

**Användning:**
```bash
plantuml audio-system-diagram.puml
```

### 5. **Highscore System Diagram** (`highscore-system-diagram.puml`)
Detaljerad vy av highscore-systemets arkitektur.

**Visar:**
- HighscoreManager (facade)
- HighscoreService (business logic)
- HighscoreStorage (persistence)
- HighscoreI18nService (formattering)
- UI-komponenter (Modal, Table, Statistics, Dialog)
- Data flow för add/view scores

**Användning:**
```bash
plantuml highscore-system-diagram.puml
```

## 🏗️ Arkitektur-principer

### Clean Architecture

```
┌─────────────────────────────────────┐
│   Application Layer (Main)          │  ← Entry point
├─────────────────────────────────────┤
│   Presentation Layer (Renderers)    │  ← UI & Rendering
├─────────────────────────────────────┤
│   Infrastructure Layer               │  ← External systems
│   (I18n, Audio, Storage, Input)     │
├─────────────────────────────────────┤
│   Domain Layer (Core)                │  ← Business logic
│   (Game, Managers, Services)        │     (No dependencies)
├─────────────────────────────────────┤
│   Shared Layer                       │  ← Types & Constants
│   (Types, Interfaces, Config)       │
└─────────────────────────────────────┘
```

**Beroenderegel:**
- Beroenden pekar **endast inåt**
- Domain-lagret har **inga** externa beroenden
- Infrastructure implementerar interfaces definierade i Domain
- Application-lagret orchestrerar allt

### Design Patterns

Projektet använder flera etablerade design patterns:

1. **Facade Pattern**
   - `AudioManager` - Förenklad access till audio-subsystemet
   - `HighscoreManager` - Förenklad access till highscore-subsystemet

2. **Observer Pattern**
   - `AudioSettings.addChangeListener()` - Audio settings ändringar
   - `GameStateManager` callbacks - State ändringar
   - `CreatureManager` callbacks - Creature events

3. **Repository Pattern**
   - `HighscoreService` - Abstraherar dataaccess
   - `GameDataRepository` - Abstraherar storage

4. **Strategy Pattern**
   - `DifficultyConfig` - Olika svårighetsgrader
   - `LevelManager` - Level-baserad konfiguration

5. **Composite Pattern**
   - `GameRenderer` → `WoodPieceRenderer` + `UIRenderer`
   - `MenuRenderer` → `LogoRenderer` + `BackgroundRenderer`
   - `HighscoreModal` → `Table` + `Statistics` + `Dialog`

6. **Singleton Pattern** (soft)
   - `I18n` - En instans per applikation
   - `AudioManager` - En instans per applikation

## 📦 Modul-struktur

```
src/
├── core/                    # Domain Layer
│   ├── game/               # Game controller & loop
│   ├── managers/           # State, Creature, Collision, Level, Highscore
│   └── services/           # Wood generator, Collapse calculator, Highscore
├── infrastructure/          # Infrastructure Layer
│   ├── audio/              # Audio system (Manager, Settings, Service)
│   ├── i18n/               # Internationalization
│   ├── input/              # Input handling
│   └── storage/            # LocalStorage abstraction
├── presentation/            # Presentation Layer
│   └── renderers/
│       ├── shared/         # BaseRenderer
│       ├── game/           # Game rendering
│       └── menu/           # Menu rendering
├── particles/               # Particle systems
├── ui/                      # UI Components
│   └── highscore/          # Highscore UI
├── types/                   # Shared types
├── shared/                  # Constants & config
└── main.ts                  # Application entry point
```

## 🔄 Data Flow Exempel

### Spelaren klickar på ved

```
Player → Input → Game → CreatureManager?
                  ↓
              StateManager (score++)
                  ↓
              WoodGenerator (check collapse)
                  ↓
              AudioManager (play sound)
                  ↓
              GameRenderer → Canvas
```

### Audio-inställningar ändras

```
Settings Modal → AudioManager.updateSettings()
                      ↓
                 AudioSettings.setMasterVolume()
                      ↓
                 localStorage (persist)
                      ↓
                 notifyListeners()
                      ↓
                 SoundService.updateAllPlayingSoundsVolume()
```

### Nytt highscore

```
Game Over → Main.handleGameOver()
              ↓
          HighscoreManager.isHighScore()
              ↓
          AddScoreDialog.show()
              ↓
          HighscoreManager.addScore()
              ↓
          HighscoreService.addScore()
              ↓
          HighscoreStorage.saveScores()
              ↓
          localStorage
```

## 🎯 Viktiga Designbeslut

### 1. **Ingen direkt DOM-manipulation i Game-klassen**
   - Alla UI-updates går genom callbacks
   - Separation mellan game logic och UI

### 2. **Audio-systemet är helt valfritt**
   - Graceful degradation om ljudfiler saknas
   - Spelet fungerar utan audio

### 3. **I18n är centraliserad**
   - En I18n-instans delas av alla komponenter
   - Översättningar laddas asynkront

### 4. **LocalStorage är abstrakt**
   - Implementeras via `LocalStorageService`
   - Lätt att byta till annan storage (IndexedDB, SessionStorage, etc.)

### 5. **Rendering är composable**
   - BaseRenderer för gemensam funktionalitet
   - Specialiserade renderers för olika delar
   - Lätt att lägga till nya visuella effekter

### 6. **State är centraliserad**
   - `GameStateManager` är single source of truth
   - Callbacks för reaktiv uppdatering
   - Immutable state updates

## 📊 Metrics

Baserat på den faktiska koden (2025-10-26):

- **Totalt antal TypeScript-filer:** ~100+
- **Totalt antal tester:** 247 (alla passerar ✅)
- **Test coverage:** Hög (Core, Infrastructure, Presentation, UI)
- **Code organization:** Clean Architecture med strict layer separation
- **External dependencies:** Minimala (Vitest, Playwright för testning)

## 🔧 Verktyg för Diagram

### PlantUML Installation

**Windows:**
```bash
choco install plantuml
# eller
scoop install plantuml
```

**Mac:**
```bash
brew install plantuml
```

**Linux:**
```bash
sudo apt install plantuml  # Debian/Ubuntu
sudo pacman -S plantuml    # Arch
```

### VS Code Extension

Installera "PlantUML" extension:
```
code --install-extension jebbs.plantuml
```

Sedan kan du:
- Öppna `.puml` filer
- Tryck `Alt+D` för preview
- Högerklicka → "Export Current Diagram" för PNG/SVG

### Online Viewer

Om du inte vill installera något lokalt:
- [PlantUML Online Server](http://www.plantuml.com/plantuml/uml/)
- [PlantText](https://www.planttext.com/)

## 📝 Uppdatera Diagram

När koden ändras, uppdatera diagram:

1. **Nya klasser/komponenter:**
   - Lägg till i `class-diagram-2025.puml`
   - Uppdatera `component-diagram-2025.puml`

2. **Nya dataflöden:**
   - Lägg till scenario i `dataflow-diagram-2025.puml`

3. **Audio/Highscore ändringar:**
   - Uppdatera respektive specialdiagram

4. **Versionshantering:**
   - Skapa ny fil med datum: `diagram-name-YYYY-MM-DD.puml`
   - Eller uppdatera befintlig och commit till git

## 🤝 Bidra

När du lägger till nya features:

1. Följ Clean Architecture-principerna
2. Uppdatera relevanta diagram
3. Lägg till tester
4. Dokumentera design decisions i denna README

## 📚 Läs mer

- [Clean Architecture (Robert C. Martin)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [PlantUML Documentation](https://plantuml.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Senast uppdaterad:** 2025-10-26  
**Författare:** Fredrik Svensson  
**Projekt:** Within the Woodpile - Alla kodares buggiga natt 2025
