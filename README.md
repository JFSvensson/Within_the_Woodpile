# Within the Woodpile 🌲
Ett spel skapat för **Alla kodares buggiga natt 2025** av Fredrik Svensson.

## Om spelet
Du är en person som ska plocka ved ur en vedstapel. Men akta dig - bakom veden kan det finnas farliga djur och läskiga varelser! Vedhögen kan också rasa om du inte är försiktig.
Spelet har **flerspråksstöd** (för närvarande svenska och engelska).

## Spelmekanik

### Grundläggande
- **Klicka på ved** för att plocka den
- **Samla poäng** genom att plocka ved och undvika faror
- **Undvik faror** som kan kosta dig hälsa
- **Hover-effekter** visar rasrisk med färgkodade ramar

### Varelser och reaktioner
När du plockat en vedpinne som gömmer en varelse har du en kort tid på dig att reagera:

- 🕷️ **Spindel**: Tryck `MELLANSLAG` för att blåsa bort den
- 🐝 **Geting**: Tryck `ESCAPE` för att ducka
- 🦔 **Igelkott**: Tryck `S` för att backa sakta
- 👻 **Spöke**: Tryck `L` för att tända lyktan
- 🎃 **Pumpahuvud**: Tryck `R` för att springa

### Rasrisk och kollaps
- **Hover-visning**: Vedpinnar visar rasrisk med färgkodade ramar
  - 🟢 Grön = Ingen risk
  - 🟡 Gul = Låg risk  
  - 🟠 Orange = Medel risk
  - 🔴 Röd = Hög risk
- **Brick-pattern**: Vedpinnar staplas omväxlande för realism
- **Kollapsmekanik**: Ta bort fel ved kan få andra att rasa

## Teknisk info

### Utvecklat med
- **TypeScript** för typning och struktur
- **HTML5 Canvas** för 2D-grafik med runda vedpinnar
- **Internationalisering (i18n)** med JSON-språkfiler
- **Modern ES modules** och clean code-arkitektur

### Projektstruktur
```
src/
├── types.ts              # Typedefinitioner och konfiguration
├── woodPileGenerator.ts  # Genererar vedstapel med brick-pattern
├── gameRenderer.ts       # Canvas-rendering och visuella effekter
├── game.ts              # Huvudspellogik och state management
├── i18n.ts              # Internationalisering
├── main.ts              # Startpunkt och initialisering
└── i18n/
    ├── sv.json          # Svenska översättningar
    └── en.json          # Engelska översättningar
```

### Arkitektur
Projektet följer **clean code-principer** med:
- **Separation of concerns**: Logik, rendering och i18n separerat
- **Dependency injection**: Klasser tar emot beroenden via konstruktor
- **Type safety**: Fullständig TypeScript-typning
- **Event-driven**: Löst kopplad kommunikation mellan komponenter

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

## Spelmekanik implementerat ✅
- [x] Grundläggande vedplockning med musklick
- [x] Runda vedpinnar i brick-pattern för realistisk stapel
- [x] Fem olika varelser med unika reaktioner
- [x] Rasrisk-beräkning och visuell feedback
- [x] Kollapsmekanik med hälsopåverkan
- [x] Poäng- och hälsosystem
- [x] Game over och restart-funktionalitet
- [x] Flerspråksstöd (svenska/engelska)
- [x] Responsiv design och tillgänglighet

## Framtida förbättringar
### Kortsiktigt
- [ ] Förbättra vedras-animationer
- [ ] Lägg till ljudeffekter
- [ ] Bättre partikeleffekter för reaktioner
- [ ] High score-system med localStorage
- [ ] Fler visuella effekter (skuggor, ljus)

### Långsiktigt  
- [ ] Flera nivåer med olika svårighetsgrad
- [ ] Powerups (t.ex. lykta för att se varelser)
- [ ] Olika typer av vedstaplar (gran, björk, ek)
- [ ] Multiplayer-läge
- [ ] Berättarröst eller bakgrundsmusik
- [ ] Progressive Web App (PWA) för mobiler

## Utvecklingsnotiser
Projektet är strukturerat för att vara lätt att bygga på under en spelsylt:

- **Nya varelser**: Lägg till i [`CreatureType`](src/types.ts), uppdatera [`KEY_BINDINGS`](src/types.ts) och [`gameRenderer.ts`](src/gameRenderer.ts)
- **Vedstapel-ändringar**: Modifiera [`WoodPileGenerator`](src/woodPileGenerator.ts)
- **Spelregler**: Justera i [`Game`](src/game.ts) klassen
- **Översättningar**: Uppdatera JSON-filerna i [`src/i18n/`](src/i18n/)
- **Visuella effekter**: Utöka [`GameRenderer`](src/gameRenderer.ts)

### Debug-funktioner
I utvecklarläge finns globala debug-funktioner:
```javascript
debugGame.togglePause()     // Pausa/återuppta
debugGame.getGameState()    // Visa nuvarande state
debugGame.changeLanguage('en') // Byt språk
```

## Licens
MIT License - Detta är ett hobbyprojekt för en spelsylt!
