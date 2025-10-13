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
│   └── config.ts                 # Konfigurations-typer
├── shared/                       # Delade konstanter och utilities
│   └── constants/
│       ├── index.ts              # Barrel export
│       ├── gameConfig.ts         # DEFAULT_CONFIG och spelkonfiguration
│       └── keyBindings.ts        # Tangentbindningar för varelser
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
│   │   └── index.ts
│   └── services/
│       ├── CollapsePredictionCalculator.ts # Intelligent kollapsförutsägelse
│       ├── WoodPileGenerator.ts  # Genererar vedstapel med brick-pattern
│       ├── HighscoreService.ts   # Ren business logic för highscores
│       ├── HighscoreI18nService.ts # Lokaliserade meddelanden och formatering
│       └── index.ts
├── infrastructure/               # Externa integrationer (Clean Architecture)
│   ├── index.ts                  # Barrel export
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
│       │   ├── UIRenderer.ts     # Varelser och UI-element
│       │   └── index.ts
│       └── menu/
│           ├── MenuRenderer.ts   # Fullständig menyrendering
│           ├── LogoRenderer.ts   # Animerad logo med vedstapel
│           ├── BackgroundRenderer.ts # Skogsglänta med träd
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
    └── MenuParticleSystem.ts     # Fallande löv-partiklar
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
Projektet har omfattande testtäckning med 213 automatiserade tester:

```bash
npm test              # Kör alla tester med Vitest
npm run test:watch    # Kör tester i watch-mode
```

#### Test-arkitektur
- **Unit tests**: Tester för individuella komponenter och services
- **Integration tests**: Tester för komponentinteraktion och dataflöde
- **Business logic tests**: Validering av highscore-logik och spelregler
- **Storage tests**: LocalStorage-persistering och datahantering
- **I18n tests**: Översättningar och lokalisering
- **Edge case tests**: Gränsfall och felhantering

#### Test-täckning per område
- **Core business logic**: 34 tester (HighscoreService, spellogik)
- **Infrastructure**: 28 tester (Storage, I18n, input-hantering)
- **UI-komponenter**: 16 tester (HighscoreModal och sub-komponenter)
- **Type validation**: 12 tester (Datastrukturer och gränssnitt)
- **Integration scenarios**: 16 tester (End-to-end flöden)
- **Edge cases**: 12 tester (Felhantering och gränsfall)
- **Algorithms**: 8 tester (Kollapsberäkning, generering)

Alla tester använder **TypeScript strict mode** och **Vitest** för modern testmiljö.

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

### Teknisk excellens
- [x] **Clean Architecture** med TypeScript och SOLID-principer
- [x] **Modulär komponentdesign** med BaseRenderer-hierarki och barrel exports
- [x] **Komplett UML-dokumentation** (class, component, dataflow)
- [x] **Event-driven state management** med observer patterns
- [x] **Transition management** för professionella övergångar med fade-effekter
- [x] **Responsive canvas** som anpassar sig automatiskt till viewport
- [x] **Automatiserad byggprocess** med modulär i18n-kopiering
- [x] **Separation of Concerns** med domain/infrastructure/presentation layers

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
- [ ] **Animerade vedras-effekter** med partiklar
- [ ] **Ljudeffekter** och atmosfärisk bakgrundsmusik
- [ ] **Instruktioner-skärm** från menyn (knapp finns)
- [ ] **Inställningar-skärm** för volym och grafik (knapp finns)
- [ ] **Export/import** av highscore-data för backup och delning

### Långsiktigt 🚀
- [ ] **Flera nivåer** med olika svårighetsgrader och vedstapel-former
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

### Resultat av Modernisering 📊
- **48% kodreduktion** i huvudspelklassen (392 → 205 rader)
- **100% TypeScript strict mode** kompatibilitet
- **Eliminerat duplicerad kod** genom BaseRenderer-pattern
- **Förbättrad testbarhet** genom dependency injection
- **Enklare vidareutveckling** genom tydlig lagerseparation

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
8. **Automatiserad optimering** av imports och byggprocess

### Utökning av spelet
- **Nya varelser**: Lägg till i [`CreatureType`](src/types/game.ts), uppdatera [`KEY_BINDINGS`](src/shared/constants/keyBindings.ts) och [`UIRenderer`](src/presentation/renderers/game/UIRenderer.ts)
- **Vedstapel-ändringar**: Modifiera [`WoodPileGenerator`](src/core/services/WoodPileGenerator.ts)
- **Menyfunktioner**: Utöka [`MenuRenderer`](src/presentation/renderers/menu/MenuRenderer.ts) och [`MenuButtonManager`](src/ui/MenuButtonManager.ts)
- **Spelregler**: Justera i [`Game`](src/core/game/Game.ts) klassen
- **Översättningar**: Uppdatera JSON-filerna i [`src/infrastructure/i18n/data/`](src/infrastructure/i18n/data/)
- **Visuella effekter**: Utöka renderare i [`src/presentation/renderers/`](src/presentation/renderers/) och [`src/particles/`](src/particles/)
- **Nya renderare**: Skapa klasser som ärver från [`BaseRenderer`](src/presentation/renderers/shared/BaseRenderer.ts)
- **Highscore-funktioner**: Utöka [`HighscoreManager`](src/core/managers/HighscoreManager.ts) för ny business logic
- **UI-komponenter**: Lägg till nya vyer i [`src/ui/highscore/`](src/ui/highscore/) med konsistent design
- **Storage-utökningar**: Modifiera [`HighscoreStorageService`](src/infrastructure/storage/HighscoreStorageService.ts) för nya dataformat

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
