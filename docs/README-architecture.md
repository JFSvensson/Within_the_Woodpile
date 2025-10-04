# Within the Woodpile - Arkitektur

Detta dokument beskriver systemarkitekturen för Within the Woodpile-spelet.

## UML-diagram

### Klassdiagram
![Klassdiagram](images/class-diagram.png)
- Visar alla klasser och deras relationer
- Källa: [class-diagram.puml](architecture/class-diagram.puml)

### Komponentdiagram  
![Komponentdiagram](images/component-diagram.png)
- Visar systemets moduler och beroenden
- Källa: [component-diagram.puml](architecture/component-diagram.puml)

### Dataflödesdiagram
![Dataflödesdiagram](images/dataflow-diagram.png)
- Visar hur data flödar genom systemet
- Källa: [dataflow-diagram.puml](architecture/dataflow-diagram.puml)

## Arkitekturprinciper

Projektet följer clean code-principer:
- **Separation of Concerns**: Logik, rendering och i18n separerat
- **Dependency Injection**: Klasser tar emot beroenden via konstruktor  
- **Single Responsibility**: Varje klass har ett tydligt ansvar
- **Type Safety**: Fullständig TypeScript-typning