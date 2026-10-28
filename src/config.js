// ⚙️ CONFIGURACIÓN DEL JUEGO
// Cambia cualquier valor, guarda el archivo (Cmd + S) ¡y mira qué pasa en el juego!
// Colores disponibles: rojo, azul, verde, amarillo, naranja, morado, rosa,
// negro, blanco, gris, cafe, celeste, dorado

export const CONFIG = {
  // 🧍 El personaje
  colorCamisa: "rojo",
  colorPantalon: "azul",
  colorPiel: "amarillo",
  tamañoPersonaje: 1, // 1 = normal, 3 = ¡gigante!, 0.5 = chiquito
  velocidad: 8, // qué tan rápido camina
  alturaSalto: 4, // cuántos bloques de alto puede saltar

  // 🌍 El mundo
  gravedad: 30, // más gravedad = cae más rápido. ¡Prueba con 5 para saltar como en la Luna!
  colorCielo: "celeste",
  colorPasto: "verde",
  esDeNoche: false, // true = de noche, false = de día
};
