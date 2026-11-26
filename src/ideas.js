// 💡 IDEAS: un formulario para que cualquiera nos mande sugerencias por correo
// (con FormSubmit.co, igual que en la Guitarra Virtual). La primera vez que llegue un envío
// desde este sitio, FormSubmit manda un correo de activación: hay que dar clic en «Activate Form».
import { esMovil } from "./dispositivo.js";

const CORREO = "jesus@javaris.mx";

export function crearFormularioDeIdeas() {
  const dialogo = document.getElementById("ideas");
  const formulario = document.getElementById("formIdeas");
  const gracias = document.getElementById("graciasIdeas");
  const estado = document.getElementById("estadoIdeas");
  const enviar = formulario.querySelector(".enviar");

  const avisar = (texto, esError = false) => {
    estado.className = esError ? "estado error" : "estado";
    estado.innerHTML = texto;
  };

  document.getElementById("botonIdeas").addEventListener("click", () => {
    formulario.hidden = false;
    gracias.hidden = true;
    avisar("");
    dialogo.showModal();
  });
  dialogo.addEventListener("click", (e) => {
    if (e.target === dialogo || e.target.closest("[data-cerrar]")) dialogo.close();
  });

  formulario.addEventListener("submit", async (e) => {
    e.preventDefault();
    const idea = document.getElementById("textoIdea");
    if (!idea.value.trim()) {
      idea.focus();
      return avisar("Escribe tu idea antes de enviar.", true);
    }
    if (!formulario.reportValidity()) return;

    const datos = Object.fromEntries(new FormData(formulario));
    if (datos._honey) {
      // Un robot llenó la trampa: fingimos que sí se envió
      formulario.hidden = true;
      gracias.hidden = false;
      return;
    }
    Object.assign(datos, {
      _subject: "💡 Nueva idea para el Mundo de Nay y de papá",
      _template: "table",
      _captcha: "false",
      dispositivo: esMovil ? "Celular / tablet" : "PC",
      pantalla: `${innerWidth} × ${innerHeight} (${innerWidth > innerHeight ? "horizontal" : "vertical"})`,
    });
    if (datos.email) datos._replyto = datos.email;

    enviar.disabled = true;
    avisar("Enviando…");
    try {
      const respuesta = await fetch(`https://formsubmit.co/ajax/${CORREO}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(datos),
      });
      const resultado = await respuesta.json();
      if (resultado.success !== true && resultado.success !== "true") throw new Error(resultado.message || "error");
      formulario.reset();
      formulario.hidden = true;
      gracias.hidden = false;
    } catch (error) {
      console.warn("Ideas:", error);
      avisar(
        /activat/i.test(error?.message ?? "")
          ? `El formulario aún no está activado. Revisa el correo de ${CORREO} y da clic en «Activate Form».`
          : `No pudimos enviar tu idea. Intenta de nuevo o escríbenos a <a href="mailto:${CORREO}">${CORREO}</a>.`,
        true
      );
    } finally {
      enviar.disabled = false;
    }
  });
}
