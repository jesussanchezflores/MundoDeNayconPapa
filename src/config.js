// ⚙️ CONFIGURACIÓN DEL JUEGO
// Cambia cualquier valor, guarda el archivo (Cmd + S) ¡y mira qué pasa en el juego!
// Colores disponibles: rojo, azul, verde, amarillo, naranja, morado, rosa,
// negro, blanco, gris, cafe, celeste, dorado

export const CONFIG = {
  // 🧍 El personaje
  colorCamisa: "rosa",
  colorPantalon: "morado",
  colorPiel: "amarillo",
  tamañoPersonaje: 10, // 1 = normal, 3 = ¡gigante!, 0.5 = chiquito
  velocidad: 8, // qué tan rápido camina
  alturaSalto: 8, // cuántos bloques de alto puede saltar
  superSalto: 2, // saltar dos veces rapidito salta esto veces más alto (1 = sin súper salto)

  // 🌍 El mundo
  gravedad: 30, // más gravedad = cae más rápido. ¡Prueba con 5 para saltar como en la Luna!
  colorCielo: "celeste",
  colorPasto: "verde",
  esDeNoche: false, // true = de noche, false = de día

  // 🏁 La pista de obstáculos
  lavaQuema: true, // false = la lava ya no te regresa al checkpoint
  colorLava: "naranja",
  velocidadPlataformas: 1, // 2 = el doble de rápido, 0 = quietas

  // 🔊 Sonido y música
  musica: "alegre", // "alegre", "aventura", "tranquila", "espacial", "misterio" o "ninguna"
  volumenMusica: 0.5, // de 0 (calladita) a 1 (fuerte)
  efectosDeSonido: true, // ¿suena al saltar y al caer?
  sonidoDePasos: true, // ¿se oyen los pasos al caminar?
  volumenEfectos: 0.8, // de 0 a 1
};
