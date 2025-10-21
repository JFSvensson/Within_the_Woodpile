/**
 * Partikel för kollaps-effekter (damm, träflisor)
 */
interface CollapseParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    opacity: number;
    rotation: number;
    rotationSpeed: number;
    color: string;
    life: number;
    maxLife: number;
}

/**
 * Hanterar partikeleffekter för ved-kollaps (damm, träflisor, debris)
 */
export class CollapseParticleSystem {
    private particles: CollapseParticle[] = [];
    private static readonly GRAVITY = 0.3;
    private static readonly AIR_RESISTANCE = 0.98;

    /**
     * Skapar partiklar för en kollapsande vedpinne
     * @param x X-position för centrum av kollaps
     * @param y Y-position för centrum av kollaps
     * @param intensity Intensitet (1-10, baserat på antal rasande pinnar)
     */
    public createCollapseParticles(x: number, y: number, intensity: number = 1): void {
        // Antal partiklar baserat på intensitet
        const particleCount = Math.min(15 + intensity * 3, 50);
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.random() * Math.PI * 2);
            const speed = 2 + Math.random() * 4;
            const isWoodChip = Math.random() > 0.7; // 30% chance för träflis
            
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2, // Initial upward velocity
                size: isWoodChip ? 3 + Math.random() * 4 : 2 + Math.random() * 3,
                opacity: 1,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.3,
                color: isWoodChip ? this.getWoodChipColor() : this.getDustColor(),
                life: 0,
                maxLife: 1000 + Math.random() * 1000 // 1-2 sekunder
            });
        }
    }

    /**
     * Slumpmässig träflis-färg
     */
    private getWoodChipColor(): string {
        const colors = [
            '#8B4513', // Saddle brown
            '#A0522D', // Sienna
            '#CD853F', // Peru
            '#DEB887', // Burlywood
            '#D2691E'  // Chocolate
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    /**
     * Slumpmässig damm-färg
     */
    private getDustColor(): string {
        const colors = [
            '#D3D3D3', // Light gray
            '#C0C0C0', // Silver
            '#B8B8B8', // Gray
            '#A8A8A8'  // Dark gray
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    /**
     * Uppdaterar alla partiklar
     * @param deltaTime Tid sedan senaste frame (ms)
     */
    public update(deltaTime: number): void {
        this.particles = this.particles.filter(particle => {
            // Uppdatera livstid
            particle.life += deltaTime;
            
            // Ta bort döda partiklar
            if (particle.life >= particle.maxLife) {
                return false;
            }
            
            // Uppdatera fysik
            particle.vy += CollapseParticleSystem.GRAVITY;
            particle.vx *= CollapseParticleSystem.AIR_RESISTANCE;
            particle.vy *= CollapseParticleSystem.AIR_RESISTANCE;
            
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Uppdatera rotation
            particle.rotation += particle.rotationSpeed;
            
            // Fade out baserat på livstid
            const lifeRatio = particle.life / particle.maxLife;
            particle.opacity = 1 - lifeRatio;
            
            return true;
        });
    }

    /**
     * Renderar alla partiklar
     * @param ctx Canvas rendering context
     */
    public render(ctx: CanvasRenderingContext2D): void {
        this.particles.forEach(particle => {
            ctx.save();
            
            ctx.globalAlpha = particle.opacity;
            ctx.translate(particle.x, particle.y);
            ctx.rotate(particle.rotation);
            
            // Rita träflis (rektangel) eller damm (cirkel)
            ctx.fillStyle = particle.color;
            if (particle.size > 4) {
                // Träflis (rektangel)
                ctx.fillRect(
                    -particle.size / 2,
                    -particle.size / 4,
                    particle.size,
                    particle.size / 2
                );
            } else {
                // Damm (cirkel)
                ctx.beginPath();
                ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        });
    }

    /**
     * Kontrollerar om det finns aktiva partiklar
     */
    public hasActiveParticles(): boolean {
        return this.particles.length > 0;
    }

    /**
     * Hämtar antal aktiva partiklar
     */
    public getActiveCount(): number {
        return this.particles.length;
    }

    /**
     * Rensar alla partiklar
     */
    public clear(): void {
        this.particles = [];
    }

    /**
     * Cleanup
     */
    public destroy(): void {
        this.clear();
    }
}
