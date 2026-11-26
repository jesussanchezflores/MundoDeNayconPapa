// 🎮 LOS CONTROLES: teclado en la compu; palanca y botón de salto en el celular
import { esMovil } from "./dispositivo.js";

const teclas = new Set();
const palanca = { x: 0, y: 0 }; // hacia dónde empuja el dedo, de -1 a 1
let botonSaltoApretado = false;
let saltosNuevos = 0; // cuántas veces se apretó "saltar" desde la última revisión

addEventListener("keydown", (e) => {
  if (e.target.closest?.("#panel, #ideas")) return; // escribiendo en los ajustes o en una idea, no jugando
  teclas.add(e.code);
  if (e.code === "Space" && !e.repeat) saltosNuevos++;
  // Que las flechas y el espacio no muevan la página
  if (e.code.startsWith("Arrow") || e.code === "Space") e.preventDefault();
});
addEventListener("keyup", (e) => teclas.delete(e.code));
addEventListener("blur", () => teclas.clear());

if (esMovil) crearControlesTactiles();

const apretada = (...codigos) => (codigos.some((c) => teclas.has(c)) ? 1 : 0);
const limitar = (valor) => Math.max(-1, Math.min(1, valor));

export function leerEntrada() {
  const entrada = {
    adelante: limitar(apretada("KeyW", "ArrowUp") - apretada("KeyS", "ArrowDown") + palanca.y),
    derecha: limitar(apretada("KeyD", "ArrowRight") - apretada("KeyA", "ArrowLeft") + palanca.x),
    saltar: apretada("Space") === 1 || botonSaltoApretado,
    saltoNuevo: saltosNuevos > 0,
    correr: apretada("ShiftLeft", "ShiftRight") === 1,
    girarCamara: apretada("KeyE") - apretada("KeyQ"),
  };
  saltosNuevos = 0;
  return entrada;
}

// 🕹️ La palanca (abajo a la izquierda) y el botón de salto (abajo a la derecha)
function crearControlesTactiles() {
  document.body.classList.add("movil");
  const base = document.getElementById("palanca");
  const bolita = document.getElementById("bolita");
  const botonSalto = document.getElementById("botonSalto");
  let radio = 50; // qué tanto se puede alejar la bolita del centro (depende del tamaño de la palanca)
  let dedo = null;
  let centro;

  const mover = (e) => {
    let dx = e.clientX - centro.x;
    let dy = e.clientY - centro.y;
    const distancia = Math.hypot(dx, dy);
    if (distancia > radio) {
      dx *= radio / distancia;
      dy *= radio / distancia;
    }
    bolita.style.transform = `translate(${dx}px, ${dy}px) scale(1.15)`;
    // Si apenas se mueve el dedo, no cuenta (para que no camine solo)
    palanca.x = Math.abs(dx) > radio * 0.15 ? dx / radio : 0;
    palanca.y = Math.abs(dy) > radio * 0.15 ? -dy / radio : 0;
  };
  const soltarTodo = () => {
    dedo = null;
    palanca.x = palanca.y = 0;
    bolita.style.transform = "";
    base.classList.remove("activa");
    botonSaltoApretado = false;
  };
  const soltar = (e) => e.pointerId === dedo && soltarTodo();

  base.addEventListener("pointerdown", (e) => {
    dedo = e.pointerId;
    base.setPointerCapture(dedo);
    base.classList.add("activa");
    const caja = base.getBoundingClientRect();
    centro = { x: caja.left + caja.width / 2, y: caja.top + caja.height / 2 };
    radio = caja.width * 0.38;
    mover(e);
  });
  // Al girar el celular o cambiar de app, la palanca regresa al centro
  addEventListener("orientationchange", soltarTodo);
  document.addEventListener("visibilitychange", soltarTodo);
  base.addEventListener("pointermove", (e) => e.pointerId === dedo && mover(e));
  base.addEventListener("pointerup", soltar);
  base.addEventListener("pointercancel", soltar);

  botonSalto.addEventListener("pointerdown", (e) => {
    botonSalto.setPointerCapture(e.pointerId);
    botonSaltoApretado = true;
    saltosNuevos++;
  });
  const soltarSalto = () => (botonSaltoApretado = false);
  botonSalto.addEventListener("pointerup", soltarSalto);
  botonSalto.addEventListener("pointercancel", soltarSalto);
}
