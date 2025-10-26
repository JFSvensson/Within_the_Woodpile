# Within the Woodpile 🌲
Ett spel skapat för **Alla kodares buggiga natt 2025** av Fredrik Svensson med hjälp av **GitHub Copilot** och AI-assisterad utveckling.

## Om spelet
Du är en person som ska plocka ved ur en vedstapel. Men akta dig - bakom veden kan det finnas farliga djur och läskiga varelser! Vedhögen kan också rasa om du inte är försiktig.

Spelet har **fullständig startmeny** med animerad skogsglänta-bakgrund, **flerspråksstöd** (svenska och engelska), och **avancerad kollapsförutsägelse** som visar exakt vilka pinnar som påverkas av ditt drag.

## Spelmekanik

### Startmeny 🎮
- **Animerad skogsglänta-bakgrund** med svajande träd
- **Fallande löv-partiklar** för atmosfär
- **Animerad vedstapel-logotyp** med "andning"-effekt
- **Träknapp-design** med hover-effekter
- **Språkväljare** i header för direkt tillgång
- **Smooth övergångar** med fade-effekter mellan meny och spel

### Grundläggande spelande
- **Klicka på ved** för att plocka den (runda vedpinnar)
- **Samla poäng** genom att plocka ved och undvika faror
- **Undvik faror** som kan kosta dig hälsa
- **Smart hover-feedback** visar vilka pinnar som påverkas av ditt drag

### Intelligent kollapsförutsägelse 🧠
När du hovrar över en vedpinne visas:
- **🟡 Gul hover-ram**: Den pinne du kan ta
- **🔴 Röd solid ram + pulsande effekt**: Pinnar som kommer att rasa
- **🟠 Orange streckad**: Hög risk för ras
- **🟡 Gul streckad**: Medel risk för ras
- **🟨 Ljusgul prickad**: Låg risk för ras
- **✨ Sekundäreffekt-analys**: Beräknar kedjereaktion av kollaps

### Varelser och reaktioner
När du plockat en vedpinne som gömmer en varelse har du en kort tid på dig att reagera:

- 🕷️ **Spindel**: Tryck `MELLANSLAG` för att blåsa bort den
- 🐝 **Geting**: Tryck `ESCAPE` för att ducka
- 🦔 **Igelkott**: Tryck `S` för att backa sakta
- 👻 **Spöke**: Tryck `L` för att tända lyktan
- 🎃 **Pumpahuvud**: Tryck `R` för att springa

Varelser visas med:
- **Pulsande emoji** och glow-effekt
- **Progressbar** som visar återstående tid
- **Tangentinstruktioner** på skärmen

### Highscore-system 🏆
Komplett highscore-tracking med automatisk integration:

#### Funktionaliteter
- **Automatisk score-tracking** från spelstart till game over
- **Intelligent level-beräkning** baserat på poäng (Level 1: 0-99p, Level 2: 100-299p, osv.)
- **Speltids-tracking** för fullständig statistik
- **Automatisk kvalifikationskontroll** - bara kvalificerade scores får lägga till highscore
- **Top 10-systemet** med lokal lagring (LocalStorage)

#### UI-komponenter
- **🏆 Highscore-knapp** i huvudmenyn för enkel åtkomst
- **HighscoreModal** med tre huvudvyer:
  - **📊 Leaderboard**: Top 10-lista med position, namn, poäng, level, speltid och datum
  - **➕ Add Score**: Dialog för att lägga till ny highscore (visas automatiskt efter kvalificerat spel)
  - **📈 Statistics**: Översikt av spelstatistik och prestationer
- **Seamless integration** - från game over direkt till Add Score-dialog för kvalificerade poäng
- **🌍 Flerspråksstöd** med över 60 översättningssträngar (svenska/engelska)

#### Game Over-flöde
1. **Spelet slutar** → Beräkna final score, level och speltid
2. **Qualification check** → Kontrollera automatiskt om score kvalificerar för top 10
3. **Kvalificerad** → Visa highscore modal med Add Score-dialog förifylld
4. **Ej kvalificerad** → Visa meddelande och återgå till meny
5. **Komplett datalagring** → Namn, poäng, level, speltid och datum sparas lokalt

#### Arkitektur
- **Clean Architecture** med separata lager för domain logic, services och UI
- **HighscoreManager**: Koordinerar business logic med internationalisering
- **HighscoreService**: Ren business logic för highscore-hantering
- **HighscoreStorageService**: LocalStorage-implementation med IHighscoreRepository
- **HighscoreI18nService**: Lokaliserade meddelanden och formatering
- **Type-safe**: Kompletta TypeScript-definitioner för alla highscore-objekt

### Avancerad fysik och rendering
- **Brick-pattern stapel**: Vedpinnar staplas omväxlande för realistisk stabilitet
- **Runda vedpinnar**: Cirkulär geometri med realistisk trätextur och årensringar
- **Sekundära effekter**: Rasande pinnar kan få andra att förlora stöd
- **Grundstöd**: Pinnar på marken har ingen rasrisk
- **Stödberäkning**: Använder centrum-till-centrum-distans för runda pinnar
- **Layered rendering**: Visar påverkade pinnar med korrekt z-order

### Kollaps-animationer och effekter 🎬
När vedstapeln rasar kommer du uppleva:

#### WoodCollapseAnimator - Fysikbaserade fallanimationer
- **Realistisk gravitation**: 0.5 px/frame² för naturlig acceleration
- **Max fallhastighet**: 15 px/frame för kontrollerad animation
- **Dynamisk rotation**: Slumpmässig rotation (-0.15 till 0.15 rad/frame) för organisk känsla
- **Smooth fade-out**: Gradvis transparency över 1 sekund när veden faller
- **Individuell animering**: Varje vedpinne animeras separat med unika egenskaper

#### CollapseParticleSystem - Dramatiska partikeleffekter
- **Intensitetsbaserade partiklar**: 15-50 partiklar beroende på kollapsstorlek
- **Två partikeltyper**:
  - 30% träflisor (rektangulära, 3-7px) med brun färgton
  - 70% damm (cirkulära, 2-5px) med ljusbrun/beige färg
- **Realistisk fysik**:
  - Gravitation: 0.3 px/frame² för lätta partiklar
  - Luftmotstånd: 0.98 för naturlig avklingning
  - Slumpmässig initial hastighet i alla riktningar
- **Livscykel**: 1-2 sekunder med gradvis fade-out

#### ScreenShakeManager - Intensitetsbaserad skärmskakning
- **Dynamisk shake-intensitet**: 
  - Bas-shake: 5px
  - +2px per kollapsande vedpinne
  - Max: 20px för stora kollaps (6+ pinnar)
- **Adaptiv varaktighet**:
  - Bas: 250ms
  - +50ms per vedpinne
  - Max: 600ms
- **Smooth avklingning**: Exponentiell decay för professionell känsla
- **Subtil rotation**: ±0.01 radianer för extra djup

**Användarupplevelse:**
- 🟢 **Små kollaps (1-2 pinnar)**: Subtil skakning, få partiklar, snabb animation
- 🟡 **Medelstora kollaps (3-5 pinnar)**: Tydlig skakning, mer partiklar, dramatisk känsla
- 🔴 **Stora kollaps (6+ pinnar)**: Kraftig skakning, många partiklar, kaotisk och impactfull effekt

### Ljudsystem 🔊
Komplett AudioManager för immersiv spelupplevelse:

#### AudioManager-funktioner
- **Master Volume**: Huvudvolymkontroll (0-100%)
- **Separata kanaler**:
  - Sound Effects: Spelljud och effekter
  - Music: Bakgrundsmusik
  - UI Sounds: Meny- och knappljud
- **Play/Pause/Stop-kontroller** för musik
- **Mute-funktionalitet** per kanal
- **Persistent inställningar** via LocalStorage

#### AudioSettings UI
- **Modern toggle-design**: iOS-inspirerade switches för varje ljudkanal
- **Volume slider**: Custom-stylad range input med live-förhandsgranskning
- **Visual feedback**: Färgkodade toggles (grön = på, grå = av)
- **Responsiv layout**: Fungerar på alla enheter
- **Flerspråksstöd**: Alla labels och beskrivningar lokaliserade (sv/en)

## Teknisk info

### Utvecklat med
- **TypeScript** för typning och struktur
- **HTML5 Canvas** för 2D-grafik med runda vedpinnar
- **Clean Architecture** med domain/infrastructure/presentation separation
- **BaseRenderer Pattern** för konsistent rendering-hierarki
- **Barrel Exports** för modulär export-struktur
- **Internationalisering (i18n)** med JSON-språkfiler
- **State management** med AppStateManager och TransitionManager
- **Responsive design** med ResponsiveManager för adaptiv canvas-skalning
- **Modern ES modules** och SOLID-principles
- **GitHub Copilot** för AI-assisterad kodutveckling

### Projektstruktur
```
src/
├── main.ts                       # Startpunkt och app-initialisering
├── appStateManager.ts            # State management (meny ↔ spel)
├── TransitionManager.ts          # Smooth övergångar med fade-effekter
├── ResponsiveManager.ts          # Responsiv canvas-hantering
├── types/                        # Typ-definitioner (modulär)
│   ├── index.ts                  # Barrel export för alla typer
│   ├── game.ts                   # Spel-relaterade typer
│   ├── ui.ts                     # UI-komponenter och meny-typer
│   ├── config.ts                 # Konfigurations-typer
│   ├── difficulty.ts             # ✨ Svårighetsgrad och nivå-typer
│   └── highscore.ts              # Highscore-typer
├── shared/                       # Delade konstanter och utilities
│   └── constants/
│       ├── index.ts              # Barrel export
│       ├── gameConfig.ts         # DEFAULT_CONFIG och spelkonfiguration
│       ├── keyBindings.ts        # Tangentbindningar för varelser
│       └── difficultyConfig.ts   # ✨ Svårighetsgrad-konfigurationer och nivåprogression
├── core/                         # Kärnlogik och domän (Clean Architecture)
│   ├── index.ts                  # Barrel export
│   ├── game/
│   │   ├── Game.ts               # Huvudspellogik och state management
│   │   ├── GameLoop.ts           # Spel-loop och timing
│   │   └── index.ts
│   ├── managers/
│   │   ├── CollisionManager.ts   # Kollisionsdetektering
│   │   ├── CreatureManager.ts    # Varelse-hantering och spawning
│   │   ├── GameStateManager.ts   # Spelstatus och poäng
│   │   ├── HighscoreManager.ts   # Högsta nivå highscore-manager med i18n
│   │   ├── LevelManager.ts       # ✨ Nivåprogression och svårighetsgrad-hantering
│   │   └── index.ts
│   └── services/
│       ├── CollapsePredictionCalculator.ts # Intelligent kollapsförutsägelse
│       ├── WoodPileGenerator.ts  # Genererar vedstapel med brick-pattern
│       ├── HighscoreService.ts   # Ren business logic för highscores
│       ├── HighscoreI18nService.ts # Lokaliserade meddelanden och formatering
│       └── index.ts
├── infrastructure/               # Externa integrationer (Clean Architecture)
│   ├── index.ts                  # Barrel export
│   ├── audio/                    # Ljudsystem
│   │   ├── AudioManager.ts       # Huvudklass för ljudhantering
│   │   ├── AudioSettings.ts      # Persistent ljudinställningar
│   │   ├── SoundService.ts       # Ljudeffekt-service
│   │   ├── types.ts              # Audio-typdefinitioner
│   │   └── index.ts
│   ├── i18n/
│   │   ├── I18n.ts               # Internationalisering-klass
│   │   ├── index.ts
│   │   └── data/
│   │       ├── sv.json           # Svenska översättningar
│   │       └── en.json           # Engelska översättningar
│   ├── input/
│   │   ├── GameInputHandler.ts   # Mus- och tangentbords-input
│   │   ├── interfaces.ts         # Input-kontrakt
│   │   └── index.ts
│   └── storage/
│       ├── LocalStorageService.ts # Browser localStorage-wrapper
│       ├── GameDataRepository.ts # Data-persistering
│       ├── HighscoreStorageService.ts # Highscore LocalStorage-implementation
│       ├── interfaces.ts         # Storage-kontrakt
│       └── index.ts
├── presentation/                 # UI och rendering (Clean Architecture)
│   ├── index.ts                  # Barrel export
│   └── renderers/
│       ├── index.ts              # Huvudbarrel export
│       ├── shared/
│       │   ├── BaseRenderer.ts   # Abstrakt basklass för alla renderare
│       │   └── index.ts
│       ├── game/
│       │   ├── GameRenderer.ts   # Koordinerar all spelrendering
│       │   ├── WoodPieceRenderer.ts # Runda vedpinnar med textur
│       │   ├── WoodCollapseAnimator.ts # Fysikbaserade fallanimationer
│       │   ├── UIRenderer.ts     # Varelser och UI-element
│       │   └── index.ts
│       └── menu/
│           ├── MenuRenderer.ts   # Fullständig menyrendering
│           ├── LogoRenderer.ts   # Animerad logo med vedstapel
│           ├── BackgroundRenderer.ts # Skogsglänta med träd
│           ├── ScreenShakeManager.ts # Skärmskakning för kollaps
│           └── index.ts
├── ui/
│   ├── MenuButtonManager.ts      # Knappar och interaktion
│   └── highscore/                # Komplett highscore UI-system
│       ├── HighscoreModal.ts     # Huvudkomponent för highscore-modalen
│       ├── HighscoreTable.ts     # Top 10-lista med formatering
│       ├── AddScoreDialog.ts     # Dialog för att lägga till ny score
│       ├── StatisticsPanel.ts    # Spelstatistik och översikter
│       └── index.ts
└── particles/
    ├── MenuParticleSystem.ts     # Fallande löv-partiklar
    └── CollapseParticleSystem.ts # Träflisor och damm vid kollaps
```

### Arkitektur
Projektet följer **Clean Architecture** och **clean code-principer** med AI-assisterad design:

#### Clean Architecture Layers 🏗️
- **Domain (Core)**: Affärslogik, entiteter och use cases
  - `src/core/game/` - Kärnspellogik
  - `src/core/managers/` - Domän-managers
  - `src/core/services/` - Domän-tjänster
- **Infrastructure**: Externa integrationer och teknisk implementation
  - `src/infrastructure/i18n/` - Internationalisering
  - `src/infrastructure/input/` - Input-hantering
  - `src/infrastructure/storage/` - Data-persistering
- **Presentation**: UI, rendering och användarinteraktion
  - `src/presentation/renderers/` - Alla renderare med BaseRenderer-hierarki
- **Application Layer**: High-level koordination och transitions
  - `src/AppStateManager.ts` - State-hantering för app-nivå
  - `src/TransitionManager.ts` - Smooth övergångar mellan states
  - `src/ResponsiveManager.ts` - Responsiv canvas-anpassning
- **Shared**: Delade utilities och konstanter
  - `src/shared/constants/` - Konfiguration och konstanter
  - `src/types/` - TypeScript-typedefinitioner

#### SOLID Principles 💎
- **Single Responsibility Principle**: Varje klass har ett specifikt syfte
- **Open/Closed Principle**: BaseRenderer möjliggör utökning utan modifikation
- **Liskov Substitution**: Alla renderare kan användas utbytbart via BaseRenderer
- **Interface Segregation**: Minimala, fokuserade interfaces
- **Dependency Inversion**: Hög-nivå moduler beror inte på låg-nivå detaljer

#### Design Patterns 🎨
- **Abstract Factory**: BaseRenderer för renderare-familjer
- **Strategy Pattern**: Olika renderare för olika visningsstrategier  
- **Observer Pattern**: Event-driven kommunikation mellan komponenter
- **Repository Pattern**: GameDataRepository för data-abstraktion
- **Barrel Exports**: Modulär export-struktur för ren arkitektur

## Kom igång

### Installation
```bash
npm install
```

### Utveckling
```bash
npm run dev    # Kompilera TypeScript i watch-mode
```

### Bygg projektet
```bash
npm run build  # Kompilerar och kopierar filer till dist/
```

### Kör spelet
1. Bygg projektet: `npm run build`
2. Öppna `dist/index.html` i webbläsaren
3. Eller använd VS Code Live Server på `dist/index.html`

### Testning 🧪
Projektet har omfattande testtäckning med **1325 automatiserade tester** och **86.24% code coverage** (85%-målet uppnått! 🎉🎊):

```bash
npm test              # Kör alla tester med Vitest
npm run test:watch    # Kör tester i watch-mode
npm run test:coverage # Generera täckningsrapport
```

#### Test-arkitektur
- **Unit tests**: Tester för individuella komponenter och services
- **Integration tests**: Tester för komponentinteraktion och dataflöde
- **Business logic tests**: Validering av highscore-logik och spelregler
- **Storage tests**: LocalStorage-persistering och datahantering
- **I18n tests**: Översättningar och lokalisering
- **Edge case tests**: Gränsfall och felhantering
- **Audio tests**: AudioManager, AudioSettings och SoundService
- **Animation tests**: Fysikbaserade animationer och partikeleffekter
- **Core game logic tests**: GameLoop och Game orchestration
- **Collision & Physics tests**: CollisionManager och CollapsePredictionCalculator
- **UI Management tests**: ResponsiveManager och TransitionManager
- **Responsive design tests**: Breakpoint detection, debouncing, canvas sizing
- **Transition tests**: Screen transitions, modal animations, overlay effects
- **Rendering tests**: GameRenderer, WoodPieceRenderer, UIRenderer
- **Input tests**: Mouse clicks, hover effects, keyboard reactions

#### Test-täckning per område (1325 tester totalt, 86.24% coverage)
- **Particle Systems**: 100 tester (MenuParticleSystem 100%!, CollapseParticleSystem 100%! - träflisor, damm, fysik, livscykel)
- **Base Rendering**: 49 tester (BaseRenderer 100%! - canvas operations, text measurement, context management)
- **State Management**: 30 tester (AppStateManager 100%! - state transitions, callback system, menu/game states)
- **Button Management**: 45 tester (MenuButtonManager 100%! - wood buttons, hover effects, click handling, animations)
- **Menu System**: 33 tester (BackgroundRenderer 97.59%!, LogoRenderer 100%! - animations, gradient backgrounds, wood piles)
- **Rendering System**: 42 tester (GameRenderer 100%!, WoodPieceRenderer 100% lines!, UIRenderer 99%!)
- **Input handling**: 38 tester (GameInputHandler 100%! - mouse clicks, hover, keyboard, circular hit detection)
- **Core business logic**: 84 tester (Game 81.78%!, HighscoreService, spellogik)
- **Infrastructure**: 186 tester (Storage 100%!, I18n, audio 90.08%!)
- **UI-komponenter**: 16 tester (HighscoreModal)
- **Type validation**: 12 tester (Datastrukturer och gränssnitt)
- **Integration scenarios**: 16 tester (End-to-end flöden)
- **Edge cases**: 12 tester (Felhantering och gränsfall)
- **Algorithms**: 8 tester (Kollapsberäkning, generering)
- **Audio system**: 146 tester (AudioManager 95%+!, AudioSettings 95%!, SoundService 95%+!)
- **Animation system**: 40 tester (WoodCollapseAnimator 97%, ScreenShakeManager 99%, CollapseParticleSystem 100%!)
- **Core game logic**: 40 tester (GameLoop 97%, Game 81.78%)
- **Collision & Physics**: 33 tester (CollisionManager 100%!, CollapsePredictionCalculator 81%)
- **Game managers**: 97 tester (GameStateManager 100%!, CreatureManager 100%!, LevelManager 100%! ✨)
- **Storage Layer**: 87 tester (LocalStorageService 100%!, GameDataRepository 100%!)

Alla tester använder **TypeScript strict mode** och **Vitest** för modern testmiljö.

#### Senaste Test-achievements 🏆

**Fas 9: Level System & Difficulty** ✨ NYTT! (Session: +38 tester, +0.63% coverage)
- ✅ **LevelManager**: 38 tester → 100% statement coverage, 94.59% branch coverage
  - Difficulty system: 5 svårighetsgrader med kompletta modifiers
  - Level progression: 10 nivåer med dynamisk skalning
  - Speed bonus calculation: Time-based rewards
  - Event system: LEVEL_START, LEVEL_COMPLETE, DIFFICULTY_CHANGE
  - Score calculations: Difficulty multipliers (Easy 0.8x → Nightmare 2.5x)
- 🎯 **Nya typer**: DifficultyLevel enum, LevelInfo, LevelProgress, DifficultyModifiers
- 📊 **Nya konstanter**: DIFFICULTY_CONFIGS, LEVEL_PROGRESSION (10 nivåer)
- 🌍 **I18n-stöd**: 50+ nya översättningssträngar för level och difficulty
- 📖 **Dokumentation**: Komplett guide i docs/LEVEL-SYSTEM-GUIDE.md

**Fas 8: Storage & Audio Excellence** (Session: +307 tester, +9.42% coverage)
- ✅ **LocalStorageService**: 37 tester → 100% coverage
  - JSON parsing/stringifying, error handling, type safety
  - Edge cases: empty strings, long keys, unicode, rapid operations
- ✅ **GameDataRepository**: 50 tester → 100% coverage
  - High score tracking, games played counter, best reaction time
  - Settings management with partial updates
  - Integration tests för complete sessions
- ✅ **CollapseParticleSystem**: 68 tester → 100% coverage
  - Particle creation med intensity scaling
  - Physics simulation: gravity (0.3), air resistance (0.98)
  - Rendering: wood chips (30%) vs dust (70%)
  - Lifecycle management: creation → update → render → cleanup
- ✅ **SoundService**: 59 tester → 95%+ coverage
  - Audio loading med concurrent protection
  - Sound playback med volume management per category
  - Error handling: play failures, load errors
  - Simultaneous sound limiting (max 10)
- ✅ **AudioManager**: 53 tester → 95%+ coverage
  - System initialization med error recovery
  - Background music switching
  - Settings management med real-time updates
  - Convenience methods för common sounds

**Test Quality Metrics:**
- **Statement Coverage**: 86.24%
- **Branch Coverage**: 93.34% (exceptional!)
- **Function Coverage**: 96.69% (outstanding!)
- **100% Pass Rate**: Alla 1325 tester passar konsekvent

## Implementerat ✅

### Meny och navigation
- [x] **Fullständig startmeny** med animerad skogsglänta-bakgrund
- [x] **Animerade träd** som svajar i vinden med bark-textur
- [x] **Fallande löv-partiklar** (🍂🍃) för naturlig atmosfär
- [x] **Animerad vedstapel-logotyp** med "andning"-effekt och brick-pattern
- [x] **Träknapp-design** med hover-effekter och rotation
- [x] **State management** för smidig övergång mellan meny och spel
- [x] **Smooth transitions** med TransitionManager och fade-effekter
- [x] **Responsive design** med ResponsiveManager för adaptiv canvas
- [x] **Språkväljare** integrerad i header

### Kärnfunktioner
- [x] **Grundläggande vedplockning** med musklick för runda pinnar
- [x] **Brick-pattern vedstapel** för realistisk stabilitet
- [x] **Fem olika varelser** med unika reaktioner och timers
- [x] **Avancerad kollapsberäkning** med sekundära effekter
- [x] **Intelligent hover-preview** som visar påverkade pinnar
- [x] **Flerspråksstöd** (svenska/engelska) med localStorage
- [x] **Responsiv design** och tillgänglighet

### Visuella effekter och rendering
- [x] **Runda vedpinnar** med realistisk trätextur och årsringar
- [x] **Färgkodade risknivåer** (solid/streckad/prickad ramar)
- [x] **Pulsande effekter** för kritiska pinnar
- [x] **Varelsehints** med glow-effekter och subtil indikation
- [x] **Reaktionstimers** med färgkodade progressbars
- [x] **Game over-skärm** med restart-funktionalitet
- [x] **Layered rendering** för korrekt z-order av påverkade pinnar
- [x] **WoodCollapseAnimator** med fysikbaserade fallanimationer
- [x] **CollapseParticleSystem** med träflisor och damm-effekter
- [x] **ScreenShakeManager** med intensitetsbaserad skakning
- [x] **Complete animation integration** i game loop och rendering pipeline

### Ljudsystem och inställningar 🔊
- [x] **AudioManager** med master volume och separata kanaler
- [x] **AudioSettings** med persistent LocalStorage-lagring
- [x] **SoundService** för ljudeffekt-hantering och caching
- [x] **Settings-skärm** med moderna toggle switches och volume slider
- [x] **Flerspråksstöd** för alla ljudinställningar (sv/en)
- [x] **Visual feedback** med färgkodade toggles och live-förhandsgranskning
- [x] **Omfattande testning**: 146 tester med 90%+ coverage för hela ljudsystemet
  - SoundService: 59 tester (95%+ coverage) - loading, playback, caching, concurrent operations
  - AudioManager: 53 tester (95%+ coverage) - initialization, settings, music switching
  - AudioSettings: 34 tester (95% coverage) - persistence, volume control, channel management

### Teknisk excellens
- [x] **Clean Architecture** med TypeScript och SOLID-principer
- [x] **Modulär komponentdesign** med BaseRenderer-hierarki och barrel exports
- [x] **Komplett UML-dokumentation** (class, component, dataflow)
- [x] **Event-driven state management** med observer patterns
- [x] **Transition management** för professionella övergångar med fade-effekter
- [x] **Responsive canvas** som anpassar sig automatiskt till viewport
- [x] **Automatiserad byggprocess** med modulär i18n-kopiering
- [x] **Separation of Concerns** med domain/infrastructure/presentation layers
- [x] **Modal transition system** med transitionToModal/FromModal för konsistent UX
- [x] **Physics-based animations** med gravitation, rotation och fade-effekter
- [x] **Particle system architecture** med återanvändbara effektsystem
- [x] **Screen shake system** med intensity-based calculations

### Highscore-system 🏆
- [x] **Komplett highscore-tracking** med automatisk integration
- [x] **Top 10-systemet** med lokal lagring och persistering
- [x] **Intelligent level-beräkning** baserat på poäng-progression
- [x] **Automatisk speltids-tracking** från start till game over
- [x] **Kvalifikationskontroll** för effektiv highscore-hantering  
- [x] **UI-komponenter** med HighscoreModal, Table, AddScore, Statistics
- [x] **Clean Architecture** med HighscoreManager, Service, Storage separation
- [x] **Flerspråksstöd** med 60+ översättningssträngar för highscore-systemet
- [x] **Seamless game integration** med automatisk Add Score-dialog
- [x] **Professional UX** med smooth övergångar och fallback-hantering

## Framtida förbättringar

### Kortsiktigt 🎯
- [ ] **Ljudfiler**: Lägg till faktiska ljudfiler för effekter och musik (infrastruktur klar med AudioManager)
- [ ] **Instruktioner-skärm**: Implementera instruktioner-innehåll (knapp finns)
- [ ] **Export/import**: Highscore-data backup och delning
- [ ] **Mer polish**: Finjustera animationstiming och partikeleffekter
- [ ] **Resterande test-coverage**: Nå 90%+ med I18n och WoodPileGenerator tester

### Långsiktigt 🚀
- [x] **Flera nivåer med olika svårighetsgrader** ✨ NYTT!
  - 🎯 **5 svårighetsgrader**: Easy, Normal, Hard, Expert, Nightmare
  - 📊 **10 progressiva nivåer** med ökande komplexitet
  - ⚡ **Speed bonus-system** för snabba genomföranden
  - 🎮 **Dynamic difficulty modifiers**: Hälsa, reaktionstid, varelsespawn, poängmultiplikator
  - 📈 **Level progression**: 15-42 vedpinnar, 5-14 lager höjd
  - 🏆 **Score multipliers**: Easy 0.8x → Nightmare 2.5x
  - ⏱️ **Reaktionstid**: Easy 3s → Nightmare 0.75s
  - 💚 **Starting health**: Easy 150 → Nightmare 50
  - 🎨 **Färgkodade svårighetsgrader**: Grön (Easy) → Lila (Nightmare)
- [ ] **Olika vedtyper** (gran, björk, ek) med olika egenskaper
- [ ] **Progressive Web App (PWA)** för mobila enheter
- [ ] **Procedurellt genererade utmaningar** med varierande layouts
- [ ] **Berättarläge** med bakgrundshistoria och karaktärer
- [ ] **Online highscore-delning** och leaderboards
- [ ] **Achievements-system** med utmärkelser och milstolpar

## Moderniseringsresa 🚀

### Från Monolitisk till Clean Architecture
Projektet genomgick en omfattande modernisering från ursprunglig monolitisk struktur till Clean Architecture:

#### Fas 1: Modulära Typer och Konstanter ✅
- Delade upp `types.ts` i modulära filer (`game.ts`, `ui.ts`, `config.ts`)
- Skapade `shared/constants/` för konfiguration och tangentbindningar
- Implementerade barrel exports för ren import-struktur

#### Fas 2: Domain Logic Separation ✅
- Flyttade kärnlogik till `core/` med tydlig separation
- Skapade `managers/` för kollision, varelser och spelstatus
- Isolerade `services/` för kollapsberäkning och vedgenerering

#### Fas 3: Infrastructure Layer ✅
- Abstraherade externa beroenden till `infrastructure/`
- Modulär i18n-hantering med data-separation
- Input-abstraktion med interface-kontrakt
- Storage-layer för localStorage-hantering

#### Fas 4: Presentation Layer ✅
- Skapade `BaseRenderer` abstrakt klass för konsistent rendering
- Organiserade renderare i `game/`, `menu/` och `shared/` hierarkier
- Implementerade SOLID-principer i rendering-arkitekturen

#### Fas 5: Application Layer ✅
- Skapade **TransitionManager** för smooth övergångar mellan states
- Implementerade **ResponsiveManager** för adaptiv canvas-skalning
- Förbättrad användarupplevelse med fade-effekter och loading-states
- Clean separation av transition-logik från state management

#### Fas 6: Visual Effects System ✅
- Implementerade **WoodCollapseAnimator** med fysikbaserade fallanimationer
- Skapade **CollapseParticleSystem** för dramatiska träflis- och damm-effekter
- Integrerade **ScreenShakeManager** för intensitetsbaserad skärmskakning
- Komplett animation pipeline i Game.ts med update/render-integration

#### Fas 7: Audio System ✅
- Utvecklade **AudioManager** med master volume och separata kanaler
- Implementerade **AudioSettings** för persistent ljudinställningar
- Skapade **SoundService** för ljudeffekt-hantering
- Byggde modern **Settings UI** med toggle switches och volume slider
- Fullständig i18n-integration för ljudinställningar (60+ nya strängar)

### Resultat av Modernisering 📊
- **48% kodreduktion** i huvudspelklassen (392 → 205 rader)
- **100% TypeScript strict mode** kompatibilitet
- **Eliminerat duplicerad kod** genom BaseRenderer-pattern
- **Professionella övergångar** med TransitionManager (800ms fade-effekter)
- **Responsiv design** som fungerar på alla enheter med ResponsiveManager
- **Dramatiska visuella effekter** med physics-based animations, particles och screen shake
- **Komplett ljudsystem** med AudioManager och persistent inställningar
- **1325 automatiserade tester** med 100% pass rate och **86.24% code coverage** 🎉
- **Exceptional test quality**: 93.34% branch coverage, 96.69% function coverage
- **Förbättrad testbarhet** genom dependency injection
- **Enklare vidareutveckling** genom tydlig lagerseparation
- **Nivåsystem med 5 svårighetsgrader** och 10 progressiva nivåer ✨ NYTT!

### Backward Compatibility 🔄
- Gamla filsökvägar har re-exports för gradvis migration
- Inga breaking changes för befintlig funktionalitet
- Smidig övergång från gammal till ny arkitektur

## Utvecklingsnotiser

### AI-utvecklingsprocess 🧠
Projektet utvecklades och moderniserades genom:
1. **Konceptuell design** med AI-assistans för spelmekanik
2. **Arkitekturplanering** med UML-generering och clean code
3. **Iterativ kodning** med Copilot för komponentstruktur
4. **Clean Architecture refactoring** från monolitisk till modulär struktur
5. **BaseRenderer pattern implementation** för konsistent rendering-hierarki
6. **Systematic modernization** genom fyra faser:
   - Fas 1: Modulära typer och konstanter
   - Fas 2: Domain logic separation (core/)
   - Fas 3: Infrastructure layer (i18n, input, storage)
   - Fas 4: Presentation layer med BaseRenderer
7. **Highscore-system implementation** genom systematisk 7-stegs approach:
   - Steg 1: Domain models och typer (HighscoreEntry, NewHighscoreInput, etc.)
   - Steg 2: Storage layer (HighscoreStorageService med LocalStorage)
   - Steg 3: Business logic (HighscoreService för ren affärslogik)
   - Steg 4: I18n-integration (HighscoreI18nService med lokaliserade meddelanden)
   - Steg 5: UI-komponenter (HighscoreModal, Table, AddScore, Statistics)
   - Steg 6: Menu integration (Highscore-knapp och navigation)
   - Steg 7: Game integration (Automatisk score-tracking och kvalifikation)
8. **Visual Effects System** genom systematisk implementation:
   - WoodCollapseAnimator: Physics-based falling animations med gravity och rotation
   - CollapseParticleSystem: Particle effects med wood chips och dust
   - ScreenShakeManager: Intensity-based screen shake för impact
   - Full Game.ts integration: Collision callbacks, update loop, render pipeline
9. **Audio System** genom arkitekturell design:
   - AudioManager: Central ljudhantering med master volume och channel controls
   - AudioSettings: Persistent settings med LocalStorage
   - SoundService: Sound effect playback service
   - Settings UI: Modern toggle switches och volume slider med i18n
10. **Automatiserad optimering** av imports och byggprocess

### Utökning av spelet
- **Nya varelser**: Lägg till i [`CreatureType`](src/types/game.ts), uppdatera [`KEY_BINDINGS`](src/shared/constants/keyBindings.ts) och [`UIRenderer`](src/presentation/renderers/game/UIRenderer.ts)
- **Vedstapel-ändringar**: Modifiera [`WoodPileGenerator`](src/core/services/WoodPileGenerator.ts)
- **Menyfunktioner**: Utöka [`MenuRenderer`](src/presentation/renderers/menu/MenuRenderer.ts) och [`MenuButtonManager`](src/ui/MenuButtonManager.ts)
- **Spelregler**: Justera i [`Game`](src/core/game/Game.ts) klassen
- **Översättningar**: Uppdatera JSON-filerna i [`src/infrastructure/i18n/data/`](src/infrastructure/i18n/data/)
- **Visuella effekter**: Utöka renderare i [`src/presentation/renderers/`](src/presentation/renderers/) och [`src/particles/`](src/particles/)
- **Nya renderare**: Skapa klasser som ärver från [`BaseRenderer`](src/presentation/renderers/shared/BaseRenderer.ts)
- **Animationer**: Utöka [`WoodCollapseAnimator`](src/presentation/renderers/game/WoodCollapseAnimator.ts) eller skapa nya animatörer
- **Partikeleffekter**: Lägg till nya partikelsystem i [`src/particles/`](src/particles/) baserat på [`CollapseParticleSystem`](src/particles/CollapseParticleSystem.ts)
- **Skärm-effekter**: Modifiera [`ScreenShakeManager`](src/presentation/renderers/ScreenShakeManager.ts) för nya shake-patterns
- **Ljudeffekter**: Utöka [`AudioManager`](src/infrastructure/audio/AudioManager.ts) och [`SoundService`](src/infrastructure/audio/SoundService.ts)
- **Highscore-funktioner**: Utöka [`HighscoreManager`](src/core/managers/HighscoreManager.ts) för ny business logic
- **UI-komponenter**: Lägg till nya vyer i [`src/ui/highscore/`](src/ui/highscore/) med konsistent design
- **Storage-utökningar**: Modifiera [`HighscoreStorageService`](src/infrastructure/storage/HighscoreStorageService.ts) för nya dataformat
- **Nivåer och svårighet**: ✨ NYTT!
  - Använd [`LevelManager`](src/core/managers/LevelManager.ts) för nivåprogression
  - Konfigurera svårighetsgrader i [`difficultyConfig.ts`](src/shared/constants/difficultyConfig.ts)
  - Lägg till nya nivåer i `LEVEL_PROGRESSION`-arrayen
  - Justera difficulty modifiers för balansering
  - Implementera level-baserad UI med i18n-stöd (`level.*` och `difficulty.*` nycklar)

### Debug-funktioner
I utvecklarläge finns globala debug-funktioner:
```javascript
debugGame.togglePause()         // Pausa/återuppta
debugGame.getGameState()        // Visa nuvarande state
debugGame.changeLanguage('en')  // Byt språk programmatiskt
```

### Arkitektur-dokumentation
Se [docs/README-architecture.md](docs/README-architecture.md) för:
- Detaljerade UML-diagram
- Klassrelationer och beroenden
- Dataflödesanalys
- Komponentarkitektur

## Tekniska detaljer

### Kollapsalgoritm
Intelligent kollapsförutsägelse använder:
- **Brick-pattern stödberäkning** för realistisk fysik
- **Sekundäreffekt-analys** för kedjereaktion av kollaps
- **Centrum-till-centrum distans** för runda pinnar
- **Överlappning-thresholds** för stödvalidering

### Rendering-pipeline
- **Layered rendering**: Icke-påverkade → påverkade → hovrade pinnar
- **Specialiserade renderare**: WoodPieceRenderer, UIRenderer, MenuRenderer
- **Cirkulär geometri** för runda vedpinnar med trätextur
- **Partikeleffekter** med MenuParticleSystem
- **Adaptiv färgkodning** baserat på risknivå

### State management
- **AppStateManager** hanterar övergångar mellan meny och spel
- **TransitionManager** ger smooth fade-effekter (800ms default)
  - Promise-baserad API för async/await
  - Konfigurerbar duration och loading-meddelanden
  - Clean separation från state-logik
- **ResponsiveManager** hanterar canvas-skalning
  - Automatisk anpassning till viewport-storlek
  - Breakpoint-hantering för mobil/tablet/desktop
  - Event-driven resize med debouncing
- **MenuState enum** för clean state-definitioner
- **Event-driven callbacks** för state-ändringar
- **Automatisk resurs-hantering** vid state-övergångar

## Kreativa bidrag

### Från utvecklaren (Fredrik Svensson)
- 🎮 Spelkoncept och design
- 🏗️ Arkitekturplanering
- 🎨 Användarupplevelse och UI/UX
- 🧩 Problemlösning och logik

### Från AI (GitHub Copilot)
- 💻 Kodstruktur och implementation
- 🔧 TypeScript-typning och felfång
- 📋 Algoritmer för kollapsberäkning
- 🎨 Rendering-optimering och effekter
- 📖 Dokumentation och kommentarer

## Licens
MIT License - Detta är ett hobbyprojekt för **Alla kodares buggiga natt 2025**!
