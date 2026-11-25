// 📱 ¿Estamos en un celular o tableta? (pantalla táctil como control principal)
// Para probar los controles táctiles en la compu, abre el juego con ?movil al final de la dirección.
export const esMovil =
  matchMedia("(pointer: coarse)").matches || new URLSearchParams(location.search).has("movil");
