// 🏁 LA PISTA DE OBSTÁCULOS: saltos, plataformas que se mueven, lava, monedas y la meta.
// Empieza arriba de la escalera de colores y termina en la torre dorada.
import * as THREE from "three";
import { CONFIG } from "./config.js";
import { colorReal } from "./colores.js";
import { agregarBloque } from "./mundo.js";
import { sonido } from "./sonido.js";

const INICIO = new THREE.Vector3(0, 0, 0);
const moviles = [];
const monedas = [];
const checkpoints = [];
let materialLava;
let confeti;

// Cómo va la carrera
let reloj = 0;
let tiempoDeCarrera = 0;
let corriendo = false;
let gano = false;
let monedasAgarradas = 0;
let ultimoCheckpoint = 0;

export function crearObby(escena) {
  materialLava = new THREE.MeshStandardMaterial({ color: colorReal(CONFIG.colorLava), emissive: colorReal(CONFIG.colorLava) });

  // Piso de lava debajo de toda la pista: si te caes, ¡regresas al checkpoint!
  agregarBloque(escena, { x: 86, y: -0.49, z: 0, ancho: 118, alto: 0.5, largo: 28, tipo: "lava", material: materialLava });

  // 1️⃣ Saltos sobre plataformas de colores
  plataforma(escena, 31, 6, 0, "rojo");
  plataforma(escena, 36, 6, 2, "naranja");
  plataforma(escena, 41, 6, -1, "amarillo");
  plataforma(escena, 46, 7, 1, "verde");
  plataforma(escena, 51, 8, 0, "azul");
  crearCheckpoint(escena, 58, 8, 0, 1);

  // 2️⃣ Plataformas que se mueven de lado a lado
  plataformaMovil(escena, 67, 8, 0, 0);
  plataformaMovil(escena, 73, 8, 0, Math.PI);
  plataformaMovil(escena, 79, 8, 0, Math.PI / 2);

  // 3️⃣ El puente con hoyos de lava
  const tramos = [[84, 90], [93, 97], [100.5, 103], [106.5, 110.5]];
  for (const [desde, hasta] of tramos) {
    agregarBloque(escena, { x: (desde + hasta) / 2, y: 7, z: 0, ancho: hasta - desde, alto: 1, largo: 3, color: "gris" });
  }
  for (const [desde, hasta] of [[90, 93], [97, 100.5], [103, 106.5]]) {
    agregarBloque(escena, { x: (desde + hasta) / 2, y: 6.5, z: 0, ancho: hasta - desde, alto: 1, largo: 3, tipo: "lava", material: materialLava });
  }
  crearCheckpoint(escena, 114, 8, 0, 2);

  // 4️⃣ La torre: cada vez más alto
  plataforma(escena, 121, 10, 0, "rosa");
  plataforma(escena, 121, 12, -5, "morado");
  plataforma(escena, 126, 14, -6, "azul");
  plataforma(escena, 131, 16, -2, "verde");
  plataforma(escena, 131, 18, 4, "amarillo");
  crearMeta(escena, 138, 20, 4);

  // 🪙 Monedas (¡las de los techos de las casas solo se alcanzan saltando muy alto!)
  const lugares = [
    [25, 7.5, 0], [31, 7.5, 0], [36, 7.5, 2], [41, 7.5, -1], [46, 8.5, 1], [51, 9.5, 0],
    [67, 9.5, 0], [73, 9.5, 0], [79, 9.5, 0],
    [87, 9.5, 0], [91.5, 10, 0], [98.75, 10, 0], [104.75, 10, 0],
    [121, 11.5, 0], [121, 13.5, -5], [126, 15.5, -6], [131, 17.5, -2], [131, 19.5, 4],
    [-14, 9.5, -28], [14, 9.5, -28],
  ];
  lugares.forEach(([x, y, z]) => crearMoneda(escena, x, y, z));

  confeti = crearConfeti(escena);
  actualizarMarcador();
}

// "top" es la altura de arriba de la plataforma, donde se para el personaje
function plataforma(escena, x, top, z, color, ancho = 3, largo = 3) {
  return agregarBloque(escena, { x, y: top - 1, z, ancho, alto: 1, largo, color });
}

function plataformaMovil(escena, x, top, z, desfase) {
  const bloque = plataforma(escena, x, top, z, "morado", 4, 4);
  moviles.push({ bloque, desfase, recorrido: 0 });
}

function crearCheckpoint(escena, x, top, z, numero) {
  plataforma(escena, x, top, z, "blanco", 7, 7);
  const base = agregarBloque(escena, { x, y: top, z, ancho: 3, alto: 0.2, largo: 3, color: "gris", tipo: "checkpoint" });
  base.solido.numero = numero;
  checkpoints.push(base);
  // Banderita de adorno
  agregarBloque(escena, { x: x + 2.5, y: top, z: z - 2.5, ancho: 0.2, alto: 4, largo: 0.2, color: "blanco", solido: false });
  agregarBloque(escena, { x: x + 1.7, y: top + 3, z: z - 2.5, ancho: 1.5, alto: 1, largo: 0.1, color: "rojo", solido: false });
}

function crearMeta(escena, x, top, z) {
  agregarBloque(escena, { x, y: top - 1, z, ancho: 6, alto: 1, largo: 6, color: "dorado", tipo: "meta" });
  // Arco de la meta
  agregarBloque(escena, { x, y: top, z: z - 2.7, ancho: 0.4, alto: 6, largo: 0.4, color: "blanco", solido: false });
  agregarBloque(escena, { x, y: top, z: z + 2.7, ancho: 0.4, alto: 6, largo: 0.4, color: "blanco", solido: false });
  for (let i = 0; i < 6; i++) {
    agregarBloque(escena, { x, y: top + 6, z: z - 2.5 + i, ancho: 0.6, alto: 0.8, largo: 1, color: i % 2 ? "negro" : "blanco", solido: false });
  }
}

function crearMoneda(escena, x, y, z) {
  const forma = new THREE.CylinderGeometry(0.6, 0.6, 0.15, 20);
  forma.rotateX(Math.PI / 2);
  const malla = new THREE.Mesh(forma, new THREE.MeshStandardMaterial({
    color: colorReal("dorado"), metalness: 0.6, roughness: 0.3, emissive: "#664400",
  }));
  malla.position.set(x, y, z);
  malla.castShadow = true;
  escena.add(malla);
  monedas.push({ malla, altura: y });
}

// Se llama ANTES de mover al personaje: mueve las plataformas y lo lleva encima
export function moverObstaculos(dt, jugador) {
  reloj += dt;
  for (const p of moviles) {
    const nuevo = Math.sin(reloj * 1.2 * CONFIG.velocidadPlataformas + p.desfase) * 5;
    const cambio = nuevo - p.recorrido;
    p.recorrido = nuevo;
    p.bloque.position.z += cambio;
    p.bloque.solido.min.z += cambio;
    p.bloque.solido.max.z += cambio;
    if (jugador.pisando === p.bloque.solido) jugador.posicion.z += cambio;
  }
  materialLava.emissiveIntensity = 0.5 + Math.sin(reloj * 3) * 0.3; // la lava "respira"
}

// Se llama DESPUÉS de mover al personaje: revisa qué está tocando
export function revisarJugador(dt, jugador) {
  const bajoLosPies = jugador.pisando;

  if (bajoLosPies?.tipo === "lava" && CONFIG.lavaQuema) {
    sonido.lava();
    destello();
    jugador.reaparecer();
  }

  if (bajoLosPies?.tipo === "checkpoint" && bajoLosPies.numero > ultimoCheckpoint) {
    ultimoCheckpoint = bajoLosPies.numero;
    const base = checkpoints[ultimoCheckpoint - 1];
    base.material.color.set(colorReal("verde"));
    jugador.inicio.set(base.position.x, bajoLosPies.max.y, base.position.z);
    sonido.checkpoint();
    mostrarMensaje(`🚩 ¡Checkpoint ${ultimoCheckpoint}!`, 1500);
  }

  if (bajoLosPies?.tipo === "meta" && !gano) ganar(jugador);

  // Monedas: giran, flotan y se agarran al tocarlas
  for (const [i, moneda] of monedas.entries()) {
    if (!moneda.malla.visible) continue;
    moneda.malla.rotation.y += dt * 3;
    moneda.malla.position.y = moneda.altura + Math.sin(reloj * 2 + i) * 0.2;
    if (tocaAlJugador(jugador, moneda.malla.position)) {
      moneda.malla.visible = false;
      monedasAgarradas++;
      sonido.moneda();
    }
  }

  // El cronómetro arranca cuando el jugador se aleja del inicio
  if (!corriendo && !gano && jugador.posicion.distanceTo(INICIO) > 1) {
    corriendo = true;
    tiempoDeCarrera = 0;
  }
  if (corriendo) tiempoDeCarrera += dt;

  moverConfeti(dt);
  actualizarMarcador();
}

function tocaAlJugador(jugador, punto) {
  const medio = 0.6 * jugador.escala + 0.6;
  const p = jugador.posicion;
  return Math.abs(punto.x - p.x) < medio && Math.abs(punto.z - p.z) < medio &&
    punto.y > p.y - 0.6 && punto.y < p.y + jugador.alto + 0.6;
}

function ganar(jugador) {
  gano = true;
  corriendo = false;
  sonido.victoria();
  lanzarConfeti(jugador.posicion);
  mostrarMensaje(
    `🏆 ¡GANASTE!<br>⏱️ ${formatoTiempo(tiempoDeCarrera)} · 🪙 ${monedasAgarradas} de ${monedas.length}` +
    `<div class="opciones">` +
    `<button data-opcion="otraVez">🔁 Jugar otra vez</button>` +
    `<button data-opcion="explorar">🌍 Seguir explorando</button>` +
    `</div><small class="soloPC">o presiona R para jugar otra vez</small>`
  );
  // Los botones sirven con el mouse y con el dedo (en el celular no hay tecla R)
  mensaje.onclick = (e) => {
    const opcion = e.target.closest("button")?.dataset.opcion;
    if (opcion === "otraVez") reiniciarCarrera(jugador);
    if (opcion === "explorar") ocultarMensaje();
    e.target.blur?.();
  };
}

// Todo de vuelta como al principio (tecla R)
export function reiniciarCarrera(jugador) {
  gano = false;
  corriendo = false;
  tiempoDeCarrera = 0;
  monedasAgarradas = 0;
  ultimoCheckpoint = 0;
  for (const moneda of monedas) moneda.malla.visible = true;
  for (const base of checkpoints) base.material.color.set(colorReal("gris"));
  jugador.inicio.copy(INICIO);
  jugador.reaparecer();
  ocultarMensaje();
}

// ---- Lo que se ve en pantalla ----

const marcador = document.getElementById("marcador");
const mensaje = document.getElementById("mensaje");
const pantallaRoja = document.getElementById("destello");
let temporizadorMensaje;

function actualizarMarcador() {
  const texto = `🪙 ${monedasAgarradas} / ${monedas.length}   ⏱️ ${formatoTiempo(tiempoDeCarrera)}`;
  if (marcador.textContent !== texto) marcador.textContent = texto;
}

function formatoTiempo(segundos) {
  const s = Math.floor(segundos);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function mostrarMensaje(html, milisegundos) {
  mensaje.innerHTML = html;
  mensaje.style.display = "block";
  clearTimeout(temporizadorMensaje);
  if (milisegundos) temporizadorMensaje = setTimeout(ocultarMensaje, milisegundos);
}

function ocultarMensaje() {
  mensaje.style.display = "none";
}

function destello() {
  pantallaRoja.animate([{ opacity: 0.6 }, { opacity: 0 }], { duration: 500 });
}

// ---- 🎉 Confeti ----

function crearConfeti(escena) {
  const cantidad = 300;
  const malla = new THREE.InstancedMesh(new THREE.BoxGeometry(0.3, 0.3, 0.05), new THREE.MeshBasicMaterial(), cantidad);
  const colores = ["rojo", "amarillo", "azul", "verde", "rosa", "morado", "naranja"];
  const pedacitos = [];
  for (let i = 0; i < cantidad; i++) {
    malla.setColorAt(i, new THREE.Color(colorReal(colores[i % colores.length])));
    pedacitos.push({ posicion: new THREE.Vector3(), velocidad: new THREE.Vector3(), giro: Math.random() * 10 });
  }
  malla.visible = false;
  malla.frustumCulled = false;
  escena.add(malla);
  return { malla, pedacitos, tiempo: 0, ayudante: new THREE.Object3D() };
}

function lanzarConfeti(centro) {
  for (const p of confeti.pedacitos) {
    p.posicion.copy(centro).add(new THREE.Vector3(0, 4, 0));
    p.velocidad.set((Math.random() - 0.5) * 14, 8 + Math.random() * 12, (Math.random() - 0.5) * 14);
  }
  confeti.tiempo = 6;
  confeti.malla.visible = true;
}

function moverConfeti(dt) {
  if (confeti.tiempo <= 0) return;
  confeti.tiempo -= dt;
  const { ayudante } = confeti;
  confeti.pedacitos.forEach((p, i) => {
    p.velocidad.y -= 12 * dt;
    p.velocidad.multiplyScalar(1 - dt * 0.8); // el aire lo frena
    p.posicion.addScaledVector(p.velocidad, dt);
    p.giro += dt * 8;
    ayudante.position.copy(p.posicion);
    ayudante.rotation.set(p.giro, p.giro * 0.7, 0);
    ayudante.updateMatrix();
    confeti.malla.setMatrixAt(i, ayudante.matrix);
  });
  confeti.malla.instanceMatrix.needsUpdate = true;
  if (confeti.tiempo <= 0) confeti.malla.visible = false;
}
