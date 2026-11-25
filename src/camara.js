// 🎥 LA CÁMARA: sigue al personaje desde atrás y se gira con el mouse
import * as THREE from "three";
import { CONFIG } from "./config.js";

export class Camara {
  constructor(lienzo) {
    this.camara = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 600);
    this.angulo = 0; // vuelta alrededor del personaje
    this.inclinacion = 0.35; // qué tan desde arriba mira
    this.distancia = 14;
    this.objetivo = new THREE.Vector3();

    // Arrastrar el mouse (o un dedo en la pantalla) gira la cámara
    let dedo = null;
    let ultimo;
    lienzo.addEventListener("pointerdown", (e) => {
      if (dedo !== null) return;
      dedo = e.pointerId;
      ultimo = { x: e.clientX, y: e.clientY };
      lienzo.setPointerCapture(e.pointerId);
    });
    const soltar = (e) => e.pointerId === dedo && (dedo = null);
    lienzo.addEventListener("pointerup", soltar);
    lienzo.addEventListener("pointercancel", soltar);
    lienzo.addEventListener("pointermove", (e) => {
      if (e.pointerId !== dedo) return;
      const sensibilidad = e.pointerType === "touch" ? 0.009 : 0.006;
      this.angulo -= (e.clientX - ultimo.x) * sensibilidad;
      this.inclinacion = THREE.MathUtils.clamp(this.inclinacion + (e.clientY - ultimo.y) * sensibilidad, 0.05, 1.3);
      ultimo = { x: e.clientX, y: e.clientY };
    });
    // La ruedita del mouse acerca o aleja
    lienzo.addEventListener("wheel", (e) => {
      this.distancia = THREE.MathUtils.clamp(this.distancia + e.deltaY * 0.02, 5, 40);
    }, { passive: true });
  }

  girar(direccion, dt) {
    this.angulo -= direccion * dt * 2.5;
  }

  seguir(posicion, altoPersonaje, dt) {
    const meta = posicion.clone();
    meta.y += altoPersonaje * 0.8;
    this.objetivo.lerp(meta, 1 - Math.exp(-dt * 10));

    // Si el personaje es gigante, la cámara se aleja más
    const d = this.distancia * Math.max(1, CONFIG.tamañoPersonaje);
    this.camara.position.set(
      this.objetivo.x + Math.sin(this.angulo) * Math.cos(this.inclinacion) * d,
      this.objetivo.y + Math.sin(this.inclinacion) * d,
      this.objetivo.z + Math.cos(this.angulo) * Math.cos(this.inclinacion) * d
    );
    this.camara.lookAt(this.objetivo);
  }

  ajustarPantalla() {
    this.camara.aspect = innerWidth / innerHeight;
    this.camara.updateProjectionMatrix();
  }
}
