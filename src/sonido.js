// 🔊 LOS SONIDOS: los fabricamos con matemáticas, ¡sin archivos de audio!
import { CONFIG } from "./config.js";

export let audio = null; // la "bocina" del juego
export let salidaMusica = null;
let salidaEfectos = null;
let volumenGeneral = null;
let ruidoBlanco = null;

// Los navegadores solo dejan sonar algo después de tocar una tecla o el mouse
export function iniciarSonido() {
  if (audio) return false;
  audio = new AudioContext();

  volumenGeneral = audio.createGain();
  volumenGeneral.connect(audio.destination);
  salidaMusica = audio.createGain();
  salidaMusica.gain.value = CONFIG.volumenMusica * 0.5;
  salidaMusica.connect(volumenGeneral);
  salidaEfectos = audio.createGain();
  salidaEfectos.gain.value = CONFIG.volumenEfectos;
  salidaEfectos.connect(volumenGeneral);

  // Un segundo de "chhhh" (números al azar) para pasos y tambores
  ruidoBlanco = audio.createBuffer(1, audio.sampleRate, audio.sampleRate);
  const datos = ruidoBlanco.getChannelData(0);
  for (let i = 0; i < datos.length; i++) datos[i] = Math.random() * 2 - 1;
  return true;
}

export function alternarSilencio() {
  if (!audio) return;
  volumenGeneral.gain.value = volumenGeneral.gain.value > 0 ? 0 : 1;
}

// Convierte una nota de piano (60 = Do central) a vibraciones por segundo
export const frecuenciaDe = (nota) => 440 * 2 ** ((nota - 69) / 12);

// Un tono: una onda que vibra, sube de volumen rápido y se apaga poco a poco
export function tono({ frecuencia, hasta, duracion, onda = "sine", volumen = 0.3, ataque = 0.01, cuando, salida = salidaEfectos }) {
  const t = cuando ?? audio.currentTime;
  const oscilador = audio.createOscillator();
  const envolvente = audio.createGain();
  oscilador.type = onda;
  oscilador.frequency.setValueAtTime(frecuencia, t);
  if (hasta) oscilador.frequency.exponentialRampToValueAtTime(hasta, t + duracion);
  envolvente.gain.setValueAtTime(0.0001, t);
  envolvente.gain.exponentialRampToValueAtTime(volumen, t + ataque);
  envolvente.gain.exponentialRampToValueAtTime(0.0001, t + duracion);
  oscilador.connect(envolvente).connect(salida);
  oscilador.start(t);
  oscilador.stop(t + duracion + 0.05);
}

// Un ruido filtrado: grave suena a "tum", agudo suena a "tss"
export function ruido({ duracion, volumen = 0.2, filtro = "lowpass", frecuencia = 1000, cuando, salida = salidaEfectos }) {
  const t = cuando ?? audio.currentTime;
  const fuente = audio.createBufferSource();
  fuente.buffer = ruidoBlanco;
  const colador = audio.createBiquadFilter();
  colador.type = filtro;
  colador.frequency.value = frecuencia;
  const envolvente = audio.createGain();
  envolvente.gain.setValueAtTime(volumen, t);
  envolvente.gain.exponentialRampToValueAtTime(0.0001, t + duracion);
  fuente.connect(colador).connect(envolvente).connect(salida);
  fuente.start(t, Math.random() * 0.5);
  fuente.stop(t + duracion);
}

const puedeSonar = () => audio && CONFIG.efectosDeSonido;

// 🎮 Los efectos de sonido del juego
export const sonido = {
  salto() {
    if (!puedeSonar()) return;
    tono({ frecuencia: 320, hasta: 760, duracion: 0.18, onda: "square", volumen: 0.12 });
  },

  aterrizar() {
    if (!puedeSonar()) return;
    tono({ frecuencia: 160, hasta: 60, duracion: 0.15, volumen: 0.4 });
    ruido({ duracion: 0.1, volumen: 0.2, frecuencia: 500 });
  },

  // Entre más grande el personaje, más pesados se oyen sus pasos
  paso(escala) {
    if (!audio || !CONFIG.sonidoDePasos) return;
    ruido({
      duracion: 0.07 * Math.max(1, escala),
      volumen: 0.25 * Math.min(escala, 2),
      frecuencia: (700 + Math.random() * 300) / escala,
    });
  },

  reaparecer() {
    if (!puedeSonar()) return;
    tono({ frecuencia: 200, hasta: 900, duracion: 0.4, onda: "triangle", volumen: 0.25 });
  },
};
