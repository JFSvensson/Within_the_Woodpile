# Audio Assets

Denna mapp innehåller alla ljudfiler för spelet. Audiofilerna är organiserade i kategorier:

## Struktur

```
assets/audio/
├── ui/                 # UI-ljud
│   ├── click.mp3      # Knapp-klick
│   ├── hover.mp3      # Hover-effekt
│   ├── open.mp3       # Öppna modal
│   └── close.mp3      # Stäng modal
├── game/               # Spel-ljud
│   ├── wood_pickup.mp3     # Plocka ved
│   ├── wood_collapse.mp3   # Ved rasar
│   ├── wood_hover.mp3      # Hover över ved
│   ├── health_low.mp3      # Låg hälsa
│   ├── level_complete.mp3  # Nivå klar
│   └── score_milestone.mp3 # Poäng-milstolpe
├── creatures/          # Varelse-ljud
│   ├── appear.mp3     # Varelse dyker upp
│   ├── success.mp3    # Lyckad reaktion
│   ├── fail.mp3       # Misslyckad reaktion
│   ├── spider.mp3     # Spindel-ljud
│   ├── wasp.mp3       # Geting-ljud
│   ├── hedgehog.mp3   # Igelkott-ljud
│   ├── ghost.mp3      # Spöke-ljud
│   └── pumpkin.mp3    # Pumpa-ljud
└── music/              # Bakgrundsmusik
    ├── menu.mp3       # Meny-musik
    ├── game.mp3       # Spel-musik
    └── game_over.mp3  # Game over-musik
```

## Ljudformat

- **Format**: MP3 (för bred kompatibilitet)
- **Bitrate**: 128-192 kbps för ljudeffekter, 192-320 kbps för musik
- **Volym**: Alla filer normaliserade till samma peak-nivå
- **Längd**: 
  - UI-ljud: 0.1-0.5 sekunder
  - Spel-ljud: 0.5-2 sekunder
  - Musik: 1-3 minuter (loop)

## Generering av Placeholders

För utveckling kan du skapa enkla placeholder-ljud med:

1. **Audacity** (gratis)
   - Generera toner med "Generate > Tone"
   - UI-ljud: Korta sinus-vågor (800-1200 Hz)
   - Spel-ljud: Brus eller komplexa toner
   - Musik: Enkla melodier eller ambient drones

2. **Online-verktyg**
   - freesound.org för gratis ljud
   - opengameart.org för spelljud
   - ccmixter.org för musik

3. **Text-to-Speech för placeholders**
   - Enkla meddelanden som "click", "hover" etc.

## Implementation

AudioManager kommer automatiskt att:
- Ladda dessa filer vid start
- Cacha dem för snabb uppspelning
- Hantera volym och inställningar
- Spela rätt ljud vid rätt tillfälle

Om en ljudfil saknas kommer spelet fortfarande fungera - ljudsystemet är designat för graceful degradation.