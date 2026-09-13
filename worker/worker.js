/**
 * Proxy de IA para el aula de Derecho Mercantil y Societario
 * Universidad Católica de Cuenca · Prof. Carlos Eduardo Chica-Villacís
 *
 * Qué hace y por qué existe
 * -------------------------
 * Los foros de debate corren enteros en el navegador del estudiante. Si la
 * clave de la API viajara con la página, cualquiera que abriese el código
 * fuente se la llevaría. Este Worker se queda con la clave y es lo único que
 * habla con Gemini: la página le manda la conversación, él le manda la clave.
 *
 * Además impone del lado del servidor lo que la página NO puede garantizar,
 * porque la página la controla el estudiante:
 *
 *   - de dónde puede venir la petición (ORÍGENES);
 *   - qué modelo se usa;
 *   - los filtros de seguridad;
 *   - el tamaño máximo de lo que se envía y de lo que se devuelve.
 *
 * Lo que un estudiante mande en `safetySettings` o en `model` se ignora.
 *
 * Variables que hay que configurar en Cloudflare
 * ----------------------------------------------
 *   GEMINI_API_KEY   (Secret)    la clave. Nunca como variable normal.
 *   MODELO           (Variable)  opcional. Por defecto gemini-2.5-flash.
 *   ORIGENES         (Variable)  opcional. Lista separada por comas.
 *
 * Instrucciones completas en README.md, al lado de este archivo.
 */

const MODELO_POR_DEFECTO = 'gemini-2.5-flash';

// Si no se define la variable ORIGENES, valen estos. El primero es el aula
// publicada; el segundo permite probar en local con `python -m http.server`.
const ORIGENES_POR_DEFECTO = [
  'https://carloseduardochica-art.github.io',
  'http://localhost:8000',
];

// Topes. El foro pide entre 200 y 1500 caracteres por turno y son 3 rondas,
// así que una conversación honesta no se acerca ni de lejos a estos números.
const MAX_CUERPO_BYTES = 120 * 1024;
const MAX_TURNOS = 40;
const MAX_TOKENS_SALIDA = 1400;

// Se imponen aquí, no en la página. BLOCK_NONE dejaría el modelo abierto a
// que un estudiante lo desvíe del debate; BLOCK_ONLY_HIGH no estorba a una
// discusión jurídica —que puede tocar fraude, quiebra o delito societario—
// y sigue cortando lo que no tiene defensa.
const FILTROS = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
];

function origenesPermitidos(env) {
  if (!env.ORIGENES) return ORIGENES_POR_DEFECTO;
  return env.ORIGENES.split(',').map((s) => s.trim()).filter(Boolean);
}

function cabecerasCORS(origen) {
  return {
    'Access-Control-Allow-Origin': origen,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function error(mensaje, codigo, origen) {
  return new Response(JSON.stringify({ error: mensaje }), {
    status: codigo,
    headers: { 'Content-Type': 'application/json', ...cabecerasCORS(origen || '*') },
  });
}

export default {
  async fetch(request, env) {
    const origen = request.headers.get('Origin') || '';
    const permitidos = origenesPermitidos(env);
    const origenOk = permitidos.includes(origen);

    // El navegador pregunta antes de enviar. Si el origen no está en la lista
    // se le responde que no, y el fetch de la página falla sin llegar a Gemini.
    if (request.method === 'OPTIONS') {
      return origenOk
        ? new Response(null, { status: 204, headers: cabecerasCORS(origen) })
        : new Response(null, { status: 403 });
    }

    if (request.method !== 'POST') return error('Solo POST.', 405, origen);
    if (!origenOk) return error('Origen no autorizado.', 403, origen);

    if (!env.GEMINI_API_KEY) {
      return error('El Worker no tiene configurada GEMINI_API_KEY.', 500, origen);
    }

    const crudo = await request.text();
    if (crudo.length > MAX_CUERPO_BYTES) {
      return error('La conversación excede el tamaño permitido.', 413, origen);
    }

    let cuerpo;
    try {
      cuerpo = JSON.parse(crudo);
    } catch {
      return error('El cuerpo no es JSON válido.', 400, origen);
    }

    const contents = cuerpo.contents;
    if (!Array.isArray(contents) || contents.length === 0) {
      return error('Falta el historial de la conversación.', 400, origen);
    }
    if (contents.length > MAX_TURNOS) {
      return error('Demasiados turnos en la conversación.', 400, origen);
    }

    // Se reconstruye la petición campo a campo. Lo que la página mande y no
    // esté en esta lista —`model`, `safetySettings`, cualquier otra cosa— no
    // llega a Gemini.
    const peticion = {
      contents,
      safetySettings: FILTROS,
      generationConfig: {
        temperature: Number(cuerpo?.generationConfig?.temperature) || 0.3,
        maxOutputTokens: MAX_TOKENS_SALIDA,
      },
    };
    if (cuerpo.systemInstruction) {
      peticion.systemInstruction = cuerpo.systemInstruction;
    }

    const modelo = env.MODELO || MODELO_POR_DEFECTO;
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`;

    let respuesta;
    try {
      respuesta = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': env.GEMINI_API_KEY,
        },
        body: JSON.stringify(peticion),
      });
    } catch {
      return error('No se pudo contactar con el servicio de IA.', 502, origen);
    }

    const texto = await respuesta.text();

    // Si Gemini devuelve un error, se registra completo en el panel del Worker
    // pero al estudiante solo le llega el código: el mensaje de Google puede
    // traer detalles del proyecto o de la clave.
    if (!respuesta.ok) {
      console.error('Gemini respondió ' + respuesta.status + ': ' + texto);
      return error('El servicio de IA devolvió un error.', 502, origen);
    }

    return new Response(texto, {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...cabecerasCORS(origen) },
    });
  },
};
