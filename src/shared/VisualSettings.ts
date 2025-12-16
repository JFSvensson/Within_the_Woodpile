/**
 * Global settings för visuella effekter
 * Används för att styra partiklar och animationer från settings UI
 */
class VisualSettings {
    private particlesEnabled: boolean = true;
    private animationsEnabled: boolean = true;

    /**
     * Aktivera/avaktivera partiklar
     */
    public setParticlesEnabled(enabled: boolean): void {
        this.particlesEnabled = enabled;
    }

    /**
     * Kontrollera om partiklar är aktiverade
     */
    public areParticlesEnabled(): boolean {
        return this.particlesEnabled;
    }

    /**
     * Aktivera/avaktivera animationer (skakningar, collapse-animationer)
     */
    public setAnimationsEnabled(enabled: boolean): void {
        this.animationsEnabled = enabled;
    }

    /**
     * Kontrollera om animationer är aktiverade
     */
    public areAnimationsEnabled(): boolean {
        return this.animationsEnabled;
    }
}

// Singleton instance för global access
export const visualSettings = new VisualSettings();
