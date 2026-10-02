import * as THREE from 'three';

/**
 * Quantum Launch Pro presentation director.
 *
 * Every one of the 40 catastrophe events has a multi-shot cinematic instead
 * of a single camera pose.  The shots are generated from the live player,
 * black-hole and route positions, so the cinematics keep showing the actual
 * world that is being simulated.
 */
export class BlackHoleEventCinematicDirector {
  private readonly phaseOffset = Array.from({ length: 40 }, (_, i) => (i * 0.37) % 1);
  private readonly baseFov = 70;
  private lastEvent = 0;

  public isActive(eventIndex: number, phase: string, submode: number): boolean {
    return submode === 10 && eventIndex >= 1 && eventIndex <= 40 && phase === 'CINEMATIC';
  }

  public update(
    camera: THREE.PerspectiveCamera,
    player: THREE.Object3D,
    blackHole: THREE.Object3D,
    trackPoint: THREE.Vector3,
    eventIndex: number,
    eventElapsed: number,
    cameraShake = 0,
  ): void {
    const i = THREE.MathUtils.clamp(Math.floor(eventIndex), 1, 40);
    const n = i - 1;
    const duration = 2.5 + (i >= 31 ? 0.75 : 0);
    const t = THREE.MathUtils.clamp(eventElapsed / duration, 0, 1);
    const phase = t * 4;
    const beat = Math.min(3, Math.floor(phase));
    const beatT = phase - beat;
    const smooth = beatT * beatT * (3 - 2 * beatT);
    const a = this.phaseOffset[n];

    const playerPos = player.position.clone();
    const bh = blackHole.position.clone();
    const route = trackPoint.clone();
    const side = i % 2 ? 1 : -1;
    const severity = i / 40;

    // Four reusable cinematic beats are composed differently for each event:
    // 1) establishing shot, 2) phenomenon/object close-up,
    // 3) player reaction or rear destruction view, 4) black-hole payoff.
    const look = new THREE.Vector3();
    let start = new THREE.Vector3();
    let end = new THREE.Vector3();

    const objectA = route.clone().add(new THREE.Vector3(45 + i * 1.5, 8 + i * .2, 35));
    const rear = playerPos.clone().add(new THREE.Vector3(0, 12 + severity * 20, 75 + severity * 120));
    const wide = bh.clone().add(new THREE.Vector3(side * (180 + severity * 800), 60 + severity * 280, 140 + severity * 600));
    const close = playerPos.clone().add(new THREE.Vector3(side * (18 + severity * 30), 5 + severity * 12, 22 + severity * 45));

    switch (beat) {
      case 0: // Establishing / black-hole reveal
        start = wide;
        end = bh.clone().add(new THREE.Vector3(side * (110 + severity * 350), 35 + severity * 120, 90 + severity * 250));
        look.copy(bh);
        break;
      case 1: // Object tracking / impact / structure detail
        start = objectA.clone().add(new THREE.Vector3(side * 70, 30 + severity * 40, 65));
        end = objectA.clone().add(new THREE.Vector3(side * 22, 8, 24));
        look.copy(objectA);
        break;
      case 2: // Player POV/reaction + rear route destruction
        start = close;
        end = rear;
        look.copy(i >= 33 ? bh : playerPos);
        break;
      default: // Gravitational lens / final payoff
        start = bh.clone().add(new THREE.Vector3(-side * (140 + severity * 450), 45 + severity * 180, -100 - severity * 350));
        end = bh.clone().add(new THREE.Vector3(-side * (80 + severity * 260), 20 + severity * 90, -55 - severity * 180));
        look.copy(bh);
        break;
    }

    // Event-specific emphasis. These are presentation-only and never modify
    // the black-hole physics or route simulation.
    if (i === 6 || i === 30 || i === 31 || i === 36 || i === 40) {
      cameraShake = Math.max(cameraShake, 1.2 + i * 0.045);
    }
    if (i === 15 || i === 24 || i === 25 || i === 33 || i === 39) {
      look.lerp(bh, 0.72);
    }
    if (i === 18 || i === 28 || i === 34 || i === 37) {
      look.lerp(playerPos, 0.45);
    }

    const orbit = new THREE.Vector3(
      Math.cos(a + eventElapsed * 0.65) * (4 + severity * 24) * side,
      Math.sin(eventElapsed * 1.15) * (2 + severity * 10),
      Math.sin(a + eventElapsed * 0.65) * (4 + severity * 24),
    );

    const targetPos = start.lerp(end, smooth).add(orbit);
    camera.position.lerp(targetPos, 0.16);
    camera.lookAt(look);

    // Cinematic lens language: wide for reveals, compressed for impacts,
    // stronger FOV during late collapse and escape-facing events.
    const targetFov = beat === 0 ? 62 : beat === 1 ? 48 : beat === 2 ? 74 : 58;
    const lateBoost = i >= 35 ? 8 : 0;
    camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov + lateBoost, 0.12);
    camera.updateProjectionMatrix();

    // Gentle roll sells gravitational lensing; it is reset by the gameplay
    // camera once this cinematic authority returns false.
    const roll = (Math.sin(eventElapsed * 1.8 + a) * (0.008 + severity * 0.035)) * side;
    camera.rotation.z = THREE.MathUtils.lerp(camera.rotation.z, roll, 0.12);

    if (cameraShake > 0) {
      const strength = Math.min(3.5, cameraShake * (0.22 + severity * 0.65));
      camera.position.x += (Math.random() - 0.5) * strength;
      camera.position.y += (Math.random() - 0.5) * strength;
      camera.position.z += (Math.random() - 0.5) * strength * 0.5;
    }

    this.lastEvent = i;
  }

  /** Reset cinematic lens state when gameplay camera regains authority. */
  public reset(camera: THREE.PerspectiveCamera): void {
    camera.fov = THREE.MathUtils.lerp(camera.fov, this.baseFov, 0.25);
    camera.rotation.z = THREE.MathUtils.lerp(camera.rotation.z, 0, 0.25);
    camera.updateProjectionMatrix();
    this.lastEvent = 0;
  }
}
