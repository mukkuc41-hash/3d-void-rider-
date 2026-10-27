/**
 * Photo Mode Studio Manager for Void-Rider 3D
 * Enables orbital camera manipulation, FOV tuning, post-processing visual filters,
 * and high-resolution wallpaper export.
 */
import * as THREE from 'three';
import { PhotoFilterType, PhotoModeSettings } from '../types';

export const DEFAULT_PHOTO_SETTINGS: PhotoModeSettings = {
  fov: 65,
  orbitYaw: 0,
  orbitPitch: 15,
  orbitDistance: 12,
  orbitHeight: 2.5,
  roll: 0,
  filter: 'NORMAL',
  dofAmount: 0,
  bloomBoost: 1.0,
  showTelemetryWatermark: true,
  showLogo: true,
};

export class PhotoModeManager {
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private targetShip: THREE.Object3D | null = null;

  public isActive: boolean = false;
  public settings: PhotoModeSettings = { ...DEFAULT_PHOTO_SETTINGS };

  private originalFov: number = 75;
  private originalCamPos: THREE.Vector3 = new THREE.Vector3();
  private originalCamRot: THREE.Euler = new THREE.Euler();

  constructor() {}

  public init(
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
    targetShip: THREE.Object3D
  ) {
    this.camera = camera;
    this.renderer = renderer;
    this.targetShip = targetShip;
  }

  public enter() {
    if (!this.camera || !this.targetShip) return;
    this.isActive = true;

    // Save initial camera state
    this.originalFov = this.camera.fov;
    this.originalCamPos.copy(this.camera.position);
    this.originalCamRot.copy(this.camera.rotation);

    // Reset settings to comfortable angle
    this.settings = { ...DEFAULT_PHOTO_SETTINGS };
    this.updateCamera();
  }

  public exit() {
    if (!this.camera) return;
    this.isActive = false;

    // Restore original camera properties
    this.camera.fov = this.originalFov;
    this.camera.position.copy(this.originalCamPos);
    this.camera.rotation.copy(this.originalCamRot);
    this.camera.updateProjectionMatrix();
  }

  public updateSettings(newSettings: Partial<PhotoModeSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    this.updateCamera();
  }

  public updateCamera() {
    if (!this.camera || !this.targetShip || !this.isActive) return;

    // Set FOV
    this.camera.fov = this.settings.fov;
    this.camera.updateProjectionMatrix();

    // Compute spherical orbit around target ship
    const targetPos = this.targetShip.position.clone();
    targetPos.y += this.settings.orbitHeight;

    const yawRad = THREE.MathUtils.degToRad(this.settings.orbitYaw);
    const pitchRad = THREE.MathUtils.degToRad(this.settings.orbitPitch);

    const cosPitch = Math.cos(pitchRad);
    const sinPitch = Math.sin(pitchRad);
    const sinYaw = Math.sin(yawRad);
    const cosYaw = Math.cos(yawRad);

    const dist = this.settings.orbitDistance;

    const offset = new THREE.Vector3(
      dist * cosPitch * sinYaw,
      dist * sinPitch,
      dist * cosPitch * cosYaw
    );

    this.camera.position.copy(targetPos).add(offset);
    this.camera.lookAt(targetPos);

    // Apply roll
    if (this.settings.roll !== 0) {
      this.camera.rotateZ(THREE.MathUtils.degToRad(this.settings.roll));
    }
  }

  public captureScreenshot(fileName: string = 'void-rider-shot.png'): string | null {
    if (!this.renderer) return null;
    try {
      const dataUrl = this.renderer.domElement.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return dataUrl;
    } catch {
      return null;
    }
  }
}
