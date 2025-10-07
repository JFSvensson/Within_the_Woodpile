/**
 * Interface för fallande löv-partiklar
 */
interface Particle {
    x: number;
    y: number;
    velocity: {
        x: number;
        y: number;
    };
    size: number;
    rotation: number;
    rotationSpeed: number;
    type: string;
}

/**
 * MenuParticleSystem ansvarar för att hantera fallande löv-partiklar i menyn
 * Skapar atmosfärisk känsla med naturliga animationer
 */
export class MenuParticleSystem {
    private particles: Particle[] = [];
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.initialize();
    }

    /**
     * Initialiserar partikelsystemet med fallande löv
     */
    public initialize(): void {
        this.particles = [];
        
        // Skapa 20 löv-partiklar med slumpmässiga egenskaper
        for (let i = 0; i < 20; i++) {
            this.particles.push(this.createRandomParticle());
        }
    }

    /**
     * Skapar en enskild partikel med slumpmässiga egenskaper
     */
    private createRandomParticle(): Particle {
        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            velocity: {
                x: (Math.random() - 0.5) * 0.5, // Lätt sidovind
                y: Math.random() * 1 + 0.5      // Fallhastighet
            },
            size: Math.random() * 8 + 4,        // Storlek 4-12px
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.02, // Rotation per frame
            type: Math.random() > 0.5 ? '🍂' : '🍃'      // Brunt eller grönt löv
        };
    }

    /**
     * Uppdaterar alla partiklars positioner och rotation
     */
    public update(): void {
        this.particles.forEach(particle => {
            // Uppdatera position baserat på hastighet
            particle.x += particle.velocity.x;
            particle.y += particle.velocity.y;
            particle.rotation += particle.rotationSpeed;

            // Återställ partikel om den faller ut ur skärmen
            if (particle.y > this.canvas.height + 10) {
                this.resetParticleToTop(particle);
            }

            // Återställ partikel om den glider ut åt sidorna
            if (particle.x < -10 || particle.x > this.canvas.width + 10) {
                particle.x = Math.random() * this.canvas.width;
            }
        });
    }

    /**
     * Återställer en partikel till toppen av skärmen
     */
    private resetParticleToTop(particle: Particle): void {
        particle.y = -10;
        particle.x = Math.random() * this.canvas.width;
        // Ge partikeln lite slumpmässig variation när den återställs
        particle.velocity.x = (Math.random() - 0.5) * 0.5;
        particle.velocity.y = Math.random() * 1 + 0.5;
    }

    /**
     * Renderar alla partiklar på canvas
     */
    public render(): void {
        this.particles.forEach(particle => {
            this.renderSingleParticle(particle);
        });
    }

    /**
     * Renderar en enskild partikel med rotation och emoji
     */
    private renderSingleParticle(particle: Particle): void {
        this.ctx.save();
        
        // Flytta till partikelns position och rotera
        this.ctx.translate(particle.x, particle.y);
        this.ctx.rotate(particle.rotation);
        
        // Rita löv-emoji
        this.ctx.font = `${particle.size}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(particle.type, 0, 0);
        
        this.ctx.restore();
    }

    /**
     * Ändrar antalet partiklar (för prestanda-justering)
     */
    public setParticleCount(count: number): void {
        if (count < this.particles.length) {
            // Ta bort överskottspartiklar
            this.particles = this.particles.slice(0, count);
        } else if (count > this.particles.length) {
            // Lägg till nya partiklar
            const particlesToAdd = count - this.particles.length;
            for (let i = 0; i < particlesToAdd; i++) {
                this.particles.push(this.createRandomParticle());
            }
        }
    }

    /**
     * Pausar/återupptar partikelsystemet
     */
    public setPaused(paused: boolean): void {
        // För framtida användning - kan implementeras med en paused-flagga
        // som hindrar update() från att köras
    }

    /**
     * Rensa alla partiklar och frigör resurser
     */
    public destroy(): void {
        this.particles = [];
    }

    /**
     * Hämtar aktuellt antal partiklar (för debug)
     */
    public getParticleCount(): number {
        return this.particles.length;
    }
}