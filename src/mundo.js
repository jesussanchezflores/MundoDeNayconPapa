// 🌍 EL MUNDO: el cielo, el piso, los árboles y las casas
import * as THREE from "three";
import { CONFIG } from "./config.js";
import { colorReal } from "./colores.js";

// Todos los bloques sólidos: los que el personaje NO puede atravesar
export const solidos = [];

export function crearMundo(escena) {
  const sol = crearCieloYLuces(escena);
  crearPiso(escena);
  crearArboles(escena);
  crearCasa(escena, -14, -28, "blanco", "rojo");
  crearCasa(escena, 14, -28, "amarillo", "azul");
  crearEscalera(escena);
  return sol;
}

// Pone un bloque en el mundo. (x, z) es el centro y "y" es la altura de abajo.
// "tipo" sirve para bloques especiales: "lava", "checkpoint" o "meta".
export function agregarBloque(escena, { x, y, z, ancho, alto, largo, color, solido = true, tipo, material }) {
  const bloque = new THREE.Mesh(
    new THREE.BoxGeometry(ancho, alto, largo),
    material ?? new THREE.MeshStandardMaterial({ color: colorReal(color) })
  );
  bloque.position.set(x, y + alto / 2, z);
  bloque.castShadow = true;
  bloque.receiveShadow = true;
  escena.add(bloque);

  if (solido) {
    bloque.solido = {
      min: { x: x - ancho / 2, y, z: z - largo / 2 },
      max: { x: x + ancho / 2, y: y + alto, z: z + largo / 2 },
      tipo,
    };
    solidos.push(bloque.solido);
  }
  return bloque;
}

function crearCieloYLuces(escena) {
  const noche = CONFIG.esDeNoche;
  const cielo = new THREE.Color(noche ? "#0b1030" : colorReal(CONFIG.colorCielo));
  escena.background = cielo;
  escena.fog = new THREE.Fog(cielo, 70, 200);

  escena.add(new THREE.HemisphereLight(noche ? "#6070c0" : "#ffffff", "#556b2f", noche ? 0.5 : 1.2));

  // El sol (o la luna) hace las sombras
  const sol = new THREE.DirectionalLight(noche ? "#aab4ff" : "#ffffff", noche ? 0.7 : 2.2);
  sol.position.set(30, 50, 20);
  sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048);
  Object.assign(sol.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, far: 150 });
  escena.add(sol, sol.target);

  if (noche) crearEstrellas(escena);
  else crearNubes(escena);
  return sol;
}

function crearEstrellas(escena) {
  const puntos = [];
  for (let i = 0; i < 1000; i++) {
    const v = new THREE.Vector3().randomDirection().multiplyScalar(300);
    puntos.push(v.x, Math.abs(v.y), v.z);
  }
  const geometria = new THREE.BufferGeometry();
  geometria.setAttribute("position", new THREE.Float32BufferAttribute(puntos, 3));
  escena.add(new THREE.Points(geometria, new THREE.PointsMaterial({ color: "#ffffff", size: 1.5, fog: false })));

  const luna = new THREE.Mesh(
    new THREE.BoxGeometry(14, 14, 14),
    new THREE.MeshBasicMaterial({ color: "#fff8d0", fog: false })
  );
  luna.position.set(-120, 140, -200);
  escena.add(luna);
}

function crearNubes(escena) {
  const azar = numerosAlAzar(7);
  for (let i = 0; i < 18; i++) {
    const x = azar() * 300 - 150;
    const z = azar() * 300 - 150;
    const y = 40 + azar() * 15;
    agregarBloque(escena, { x, y, z, ancho: 12 + azar() * 10, alto: 2, largo: 8 + azar() * 6, color: "blanco", solido: false });
    agregarBloque(escena, { x: x + 2, y: y + 2, z, ancho: 7, alto: 1.5, largo: 5, color: "blanco", solido: false });
  }
}

function crearPiso(escena) {
  const tamaño = 400;
  const textura = texturaDeCuadritos();
  textura.repeat.set(tamaño / 2, tamaño / 2);

  const piso = new THREE.Mesh(
    new THREE.BoxGeometry(tamaño, 1, tamaño),
    new THREE.MeshStandardMaterial({ color: colorReal(CONFIG.colorPasto), map: textura })
  );
  piso.position.y = -0.5;
  piso.receiveShadow = true;
  escena.add(piso);
  solidos.push({ min: { x: -tamaño / 2, y: -1, z: -tamaño / 2 }, max: { x: tamaño / 2, y: 0, z: tamaño / 2 } });
}

// Dibuja un cuadrito blanco con borde gris; se repite por todo el piso
function texturaDeCuadritos() {
  const lienzo = document.createElement("canvas");
  lienzo.width = lienzo.height = 64;
  const pincel = lienzo.getContext("2d");
  pincel.fillStyle = "#ffffff";
  pincel.fillRect(0, 0, 64, 64);
  pincel.strokeStyle = "rgba(0, 0, 0, 0.12)";
  pincel.lineWidth = 4;
  pincel.strokeRect(0, 0, 64, 64);

  const textura = new THREE.CanvasTexture(lienzo);
  textura.wrapS = textura.wrapT = THREE.RepeatWrapping;
  textura.colorSpace = THREE.SRGBColorSpace;
  textura.anisotropy = 8;
  return textura;
}

function crearArboles(escena) {
  const azar = numerosAlAzar(42);
  let plantados = 0;
  while (plantados < 70) {
    const x = Math.round(azar() * 180 - 90);
    const z = Math.round(azar() * 180 - 90);
    // Dejamos libre el centro, donde están las casas y la escalera
    if (Math.abs(x) < 24 && z > -40 && z < 16) continue;
    if (x > 20 && Math.abs(z) < 20) continue; // ahí va la pista de obstáculos
    crearArbol(escena, x, z);
    plantados++;
  }
}

function crearArbol(escena, x, z) {
  agregarBloque(escena, { x, y: 0, z, ancho: 1, alto: 4, largo: 1, color: "cafe" });
  agregarBloque(escena, { x, y: 4, z, ancho: 4, alto: 3, largo: 4, color: "verdeHoja" });
  agregarBloque(escena, { x, y: 7, z, ancho: 2, alto: 1.5, largo: 2, color: "verdeHoja" });
}

function crearCasa(escena, x, z, colorParedes, colorTecho) {
  agregarBloque(escena, { x, y: 0, z, ancho: 8, alto: 5, largo: 8, color: colorParedes });
  // Techo de escalones
  agregarBloque(escena, { x, y: 5, z, ancho: 9, alto: 1, largo: 9, color: colorTecho });
  agregarBloque(escena, { x, y: 6, z, ancho: 6, alto: 1, largo: 6, color: colorTecho });
  agregarBloque(escena, { x, y: 7, z, ancho: 3, alto: 1, largo: 3, color: colorTecho });
  // Puerta y ventanas (solo de adorno, no chocan)
  const frente = z + 4.05;
  agregarBloque(escena, { x, y: 0, z: frente, ancho: 1.6, alto: 3, largo: 0.1, color: "cafe", solido: false });
  agregarBloque(escena, { x: x - 2.6, y: 2, z: frente, ancho: 1.4, alto: 1.4, largo: 0.1, color: "celeste", solido: false });
  agregarBloque(escena, { x: x + 2.6, y: 2, z: frente, ancho: 1.4, alto: 1.4, largo: 0.1, color: "celeste", solido: false });
}

// Una escalera de colores para practicar los saltos
function crearEscalera(escena) {
  const colores = ["rojo", "naranja", "amarillo", "verde", "azul", "morado"];
  colores.forEach((color, i) => {
    agregarBloque(escena, { x: 10 + i * 3, y: 0, z: 0, ancho: 3, alto: i + 1, largo: 3, color });
  });
}

// Números "al azar" que siempre salen iguales, para que el mundo no cambie cada vez
function numerosAlAzar(semilla) {
  return () => {
    semilla = (semilla * 16807) % 2147483647;
    return semilla / 2147483647;
  };
}
