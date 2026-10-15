/**
 * Interactive 3D Track Builder Engine for Void-Rider 3D
 * Generates custom procedural spline tracks, handles node manipulation,
 * interactive Three.js 3D editing, and base64 export/import.
 */
import * as THREE from 'three';
import { CustomTrackData, CustomTrackNode } from '../types';

export class TrackBuilderEngine {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer | null = null;

  public nodes: CustomTrackNode[] = [];
  public selectedNodeIndex: number = 0;

  private trackMesh: THREE.Mesh | null = null;
  private nodeMarkers: THREE.Mesh[] = [];
  private propMeshes: THREE.Object3D[] = [];
  private gridHelper: THREE.GridHelper | null = null;

  private animationFrameId: number | null = null;
  private isOrbiting: boolean = false;
  private camRadius: number = 250;
  private camTheta: number = Math.PI / 4;
  private camPhi: number = Math.PI / 4;

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x030712);

    this.camera = new THREE.PerspectiveCamera(60, 1, 1, 4000);
    this.camera.position.set(200, 150, 200);
    this.camera.lookAt(0, 0, 0);

    this.setupLighting();
    this.initDefaultTrack();
  }

  private setupLighting() {
    const amb = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(amb);

    const dir = new THREE.DirectionalLight(0x00f0ff, 1.5);
    dir.position.set(100, 200, 100);
    this.scene.add(dir);

    const dir2 = new THREE.DirectionalLight(0xa855f7, 1.2);
    dir2.position.set(-100, -100, -100);
    this.scene.add(dir2);

    this.gridHelper = new THREE.GridHelper(600, 30, 0x00f0ff, 0x1e293b);
    this.gridHelper.position.y = -2;
    this.scene.add(this.gridHelper);
  }

  private initDefaultTrack() {
    // 6 default nodes forming an expansive cosmic circuit
    this.nodes = [
      { id: 'n1', x: 0, y: 0, z: -150, bank: 0, width: 22, hasBoostPad: true },
      { id: 'n2', x: 120, y: 25, z: -80, bank: 15, width: 22, hasNeonRing: true },
      { id: 'n3', x: 150, y: 50, z: 80, bank: 30, width: 22, hasObstacle: true },
      { id: 'n4', x: 20, y: 30, z: 160, bank: 10, width: 22, hasBoostPad: true },
      { id: 'n5', x: -130, y: 15, z: 100, bank: -20, width: 22, hasNeonRing: true },
      { id: 'n6', x: -140, y: 5, z: -80, bank: -15, width: 22 },
    ];
  }

  public attachCanvas(container: HTMLDivElement) {
    if (this.renderer) {
      if (this.renderer.domElement.parentElement) {
        this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
      }
      this.renderer.dispose();
    }

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    this.camera.aspect = container.clientWidth / container.clientHeight;
    this.camera.updateProjectionMatrix();

    this.rebuildTrack();
    this.startLoop();
  }

  public resize(width: number, height: number) {
    if (!this.renderer) return;
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  public addNode() {
    const lastNode = this.nodes[this.nodes.length - 1] || { x: 0, y: 0, z: 0, bank: 0, width: 22 };
    const secondLast = this.nodes[this.nodes.length - 2] || { x: 0, y: 0, z: -50 };

    const dirX = lastNode.x - secondLast.x;
    const dirZ = lastNode.z - secondLast.z;

    const newNode: CustomTrackNode = {
      id: 'n_' + Date.now().toString(36),
      x: lastNode.x + dirX * 0.8,
      y: lastNode.y,
      z: lastNode.z + dirZ * 0.8,
      bank: 0,
      width: 22,
    };

    this.nodes.push(newNode);
    this.selectedNodeIndex = this.nodes.length - 1;
    this.rebuildTrack();
  }

  public deleteSelectedNode() {
    if (this.nodes.length <= 3) return; // Keep at least 3 nodes for a loop
    this.nodes.splice(this.selectedNodeIndex, 1);
    this.selectedNodeIndex = Math.max(0, this.selectedNodeIndex - 1);
    this.rebuildTrack();
  }

  public updateSelectedNode(partial: Partial<CustomTrackNode>) {
    if (!this.nodes[this.selectedNodeIndex]) return;
    this.nodes[this.selectedNodeIndex] = {
      ...this.nodes[this.selectedNodeIndex],
      ...partial,
    };
    this.rebuildTrack();
  }

  public rebuildTrack() {
    // Clean old track and props
    if (this.trackMesh) {
      this.scene.remove(this.trackMesh);
      this.trackMesh.geometry.dispose();
      this.trackMesh = null;
    }
    this.nodeMarkers.forEach((m) => {
      this.scene.remove(m);
      m.geometry.dispose();
    });
    this.nodeMarkers = [];

    this.propMeshes.forEach((p) => {
      this.scene.remove(p);
    });
    this.propMeshes = [];

    if (this.nodes.length < 3) return;

    // Build CatmullRomCurve3
    const points = this.nodes.map((n) => new THREE.Vector3(n.x, n.y, n.z));
    const curve = new THREE.CatmullRomCurve3(points, true, 'centripetal', 0.5);

    // Build tubular/ribbon track geometry
    const tubeGeo = new THREE.TubeGeometry(curve, 180, 8, 12, true);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.3,
      metalness: 0.8,
      wireframe: false,
    });
    this.trackMesh = new THREE.Mesh(tubeGeo, tubeMat);
    this.scene.add(this.trackMesh);

    // Add glowing neon rail outlines
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.4,
    });
    const wireMesh = new THREE.Mesh(tubeGeo, wireMat);
    this.trackMesh.add(wireMesh);

    // Build Node Handle Markers
    this.nodes.forEach((node, idx) => {
      const isSelected = idx === this.selectedNodeIndex;
      const markerGeo = new THREE.SphereGeometry(isSelected ? 4.5 : 3, 16, 16);
      const markerMat = new THREE.MeshBasicMaterial({
        color: isSelected ? 0xfbbf24 : 0x00f0ff,
        wireframe: true,
      });
      const marker = new THREE.Mesh(markerGeo, markerMat);
      marker.position.set(node.x, node.y, node.z);
      this.scene.add(marker);
      this.nodeMarkers.push(marker);

      // Add Boost Pad Prop if enabled
      if (node.hasBoostPad) {
        const boostGeo = new THREE.BoxGeometry(10, 0.5, 8);
        const boostMat = new THREE.MeshBasicMaterial({ color: 0x10b981, wireframe: true });
        const boost = new THREE.Mesh(boostGeo, boostMat);
        boost.position.set(node.x, node.y + 4.5, node.z);
        this.scene.add(boost);
        this.propMeshes.push(boost);
      }

      // Add Neon Ring Prop if enabled
      if (node.hasNeonRing) {
        const ringGeo = new THREE.TorusGeometry(12, 0.8, 12, 24);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.set(node.x, node.y, node.z);
        this.scene.add(ring);
        this.propMeshes.push(ring);
      }

      // Add Asteroid Obstacle if enabled
      if (node.hasObstacle) {
        const astGeo = new THREE.DodecahedronGeometry(6, 1);
        const astMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.9 });
        const ast = new THREE.Mesh(astGeo, astMat);
        ast.position.set(node.x + 12, node.y + 6, node.z);
        this.scene.add(ast);
        this.propMeshes.push(ast);
      }
    });
  }

  public exportTrackCode(name: string = 'Custom Circuit', author: string = 'Pilot'): string {
    const data: CustomTrackData = {
      id: 'ct_' + Date.now().toString(36),
      name,
      author,
      createdAt: Date.now(),
      nodes: this.nodes,
      loops: true,
      environmentTheme: 'DEEP_SPACE',
    };
    return btoa(JSON.stringify(data));
  }

  public importTrackCode(code: string): boolean {
    try {
      const json = atob(code.trim());
      const data: CustomTrackData = JSON.parse(json);
      if (data.nodes && Array.isArray(data.nodes) && data.nodes.length >= 3) {
        this.nodes = data.nodes;
        this.selectedNodeIndex = 0;
        this.rebuildTrack();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // Camera Orbit Controls for track preview
  public rotateCamera(deltaX: number, deltaY: number) {
    this.camTheta += deltaX * 0.008;
    this.camPhi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, this.camPhi + deltaY * 0.008));
    this.updateCamPosition();
  }

  public zoomCamera(deltaZoom: number) {
    this.camRadius = Math.max(60, Math.min(600, this.camRadius + deltaZoom * 0.2));
    this.updateCamPosition();
  }

  private updateCamPosition() {
    this.camera.position.x = this.camRadius * Math.sin(this.camPhi) * Math.sin(this.camTheta);
    this.camera.position.y = this.camRadius * Math.cos(this.camPhi);
    this.camera.position.z = this.camRadius * Math.sin(this.camPhi) * Math.cos(this.camTheta);
    this.camera.lookAt(0, 20, 0);
  }

  private startLoop() {
    const loop = () => {
      this.animationFrameId = requestAnimationFrame(loop);
      if (this.renderer && this.scene && this.camera) {
        // Subtle rotation of props
        this.propMeshes.forEach((p) => {
          p.rotation.y += 0.01;
        });
        this.renderer.render(this.scene, this.camera);
      }
    };
    loop();
  }

  public dispose() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.renderer) {
      if (this.renderer.domElement.parentElement) {
        this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
      }
      this.renderer.dispose();
      this.renderer = null;
    }
  }
}
