export class I18n {
  private currentLanguage: string = 'sv';
  private translations: Record<string, any> = {};

  /**
   * Laddar språkfil och sparar språkval i localStorage
   */
  async loadLanguage(lang: string): Promise<void> {
    try {
      const response = await fetch(`i18n/${lang}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load language ${lang}`);
      }
      this.translations = await response.json();
      this.currentLanguage = lang;
      localStorage.setItem('language', lang);
    } catch (error) {
      console.warn(`Could not load language ${lang}, falling back to Swedish`);
      if (lang !== 'sv') {
        await this.loadLanguage('sv');
      }
    }
  }

  /**
   * Hämtar översättning för given nyckel
   */
  translate(key: string): string {
    return this.translations[key] || key;
  }

  /**
   * Returnerar nuvarande språk
   */
  getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  /**
   * Hämtar sparat språk från localStorage, fallback till svenska
   */
  getSavedLanguage(): string {
    return localStorage.getItem('language') || 'sv';
  }

  /**
   * Uppdaterar alla element med data-i18n attribut
   */
  updateUI(): void {
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      if (key) {
        element.textContent = this.translate(key);
      }
    });
  }

  /**
   * Initialiserar språksystemet och event listeners
   */
  async initialize(): Promise<void> {
    // Ladda sparat språk
    const savedLanguage = this.getSavedLanguage();
    await this.loadLanguage(savedLanguage);
    
    // Uppdatera UI
    this.updateUI();
    
    // Sätt rätt värde på språkväljaren
    const languageSelect = document.getElementById('languageSelect') as HTMLSelectElement;
    if (languageSelect) {
      languageSelect.value = this.currentLanguage;
      
      // Lägg till event listener för språkbyte
      languageSelect.addEventListener('change', async (event) => {
        const target = event.target as HTMLSelectElement;
        await this.loadLanguage(target.value);
        this.updateUI();
      });
    }
  }
}