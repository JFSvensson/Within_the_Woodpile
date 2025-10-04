# Within the Woodpile 🌲
Ett spel skapat för **Alla kodares buggiga natt 2025** av Fredrik Svensson.

## Om spelet
Du är en person som ska plocka ved ur en vedstapel. Men akta dig - bakom veden kan det finnas farliga djur och läskiga varelser! Vedhögen kan också rasa om du inte är försiktig.

## Spelmekanik

### Grundläggande
- **Klicka på ved** för att plocka den
- **Samla poäng** genom att plocka ved och undvika faror
- **Undvik faror** som kan kosta dig hälsa

### Varelser och reaktioner
När du plockat en vedpinne som gömmer en varelse har du en kort tid på dig att reagera:

- 🕷️ **Spindel**: Tryck `MELLANSLAG` för att blåsa bort den
- 🐝 **Geting**: Tryck `ESCAPE` för att ducka
- 🦔 **Igelkott**: Tryck `S` för att backa sakta
- 👻 **Spöke**: Tryck `L` för att tända lyktan
- 🎃 **Pumpahuvud**: Tryck `R` för att springa

### Rasrisk
- När du håller muspekaren över veden ser du om den riskerar att rasa 
- Ved som riskerar att rasa visas med **gul** eller **röd** ram
- Om veden rasar blir du av med hälsa

## Teknisk info

### Utvecklat med
- **TypeScript** för typning och struktur
- **Vektorgrafik-inspirerade** visuella element

### Projektstruktur
```
src/
├── types.ts           # Typedefinitioner
├── woodPileGenerator.ts # Genererar vedstapeln
├── gameRenderer.ts    # Ansvarar för grafik
├── game.ts           # Huvudspellogik
└── main.ts           # Startpunkt
```

## Kom igång
### Installation
```bash
npm install
```

### Utveckling
```bash
npm run dev    # Kompilera TypeScript i watch-mode
npm run serve  # Starta lokal server
```

### Bygg och kör
```bash
npm start      # Bygg och starta
```

Öppna sedan `http://localhost:8080` i din webbläsare.

## Spelmekanik att implementera i framtiden
### Kortsiktigt
- [ ] Förbättra vedras-animationer
- [ ] Lägg till ljudeffekter
- [ ] Bättre partikeleffekter för reaktioner
- [ ] High score-system

### Långsiktigt  
- [ ] Flera nivåer med olika svårighetsgrad
- [ ] Powerups (t.ex. lykta för att se varelser)
- [ ] Olika typer av vedstaplar
- [ ] Multiplayer-läge
- [ ] Berättarröst eller bakgrundsmusik

## Utvecklingsnotiser
Projektet är strukturerat för att vara lätt att bygga på under en spelsylt. Huvudklasserna är separerade så att du enkelt kan:
- Lägga till nya varelser i `types.ts` och `gameRenderer.ts`
- Ändra vedstapel-generering i `woodPileGenerator.ts`  
- Modifiera spelregler i `game.ts`

## Licens
MIT License - Detta är ett hobbyprojekt för en spelsylt!
