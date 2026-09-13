# Aula · Derecho Mercantil y Societario

**Universidad Católica de Cuenca · Carrera de Derecho · Tercer ciclo · Paralelo 3A**
Prof. Carlos Eduardo Chica-Villacís · Septiembre 2026 – Febrero 2027

La segunda aula de la asignatura. Contiene el material de lectura de los dos
bloques y las actividades que corren fuera de Moodle.

**Dirección publicada:** `https://carloseduardochica-art.github.io/aula-mercantil/`

---

## Qué hay dentro

| Ruta | Qué es | Peso |
|---|---|---|
| `index.html` | La portada: las dos unidades con sus tareas y sus fechas | 14 KB |
| `lectura-b1/` | Las 20 secciones del Bloque 1, con sus 20 láminas | 3,4 MB |
| `lectura-b2/` | Las 16 secciones del Bloque 2, con sus 9 láminas | 0,9 MB |
| `foro-b1/` | AD‑1 · foro socrático con IA · 10 pts | 47 KB |
| `foro-b2/` | AD‑2 · foro socrático con IA · 10 pts | 50 KB |
| `autocontrol-b1/` | AA‑1 · 78 preguntas · 15 pts | 3,5 MB |
| `autocontrol-b2/` | AA‑2 · 70 preguntas · 15 pts | 1,1 MB |
| `worker/` | El proxy de IA. **No se publica**: es documentación y el código que va a Cloudflare | 10 KB |

Todos los archivos son **autocontenidos**: las láminas viajan dentro en base64,
así que no hay carpetas de imágenes que se puedan romper.

## Cómo se publica

Repositorio **público** llamado `aula-mercantil`, y en él:

**Settings** → **Pages** → Source: **Deploy from a branch** → Branch: **main**,
carpeta **/ (root)** → **Save**.

Tarda un par de minutos la primera vez. El archivo `.nojekyll` está para que
GitHub no intente procesar el sitio con Jekyll.

## Lo único que no puede cambiar de sitio

El Worker de Cloudflare solo responde a peticiones que vengan de
`https://carloseduardochica-art.github.io`. Si algún día mueve esto a otro
dominio, los foros dejarán de recibir respuesta hasta que declare el nuevo
origen en la variable `ORIGENES` del Worker. Está explicado en
`worker/README.md`.

Por lo mismo, **los foros no funcionan abriéndolos con doble clic**: un archivo
local manda origen `null` y el Worker lo rechaza. Para probar en el equipo:

```bash
python -m http.server 8000
```

y abrir `http://localhost:8000/foro-b1/`, que sí está permitido. Ojo con usar
`127.0.0.1` en vez de `localhost`: para el navegador son orígenes distintos y el
Worker rechaza el primero.

## Qué se cambia a mano y dónde

| Qué | Dónde |
|---|---|
| Fecha de cierre del foro B1 | `foro-b1/index.html`, línea `var CIERRE_TAREA` |
| Fecha de cierre del foro B2 | `foro-b2/index.html`, misma línea |
| Fecha de cierre de cada autocontrol | `autocontrol-b*/index.html`, misma línea |
| Fechas que muestra la portada | `index.html`, atributo `data-cierre` de cada tarjeta |
| URL del Worker | `foro-b*/index.html`, línea `const WORKER_URL` |

Las fechas de la portada son solo informativas: pintan el aviso de «cierra en N
días». Las que de verdad marcan la constancia como fuera de plazo son las de
`CIERRE_TAREA` dentro de cada actividad. **Si cambia una, cambie las dos.**

## Lo que este sitio no hace

**No recibe entregas.** Todo corre en el navegador del estudiante. Las
actividades emiten un PDF y un código firmado, y eso se sube a Moodle, que es
quien sella la entrega del lado del servidor.

**No guarda nada de nadie.** El avance del autocontrol vive en el navegador del
propio estudiante y se pierde si cambia de aparato. El foro no guarda ni una
línea: la prueba de lo ocurrido es el acta que descarga.

**No resiste a quien quiera hacer trampa a conciencia.** Las fechas se leen del
reloj del aparato y las preguntas viajan dentro del archivo. Sirve para que se
lea el material y para calificar cómodo, no como instrumento probatorio. Si una
nota tiene que aguantar una impugnación, el instrumento es un cuestionario del
aula virtual.

## Los lanzadores de Moodle

El código para pegar en las etiquetas de Moodle está fuera de este repositorio,
en `Recurso del Aula/lanzadores_aula_mercantil.html`: cuatro bloques listos, uno
por foro, uno de autocontrol y uno de entrada general al aula.

## Estado

| Pieza | Estado |
|---|---|
| Lectura B1 y B2 | ✅ |
| Foros B1 y B2 | ✅ con Worker en marcha |
| Autocontroles B1 y B2 | ✅ con las fechas del sílabo firmado |
| AP‑1 · letra de cambio | pendiente |
| AP‑2 · minuta SAS | pendiente |
| Investigación formativa | pendiente |
