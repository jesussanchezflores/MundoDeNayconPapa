// 🧍 EL PERSONAJE: cómo se ve, cómo camina, salta y choca con las cosas
import * as THREE from "three";
import { CONFIG } from "./config.js";
import { colorReal } from "./colores.js";

const ALTO = 3.2; // de los pies a la cabeza, en bloques
const MEDIO_ANCHO = 0.6;

export class Personaje {
  constructor(escena, inicio) {
    this.escala = CONFIG.tamañoPersonaje;
    this.alto = ALTO * this.escala;
    this.inicio = inicio.clone();
    this.posicion = inicio.clone();
    this.velocidad = new THREE.Vector3();
    this.enSuelo = false;
    this.pasos = 0;
    this.modelo = this.construirModelo();
    escena.add(this.modelo);
  }

  // Armamos el muñequito con puros bloques
  construirModelo() {
    const cuerpo = new THREE.Group();
    const pieza = (ancho, alto, largo, color) => {
      const bloque = new THREE.Mesh(
        new THREE.BoxGeometry(ancho, alto, largo),
        new THREE.MeshStandardMaterial({ color: colorReal(color) })
      );
      bloque.castShadow = true;
      return bloque;
    };
    // Brazos y piernas giran desde el hombro o la cadera, como una bisagra
    const extremidad = (x, y, ancho, color) => {
      const bisagra = new THREE.Group();
      bisagra.position.set(x, y, 0);
      const bloque = pieza(ancho, 1.2, 0.5, color);
      bloque.position.y = -0.6;
      bisagra.add(bloque);
      cuerpo.add(bisagra);
      return bisagra;
    };

    this.piernaIzq = extremidad(-0.28, 1.2, 0.52, CONFIG.colorPantalon);
    this.piernaDer = extremidad(0.28, 1.2, 0.52, CONFIG.colorPantalon);
    this.brazoIzq = extremidad(-0.8, 2.4, 0.45, CONFIG.colorPiel);
    this.brazoDer = extremidad(0.8, 2.4, 0.45, CONFIG.colorPiel);

    const torso = pieza(1.1, 1.2, 0.6, CONFIG.colorCamisa);
    torso.position.y = 1.8;
    const cabeza = pieza(0.8, 0.8, 0.8, CONFIG.colorPiel);
    cabeza.position.y = 2.8;
    cuerpo.add(torso, cabeza);

    // La carita 🙂
    for (const x of [-0.17, 0.17]) {
      const ojo = pieza(0.12, 0.18, 0.05, "negro");
      ojo.position.set(x, 2.9, 0.41);
      cuerpo.add(ojo);
    }
    const sonrisa = pieza(0.36, 0.07, 0.05, "negro");
    sonrisa.position.set(0, 2.65, 0.41);
    cuerpo.add(sonrisa);

    cuerpo.scale.setScalar(this.escala);
    return cuerpo;
  }

  actualizar(dt, entrada, anguloCamara, solidos) {
    // 1. ¿Hacia dónde quiere ir? (relativo a hacia dónde mira la cámara)
    const adelante = new THREE.Vector3(-Math.sin(anguloCamara), 0, -Math.cos(anguloCamara));
    const derecha = new THREE.Vector3(Math.cos(anguloCamara), 0, -Math.sin(anguloCamara));
    const direccion = new THREE.Vector3()
      .addScaledVector(adelante, entrada.adelante)
      .addScaledVector(derecha, entrada.derecha);
    const seMueve = direccion.lengthSq() > 0;
    if (seMueve) direccion.normalize();

    const rapidez = CONFIG.velocidad * (entrada.correr ? 1.7 : 1);
    this.velocidad.x = direccion.x * rapidez;
    this.velocidad.z = direccion.z * rapidez;

    // 2. La gravedad lo jala hacia abajo; el salto lo empuja hacia arriba
    this.velocidad.y -= CONFIG.gravedad * dt;
    if (entrada.saltar && this.enSuelo) {
      this.velocidad.y = Math.sqrt(2 * CONFIG.gravedad * CONFIG.alturaSalto);
    }

    // 3. Lo movemos poco a poco, revisando si choca con algo
    this.enSuelo = false;
    this.moverEje("x", this.velocidad.x * dt, solidos);
    this.moverEje("z", this.velocidad.z * dt, solidos);
    this.moverEje("y", this.velocidad.y * dt, solidos);

    // 4. Si se cae del mundo, regresa al inicio
    if (this.posicion.y < -30) this.reaparecer();

    // 5. Acomodamos el modelo: posición, hacia dónde mira y la animación
    this.modelo.position.copy(this.posicion);
    if (seMueve) this.voltearHacia(Math.atan2(direccion.x, direccion.z), dt);
    this.animar(dt, seMueve ? rapidez : 0);
  }

  moverEje(eje, distancia, solidos) {
    const p = this.posicion;
    const medio = MEDIO_ANCHO * this.escala;
    p[eje] += distancia;

    for (const b of solidos) {
      const choca =
        p.x - medio < b.max.x && p.x + medio > b.min.x &&
        p.z - medio < b.max.z && p.z + medio > b.min.z &&
        p.y < b.max.y && p.y + this.alto > b.min.y;
      if (!choca) continue;

      if (eje === "y") {
        if (distancia < 0) {
          p.y = b.max.y; // cayó encima de un bloque
          this.enSuelo = true;
        } else {
          p.y = b.min.y - this.alto; // se pegó en la cabeza
        }
        this.velocidad.y = 0;
      } else {
        // Chocó contra una pared: lo regresamos justo al borde
        p[eje] = distancia > 0 ? b.min[eje] - medio - 0.001 : b.max[eje] + medio + 0.001;
      }
    }
  }

  voltearHacia(angulo, dt) {
    let diferencia = angulo - this.modelo.rotation.y;
    diferencia = Math.atan2(Math.sin(diferencia), Math.cos(diferencia));
    this.modelo.rotation.y += diferencia * Math.min(1, dt * 12);
  }

  animar(dt, rapidez) {
    // Cuánto gira cada parte: [pierna izq, pierna der, brazo izq, brazo der]
    let metas = [0, 0, 0, 0];
    if (!this.enSuelo) {
      metas = [0.4, -0.2, -2.8, -2.8]; // ¡brazos arriba al saltar!
    } else if (rapidez > 0) {
      this.pasos += dt * rapidez * 1.2;
      const paso = Math.sin(this.pasos) * 0.9;
      metas = [paso, -paso, -paso, paso];
    }
    const suave = Math.min(1, dt * 15);
    [this.piernaIzq, this.piernaDer, this.brazoIzq, this.brazoDer].forEach((parte, i) => {
      parte.rotation.x += (metas[i] - parte.rotation.x) * suave;
    });
  }

  reaparecer() {
    this.posicion.copy(this.inicio);
    this.velocidad.set(0, 0, 0);
  }
}
