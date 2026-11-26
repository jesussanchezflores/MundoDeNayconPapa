// 🚀 AQUÍ EMPIEZA TODO: junta el mundo, el personaje y la cámara
import * as THREE from "three";
import { crearMundo, solidos } from "./mundo.js";
import { Personaje } from "./personaje.js";
import { Camara } from "./camara.js";
import { leerEntrada } from "./controles.js";
import { iniciarSonido, alternarSilencio } from "./sonido.js";
import { iniciarMusica } from "./musica.js";
import { crearObby, moverObstaculos, revisarJugador, reiniciarCarrera } from "./obby.js";
import { aplicarAjustesGuardados, crearPanel, panelAbierto } from "./ajustes.js";
import { esMovil } from "./dispositivo.js";
import { crearFormularioDeIdeas } from "./ideas.js";

// Primero, lo que se haya elegido en el panel de ajustes ⚙️
aplicarAjustesGuardados();

// El "pintor" que dibuja el juego en la pantalla (en celular, un poco menos detallado para que vaya rápido)
const pintor = new THREE.WebGLRenderer({ antialias: true });
pintor.setPixelRatio(Math.min(devicePixelRatio, esMovil ? 1.5 : 2));
pintor.setSize(innerWidth, innerHeight);
pintor.shadowMap.enabled = true;
pintor.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(pintor.domElement);

const escena = new THREE.Scene();
const sol = crearMundo(escena);
crearObby(escena);
const jugador = new Personaje(escena, new THREE.Vector3(0, 0, 0));
const camara = new Camara(pintor.domElement);
crearPanel({ alReiniciar: () => reiniciarCarrera(jugador) });
crearFormularioDeIdeas();

// Si cambia el tamaño de la ventana o se gira el celular, ajustamos el dibujo
function ajustarPantalla() {
  pintor.setSize(innerWidth, innerHeight);
  camara.ajustarPantalla();
  scrollTo(0, 0);
}
addEventListener("resize", ajustarPantalla);
addEventListener("orientationchange", () => setTimeout(ajustarPantalla, 300));
visualViewport?.addEventListener("resize", ajustarPantalla);

// 🔊 El sonido arranca con la primera tecla, clic o toque; la M lo silencia
function activarSonido() {
  if (iniciarSonido()) {
    iniciarMusica();
    document.getElementById("avisoSonido").remove();
  }
}
addEventListener("keydown", activarSonido);
addEventListener("pointerdown", activarSonido);
addEventListener("touchend", activarSonido);
addEventListener("keydown", (e) => {
  if (panelAbierto()) return;
  if (e.code === "KeyM") alternarSilencio();
  if (e.code === "KeyR") reiniciarCarrera(jugador);
});

// 🔁 El ciclo del juego: se repite unas 60 veces por segundo
const reloj = new THREE.Clock();
const QUIETO = { adelante: 0, derecha: 0, saltar: false, saltoNuevo: false, correr: false, girarCamara: 0 };
pintor.setAnimationLoop(() => {
  const dt = Math.min(reloj.getDelta(), 1 / 30);
  // Con el panel de ajustes abierto, el personaje se queda quieto
  const entrada = panelAbierto() ? QUIETO : leerEntrada();

  camara.girar(entrada.girarCamara, dt);
  moverObstaculos(dt, jugador);
  jugador.actualizar(dt, entrada, camara.angulo, solidos);
  revisarJugador(dt, jugador);
  camara.seguir(jugador.posicion, jugador.alto, dt);

  // El sol sigue al jugador para que siempre haya sombras cerca
  sol.position.copy(jugador.posicion).add(new THREE.Vector3(30, 50, 20));
  sol.target.position.copy(jugador.posicion);

  pintor.render(escena, camara.camara);
});
