/**
 * AI Rival Nemesis & Tactical Radio Chatter System for Void-Rider 3D
 * Generates dynamic in-race pilot comms, rival taunts, missile warnings, and grudge ratings.
 */
import { NemesisProfile, RivalRadioChatter } from '../types';
import { sound } from './audio';

const RIVALS: { id: string; name: string; shipName: string; callsign: string; avatarColor: string }[] = [
  { id: 'rival_nyx', name: 'Nyx Shadow', shipName: 'Black Phoenix', callsign: 'PHANTOM-01', avatarColor: '#ec4899' },
  { id: 'rival_lyra', name: 'Lyra Vance', shipName: 'Nebula Dart', callsign: 'NEBULA-9', avatarColor: '#00f0ff' },
  { id: 'rival_orion', name: 'Orion Drake', shipName: 'Solar Wing', callsign: 'SOLAR-ACE', avatarColor: '#f59e0b' },
  { id: 'rival_kaelen', name: 'Kaelen Voss', shipName: 'Aegis Cruiser', callsign: 'TITAN-HEAVY', avatarColor: '#10b981' },
];

export class RivalNemesisSystem {
  public activeChatter: RivalRadioChatter | null = null;
  private chatterTimeout: any = null;
  private lastTriggerTime: number = 0;

  constructor() {}

  public triggerChatter(
    triggerType: 'OVERTAKE' | 'MISSILE_LOCK' | 'EMP_STUN' | 'SLINGSHOT' | 'DAMAGE',
    pilotId?: string
  ): RivalRadioChatter | null {
    const now = Date.now();
    if (now - this.lastTriggerTime < 5000) return null; // Throttle comms
    this.lastTriggerTime = now;

    const rival = RIVALS.find((r) => r.id === pilotId) || RIVALS[Math.floor(Math.random() * RIVALS.length)];

    let messages: string[] = [];
    switch (triggerType) {
      case 'OVERTAKE':
        messages = [
          'Too slow, rookie! Try checking my afterburners!',
          'Clean overtake. Keep up if you can handle this G-force!',
          'Nice line back there, but the apex is mine!',
        ];
        break;
      case 'MISSILE_LOCK':
        messages = [
          'WARNING! Hostile missile lock acquired on my vector!',
          'Evasive maneuvers! Who authorized guided ordnance?!',
          'Deploying thermal decoys—break lock now!',
        ];
        break;
      case 'EMP_STUN':
        messages = [
          'Argh! My thruster coils are fried! You will pay for that!',
          'EMP shockwave hit! Core rebooting in three seconds!',
          'Dirty tactical trick! You are on my target list now!',
        ];
        break;
      case 'SLINGSHOT':
        messages = [
          'Catching the event horizon slingshot—hold on!',
          'Maximum acceleration vector locked in! See you in orbit!',
        ];
        break;
      case 'DAMAGE':
        messages = [
          'Hull impact sustained! Structural shields down 40%!',
          'Heavy debris strike! Re-routing auxiliary coolant!',
        ];
        break;
    }

    const message = messages[Math.floor(Math.random() * messages.length)];

    const chatter: RivalRadioChatter = {
      id: 'chat_' + now,
      pilotId: rival.id,
      pilotName: rival.name,
      callsign: rival.callsign,
      avatarColor: rival.avatarColor,
      message,
      triggerType,
      timestamp: now,
    };

    this.activeChatter = chatter;

    sound.playCheckpoint(); // Subtle radio squawk audio cue

    if (this.chatterTimeout) clearTimeout(this.chatterTimeout);
    this.chatterTimeout = setTimeout(() => {
      this.activeChatter = null;
    }, 4200);

    return chatter;
  }
}

export const rivalNemesisSystem = new RivalNemesisSystem();
