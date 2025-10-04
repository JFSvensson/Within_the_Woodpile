# Within the Woodpile 🌲
Ett spel skapat för **Alla kodares buggiga natt 2025** av Fredrik Svensson med hjälp av **GitHub Copilot** och AI-assisterad utveckling.

## Om spelet
Du är en person som ska plocka ved ur en vedstapel. Men akta dig - bakom veden kan det finnas farliga djur och läskiga varelser! Vedhögen kan också rasa om du inte är försiktig.
Spelet har **flerspråksstöd** (för närvarande svenska och engelska).

## Spelmekanik

### Grundläggande
- **Klicka på ved** för att plocka den
- **Samla poäng** genom att plocka ved och undvika faror
- **Undvik faror** som kan kosta dig hälsa
- **Smart hover-feedback** visar vilka pinnar som påverkas av ditt drag

### Intelligent kollapsförutsägelse 🧠
När du hovrar över en vedpinne visas:
- **🟡 Gul hover-ram**: Den pinne du kan ta
- **🔴 Röd solid ram**: Pinnar som kommer att rasa
- **🟠 Orange streckad**: Hög risk för ras
- **🟡 Gul streckad**: Medel risk för ras
- **🟨 Ljusgul prickad**: Låg risk för ras
- **✨ Pulsande effekt**: Kritiska pinnar som definitivt kommer att falla

### Varelser och reaktioner
När du plockat en vedpinne som gömmer en varelse har du en kort tid på dig att reagera:

- 🕷️ **Spindel**: Tryck `MELLANSLAG` för att blåsa bort den
- 🐝 **Geting**: Tryck `ESCAPE` för att ducka
- 🦔 **Igelkott**: Tryck `S` för att backa sakta
- 👻 **Spöke**: Tryck `L` för att tända lyktan
- 🎃 **Pumpahuvud**: Tryck `R` för att springa

### Avancerad fysik
- **Brick-pattern stapel**: Vedpinnar staplas omväxlande för realistisk stabilitet
- **Sekundära effekter**: Rasande pinnar kan få andra att förlora stöd
- **Grundstöd**: Pinnar på marken har ingen rasrisk
- **Stödberäkning**: Använder centrum-till-centrum-distans för runda pinnar

## Teknisk info

### Utvecklat med
- **TypeScript** för typning och struktur
- **HTML5 Canvas** för 2D-grafik med runda vedpinnar
- **Internationalisering (i18n)** med JSON-språkfiler
- **Modern ES modules** och clean code-arkitektur
- **GitHub Copilot** för AI-assisterad kodutveckling

### AI-assisterad utveckling 🤖
Detta projekt utvecklades med hjälp av:
- **GitHub Copilot** för kodkomplettering och struktur
- **AI-baserad arkitektur** för clean code-principer
- **Intelligent problemlösning** för kollapsberäkningar
- **Automatiserad typning** och felfång med TypeScript

### Projektstruktur
```
src/
├── types.ts              # Typedefinitioner och konfiguration
├── woodPileGenerator.ts  # Genererar vedstapel med brick-pattern
├── gameRenderer.ts       # Canvas-rendering och intelligent preview
├── game.ts              # Huvudspellogik och state management
├── i18n.ts              # Internationalisering
├── main.ts              # Startpunkt och initialisering
└── i18n/
    ├── sv.json          # Svenska översättningar
    └── en.json          # Engelska översättningar

docs/
├── README-architecture.md # Detaljerad arkitektur-dokumentation
└── architecture/          # UML-diagram (PlantUML)
    ├── class-diagram.puml
    ├── component-diagram.puml
    └── dataflow-diagram.puml
```

### Arkitektur
Projektet följer **clean code-principer** med AI-assisterad design:
- **Separation of concerns**: Logik, rendering och i18n separerat
- **Dependency injection**: Klasser tar emot beroenden via konstruktor
- **Type safety**: Fullständig TypeScript-typning
- **Event-driven**: Löst kopplad kommunikation mellan komponenter
- **Intelligent prediction**: Avancerad kollapsförutsägelse med visuell feedback

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

### Kärnfunktioner
- [x] Grundläggande vedplockning med musklick för runda pinnar
- [x] Brick-pattern vedstapel för realistisk stabilitet
- [x] Fem olika varelser med unika reaktioner och timers
- [x] Avancerad kollapsberäkning med sekundära effekter
- [x] **Intelligent hover-preview** som visar påverkade pinnar
- [x] Flerspråksstöd (svenska/engelska) med localStorage
- [x] Responsiv design och tillgänglighet

### Visuella effekter
- [x] Runda vedpinnar med realistisk trätextur
- [x] Färgkodade risknivåer (solid/streckad/prickad)
- [x] Pulsande effekter för kritiska pinnar
- [x] Varelsehints och reaktionstimers
- [x] Game over-skärm med restart-funktionalitet

### Teknisk excellens
- [x] Clean code-arkitektur med TypeScript
- [x] Komplett UML-dokumentation
- [x] Event-driven state management
- [x] Modulär komponentdesign
- [x] Automatiserad byggprocess

## Framtida förbättringar

### Kortsiktigt 🎯
- [ ] Animerade vedras-effekter
- [ ] Ljudeffekter och bakgrundsmusik
- [ ] Partikeleffekter för kollaps
- [ ] High score-system med localStorage
- [ ] Powerups (lykta, verktyg, etc.)

### Långsiktigt 🚀
- [ ] Flera nivåer med olika svårighetsgrader
- [ ] Olika vedtyper (gran, björk, ek) med olika egenskaper
- [ ] Multiplayer-läge via WebRTC
- [ ] Progressive Web App (PWA) för mobiler
- [ ] Procedurellt genererade utmaningar
- [ ] Berättarläge med bakgrundshistoria

## Utvecklingsnotiser

### AI-utvecklingsprocess 🧠
Projektet utvecklades genom:
1. **Konceptuell design** med AI-assistans
2. **Arkitekturplanering** med UML-generering
3. **Iterativ kodning** med Copilot-förslag
4. **Intelligent refaktoring** för clean code
5. **Automatiserad testning** av logik

### Utökning av spelet
- **Nya varelser**: Lägg till i [`CreatureType`](src/types.ts), uppdatera [`KEY_BINDINGS`](src/types.ts) och [`GameRenderer`](src/gameRenderer.ts)
- **Vedstapel-ändringar**: Modifiera [`WoodPileGenerator`](src/woodPileGenerator.ts)
- **Spelregler**: Justera i [`Game`](src/game.ts) klassen
- **Översättningar**: Uppdatera JSON-filerna i [`src/i18n/`](src/i18n/)
- **Visuella effekter**: Utöka [`GameRenderer`](src/gameRenderer.ts)

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

### Rendering-optimering
- **Layered rendering**: Icke-påverkade → påverkade → hovrade pinnar
- **Cirkulär geometri** för runda vedpinnar
- **Texturerad träyta** med koncentriska ringar
- **Adaptiv färgkodning** baserat på risknivå

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
- 📖 Dokumentation och kommentarer

## Licens
MIT License - Detta är ett hobbyprojekt för **Alla kodares buggiga natt 2025**!
