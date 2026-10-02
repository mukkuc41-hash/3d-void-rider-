import * as THREE from 'three';

/**
 * Quantum Launch Pro presentation director.
 *
 * Every one of the 40 catastrophe events uses a continuous panoramic camera
 * composition in Submode 10. The camera frames the complete live black-hole
 * system while preserving the actual route, debris and planetary destruction.
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
    const severity = i / 40;
    const bh = blackHole.position.clone();

    // Submode 10 presentation: every event uses a single continuous
    // panoramic composition of the complete black-hole system.  Do not
    // switch to cockpit, close-up, or object-tracking shots here.
    // The camera stays far enough away to include the event horizon,
    // accretion disk, lensing, route, debris and planetary activity.
    const orbitAngle = (i - 1) * 0.22 + eventElapsed * (0.035 + severity * 0.02);
    const radius = 1550 + severity * 650;
    const height = 620 + severity * 360;
    const depth = 1050 + severity * 450;

    const targetPos = bh.clone().add(new THREE.Vector3(
      Math.cos(orbitAngle) * radius,
      height + Math.sin(eventElapsed * 0.35 + i) * (35 + severity * 40),
      Math.sin(orbitAngle) * depth,
    ));

    // Keep the whole black-hole system as the visual center. A small blend
    // toward the live route keeps the player's route/planetary destruction
    // visible without losing the panoramic black-hole framing.
    const lookTarget = bh.clone().lerp(trackPoint, 0.10);

    camera.position.lerp(targetPos, 0.055);
    camera.lookAt(lookTarget);

    // Wide panoramic lens. Late events widen slightly further so the
    // planetary collection/spaghettification and route collapse remain in frame.
    const targetFov = 76 + severity * 10;
    camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 0.08);
    camera.updateProjectionMatrix();

    // Ensure distant planetary/debris elements are not clipped.
    if (camera.far < 30000) {
      camera.far = 30000;
      camera.updateProjectionMatrix();
    }

    // Subtle gravitational drift; no aggressive cinematic shake that would
    // obscure the panoramic view.
    if (cameraShake > 0) {
      const strength = Math.min(1.4, cameraShake * (0.08 + severity * 0.16));
      camera.position.x += (Math.random() - 0.5) * strength;
      camera.position.y += (Math.random() - 0.5) * strength;
      camera.position.z += (Math.random() - 0.5) * strength * 0.5;
    }

    camera.rotation.z = THREE.MathUtils.lerp(camera.rotation.z, 0, 0.12);
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
