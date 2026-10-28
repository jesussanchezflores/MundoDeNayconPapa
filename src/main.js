// 🚀 AQUÍ EMPIEZA TODO: junta el mundo, el personaje y la cámara
import * as THREE from "three";
import { crearMundo, solidos } from "./mundo.js";
import { Personaje } from "./personaje.js";
import { Camara } from "./camara.js";
import { leerEntrada } from "./controles.js";

// El "pintor" que dibuja el juego en la pantalla
const pintor = new THREE.WebGLRenderer({ antialias: true });
pintor.setPixelRatio(Math.min(devicePixelRatio, 2));
pintor.setSize(innerWidth, innerHeight);
pintor.shadowMap.enabled = true;
pintor.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(pintor.domElement);

const escena = new THREE.Scene();
const sol = crearMundo(escena);
const jugador = new Personaje(escena, new THREE.Vector3(0, 0, 0));
const camara = new Camara(pintor.domElement);

addEventListener("resize", () => {
  pintor.setSize(innerWidth, innerHeight);
  camara.ajustarPantalla();
});

// 🔁 El ciclo del juego: se repite unas 60 veces por segundo
const reloj = new THREE.Clock();
pintor.setAnimationLoop(() => {
  const dt = Math.min(reloj.getDelta(), 1 / 30);
  const entrada = leerEntrada();

  camara.girar(entrada.girarCamara, dt);
  jugador.actualizar(dt, entrada, camara.angulo, solidos);
  camara.seguir(jugador.posicion, jugador.alto, dt);

  // El sol sigue al jugador para que siempre haya sombras cerca
  sol.position.copy(jugador.posicion).add(new THREE.Vector3(30, 50, 20));
  sol.target.position.copy(jugador.posicion);

  pintor.render(escena, camara.camara);
});
