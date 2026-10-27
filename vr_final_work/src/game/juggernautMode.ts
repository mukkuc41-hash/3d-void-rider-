/**
 * Asymmetrical Juggernaut Mode Director for Void-Rider 3D
 * 1 Heavy Dreadnought Juggernaut vs 5 Agile Interceptors with escape gate objectives
 * and team-based attrition telemetry.
 */
import { JuggernautModeTelemetry } from '../types';
import { sound } from './audio';

export class JuggernautModeDirector {
  public isActive: boolean = false;
  public isPlayerJuggernaut: boolean = true;

  public juggernautHealth: number = 500;
  public juggernautMaxHealth: number = 500;
  public juggernautShield: number = 200;
  public interceptorsRemaining: number = 5;
  public totalInterceptors: number = 5;

  public distanceToEscapeGateMeters: number = 7500;
  public totalGateDistanceMeters: number = 7500;

  constructor() {}

  public startJuggernautMatch(asJuggernaut: boolean = true) {
    this.isActive = true;
    this.isPlayerJuggernaut = asJuggernaut;
    this.juggernautHealth = 500;
    this.juggernautMaxHealth = 500;
    this.juggernautShield = 200;
    this.interceptorsRemaining = 5;
    this.distanceToEscapeGateMeters = 7500;
    sound.playAlarmAlert();
  }

  public update(deltaSeconds: number, currentSpeed: number): JuggernautModeTelemetry {
    if (!this.isActive) return this.getTelemetry();

    // Advance distance toward the escape gate based on speed
    const advance = (currentSpeed * 1000 / 3600) * deltaSeconds;
    this.distanceToEscapeGateMeters = Math.max(0, this.distanceToEscapeGateMeters - advance);

    // Regenerate shield slowly if not recently hit
    if (this.juggernautShield < 200) {
      this.juggernautShield = Math.min(200, this.juggernautShield + deltaSeconds * 8);
    }

    return this.getTelemetry();
  }

  public damageJuggernaut(amount: number): boolean {
    if (this.juggernautShield > 0) {
      this.juggernautShield = Math.max(0, this.juggernautShield - amount);
      sound.playShieldHit();
    } else {
      this.juggernautHealth = Math.max(0, this.juggernautHealth - amount);
      sound.playExplosion();
    }
    return this.juggernautHealth <= 0;
  }

  public destroyInterceptor(): number {
    this.interceptorsRemaining = Math.max(0, this.interceptorsRemaining - 1);
    sound.playExplosion();
    return this.interceptorsRemaining;
  }

  public getTelemetry(): JuggernautModeTelemetry {
    const progress = Math.min(
      100,
      Math.round(((this.totalGateDistanceMeters - this.distanceToEscapeGateMeters) / this.totalGateDistanceMeters) * 100)
    );

    return {
      isActive: this.isActive,
      isPlayerJuggernaut: this.isPlayerJuggernaut,
      juggernautName: this.isPlayerJuggernaut ? 'PLAYER JUGGERNAUT' : 'TITAN DREADNOUGHT AI',
      juggernautHealth: Math.round(this.juggernautHealth),
      juggernautMaxHealth: this.juggernautMaxHealth,
      juggernautShield: Math.round(this.juggernautShield),
      interceptorsRemaining: this.interceptorsRemaining,
      totalInterceptors: this.totalInterceptors,
      distanceToEscapeGateMeters: Math.round(this.distanceToEscapeGateMeters),
      escapeProgressPercent: progress,
    };
  }

  public stop() {
    this.isActive = false;
  }
}

export const juggernautMode = new JuggernautModeDirector();
