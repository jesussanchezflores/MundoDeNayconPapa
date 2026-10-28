// 🎮 LOS CONTROLES: qué teclas están apretadas
const teclas = new Set();

addEventListener("keydown", (e) => {
  teclas.add(e.code);
  // Que las flechas y el espacio no muevan la página
  if (e.code.startsWith("Arrow") || e.code === "Space") e.preventDefault();
});
addEventListener("keyup", (e) => teclas.delete(e.code));
addEventListener("blur", () => teclas.clear());

const apretada = (...codigos) => (codigos.some((c) => teclas.has(c)) ? 1 : 0);

export function leerEntrada() {
  return {
    adelante: apretada("KeyW", "ArrowUp") - apretada("KeyS", "ArrowDown"),
    derecha: apretada("KeyD", "ArrowRight") - apretada("KeyA", "ArrowLeft"),
    saltar: apretada("Space") === 1,
    correr: apretada("ShiftLeft", "ShiftRight") === 1,
    girarCamara: apretada("KeyE") - apretada("KeyQ"),
  };
}
