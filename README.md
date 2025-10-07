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
- **State management** med AppStateManager
- **Modern ES modules** och SOLID-principles
- **GitHub Copilot** för AI-assisterad kodutveckling

### Projektstruktur
```
src/
├── main.ts                       # Startpunkt och app-initialisering
├── appStateManager.ts            # State management (meny ↔ spel)
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
│   │   └── index.ts
│   └── services/
│       ├── CollapsePredictionCalculator.ts # Intelligent kollapsförutsägelse
│       ├── WoodPileGenerator.ts  # Genererar vedstapel med brick-pattern
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
│   └── MenuButtonManager.ts      # Knappar och interaktion
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

## Implementerat ✅

### Meny och navigation
- [x] **Fullständig startmeny** med animerad skogsglänta-bakgrund
- [x] **Animerade träd** som svajar i vinden med bark-textur
- [x] **Fallande löv-partiklar** (🍂🍃) för naturlig atmosfär
- [x] **Animerad vedstapel-logotyp** med "andning"-effekt och brick-pattern
- [x] **Träknapp-design** med hover-effekter och rotation
- [x] **State management** för smidig övergång mellan meny och spel
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
- [x] **Automatiserad byggprocess** med modulär i18n-kopiering
- [x] **Separation of Concerns** med domain/infrastructure/presentation layers

## Framtida förbättringar

### Kortsiktigt 🎯
- [ ] **Animerade vedras-effekter** med partiklar
- [ ] **Ljudeffekter** och atmosfärisk bakgrundsmusik
- [ ] **Instruktioner-skärm** från menyn (knapp finns)
- [ ] **Inställningar-skärm** för volym och grafik (knapp finns)
- [ ] **High score-system** med localStorage-persistering

### Långsiktigt 🚀
- [ ] **Flera nivåer** med olika svårighetsgrader och vedstapel-former
- [ ] **Olika vedtyper** (gran, björk, ek) med olika egenskaper
- [ ] **Progressive Web App (PWA)** för mobila enheter
- [ ] **Procedurellt genererade utmaningar** med varierande layouts
- [ ] **Berättarläge** med bakgrundshistoria och karaktärer

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
7. **Automatiserad optimering** av imports och byggprocess

### Utökning av spelet
- **Nya varelser**: Lägg till i [`CreatureType`](src/types/game.ts), uppdatera [`KEY_BINDINGS`](src/shared/constants/keyBindings.ts) och [`UIRenderer`](src/presentation/renderers/game/UIRenderer.ts)
- **Vedstapel-ändringar**: Modifiera [`WoodPileGenerator`](src/core/services/WoodPileGenerator.ts)
- **Menyfunktioner**: Utöka [`MenuRenderer`](src/presentation/renderers/menu/MenuRenderer.ts) och [`MenuButtonManager`](src/ui/MenuButtonManager.ts)
- **Spelregler**: Justera i [`Game`](src/core/game/Game.ts) klassen
- **Översättningar**: Uppdatera JSON-filerna i [`src/infrastructure/i18n/data/`](src/infrastructure/i18n/data/)
- **Visuella effekter**: Utöka renderare i [`src/presentation/renderers/`](src/presentation/renderers/) och [`src/particles/`](src/particles/)
- **Nya renderare**: Skapa klasser som ärver från [`BaseRenderer`](src/presentation/renderers/shared/BaseRenderer.ts)

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
