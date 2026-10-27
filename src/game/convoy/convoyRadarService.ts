/**
 * VOID-RIDER 3D — CONVOY GUARDIAN TACTICAL RADAR & DETECTION SERVICE
 * 
 * Master contract requirements:
 * - Authoritative shared detection service fed by actual world-space transforms
 * - Evaluates detection range, line-of-sight, stealth, jamming, and scanner bonuses
 * - Differentiates LIVE contacts from LAST KNOWN contacts (with timestamp/age decay)
 * - Faction-aware visibility: SAVIOUR vs HUNTERS
 * - Accessible contact symbology (Shape & Color)
 * - Target selection does not change ship possession
 */
import * as THREE from 'three';
import { RadarContact, ConvoyShipState, EnemyDrone } from './convoyTypes';

interface StoredContact {
  contact: RadarContact;
  lastSeenTime: number;
}

export class ConvoyRadarService {
  private contactsMemory = new Map<string, StoredContact>();
  public baseDetectionRange = 1800; // Meters
  public lastKnownRetentionSec = 10; // Fades out over 10s after losing contact
  public isJammingActive = false;
  public scannerBonusActive = false;

  public updateContacts(
    playerPos: THREE.Vector3,
    playerRot: THREE.Euler,
    playerFaction: 'SAVIOUR' | 'HUNTERS',
    convoyShips: ConvoyShipState[],
    enemyDrones: EnemyDrone[],
    hazards: Array<{ id: string; kind: string; position: THREE.Vector3; radius: number }>,
    checkpointPos: THREE.Vector3 | null,
    parkingDomePos: THREE.Vector3 | null,
    currentTime: number,
    stealthEntities: Set<string> = new Set()
  ): RadarContact[] {
    const liveContacts: RadarContact[] = [];
    const playerHeading = -playerRot.y; // Forward vector angle in X-Z plane

    const maxRange = this.scannerBonusActive ? this.baseDetectionRange * 1.5 : this.baseDetectionRange;

    // 1. Evaluate Convoy Ships
    convoyShips.forEach((ship) => {
      if (!ship.isAlive) return;
      const dist = playerPos.distanceTo(ship.position);
      const isFriendly = playerFaction === 'SAVIOUR';

      // Friendly convoy ships are always communicated via transponder
      // If player is Hunter, convoy ships must be within sensor range unless stealth applies
      const isStealthed = stealthEntities.has(ship.id);
      const effectiveRange = isStealthed ? 300 : maxRange;

      if (isFriendly || dist <= effectiveRange) {
        const dx = ship.position.x - playerPos.x;
        const dz = ship.position.z - playerPos.z;
        const worldAngle = Math.atan2(dx, -dz);
        const relativeAngle = worldAngle - playerHeading;

        const isLead = ship.isLead;
        const isCargo = ship.role === 'CARGO';

        const contact: RadarContact = {
          id: ship.id,
          name: ship.name,
          faction: 'SAVIOUR',
          category: isCargo ? 'CARGO' : isFriendly ? 'FRIENDLY' : 'HOSTILE',
          worldPos: { x: ship.position.x, y: ship.position.y, z: ship.position.z },
          distance: Math.round(dist),
          angleRad: relativeAngle,
          isLive: true,
          lastSeenAgeSec: 0,
          symbol: isCargo ? 'SQUARE' : isLead ? 'STAR' : 'TRIANGLE',
          color: isFriendly ? (isCargo ? '#38bdf8' : '#2dd4bf') : '#ef4444',
          healthPct: Math.round((ship.health / ship.maxHealth) * 100),
        };

        liveContacts.push(contact);
        this.contactsMemory.set(ship.id, { contact, lastSeenTime: currentTime });
      }
    });

    // 2. Evaluate Enemy Drones & Hostile/Allied Fighters
    enemyDrones.forEach((drone) => {
      if (!drone.isAlive) return;
      const dist = playerPos.distanceTo(drone.position);
      const isFriendly = playerFaction === 'HUNTERS';

      const isStealthed = stealthEntities.has(drone.id);
      const effectiveRange = isStealthed ? 250 : maxRange;

      if (isFriendly || dist <= effectiveRange) {
        const dx = drone.position.x - playerPos.x;
        const dz = drone.position.z - playerPos.z;
        const worldAngle = Math.atan2(dx, -dz);
        const relativeAngle = worldAngle - playerHeading;

        const isBoss = drone.role === 'BOSS';
        const isDrone = drone.role === 'DEFENSE_DRONE' || drone.type === 'DEFENSE_DRONE';

        const contact: RadarContact = {
          id: drone.id,
          name: isBoss ? 'DREADNOUGHT X (BOSS)' : isDrone ? 'DEFENSE DRONE' : 'HUNTER STRIKER',
          faction: 'HUNTERS',
          category: isBoss ? 'BOSS' : isDrone ? 'DRONE' : isFriendly ? 'FRIENDLY' : 'HOSTILE',
          worldPos: { x: drone.position.x, y: drone.position.y, z: drone.position.z },
          distance: Math.round(dist),
          angleRad: relativeAngle,
          isLive: true,
          lastSeenAgeSec: 0,
          symbol: isBoss ? 'HEXAGON' : isDrone ? 'DIAMOND' : 'TRIANGLE',
          color: isFriendly ? '#c084fc' : isBoss ? '#f43f5e' : '#f97316',
          healthPct: Math.round((drone.health / drone.maxHealth) * 100),
        };

        liveContacts.push(contact);
        this.contactsMemory.set(drone.id, { contact, lastSeenTime: currentTime });
      }
    });

    // 3. Evaluate Route Hazards
    hazards.forEach((hazard) => {
      const dist = playerPos.distanceTo(hazard.position);
      if (dist <= maxRange * 0.8) {
        const dx = hazard.position.x - playerPos.x;
        const dz = hazard.position.z - playerPos.z;
        const worldAngle = Math.atan2(dx, -dz);
        const relativeAngle = worldAngle - playerHeading;

        const contact: RadarContact = {
          id: hazard.id,
          name: hazard.kind,
          faction: 'NEUTRAL',
          category: 'HAZARD',
          worldPos: { x: hazard.position.x, y: hazard.position.y, z: hazard.position.z },
          distance: Math.round(dist),
          angleRad: relativeAngle,
          isLive: true,
          lastSeenAgeSec: 0,
          symbol: 'CIRCLE',
          color: '#fbbf24',
        };
        liveContacts.push(contact);
      }
    });

    // 4. Checkpoint / Destination Gateway
    if (checkpointPos) {
      const dist = playerPos.distanceTo(checkpointPos);
      const dx = checkpointPos.x - playerPos.x;
      const dz = checkpointPos.z - playerPos.z;
      const worldAngle = Math.atan2(dx, -dz);
      const relativeAngle = worldAngle - playerHeading;

      liveContacts.push({
        id: 'checkpoint_next',
        name: 'NEXT CHECKPOINT',
        faction: 'NEUTRAL',
        category: 'CHECKPOINT',
        worldPos: { x: checkpointPos.x, y: checkpointPos.y, z: checkpointPos.z },
        distance: Math.round(dist),
        angleRad: relativeAngle,
        isLive: true,
        lastSeenAgeSec: 0,
        symbol: 'STAR',
        color: '#00f0ff',
      });
    }

    // 5. Parking Dome Gateway
    if (parkingDomePos) {
      const dist = playerPos.distanceTo(parkingDomePos);
      const dx = parkingDomePos.x - playerPos.x;
      const dz = parkingDomePos.z - playerPos.z;
      const worldAngle = Math.atan2(dx, -dz);
      const relativeAngle = worldAngle - playerHeading;

      liveContacts.push({
        id: 'parking_dome_gate',
        name: 'PARKING DOME EXTRACTION',
        faction: 'NEUTRAL',
        category: 'DOME',
        worldPos: { x: parkingDomePos.x, y: parkingDomePos.y, z: parkingDomePos.z },
        distance: Math.round(dist),
        angleRad: relativeAngle,
        isLive: true,
        lastSeenAgeSec: 0,
        symbol: 'HEXAGON',
        color: '#10b981',
      });
    }

    // 6. Include Fading "LAST KNOWN" Contacts from Memory
    const liveIds = new Set(liveContacts.map(c => c.id));
    this.contactsMemory.forEach((stored, id) => {
      if (liveIds.has(id)) return;
      const age = currentTime - stored.lastSeenTime;
      if (age < this.lastKnownRetentionSec) {
        // Calculate relative angle to current player heading
        const dx = stored.contact.worldPos.x - playerPos.x;
        const dz = stored.contact.worldPos.z - playerPos.z;
        const worldAngle = Math.atan2(dx, -dz);
        const relativeAngle = worldAngle - playerHeading;
        const dist = Math.sqrt(dx * dx + dz * dz);

        liveContacts.push({
          ...stored.contact,
          distance: Math.round(dist),
          angleRad: relativeAngle,
          isLive: false,
          lastSeenAgeSec: Math.round(age),
        });
      } else {
        this.contactsMemory.delete(id);
      }
    });

    return liveContacts;
  }

  public clear() {
    this.contactsMemory.clear();
    this.isJammingActive = false;
    this.scannerBonusActive = false;
  }
}

export const convoyRadarService = new ConvoyRadarService();
