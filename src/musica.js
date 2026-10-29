// 🎵 LA MÚSICA: cada estilo es una "receta" con velocidad, notas y ritmo.
// En los ritmos, cada "x" es un golpe y cada "." es un silencio (16 por compás).
import { CONFIG } from "./config.js";
import { audio, salidaMusica, tono, ruido, frecuenciaDe } from "./sonido.js";

const ESTILOS = {
  alegre: {
    tempo: 128, raiz: 60, menor: false, instrumento: "square", volumenMelodia: 0.06,
    acordes: [[0, "M"], [7, "M"], [9, "m"], [5, "M"]],
    melodia:  "x.x.xx.xx.x.x.x.",
    bajo:     "x...x...x...x...",
    bombo:    "x.......x.......",
    caja:     "....x.......x...",
    platillo: "..x...x...x...x.",
  },
  aventura: {
    tempo: 140, raiz: 57, menor: true, instrumento: "sawtooth", volumenMelodia: 0.05,
    acordes: [[0, "m"], [8, "M"], [3, "M"], [10, "M"]],
    melodia:  "x.xxx.x.x.xxx.x.",
    bajo:     "x.x.x.x.x.x.x.x.",
    bombo:    "x...x...x...x...",
    caja:     "....x.......x..x",
    platillo: "x.x.x.x.x.x.x.x.",
  },
  tranquila: {
    tempo: 84, raiz: 65, menor: false, instrumento: "triangle", volumenMelodia: 0.14,
    acordes: [[0, "M"], [9, "m"], [5, "M"], [7, "M"]],
    melodia:  "x...x...x.x.x...",
    bajo:     "x.......x.......",
    acordesLargos: true,
  },
  espacial: {
    tempo: 66, raiz: 62, menor: true, instrumento: "sine", volumenMelodia: 0.14,
    acordes: [[0, "m"], [10, "M"], [8, "M"], [10, "M"]],
    melodia:  "x.......x...x...",
    bajo:     "x...............",
    acordesLargos: true,
    eco: true,
  },
  // Sintetizador ochentero de misterio: las notas del acorde suben y bajan sin parar
  misterio: {
    tempo: 84, raiz: 52, menor: true, instrumento: "triangle", volumenMelodia: 0.1,
    acordes: [[0, "m"], [0, "m"], [8, "M"], [10, "M"]],
    melodia:  "x.......x.......",
    bajo:     "x.x.x.x.x.x.x.x.",
    acordesLargos: true,
    arpegio: true,
    eco: true,
  },
};

const ESCALA_MAYOR = [0, 2, 4, 5, 7, 9, 11];
const ESCALA_MENOR = [0, 2, 3, 5, 7, 8, 10];
const TRIADA = { M: [0, 4, 7], m: [0, 3, 7] };
const COMPASES = 8;

export function iniciarMusica() {
  const estilo = ESTILOS[CONFIG.musica];
  if (!estilo) return; // "ninguna" (o un nombre que no existe)

  let salida = salidaMusica;
  if (estilo.eco) salida = crearEco();

  const cancion = componerMelodia(estilo);
  const duracionPaso = 60 / estilo.tempo / 4;
  let paso = 0;
  let siguiente = audio.currentTime + 0.1;

  // Cada 25 milisegundos revisamos qué notas tocan a continuación
  setInterval(() => {
    while (siguiente < audio.currentTime + 0.15) {
      tocarPaso(estilo, cancion, paso, siguiente, duracionPaso, salida);
      siguiente += duracionPaso;
      paso = (paso + 1) % (16 * COMPASES);
    }
  }, 25);
}

function tocarPaso(estilo, cancion, paso, t, duracionPaso, salida) {
  const golpe = paso % 16;
  const [desde, tipo] = estilo.acordes[Math.floor(paso / 16) % estilo.acordes.length];
  const raizAcorde = estilo.raiz + desde;
  const toca = (ritmo) => ritmo?.[golpe] === "x";

  if (estilo.acordesLargos && golpe === 0) {
    for (const intervalo of TRIADA[tipo]) {
      tono({ frecuencia: frecuenciaDe(raizAcorde + intervalo), duracion: duracionPaso * 16, onda: "triangle",
        volumen: 0.04, ataque: 0.4, cuando: t, salida });
    }
  }
  if (estilo.arpegio) {
    const [, tercera, quinta] = TRIADA[tipo];
    const ciclo = [0, tercera, quinta, 12, quinta, tercera];
    tono({ frecuencia: frecuenciaDe(raizAcorde + ciclo[paso % ciclo.length]), duracion: duracionPaso * 0.9,
      onda: "sawtooth", volumen: 0.035, cuando: t, salida });
  }
  if (toca(estilo.bajo)) {
    tono({ frecuencia: frecuenciaDe(raizAcorde - 12), duracion: duracionPaso * 2, onda: "triangle", volumen: 0.3, cuando: t, salida });
  }
  if (cancion[paso]) {
    tono({ frecuencia: frecuenciaDe(cancion[paso]), duracion: duracionPaso * 1.8, onda: estilo.instrumento,
      volumen: estilo.volumenMelodia, cuando: t, salida });
  }
  if (toca(estilo.bombo)) tono({ frecuencia: 150, hasta: 45, duracion: 0.15, volumen: 0.5, cuando: t, salida });
  if (toca(estilo.caja)) ruido({ duracion: 0.12, volumen: 0.2, filtro: "bandpass", frecuencia: 1800, cuando: t, salida });
  if (toca(estilo.platillo)) ruido({ duracion: 0.04, volumen: 0.08, filtro: "highpass", frecuencia: 7000, cuando: t, salida });
}

// La computadora "compone" una melodía: brinca entre notas cercanas de la escala
// y al empezar cada compás cae en una nota del acorde para que suene bonito.
// Los compases 5 a 8 repiten los primeros, con un final distinto.
function componerMelodia(estilo) {
  const azar = numerosAlAzar(11);
  const escala = estilo.menor ? ESCALA_MENOR : ESCALA_MAYOR;
  const notas = [];
  for (const octava of [12, 24]) for (const grado of escala) notas.push(estilo.raiz + octava + grado);

  const cancion = new Array(16 * COMPASES).fill(null);
  let indice = 4;
  for (let compas = 0; compas < COMPASES; compas++) {
    if (compas >= 4 && compas < 6) {
      for (let g = 0; g < 16; g++) cancion[compas * 16 + g] = cancion[(compas - 4) * 16 + g];
      continue;
    }
    const [desde, tipo] = estilo.acordes[compas % estilo.acordes.length];
    const notasDelAcorde = TRIADA[tipo].map((i) => (desde + i) % 12);

    for (let golpe = 0; golpe < 16; golpe++) {
      if (estilo.melodia[golpe] !== "x") continue;
      if (golpe === 0) {
        indice = notaDelAcordeMasCercana(notas, notasDelAcorde, estilo.raiz, indice);
      } else {
        const brinco = [-2, -1, -1, 1, 1, 2][Math.floor(azar() * 6)];
        indice = Math.max(0, Math.min(notas.length - 1, indice + brinco));
      }
      cancion[compas * 16 + golpe] = notas[indice];
    }
  }
  return cancion;
}

function notaDelAcordeMasCercana(notas, notasDelAcorde, raiz, indiceActual) {
  let mejor = indiceActual;
  let distancia = Infinity;
  notas.forEach((nota, i) => {
    const esDelAcorde = notasDelAcorde.includes((((nota - raiz) % 12) + 12) % 12);
    if (esDelAcorde && Math.abs(i - indiceActual) < distancia) {
      mejor = i;
      distancia = Math.abs(i - indiceActual);
    }
  });
  return mejor;
}

// Eco espacial: el sonido se repite cada vez más bajito
function crearEco() {
  const entrada = audio.createGain();
  const retraso = audio.createDelay();
  retraso.delayTime.value = 0.45;
  const repeticion = audio.createGain();
  repeticion.gain.value = 0.45;
  entrada.connect(salidaMusica);
  entrada.connect(retraso);
  retraso.connect(repeticion).connect(retraso);
  retraso.connect(salidaMusica);
  return entrada;
}

function numerosAlAzar(semilla) {
  return () => {
    semilla = (semilla * 16807) % 2147483647;
    return semilla / 2147483647;
  };
}
