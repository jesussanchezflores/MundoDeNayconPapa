// ⚙️ EL PANEL DE AJUSTES: cambia la CONFIG desde el juego, sin tocar el código.
// Lo que eliges se guarda en este navegador. Si alguien cambia config.js, gana el código.
import { CONFIG } from "./config.js";
import { NOMBRES_DE_COLORES, colorReal } from "./colores.js";

const CAMPOS = [
  { grupo: "🧍 Personaje" },
  { clave: "colorCamisa", nombre: "Camisa", tipo: "color" },
  { clave: "colorPantalon", nombre: "Pantalón", tipo: "color" },
  { clave: "colorPiel", nombre: "Piel", tipo: "color" },
  { clave: "tamañoPersonaje", nombre: "Tamaño", tipo: "numero", min: 0.3, max: 10, paso: 0.1 },
  { clave: "velocidad", nombre: "Velocidad", tipo: "numero", min: 2, max: 30, paso: 1 },
  { clave: "alturaSalto", nombre: "Altura del salto", tipo: "numero", min: 1, max: 40, paso: 1 },
  { clave: "superSalto", nombre: "Súper salto (doble toque)", tipo: "numero", min: 1, max: 5, paso: 0.5 },
  { grupo: "🌍 Mundo" },
  { clave: "gravedad", nombre: "Gravedad", tipo: "numero", min: 3, max: 80, paso: 1 },
  { clave: "colorCielo", nombre: "Cielo", tipo: "color" },
  { clave: "colorPasto", nombre: "Pasto", tipo: "color" },
  { clave: "esDeNoche", nombre: "Es de noche", tipo: "siNo" },
  { grupo: "🏁 Pista de obstáculos" },
  { clave: "lavaQuema", nombre: "La lava quema", tipo: "siNo" },
  { clave: "colorLava", nombre: "Lava", tipo: "color" },
  { clave: "velocidadPlataformas", nombre: "Velocidad de plataformas", tipo: "numero", min: 0, max: 4, paso: 0.5 },
  { grupo: "🔊 Sonido" },
  { clave: "musica", nombre: "Música", tipo: "opciones", opciones: ["alegre", "aventura", "tranquila", "espacial", "misterio", "ninguna"] },
  { clave: "volumenMusica", nombre: "Volumen de música", tipo: "numero", min: 0, max: 1, paso: 0.1 },
  { clave: "efectosDeSonido", nombre: "Efectos de sonido", tipo: "siNo" },
  { clave: "sonidoDePasos", nombre: "Sonido de pasos", tipo: "siNo" },
  { clave: "volumenEfectos", nombre: "Volumen de efectos", tipo: "numero", min: 0, max: 1, paso: 0.1 },
];

// Estos se notan al instante; los demás necesitan volver a armar el mundo (recargar la página)
const AL_INSTANTE = new Set([
  "velocidad", "alturaSalto", "superSalto", "gravedad", "lavaQuema",
  "velocidadPlataformas", "efectosDeSonido", "sonidoDePasos",
]);

const LLAVE = "mundoDeBloques.ajustes";
const ORIGINAL = { ...CONFIG }; // lo que dice config.js

function leerGuardado() {
  try {
    return JSON.parse(localStorage.getItem(LLAVE)) ?? {};
  } catch {
    return {};
  }
}

function guardar(ajustes) {
  try {
    localStorage.setItem(LLAVE, JSON.stringify(ajustes));
  } catch {
    // Sin almacenamiento (modo incógnito, por ejemplo): solo dura hasta recargar
  }
}

// Cada ajuste se guarda junto con el valor que tenía config.js en ese momento ("base").
// Si config.js cambió desde entonces, ese ajuste ya no se usa.
export function aplicarAjustesGuardados() {
  for (const [clave, { base, valor }] of Object.entries(leerGuardado())) {
    if (ORIGINAL[clave] === base) CONFIG[clave] = valor;
  }
}

let abierto = false;
export const panelAbierto = () => abierto;

export function crearPanel({ alReiniciar }) {
  const panel = document.getElementById("panel");
  const lista = panel.querySelector(".campos");

  const abrir = () => {
    lista.replaceChildren(...CAMPOS.map(crearCampo));
    panel.hidden = false;
    abierto = true;
  };
  const cerrar = () => {
    panel.hidden = true;
    abierto = false;
    document.activeElement?.blur(); // para que la barra espaciadora no vuelva a abrir el panel
  };

  document.getElementById("botonAjustes").addEventListener("click", abrir);
  panel.addEventListener("click", (e) => {
    if (e.target === panel) return cerrar(); // clic afuera de la tarjeta
    const accion = e.target.closest("button")?.dataset.accion;
    if (accion === "cerrar") cerrar();
    if (accion === "reiniciar") {
      alReiniciar();
      cerrar();
    }
    if (accion === "original") {
      guardar({});
      location.reload();
    }
    if (accion === "aplicar") aplicar(lista, cerrar);
  });
}

function aplicar(lista, cerrar) {
  const cambios = [];
  for (const control of lista.querySelectorAll("[data-clave]")) {
    const clave = control.dataset.clave;
    const valor =
      control.type === "checkbox" ? control.checked :
      control.type === "range" ? Number(control.value) :
      control.value;
    if (valor !== CONFIG[clave]) {
      CONFIG[clave] = valor;
      cambios.push(clave);
    }
  }

  const ajustes = {};
  for (const { clave } of CAMPOS.filter((c) => c.clave)) {
    if (CONFIG[clave] !== ORIGINAL[clave]) ajustes[clave] = { base: ORIGINAL[clave], valor: CONFIG[clave] };
  }
  guardar(ajustes);

  if (cambios.some((clave) => !AL_INSTANTE.has(clave))) location.reload();
  else cerrar();
}

function crearCampo(campo) {
  if (campo.grupo) {
    const titulo = document.createElement("h3");
    titulo.textContent = campo.grupo;
    return titulo;
  }

  const fila = document.createElement("label");
  fila.className = "campo";
  const nombre = document.createElement("span");
  nombre.textContent = campo.nombre;
  fila.append(nombre);
  const valor = CONFIG[campo.clave];

  if (campo.tipo === "numero") {
    const deslizador = Object.assign(document.createElement("input"), {
      type: "range", step: campo.paso,
      min: Math.min(campo.min, valor), max: Math.max(campo.max, valor), value: valor,
    });
    const numero = document.createElement("output");
    numero.textContent = valor;
    deslizador.addEventListener("input", () => (numero.textContent = deslizador.value));
    deslizador.dataset.clave = campo.clave;
    fila.append(deslizador, numero);
  } else if (campo.tipo === "siNo") {
    const casilla = Object.assign(document.createElement("input"), { type: "checkbox", checked: valor });
    casilla.dataset.clave = campo.clave;
    fila.append(casilla);
  } else {
    const opciones = campo.tipo === "color" ? [...NOMBRES_DE_COLORES] : [...campo.opciones];
    if (!opciones.includes(valor)) opciones.unshift(valor);
    const lista = document.createElement("select");
    for (const opcion of opciones) lista.add(new Option(opcion, opcion, false, opcion === valor));
    lista.dataset.clave = campo.clave;
    fila.append(lista);

    if (campo.tipo === "color") {
      const muestra = document.createElement("i");
      muestra.className = "muestra";
      const pintar = () => (muestra.style.background = colorReal(lista.value));
      lista.addEventListener("change", pintar);
      pintar();
      fila.append(muestra);
    }
  }
  return fila;
}
