# El Worker de IA · cómo se crea

**Derecho Mercantil y Societario · Universidad Católica de Cuenca**

> ## ✅ EN MARCHA desde el 12-IX-2026
>
> **URL:** `https://aula-mercantil-ia.carloseduardochica.workers.dev`
>
> Ya está puesta en la línea `WORKER_URL` de `foro-b1/index.html` (línea 402) y
> de `foro-b2/index.html` (línea 410). No hay que tocar nada más.
>
> **Variables realmente configuradas:**
>
> | Variable | Estado |
> |---|---|
> | `GEMINI_API_KEY` | Secret, configurada |
> | `MODELO` | configurada — **hizo falta** |
> | `ORIGENES` | sin configurar; rigen los valores por defecto del código |
>
> **El modelo por defecto del código no servía.** Con `gemini-2.5-flash` la
> llamada devolvía 502. Al declarar la variable `MODELO` empezó a funcionar, y
> quien responde de verdad es **`gemini-3.8-flash`**. Si algún día vuelve a
> fallar con un 502, el primer sospechoso es el nombre del modelo, no la clave.
>
> **Comprobado de punta a punta:** `GET` → 405 · `POST` sin origen → 403 ·
> `OPTIONS` con origen autorizado → 204 · origen ajeno → 403 · petición real con
> `systemInstruction` y tres turnos → respuesta de 259 palabras con
> `finishReason: STOP`, en su papel y cerrando con pregunta.
>
> **Aviso para probar los foros.** Abrirlos con doble clic **no funciona**: un
> archivo local manda origen `null` y el Worker lo rechaza. Para probar en el
> equipo, sirva la carpeta y ábrala en `http://localhost:8000`, que sí está
> permitido:
>
> ```bash
> python -m http.server 8000
> ```
>
> Lo que sigue de este documento es el procedimiento original, por si hubiera
> que rehacer el Worker o montar otro para otra materia.

---

Los dos foros de debate (`foro-b1/` y `foro-b2/`) no hablan con Gemini
directamente: hablan con este Worker, y él guarda la clave. Sin el Worker
publicado, los foros abren y muestran el caso, pero al enviar el primer turno
dan error de red.

Se hace una vez, en unos diez minutos, y sirve para las dos tareas.

---

## 1 · La clave de Gemini

En [aistudio.google.com/apikey](https://aistudio.google.com/apikey), **Crear
clave de API**. Cópiela y téngala a mano; no la pegue en ningún archivo de este
repositorio.

## 2 · Crear el Worker

En [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** →
**Create** → **Start with Hello World!** → **Deploy**.

Póngale de nombre **`aula-mercantil-ia`**. La URL le quedará así:

```
https://aula-mercantil-ia.<su-subdominio>.workers.dev
```

Ese es el dato que hay que llevar a los dos foros. Anótelo.

## 3 · Pegar el código

En el Worker recién creado → **Edit code**. Borre todo lo que trae de ejemplo y
pegue el contenido íntegro de `worker.js`. **Deploy**.

## 4 · Las tres variables

Settings → **Variables and Secrets** → **Add**:

| Nombre | Tipo | Valor |
|---|---|---|
| `GEMINI_API_KEY` | **Secret** | la clave del paso 1 |
| `MODELO` | Text | `gemini-2.5-flash` |
| `ORIGENES` | Text | `https://carloseduardochica-art.github.io` |

`GEMINI_API_KEY` tiene que ir como **Secret**, no como Text: así deja de poder
leerse desde el panel una vez guardada.

`MODELO` y `ORIGENES` son opcionales —el código trae los mismos valores por
defecto—, pero conviene declararlas para poder cambiar de modelo sin volver a
tocar el código.

**Deploy** otra vez para que las variables entren en vigor.

## 5 · Llevar la URL a los foros

En `foro-b1/index.html` y en `foro-b2/index.html`, cerca del inicio del
`<script>`, hay esta línea:

```js
const WORKER_URL = "https://aula-mercantil-ia.TU-SUBDOMINIO.workers.dev";
```

Sustituya la URL por la real. Es lo único que hay que tocar en los foros.

## 6 · Comprobar que responde

Desde PowerShell:

```bash
curl -X POST "https://aula-mercantil-ia.TU-SUBDOMINIO.workers.dev" -H "Content-Type: application/json" -H "Origin: https://carloseduardochica-art.github.io" -d "{\"contents\":[{\"role\":\"user\",\"parts\":[{\"text\":\"Responde solo: listo\"}]}]}"
```

Tiene que devolver un JSON con `candidates`. Si devuelve
`{"error":"Origen no autorizado."}`, revise que `ORIGENES` esté escrito sin
barra final. Si devuelve `El servicio de IA devolvió un error`, el detalle real
está en **Workers → su Worker → Logs**: casi siempre es la clave mal pegada o
el nombre del modelo.

---

## Qué impone el Worker y qué no

**Lo que impone**, y por eso no basta con esconder la clave en la página:

- **El origen.** Solo responde a peticiones que vengan del dominio declarado.
  Alguien que copie su HTML a otro servidor no puede usar su cuota.
- **Los filtros de seguridad.** Van fijados en `BLOCK_ONLY_HIGH` del lado del
  servidor. Lo que la página mande en `safetySettings` se descarta.
- **El modelo y el tamaño.** La página no elige modelo ni puede pedir
  respuestas largas: el tope de salida está en el Worker.

**Lo que no impone:**

- **No hay límite de peticiones por estudiante.** Un alumno que reinicie el
  foro veinte veces consume veinte conversaciones de su cuota. Para el tamaño
  de un paralelo no es un problema; si algún día lo fuera, se añade con
  Cloudflare KV.
- **No guarda nada.** No hay registro de conversaciones del lado del servidor.
  La prueba de lo que ocurrió es el acta en PDF que descarga el estudiante.

## El coste

`gemini-2.5-flash` tiene capa gratuita, y un paralelo entero de tres rondas por
estudiante cabe holgadamente dentro. Los Workers de Cloudflare dan 100.000
peticiones diarias en el plan gratuito. En la práctica, cero.

## Si algún día hay que apagarlo

Cloudflare → el Worker → Settings → **Delete**, o simplemente vacíe la variable
`ORIGENES`: los foros dejarán de recibir respuesta al instante, sin tocar
GitHub.
