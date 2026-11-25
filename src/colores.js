// 🎨 Traductor de colores: la computadora no entiende "rojo",
// entiende códigos como "#e53935". Aquí los traducimos.

const COLORES = {
  rojo: "#e53935",
  azul: "#1e88e5",
  verde: "#5cb85c",
  verdeHoja: "#2e7d32",
  amarillo: "#fdd835",
  naranja: "#fb8c00",
  morado: "#8e24aa",
  rosa: "#f06292",
  negro: "#212121",
  blanco: "#fafafa",
  gris: "#9e9e9e",
  cafe: "#795548",
  celeste: "#87ceeb",
  dorado: "#ffc107",
};

// Los nombres que aparecen en el panel de ajustes
export const NOMBRES_DE_COLORES = Object.keys(COLORES).filter((nombre) => nombre !== "verdeHoja");

// Si el color no está en la lista (por ejemplo "#ff00ff"), lo usamos tal cual
export function colorReal(nombre) {
  return COLORES[nombre] ?? nombre;
}
