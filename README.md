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
- **Modular arkitektur** med specialiserade renderare
- **Internationalisering (i18n)** med JSON-språkfiler
- **State management** med AppStateManager
- **Modern ES modules** och clean code-arkitektur
- **GitHub Copilot** för AI-assisterad kodutveckling

### Projektstruktur
```
src/
├── types.ts                    # Typedefinitioner och konfiguration
├── main.ts                     # Startpunkt och app-initialisering
├── appStateManager.ts          # State management (meny ↔ spel)
├── game.ts                     # Huvudspellogik och state management
├── gameRenderer.ts             # Koordinerar all spelrendering
├── menuRenderer.ts             # Fullständig menyrendering
├── woodPileGenerator.ts        # Genererar vedstapel med brick-pattern
├── collapsePredictionCalculator.ts # Intelligent kollapsförutsägelse
├── woodPieceRenderer.ts        # Runda vedpinnar med textur
├── uiRenderer.ts               # Varelser och UI-element
├── i18n.ts                     # Internationalisering
├── i18n/
│   ├── sv.json                 # Svenska översättningar (inkl. meny)
│   └── en.json                 # Engelska översättningar (inkl. meny)
├── ui/
│   └── MenuButtonManager.ts    # Knappar och interaktion
├── renderers/
│   ├── LogoRenderer.ts         # Animerad logo med vedstapel
│   └── BackgroundRenderer.ts   # Skogsglänta med träd
└── particles/
    └── MenuParticleSystem.ts   # Fallande löv-partiklar
```

### Arkitektur
Projektet följer **clean code-principer** med AI-assisterad design:
- **Separation of concerns**: Dedikerade renderare för varje ansvar
- **Single Responsibility Principle**: Varje klass har ett specifikt syfte
- **Dependency injection**: Klasser tar emot beroenden via konstruktor
- **Type safety**: Fullständig TypeScript-typning
- **Event-driven**: Löst kopplad kommunikation mellan komponenter
- **State pattern**: AppStateManager hanterar app-tillstånd

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
- [x] **Clean code-arkitektur** med TypeScript
- [x] **Modulär komponentdesign** med specialiserade renderare
- [x] **Komplett UML-dokumentation** (class, component, dataflow)
- [x] **Event-driven state management**
- [x] **Automatiserad byggprocess** med i18n-kopiering

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

## Utvecklingsnotiser

### AI-utvecklingsprocess 🧠
Projektet utvecklades genom:
1. **Konceptuell design** med AI-assistans för spelmekanik
2. **Arkitekturplanering** med UML-generering och clean code
3. **Iterativ kodning** med Copilot för komponentstruktur
4. **Intelligent refaktoring** för modulär design
5. **Automatiserad optimering** av rendering och fysik

### Utökning av spelet
- **Nya varelser**: Lägg till i [`CreatureType`](src/types.ts), uppdatera [`KEY_BINDINGS`](src/types.ts) och [`UIRenderer`](src/uiRenderer.ts)
- **Vedstapel-ändringar**: Modifiera [`WoodPileGenerator`](src/woodPileGenerator.ts)
- **Menyfunktioner**: Utöka [`MenuRenderer`](src/menuRenderer.ts) och [`MenuButtonManager`](src/ui/MenuButtonManager.ts)
- **Spelregler**: Justera i [`Game`](src/game.ts) klassen
- **Översättningar**: Uppdatera JSON-filerna i [`src/i18n/`](src/i18n/)
- **Visuella effekter**: Utöka renderare i [`src/renderers/`](src/renderers/) och [`src/particles/`](src/particles/)

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
