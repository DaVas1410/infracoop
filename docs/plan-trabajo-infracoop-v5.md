# Plan de Trabajo   Infra.Coop v5
## Épica, Stories y Subtasks

> **Base:** RFC-001 (22 de abril de 2026)
> **Ventana:** 4 días laborales · 1 desarrollador · Claude Code
> **Criterio de priorización:** Backend-first. Sin datos reales, el frontend es teatro.

---

## ÉPICA: INFRACOOP-EPIC-01
### De prototipo simulado a sistema real desplegado en producción

**Descripción:** Transformar el HTML monolítico de 1,710 líneas (v4) en un sistema funcional con backend real (FastAPI), base de datos persistente (Supabase + pgvector), búsqueda semántica por embeddings, anonimización de preguntas, y frontend Gradio, desplegado públicamente en HuggingFace Spaces para una demo cerrada de 20 usuarios.

**Definición de Hecho (DoD) de la Épica:**
- Sistema accesible vía URL pública `*.hf.space`
- Todos los criterios de aceptación CA-01 a CA-10 verificados
- README completo con instrucciones reproducibles
- Repo GitHub con historial limpio (sin archivos con espacios o paréntesis en los nombres)

---

## DÍA 1   Fundaciones

---

### STORY-01: Inicialización del repositorio y estructura del proyecto

**Como** desarrollador del proyecto,
**quiero** un repositorio GitHub con la estructura de directorios definida en el RFC,
**para que** todo el trabajo posterior tenga una base organizada y el proyecto sea colaborativo y reproducible.

**Criterio de aceptación:** `git clone` del repo + `ls` muestra la estructura completa del RFC. El `.gitignore` excluye `.env`, `__pycache__`, y archivos con paréntesis heredados.

**Subtasks:**

- [ ] **ST-01.1** Crear repositorio GitHub `infracoop` con visibilidad privada
- [ ] **ST-01.2** Crear estructura de directorios: `app/`, `app/routes/`, `app/services/`, `app/db/`, `frontend/`, `frontend/components/`, `db/`, `db/seeds/`, `docs/`
- [ ] **ST-01.3** Crear `.gitignore` (Python, Node, `.env`, `*.pyc`, `__pycache__/`, `.DS_Store`)
- [ ] **ST-01.4** Crear `.env.example` con todas las variables: `SUPABASE_URL`, `SUPABASE_KEY`, `GEMINI_API_KEY`, `JWT_SECRET_KEY`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`
- [ ] **ST-01.5** Copiar `RFC-001.md` a `docs/`
- [ ] **ST-01.6** Commit inicial: `chore: initialize project structure`

---

### STORY-02: Schema de base de datos en Supabase

**Como** sistema
 **quiero** un schema de base de datos desplegado en Supabase con soporte para vectores pgvector,
**para que** los datos de datasets, normativas y preguntas puedan almacenarse y consultarse de forma persistente.

**Criterio de aceptación:** Todas las tablas visibles en Supabase Dashboard. `SELECT count(*) FROM datasets;` retorna 0 (sin errores). La extensión pgvector está habilitada.

**Guía técnica   Supabase:**

Supabase es una base de datos PostgreSQL en la nube con interfaz web. Se opera principalmente desde su dashboard en `supabase.com`. No requiere instalar nada localmente para esta story.

**Cómo crear el proyecto (paso a paso):**
1. Ir a `supabase.com` → crear cuenta (se puede usar GitHub).
2. Clic en "New project" → llenar: Name: `infracoop`, Region: `South America (São Paulo)`, Plan: Free.
3. Esperar 2 minutos mientras provisiona.
4. Ir a **Settings → API** → copiar:
   - **Project URL** → será `SUPABASE_URL` en el `.env`
   - **anon public** key → será `SUPABASE_KEY` en el `.env`

**Cómo encontrar el SQL Editor:**
En el menú lateral izquierdo del dashboard hay un ícono de base de datos. El SQL Editor está en **Database → SQL Editor** o directamente en el menú lateral como "SQL Editor". Es una interfaz donde se pegan y ejecutan queries SQL directamente, similar a pgAdmin pero en el navegador.

**Cómo habilitar pgvector:**
Opción A: **Database → Extensions** → buscar `vector` → activar el toggle.
Opción B: En SQL Editor ejecutar `CREATE EXTENSION IF NOT EXISTS vector;`

**Cómo ejecutar el schema:**
1. SQL Editor → "New query" (botón "+" o "+New query").
2. Pegar todo el contenido de `db/schema.sql`.
3. Clic en "Run" (o `Ctrl+Enter`).
4. Si hay errores, aparecen en el panel de abajo con número de línea.
5. Error más común: `extension "vector" does not exist` → habilitar pgvector primero.

**Cómo verificar que funcionó:**
Ir a **Table Editor** en el menú lateral → deben aparecer las tablas del schema. Si no aparecen, el SQL tuvo un error   revisar el panel de errores del SQL Editor.

**Subtasks:**

- [ ] **ST-02.1** Crear proyecto en Supabase (free tier), copiar `SUPABASE_URL` y `SUPABASE_KEY` al `.env`
- [ ] **ST-02.2** Habilitar la extensión `vector` desde **Database → Extensions**
- [ ] **ST-02.3** Adaptar `infracoop_schema.sql` → `db/schema.sql`:
  - Renombrar archivo (eliminar paréntesis del nombre original)
  - Agregar `CREATE EXTENSION IF NOT EXISTS vector;` al inicio
  - Agregar columna `embedding vector(768)` en tabla `datasets`
  - Agregar columna `embedding vector(768)` en tabla `normativas`
  - Crear función `match_datasets(query_embedding vector, match_threshold float, match_count int)` para búsqueda por cosine similarity (ver SQL completo en RFC §7.1.5)
  - Crear función `match_normativas(query_embedding vector, match_threshold float, match_count int)`
- [ ] **ST-02.4** Adaptar `infracoop_metricas_backup.sql` → `db/metrics.sql`
- [ ] **ST-02.5** Ejecutar `db/schema.sql` en Supabase SQL Editor → verificar que no hay errores
- [ ] **ST-02.6** Ejecutar `db/metrics.sql` en Supabase SQL Editor
- [ ] **ST-02.7** Verificar en **Table Editor** que las tablas existen
- [ ] **ST-02.8** Ejecutar el SQL de las funciones `match_datasets` y `match_normativas` (del RFC §7.1.5)
- [ ] **ST-02.9** Configurar política RLS mínima: `SELECT` público en `datasets` y `normativas`
- [ ] **ST-02.10** Commit: `feat(db): deploy schema to supabase with pgvector support`

---

### STORY-03: Script de ingesta del .xlsx de datos seed

**Como** sistema,
**quiero** un script que importe el archivo Excel de datasets y normativas a Supabase generando sus embeddings,
**para que** el Motor de Brechas tenga datos reales sobre los cuales hacer búsquedas semánticas.

**Criterio de aceptación:** Después de ejecutar `python db/seeds/import_xlsx.py`, `SELECT count(*) FROM datasets;` retorna el número de filas del Excel. La columna `embedding` tiene valores no nulos.

**Guía técnica   API de Gemini (Google AI Studio):**

El script de ingesta necesita generar embeddings para cada dataset. Esto requiere una API key de Google AI Studio:

1. Ir a `aistudio.google.com` → iniciar sesión con cuenta Google.
2. Clic en **"Get API key"** en el menú lateral.
3. Clic en **"Create API key"** → seleccionar un proyecto de Google Cloud (o crear uno nuevo si pide).
4. Copiar la key generada (empieza con `AIza...`) → ponerla como `GEMINI_API_KEY` en el `.env`.

El free tier de Gemini en AI Studio incluye **1,500 requests por día** para embeddings   más que suficiente para la ingesta del xlsx y para la demo.

**Cómo verificar los embeddings en Supabase:**

Después de ejecutar el script, ir en Supabase al **Table Editor → datasets**. Hacer clic en cualquier fila. El campo `embedding` debe mostrar algo como `[0.023, -0.041, 0.187, ...]` (un array de 768 números). Si aparece `NULL`, el script falló al llamar a la API   revisar que `GEMINI_API_KEY` está correctamente configurado en el `.env` y que no se agotó el rate limit del día.

**Cómo verificar los datos con SQL:**

Desde el SQL Editor de Supabase, se pueden correr estas queries de verificación:

```sql
-- Contar registros importados
SELECT count(*) FROM datasets;

-- Verificar que los embeddings no son NULL
SELECT count(*) FROM datasets WHERE embedding IS NOT NULL;

-- Ver los primeros 5 registros
SELECT id, nombre, pais, agenda FROM datasets LIMIT 5;

-- Verificar dimensiones del embedding (debe ser 768)
SELECT array_length(embedding::float[], 1) FROM datasets LIMIT 1;
```

**Subtasks:**

- [ ] **ST-03.1** Obtener `GEMINI_API_KEY` desde `aistudio.google.com` → agregar al `.env`
- [ ] **ST-03.2** Inspeccionar el `.xlsx`: abrir en Excel/LibreOffice, identificar nombres de columnas, tipos de datos, filas vacías o inconsistencias   crear un mapa de columnas del Excel a columnas del schema
- [ ] **ST-03.3** Escribir `db/seeds/import_xlsx.py`:
  - Leer `.xlsx` con `openpyxl` + `pandas`
  - Limpiar datos: eliminar filas vacías, normalizar strings, validar campos requeridos
  - Para cada fila: generar embedding con `google-generativeai` (`gemini-embedding-001`, `task_type="RETRIEVAL_DOCUMENT"`)
  - Respetar rate limit: procesar en batches de 10 con `time.sleep(1)` entre batches
  - Hacer upsert en Supabase por campo `id` o `nombre` (idempotente   re-ejecutable sin duplicar)
  - Log de progreso por pantalla: `print(f"[{n}/{total}] Importado: {nombre}")`
- [ ] **ST-03.4** Ejecutar el script localmente: `python db/seeds/import_xlsx.py`
- [ ] **ST-03.5** Verificar en Supabase SQL Editor: `SELECT count(*) FROM datasets WHERE embedding IS NOT NULL;` debe ser > 0
- [ ] **ST-03.6** Si el `.xlsx` tiene inconsistencias que bloquean la ingesta: usar los 5 `DATOS_MOCK` del prototipo v4 como seed mínimo y documentar como deuda técnica
- [ ] **ST-03.7** Commit: `feat(db): seed datasets and normativas with embeddings`

---

### STORY-04: Dockerfile y entorno reproducible

**Como** desarrollador,
**quiero** un `Dockerfile` y `docker-compose.yml` que levanten el sistema localmente,
**para que** el deploy en HuggingFace Spaces sea predecible y cualquier colaborador pueda replicar el entorno.

**Criterio de aceptación:** `docker compose up` levanta el sistema. `curl http://localhost:7860/health` retorna 200.

**Guía técnica   Docker local:**

Docker permite correr la aplicación en un contenedor aislado, idéntico al entorno de producción en HuggingFace. Los comandos clave son:

```bash
# Construir la imagen (solo la primera vez o cuando cambia el Dockerfile o requirements.txt)
docker compose build

# Levantar el sistema (en foreground, muestra logs)
docker compose up

# Levantar en background
docker compose up -d

# Ver logs cuando corre en background
docker compose logs -f

# Detener
docker compose down

# Construir y levantar en un solo comando
docker compose up --build
```

El archivo `.env` debe existir en la raíz del proyecto antes de ejecutar `docker compose up`. Si falta, el sistema arranca pero falla al conectarse a Supabase y Gemini.

**Subtasks:**

- [ ] **ST-04.1** Crear `requirements.txt` con todas las dependencias: `fastapi`, `uvicorn[standard]`, `gradio`, `supabase`, `asyncpg`, `pgvector`, `google-generativeai`, `presidio-analyzer`, `presidio-anonymizer`, `spacy`, `pandas`, `openpyxl`, `python-jose[cryptography]`, `passlib[bcrypt]`, `bleach`, `python-dotenv`, `httpx`, `pydantic`, `slowapi`
- [ ] **ST-04.2** Crear `Dockerfile` siguiendo exactamente la estructura del RFC §7.2.3 (usuario no-root UID 1000, puerto 7860, spacy download durante el build)
- [ ] **ST-04.3** Crear `docker-compose.yml`:
  ```yaml
  services:
    app:
      build: .
      ports:
        - "7860:7860"
      env_file:
        - .env
  ```
- [ ] **ST-04.4** Ejecutar `docker compose build` → verificar que el build completa sin errores
- [ ] **ST-04.5** Ejecutar `docker compose up` → verificar que uvicorn arranca y el endpoint `/health` responde
- [ ] **ST-04.6** Commit: `chore: add dockerfile and docker-compose`

---

## DÍA 2   Backend Core

---

### STORY-05: Pipeline de anonimización

**Como** sistema,
**quiero** un servicio que detecte y redacte PII en texto en español antes de procesarlo o almacenarlo,
**para que** nunca se almacene ni envíe información personal identificable de los usuarios.

**Criterio de aceptación:** `anonymize("Juan García vive en CDMX y su email es juan@mail.com")` retorna texto con nombre, email y ubicación redactados.

**Subtasks:**

- [ ] **ST-05.1** Implementar `app/services/anonymizer.py`:
  - Inicializar `AnalyzerEngine` y `AnonymizerEngine` de Presidio
  - Configurar con `es_core_news_sm` de spaCy
  - Función `anonymize_text(text: str) -> str`
  - Entidades a detectar: `PERSON`, `EMAIL_ADDRESS`, `PHONE_NUMBER`, `LOCATION`, `URL`
  - Agregar reglas regex para patrones latinoamericanos: CURP (México), RUT (Chile/Argentina), cédula colombiana
- [ ] **ST-05.2** Test unitario manual: 5 inputs con diferentes tipos de PII, verificar redacción correcta
- [ ] **ST-05.3** Verificar que preguntas sin PII pasan sin modificación
- [ ] **ST-05.4** Commit: `feat(services): implement presidio anonymization pipeline`

---

### STORY-06: Servicio de embeddings y calidad

**Como** sistema,
**quiero** un servicio de generación de embeddings y un clasificador de calidad de datasets,
**para que** las preguntas puedan ser comparadas semánticamente con los datos disponibles y los resultados tengan un score determinístico.

**Criterio de aceptación:** `get_embedding("feminicidios en México")` retorna un vector de 768 dimensiones. `calculate_quality_score(dataset_row)` retorna el mismo valor para la misma entrada en múltiples llamadas.

**Subtasks:**

- [ ] **ST-06.1** Implementar `app/services/embeddings.py`:
  - Client de `google-generativeai`
  - Función `get_embedding(text: str, task_type: str = "RETRIEVAL_QUERY") -> list[float]`
  - Manejo de errores: retry con backoff exponencial ante rate limit (429)
- [ ] **ST-06.2** Implementar `app/services/quality_classifier.py`:
  - Portar `calcularCalidadAuto()` del JS a Python
  - Señales ponderadas: S1 metadatos 20%, S2 frecuencia 30%, S3 desagregación geográfica 30%, S4 accesibilidad 20%
  - Regla de bloqueo: `>3 años desde última actualización → score Nulo`
  - Sin ningún `random()`   función pura y determinística
  - Tests: misma entrada → mismo output en 10 llamadas consecutivas
- [ ] **ST-06.3** Commit: `feat(services): embeddings client and deterministic quality classifier`

---

### STORY-07: Motor de Brechas   endpoint principal

**Como** usuario,
**quiero** enviar una pregunta en lenguaje natural y recibir un análisis real de brechas de datos,
**para que** pueda entender qué datos existen, cuáles faltan, y qué marcos normativos aplican.

**Criterio de aceptación:** `POST /gaps {"pregunta": "¿cuántos feminicidios hay por estado?"}` retorna JSON con datasets relevantes, scores, marcos normativos, y síntesis. La misma request ejecutada dos veces retorna el mismo score.

**Subtasks:**

- [ ] **ST-07.1** Implementar `app/services/gap_engine.py`:
  - Función `search_gaps(pregunta_anonimizada: str, filters: GapFilters) -> GapResult`
  - Llamar a `get_embedding()` con `task_type="RETRIEVAL_QUERY"`
  - Llamar a `match_datasets()` y `match_normativas()` en Supabase via pgvector
  - Aplicar filtros (agenda, país, calidad) como condiciones SQL
  - Calcular score de brecha con `calculate_quality_score()` para cada dataset encontrado
  - Retornar `GapResult` (Pydantic model)
- [ ] **ST-07.2** Implementar `app/services/llm_synthesis.py`:
  - Función `synthesize_gap(pregunta: str, gap_result: GapResult) -> str`
  - Prompt estructurado para Gemini 2.5 Flash
  - Timeout de 10s, fallback a síntesis local si falla
- [ ] **ST-07.3** Implementar `app/routes/gaps.py`:
  - `POST /gaps` con modelo Pydantic de request/response
  - Llamar pipeline completo: anonimizar → embedding → search → score → synthesize → almacenar pregunta anon
  - Manejo de errores con respuestas HTTP apropiadas
- [ ] **ST-07.4** Implementar `app/db/models.py` con schemas Pydantic: `GapRequest`, `GapFilters`, `DatasetResult`, `NormativaResult`, `GapResponse`
- [ ] **ST-07.5** Test con curl: los 5 escenarios de `DATOS_MOCK` del prototipo v4
- [ ] **ST-07.6** Commit: `feat(routes): POST /gaps with real semantic search and deterministic scoring`

---

### STORY-08: Monitor Colectivo y autenticación

**Como** sistema,
**quiero** endpoints para el Monitor Colectivo con datos reales y autenticación JWT para el panel de curación,
**para que** el dashboard muestre agregaciones reales y el panel de curación esté protegido.

**Criterio de aceptación:** `GET /monitor` retorna conteos reales desde Supabase. `POST /auth/token` con credenciales inválidas retorna 401. Con credenciales válidas retorna JWT.

**Subtasks:**

- [ ] **ST-08.1** Implementar `app/routes/monitor.py`:
  - `GET /monitor/stats` → conteo de preguntas por agenda, región, semana
  - `GET /monitor/trends` → evolución semanal desde la tabla de métricas
  - Queries SQL reales a Supabase
- [ ] **ST-08.2** Implementar `app/routes/auth.py`:
  - `POST /auth/token` con `username` + `password`
  - Verificar contra `ADMIN_USERNAME` y hash de `ADMIN_PASSWORD_HASH` del `.env`
  - Retornar JWT con expiración de 8 horas
  - Dependency `get_current_user` para proteger rutas de curación
- [ ] **ST-08.3** Implementar `app/routes/datasets.py`:
  - `GET /datasets` (público)   lista de datasets con metadatos
  - `POST /datasets` (requiere JWT)   agregar dataset
  - `PATCH /datasets/{id}` (requiere JWT)   actualizar dataset
- [ ] **ST-08.4** Implementar `GET /health` → `{"status": "ok", "supabase": "connected"}`
- [ ] **ST-08.5** Commit: `feat(routes): monitor aggregations, JWT auth, datasets CRUD`

---

## DÍA 3   Frontend e Integración

---

### STORY-09: Frontend Gradio   Motor de Brechas

**Como** usuario,
**quiero** una interfaz web donde pueda ingresar mi pregunta y ver el análisis de brechas,
**para que** pueda usar el sistema sin conocimiento técnico.

**Criterio de aceptación:** La interfaz muestra el campo de pregunta, los filtros (Agenda, País, Calidad), y los resultados con datasets, scores y síntesis. Los filtros afectan los resultados.

**Subtasks:**

- [ ] **ST-09.1** Crear `frontend/app.py` con estructura base de Gradio: tabs "Motor de Brechas", "Monitor Colectivo", "Panel de Curación"
- [ ] **ST-09.2** Implementar tab Motor de Brechas:
  - `gr.Textbox` para ingreso de pregunta
  - `gr.Dropdown` para filtros Agenda, País, Calidad (conectados al endpoint)
  - `gr.Button` "Analizar brecha"
  - Área de resultados: datasets encontrados (tabla), score de brecha (número), síntesis narrativa (texto), marcos normativos (lista)
- [ ] **ST-09.3** Conectar UI al endpoint `POST /gaps` via `httpx` async
- [ ] **ST-09.4** Aplicar CSS del design system v4: importar variables `:root` como CSS personalizado en Gradio (`gr.Blocks(css=...)`). Colores desde variables, no hardcodeados.
- [ ] **ST-09.5** Test end-to-end: ingresar pregunta → recibir resultado real
- [ ] **ST-09.6** Commit: `feat(frontend): gap engine UI with real data and working filters`

---

### STORY-10: Frontend Gradio   Monitor Colectivo y Panel de Curación

**Como** usuario y curador,
**quiero** ver las agregaciones colectivas y poder gestionar datasets,
**para que** el Monitor Colectivo muestre evidencia real y los curadores puedan actualizar datos.

**Criterio de aceptación:** El Monitor muestra conteos reales. El Panel de Curación solicita login y bloquea el acceso sin credenciales.

**Subtasks:**

- [ ] **ST-10.1** Implementar tab Monitor Colectivo:
  - Contadores reales (preguntas totales, brechas identificadas, datasets cubiertos)
  - Gráfico de evolución semanal con `gr.LinePlot` o similar
  - Distribución por agenda con `gr.BarPlot`
  - Datos obtenidos de `GET /monitor/stats` y `GET /monitor/trends`
- [ ] **ST-10.2** Implementar tab Panel de Curación:
  - Login form (usuario + contraseña) → obtener JWT → almacenar en `gr.State`
  - Si no hay JWT válido: mostrar solo el form de login
  - Si hay JWT: mostrar tabla de datasets pendientes de revisión, botones aprobar/rechazar
  - Conectar a `GET /datasets`, `PATCH /datasets/{id}`
- [ ] **ST-10.3** Verificar que el panel rechaza acceso sin JWT (test manual: intentar operación sin login)
- [ ] **ST-10.4** Commit: `feat(frontend): collective monitor with real data and protected curation panel`

---

### STORY-11: Refactor del HTML v4 (preservación como referencia)

**Como** equipo del proyecto,
**quiero** que el prototipo HTML v4 esté separado en archivos CSS/JS independientes,
**para que** sirva como referencia de diseño sin ser un archivo imposible de mantener.

**Nota:** Esta story es lower priority frente a las anteriores. Si el tiempo escasea en Día 3, se mueve a post-demo.

**Criterio de aceptación:** El prototipo v4 funciona igual que antes, pero con CSS y JS en archivos separados.

**Subtasks:**

- [ ] **ST-11.1** Extraer CSS (~300 líneas) del HTML v4 → `assets/styles/tokens.css` + `assets/styles/components.css`
- [ ] **ST-11.2** Extraer JS (~900 líneas) del HTML v4 → `assets/scripts/motor.js` + `assets/scripts/monitor.js` + `assets/scripts/utils.js`
- [ ] **ST-11.3** Reemplazar colores hexadecimales hardcodeados en JS por `getComputedStyle(document.documentElement).getPropertyValue('--color-name')`
- [ ] **ST-11.4** Verificar que el prototipo v4 refactorizado funciona igual (solo como demo estático)
- [ ] **ST-11.5** Mover al directorio `docs/prototype-v4/`
- [ ] **ST-11.6** Commit: `refactor(prototype): separate CSS and JS from monolithic HTML`

---

## DÍA 4   Deploy, Hardening y Documentación

---

### STORY-12: Deploy en HuggingFace Spaces

**Como** equipo,
**quiero** el sistema desplegado en HuggingFace Spaces accesible públicamente,
**para que** los 20 usuarios de la demo puedan acceder sin configuración local.

**Criterio de aceptación:** URL pública `*.hf.space` carga el sistema. Todos los flujos funcionan desde esa URL.

**Guía técnica   HuggingFace Spaces Docker:**

HuggingFace Spaces es una plataforma de hosting que ejecuta contenedores Docker. Es diferente a servicios como Railway o Render en que tiene restricciones específicas de seguridad y requiere configuración explícita en el README.md.

**Paso 1   Crear el Space:**
1. Ir a `huggingface.co` → iniciar sesión → avatar → "New Space".
2. Llenar: Space name: `infracoop`, SDK: **Docker** (importante   no Gradio), Visibility: **Public**.
3. Clic en "Create Space". Se crea un repositorio Git vacío en HuggingFace.

**Paso 2   Preparar el README.md con el bloque YAML:**

El README.md del repo **debe** tener un bloque YAML al inicio. Sin este bloque, HuggingFace no sabe qué puerto exponer y el deploy falla. El bloque va al inicio del archivo, antes de cualquier texto:

```
---
title: Infra.Coop Motor de Brechas
emoji: 🔍
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---
```

**Paso 3   Configurar los Secrets:**

Ir a la página del Space → **Settings** (engranaje arriba a la derecha) → sección **"Repository secrets"**. Agregar cada variable de entorno como un Secret individual. Los Secrets se inyectan como variables de entorno en el contenedor. No son visibles en los logs ni en el código:

| Secret | Cómo obtener el valor |
|---|---|
| `SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `SUPABASE_KEY` | Supabase → Settings → API → anon public key |
| `GEMINI_API_KEY` | `aistudio.google.com` → Get API key |
| `JWT_SECRET_KEY` | Ejecutar en terminal: `openssl rand -hex 32` |
| `ADMIN_USERNAME` | El nombre de usuario elegido para el panel de curación |
| `ADMIN_PASSWORD_HASH` | Ejecutar: `python -c "from passlib.context import CryptContext; print(CryptContext(schemes=['bcrypt']).hash('la-contraseña'))"` |

**Paso 4   Hacer el deploy:**

```bash
# Método recomendado: agregar HF como remote y hacer push
git remote add space https://huggingface.co/spaces/tuusuario/infracoop

# Si pide credenciales, usar el usuario de HF y un Access Token
# (Generarlo en: huggingface.co → Settings → Access Tokens → New token con permisos "write")
git push space main
```

**Paso 5   Monitorear el build:**

En la página del Space → pestaña **"Logs"**. El build de Docker tarda entre 3 y 8 minutos la primera vez (principalmente por la instalación de dependencias y la descarga del modelo de spaCy). Los logs muestran cada línea del `docker build` en tiempo real.

El Space está listo cuando los logs muestran:
```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:7860
```

**Errores comunes en los logs y sus soluciones:**

| Lo que aparece en los logs | Qué significa | Qué hacer |
|---|---|---|
| `useradd: user 'appuser' already exists` | El Dockerfile intenta crear el usuario dos veces | Agregar `--ignore-existing` o verificar el Dockerfile |
| `Permission denied: '/app/...'` | El usuario 1000 no tiene permisos sobre los archivos copiados | Verificar que el `COPY` usa `--chown=appuser:appuser` |
| `KeyError: 'SUPABASE_URL'` | El Secret no está configurado o tiene un typo en el nombre | Ir a Settings → Secrets y verificar el nombre exacto |
| `OSError: [Errno 28] No space left` | El disco efímero del Space está lleno (raro en free tier) | Limpiar archivos temporales en el Dockerfile |
| Space queda en "Building" > 15 min | Timeout por descarga de archivos grandes | Revisar que no hay `wget` o `curl` descargando modelos pesados en el Dockerfile |

**Subtasks:**

- [ ] **ST-12.1** Crear HuggingFace Space (tipo: Docker, visibilidad: público) desde `huggingface.co`
- [ ] **ST-12.2** Agregar el bloque YAML de configuración al inicio del `README.md` (ver guía arriba)
- [ ] **ST-12.3** Verificar que el `Dockerfile` cumple los requisitos de HF Spaces: usuario no-root UID 1000, puerto 7860 en `EXPOSE` y en `CMD`
- [ ] **ST-12.4** Configurar todos los Secrets en Settings del Space (ver tabla arriba)
- [ ] **ST-12.5** Agregar el remote de HuggingFace: `git remote add space https://huggingface.co/spaces/tuusuario/infracoop`
- [ ] **ST-12.6** Hacer push: `git push space main` → monitorear los logs del build en la pestaña "Logs"
- [ ] **ST-12.7** Una vez que el build completa, verificar que la URL pública carga el sistema
- [ ] **ST-12.8** Test completo desde la URL pública: búsqueda en Motor de Brechas, Monitor Colectivo, login en Panel de Curación
- [ ] **ST-12.9** Configurar sincronización automática desde GitHub (Space → Settings → Repository) para que futuros pushes a `main` en GitHub disparen rebuilds automáticamente
- [ ] **ST-12.10** Documentar en el README: URL del Space, comportamiento de sleep (48h inactividad → 60s warm-up), protocolo pre-demo
- [ ] **ST-12.11** Commit: `chore: configure huggingface spaces deploy and sync`

---

### STORY-13: Seguridad y hardening

**Como** sistema,
**quiero** protecciones básicas de seguridad implementadas,
**para que** el sistema pueda estar en producción sin vectores de ataque obvios.

**Criterio de aceptación:** XSS test (inyectar `<script>alert(1)</script>` como pregunta) no ejecuta código. Rate limit activo: más de 10 requests/minuto al endpoint `/gaps` retorna 429.

**Subtasks:**

- [ ] **ST-13.1** Agregar sanitización con `bleach.clean()` en `app/routes/gaps.py` antes de procesar cualquier input de texto
- [ ] **ST-13.2** Agregar `escapeHTML()` en el frontend Gradio para cualquier texto de usuario mostrado en el DOM
- [ ] **ST-13.3** Implementar rate limiting en `POST /gaps`: 10 requests/minuto por IP con `slowapi` (middleware de FastAPI)
- [ ] **ST-13.4** Verificar que los logs de uvicorn no registran el body de las requests (configurar `access_log=False` en producción o usar un filtro de log)
- [ ] **ST-13.5** Commit: `security: add input sanitization, rate limiting, log filtering`

---

### STORY-14: Documentación y README

**Como** colaborador y usuario técnico,
**quiero** un README completo y documentación del proyecto,
**para que** cualquier persona pueda entender, instalar y contribuir al sistema.

**Criterio de aceptación:** Un desarrollador nuevo puede clonar el repo y tener el sistema corriendo localmente siguiendo el README, sin instrucciones adicionales.

**Subtasks:**

- [ ] **ST-14.1** Escribir `README.md`:
  - Descripción del proyecto (qué es Infra.Coop, los 3 módulos)
  - Arquitectura en 1 párrafo + diagrama de texto (ASCII o mermaid)
  - Variables de entorno requeridas (con descripción de cada una)
  - Instrucciones de setup local: `git clone → cp .env.example .env → editar .env → docker compose up`
  - Instrucciones de ingesta de datos: `python db/seeds/import_xlsx.py`
  - Nota sobre HuggingFace Spaces: comportamiento de sleep, warm-up para demos
  - Estructura del proyecto
  - Cómo contribuir (pull requests, branches)
- [ ] **ST-14.2** Crear `docs/ARCHITECTURE.md` con el diagrama de arquitectura del RFC
- [ ] **ST-14.3** Agregar docstrings a todos los módulos de `app/services/`
- [ ] **ST-14.4** Commit: `docs: complete README and architecture documentation`

---

### STORY-15: Verificación de criterios de aceptación

**Como** equipo,
**quiero** verificar que todos los criterios de aceptación del RFC se cumplen,
**para que** podamos declarar el sistema listo para la demo.

**Subtasks:**

- [ ] **ST-15.1** CA-01: Ejecutar la misma query 2 veces → verificar scores idénticos ✓/✗
- [ ] **ST-15.2** CA-02: Query con nombre propio → verificar redacción en Supabase ✓/✗
- [ ] **ST-15.3** CA-03: Ingresar 5 preguntas → recargar → verificar conteo en Monitor ✓/✗
- [ ] **ST-15.4** CA-04: Acceder a `/datasets` con POST sin JWT → verificar 401 ✓/✗
- [ ] **ST-15.5** CA-05: `GET /health` → verificar 200 y conexión Supabase ✓/✗
- [ ] **ST-15.6** CA-06: URL pública HF Spaces accesible ✓/✗
- [ ] **ST-15.7** CA-07: Filtro de país → verificar que cambia resultados ✓/✗
- [ ] **ST-15.8** CA-08: README completo ✓/✗
- [ ] **ST-15.9** CA-09: `docker compose up` en máquina limpia → sistema funcional ✓/✗
- [ ] **ST-15.10** CA-10: Los 5 escenarios DATOS_MOCK producen resultados coherentes ✓/✗
- [ ] **ST-15.11** Documentar resultados del checklist en `docs/acceptance-test-results.md`
- [ ] **ST-15.12** Commit final: `release: infracoop v5 - all acceptance criteria verified`

---

## Resumen del Plan

| Día | Stories | Meta |
|---|---|---|
| Día 1 | ST-01 a ST-04 | Repo + Schema + Seed + Docker |
| Día 2 | ST-05 a ST-08 | Backend completo con datos reales |
| Día 3 | ST-09 a ST-11 | Frontend Gradio + integración completa |
| Día 4 | ST-12 a ST-15 | Deploy + Seguridad + Docs + Verificación |

**Stories innegociables (bloqueantes para la demo):**
ST-01, ST-02, ST-03, ST-06, ST-07, ST-08, ST-09, ST-12

**Stories deseables pero movibles post-demo si hay tiempo:**
ST-10 (Monitor Colectivo completo), ST-11 (Refactor HTML v4), ST-13 (hardening completo)

**Deuda técnica documentada (fuera de scope v5):**
- Sección "¿Qué datos queremos?" (pendiente decisión de producto   Q-05)
- Flujo cooperativo completo de 3 revisores en tiempo real (Q-06)
- Autenticación multi-usuario (actualmente solo admin único)
- Exportación real a PDF/JPG (actualmente eliminada del scope)
- Tests automatizados (CI con pytest)
