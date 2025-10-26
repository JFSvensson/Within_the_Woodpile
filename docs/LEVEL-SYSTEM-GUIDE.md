# Nivåsystem - Användningsexempel

## Grundläggande användning

### 1. Skapa en LevelManager

```typescript
import { LevelManager, DifficultyLevel } from './core/managers/index.js';

// Skapa med default svårighetsgrad (Normal) och nivå 1
const levelManager = new LevelManager();

// Eller med anpassad svårighetsgrad och startanivå
const hardLevelManager = new LevelManager(DifficultyLevel.HARD, 3);
```

### 2. Applicera svårighetsgrad på GameConfig

```typescript
import { DEFAULT_CONFIG } from './shared/constants/index.js';

// Hämta modifierad config baserat på svårighetsgrad
const gameConfig = levelManager.applyDifficultyToConfig(DEFAULT_CONFIG);

// Nu har config:
// - reactionTime: 2000ms (Normal), 3000ms (Easy), 1500ms (Hard), etc.
// - creatureProbability: Multiplicerad med difficulty spawn rate
// - healthPenalty & collapseDamage: Justerade efter difficulty
```

### 3. Starta en nivå

```typescript
// Starta nivå 1
levelManager.startLevel();

// Hämta information om nivån
const levelInfo = levelManager.getCurrentLevelInfo();
console.log(`Level ${levelInfo.levelNumber}`);
console.log(`Wood to collect: ${levelInfo.woodPieceCount}`);
console.log(`Stack height: ${levelInfo.stackHeight} layers`);
console.log(`Target score: ${levelInfo.targetScore}`);
```

### 4. Spåra progress

```typescript
// När spelaren plockar ved
levelManager.onWoodCollected(10); // 10 poäng

// Kontrollera om nivån är klar
if (levelManager.isLevelComplete()) {
    const result = levelManager.completeLevel();
    
    console.log(`Level ${result.levelNumber} complete!`);
    console.log(`Speed bonus: ${result.speedBonus}`);
    console.log(`Total score: ${result.totalScore}`);
    
    if (result.nextLevel) {
        // Starta nästa nivå
        levelManager.startLevel(result.nextLevel);
    } else {
        console.log('All levels complete!');
    }
}
```

### 5. Lyssna på events

```typescript
levelManager.on('LEVEL_START', (event) => {
    console.log(`Starting level ${event.level} on ${event.difficulty}`);
});

levelManager.on('LEVEL_COMPLETE', (event) => {
    const { speedBonus, completionTime, nextLevel } = event.data;
    console.log(`Completed in ${completionTime}s with +${speedBonus} bonus!`);
});

levelManager.on('DIFFICULTY_CHANGE', (event) => {
    console.log(`Difficulty changed to ${event.difficulty}`);
});
```

### 6. Visa progress

```typescript
const progress = levelManager.getProgress();

console.log(`Level ${progress.currentLevel}/${10}`);
console.log(`Wood: ${progress.woodCollectedThisLevel}/${progress.totalWoodOnLevel}`);
console.log(`Total Score: ${progress.totalScore}`);
console.log(`Time: ${levelManager.getLevelDuration()}s`);
```

## Integration med Game-klassen

### Exempel: Game.ts med LevelManager

```typescript
import { LevelManager } from '../managers/LevelManager.js';
import { DifficultyLevel } from '../../types/difficulty.js';

export class Game {
    private levelManager: LevelManager;
    
    constructor(
        canvas: HTMLCanvasElement, 
        i18n: I18n, 
        difficulty: DifficultyLevel = DifficultyLevel.NORMAL
    ) {
        this.levelManager = new LevelManager(difficulty);
        
        // Applicera difficulty på config
        const modifiedConfig = this.levelManager.applyDifficultyToConfig(DEFAULT_CONFIG);
        
        // Använd modifierad config för att skapa managers
        this.creatureManager = new CreatureManager(modifiedConfig, stateRef);
        
        // Sätt starting health baserat på difficulty
        this.stateManager.setHealth(this.levelManager.getStartingHealth());
        
        // Lyssna på level events
        this.setupLevelEvents();
    }
    
    private setupLevelEvents(): void {
        this.levelManager.on('LEVEL_COMPLETE', (event) => {
            this.showLevelCompleteScreen(event);
            
            if (event.data.nextLevel) {
                this.startNextLevel(event.data.nextLevel);
            }
        });
    }
    
    public startGame(): void {
        // Starta första nivån
        this.levelManager.startLevel(1);
        
        // Generera vedstapel baserat på level info
        const levelInfo = this.levelManager.getCurrentLevelInfo();
        this.woodPieces = this.woodPileGenerator.generate(
            levelInfo.woodPieceCount,
            levelInfo.stackHeight
        );
    }
    
    private onWoodPicked(points: number): void {
        // Applicera score multiplier från difficulty
        const finalPoints = this.levelManager.calculateScoreWithDifficulty(points);
        
        this.stateManager.addScore(finalPoints);
        this.levelManager.onWoodCollected(finalPoints);
        
        // Kontrollera om nivån är klar
        if (this.levelManager.isLevelComplete()) {
            this.completeCurrentLevel();
        }
    }
    
    private completeCurrentLevel(): void {
        const result = this.levelManager.completeLevel();
        
        // Visa level complete med speed bonus
        this.showLevelComplete(result);
    }
}
```

## UI Integration

### Visa svårighetsgrad-väljare i menyn

```typescript
// MenuRenderer.ts eller liknande

private renderDifficultySelector(ctx: CanvasRenderingContext2D): void {
    const difficulties = [
        DifficultyLevel.EASY,
        DifficultyLevel.NORMAL,
        DifficultyLevel.HARD,
        DifficultyLevel.EXPERT,
        DifficultyLevel.NIGHTMARE
    ];
    
    difficulties.forEach((diff, index) => {
        const modifiers = DIFFICULTY_CONFIGS[diff];
        const color = modifiers.color;
        const name = this.i18n.translate(`difficulty.${diff}.name`);
        
        // Rita knapp med färg
        ctx.fillStyle = color;
        ctx.fillRect(x, y + index * 60, width, height);
        
        // Rita text
        ctx.fillStyle = '#ffffff';
        ctx.fillText(name, x + width/2, y + index * 60 + height/2);
    });
}
```

### Visa level progress under spelet

```typescript
// UIRenderer.ts

private renderLevelProgress(
    ctx: CanvasRenderingContext2D, 
    progress: LevelProgress
): void {
    const levelText = this.i18n.translate('level.current');
    const woodText = this.i18n.translate('level.stats.woodCollected', {
        current: progress.woodCollectedThisLevel,
        total: progress.totalWoodOnLevel
    });
    
    // Rita level nummer
    ctx.font = '20px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${levelText} ${progress.currentLevel}`, 20, 30);
    
    // Rita progress bar
    const progressPercent = progress.woodCollectedThisLevel / progress.totalWoodOnLevel;
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(20, 40, 200 * progressPercent, 10);
    
    // Rita wood counter
    ctx.font = '14px Arial';
    ctx.fillText(woodText, 20, 65);
    
    // Rita tid
    const time = Math.floor((Date.now() - progress.levelStartTime) / 1000);
    ctx.fillText(`${time}s`, 20, 85);
}
```

## Svårighetsgrad-översikt

### Easy 🟢
- **Starting Health**: 150
- **Reaction Time**: 3.0s
- **Creature Spawn**: 0.5x (färre varelser)
- **Score Multiplier**: 0.8x
- **Collapse Damage**: 0.7x

### Normal 🔵
- **Starting Health**: 100
- **Reaction Time**: 2.0s
- **Creature Spawn**: 1.0x
- **Score Multiplier**: 1.0x
- **Collapse Damage**: 1.0x

### Hard 🟠
- **Starting Health**: 80
- **Reaction Time**: 1.5s
- **Creature Spawn**: 1.5x
- **Score Multiplier**: 1.3x
- **Collapse Damage**: 1.3x

### Expert 🔴
- **Starting Health**: 60
- **Reaction Time**: 1.0s
- **Creature Spawn**: 2.0x
- **Score Multiplier**: 1.7x
- **Collapse Damage**: 1.5x

### Nightmare 🟣
- **Starting Health**: 50
- **Reaction Time**: 0.75s
- **Creature Spawn**: 3.0x (många varelser!)
- **Score Multiplier**: 2.5x (högsta belöning!)
- **Collapse Damage**: 2.0x

## Nivåprogression (10 nivåer)

| Level | Wood Count | Stack Height | Target Score |
|-------|-----------|--------------|--------------|
| 1     | 15        | 5            | 100          |
| 2     | 18        | 6            | 200          |
| 3     | 21        | 7            | 350          |
| 4     | 24        | 8            | 500          |
| 5     | 27        | 9            | 700          |
| 6     | 30        | 10           | 900          |
| 7     | 33        | 11           | 1150         |
| 8     | 36        | 12           | 1400         |
| 9     | 39        | 13           | 1700         |
| 10    | 42        | 14           | 2000         |

## Speed Bonus System

- **Base Time**: 60 sekunder
- **Bonus per sekund under**: 5 poäng
- **Exempel**: Klarar nivå på 30s → +150 poäng bonus (30s under limit)

```typescript
// Speed bonus beräkning
const duration = 30; // sekunder
const timeUnderLimit = Math.max(0, 60 - duration); // 30s
const bonus = timeUnderLimit * 5; // 150 poäng
```

## Best Practices

1. **Välj rätt svårighetsgrad för målgrupp**
   - Easy: Nybörjare och casual-spelare
   - Normal: Rekommenderad för de flesta
   - Hard+: För erfarna spelare som vill ha utmaning

2. **Balansera difficulty modifiers**
   - Testa olika kombinationer
   - Justera `DIFFICULTY_CONFIGS` för perfekt balans

3. **Visa clear feedback**
   - Level progress bar
   - Speed bonus countdown
   - Difficulty color coding

4. **Använd events för UI updates**
   - Lyssna på `LEVEL_START` för övergångar
   - Använd `LEVEL_COMPLETE` för congratulations-screen

5. **Spara difficulty i settings**
   - Använd `GameDataRepository.updateSettings({ difficulty: 'hard' })`
   - Återställ difficulty vid nästa session
