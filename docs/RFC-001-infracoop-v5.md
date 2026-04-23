# RFC-001   Infra.Coop Motor de Brechas: Transición a Producción (v5)

---

## Metadata

| Campo | Valor |
|---|---|
| **Fecha** | 22 de abril de 2026 |
| **Propietario** | Diversa |
| **Revisores** | Equipo técnico, equipo de curación de datos |
| **Status** | BORRADOR   pendiente de aprobación |
| **Versión del prototipo base** | v4 (1,710 líneas, HTML monolítico) |
| **Ventana de ejecución** | 4 días laborales |
| **Usuarios objetivo (v5)** | ~20 usuarios externos invitados (demo cerrada) |

---

## Índice

1. Objetivo
2. Contexto y motivación
3. Requerimientos funcionales
4. Requerimientos no funcionales
5. Solución propuesta
6. Arquitectura en alto nivel
7. Guías técnicas de herramientas externas (Supabase + HuggingFace Spaces)
8. Pruebas sugeridas
9. Seguridad
10. Criterios de aceptación
11. Plan de ejecución
12. Riesgos
13. Preguntas abiertas

---

## 1. Objetivo

Transformar el prototipo funcional de alta fidelidad (v4) en un sistema real desplegado públicamente en HuggingFace Spaces, con backend real (FastAPI + Supabase), búsqueda semántica por embeddings, anonimización de preguntas con Presidio, y un frontend funcional basado en Gradio, en un plazo de 4 días de trabajo asistido con Claude Code. El sistema debe poder ser usado por 20 usuarios externos invitados sin que ningún dato se pierda al recargar la página y sin que los resultados sean ficticios.

**Lo que NO es el objetivo de esta iteración:** reescribir completamente el diseño visual, implementar un sistema de autenticación robusto multi-tenant, ni escalar a cientos de usuarios concurrentes.

---

## 2. Contexto y motivación

### 2.1 Estado actual

El prototipo v4 es un archivo HTML monolítico de 1,710 líneas que simula completamente un sistema real. Sus problemas críticos son:

- La búsqueda de brechas es un `setTimeout(2600ms)` + `if/else` sobre 5 palabras clave. Cualquier pregunta que no matchee devuelve un resultado **aleatorio**.
- Los scores de agenda se calculan con `Math.random()`   la misma pregunta da resultados diferentes cada vez.
- El Monitor Colectivo es un array estático que nunca cambia.
- Toda la data ingresada en el panel backend se pierde al recargar.
- No hay autenticación de ningún tipo en el panel de curación.
- La anonimización existe como diagrama SVG, pero sin código real.
- Los filtros (Agenda, País, Calidad) son decorativos   no hacen nada.

### 2.2 Por qué esto importa ahora

El proyecto tiene una demo cerrada con 20 usuarios invitados externos. Presentar el sistema actual como funcional sería engañoso y contraproducente para la credibilidad del proyecto. Esta iteración cierra la brecha entre la simulación y el sistema real.

### 2.3 Decisión sobre el stack

Se adopta la **Opción A: Free-Tier Cloud APIs** del documento de análisis técnico, por las siguientes razones frente a la Opción B (LLM local):

- Tiempo de build menor: sin descarga de modelos GGUF (~2 GB) ni configuración de llama.cpp
- Mejor calidad de embeddings para español: `gemini-embedding-001` (768 dims, multilingüe) vs `paraphrase-multilingual-mpnet-base-v2` (384 dims)
- El LLM (Gemini 2.5 Flash) se usa solo para síntesis narrativa   el 80% del sistema es búsqueda vectorial, que no depende del LLM
- El límite de 1,500 req/día es suficiente para una demo cerrada de 20 usuarios

**Stack decidido:**

| Componente | Tecnología |
|---|---|
| Hosting | HuggingFace Spaces (Docker SDK, free tier) |
| Backend | FastAPI + uvicorn |
| Frontend | Gradio (co-hosted en el mismo Space) |
| Base de datos | Supabase free tier (PostgreSQL + pgvector) |
| Embeddings | Google Gemini `gemini-embedding-001` |
| LLM síntesis | Google Gemini 2.5 Flash |
| Anonimización | Microsoft Presidio + spaCy `es_core_news_sm` |
| Data processing | pandas + openpyxl |
| Seguridad | bleach (XSS) + python-jose (JWT) + passlib |

---

## 3. Requerimientos Funcionales

### RF-01: Motor de Brechas (búsqueda real)
- El sistema debe aceptar una pregunta en lenguaje natural en español.
- Antes de procesarse, la pregunta debe pasar por el pipeline de anonimización (Presidio).
- La pregunta anonimizada debe ser convertida a embedding (Gemini `gemini-embedding-001`).
- El sistema debe hacer búsqueda por similitud de coseno en Supabase (pgvector) contra la tabla de datasets y marcos normativos.
- El resultado debe incluir: datasets relevantes encontrados, marcos normativos aplicables, score de brecha calculado deterministamente (fórmula ponderada S1–S4 de `calcularCalidadAuto()`), y síntesis narrativa generada por Gemini 2.5 Flash.
- Los filtros de Agenda, País y Calidad deben funcionar como parámetros de la búsqueda.

### RF-02: Persistencia de preguntas (Monitor Colectivo)
- Cada pregunta anonimizada procesada debe almacenarse en Supabase.
- El Monitor Colectivo debe consultar la base de datos real y mostrar agregaciones reales.
- El contador de preguntas debe reflejar datos reales acumulados entre sesiones para control interno.

### RF-03: Ingesta de datos seed
- El archivo `.xlsx` de datasets y normativas debe ser importado a Supabase mediante un script Python.
- Los embeddings de cada dataset/normativa deben generarse en batch y almacenarse en la columna vectorial.
- El script debe ser idempotente (re-ejecutable sin duplicar datos).

### RF-04: Panel de curación (backend)
- El panel debe requerir autenticación JWT (usuario/contraseña fija para la demo).
- Las acciones de curación (aprobar/rechazar datasets) deben persistir en la base de datos.
- El flujo cooperativo de 3 revisores debe conectarse a Supabase (no a memoria del browser).

### RF-05: Anonimización
- Toda pregunta ingresada debe pasar por Presidio antes de ser almacenada o enviada a cualquier API externa.
- El sistema debe detectar y redactar: nombres propios, emails, teléfonos, direcciones.
- El español debe ser el idioma principal (modelo `es_core_news_sm` de spaCy).

### RF-06: Refactor del código
- El HTML monolítico debe separarse en al menos: `index.html` (estructura), `assets/styles/` (CSS), `assets/scripts/` (JS).
- El JS no debe contener valores hexadecimales de colores hardcodeados   deben leerse de las variables CSS.
- Eliminar `Math.random()` de todos los cálculos de scores.
- Sanitizar todos los puntos de `innerHTML` con `bleach` en backend y función `escapeHTML()` en frontend.

### RF-07: Deploy y GitOps
- El proyecto debe tener un repositorio GitHub con estructura limpia.
- El deploy en HuggingFace Spaces debe funcionar desde un `Dockerfile`.
- El README debe incluir instrucciones de instalación, variables de entorno requeridas, y cómo ejecutar localmente.

---

## 4. Requerimientos No Funcionales

### RNF-01: Tiempo de respuesta
- El endpoint de búsqueda (`POST /gaps`) debe responder en menos de 5 segundos para el percentil 95 con la demo de 20 usuarios.

### RNF-02: Disponibilidad
- El Space en HuggingFace puede dormir después de 48h de inactividad (comportamiento del free tier). Esto es aceptable para la demo cerrada. El README debe documentarlo.

### RNF-03: Privacidad
- Ninguna pregunta con PII debe almacenarse o enviarse a APIs externas.
- Los logs de la aplicación no deben registrar el texto original de las preguntas.

### RNF-04: Escalabilidad mínima
- El sistema debe soportar 10–20 usuarios concurrentes sin degradación visible (garantizado por las características del free tier de HuggingFace Spaces: 2 vCPU, 16 GB RAM).

### RNF-05: Reproducibilidad
- Cualquier desarrollador debe poder clonar el repo, configurar las variables de entorno, y ejecutar el sistema localmente con `docker compose up`.

### RNF-06: Mantenibilidad
- El código debe estar separado en módulos por responsabilidad.
- Cada módulo debe tener un docstring que explique su propósito.
- Las variables de configuración deben estar en `.env`, nunca hardcodeadas.

---

## 5. Solución Propuesta

### 5.1 Estructura del proyecto

```
infracoop/
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
├── .env.example
├── README.md
├── app/
│   ├── main.py                  # FastAPI app + Gradio mount
│   ├── config.py                # Settings desde .env
│   ├── routes/
│   │   ├── gaps.py              # POST /gaps (Motor de Brechas)
│   │   ├── monitor.py           # GET /monitor (Monitor Colectivo)
│   │   ├── datasets.py          # CRUD datasets
│   │   └── auth.py              # POST /auth/token
│   ├── services/
│   │   ├── anonymizer.py        # Pipeline Presidio
│   │   ├── embeddings.py        # Gemini embedding client
│   │   ├── gap_engine.py        # Lógica de búsqueda + score
│   │   ├── llm_synthesis.py     # Gemini narrative synthesis
│   │   └── quality_classifier.py # calcularCalidadAuto() portado
│   └── db/
│       ├── client.py            # Supabase async client
│       └── models.py            # Pydantic schemas
├── frontend/
│   ├── app.py                   # Gradio UI
│   └── components/              # Tabs por módulo
├── db/
│   ├── schema.sql               # Schema limpio (desde infracoop_schema.sql)
│   ├── metrics.sql              # Triggers y snapshots
│   └── seeds/
│       └── import_xlsx.py       # Script de ingesta del .xlsx
└── docs/
    └── RFC-001.md               # Este documento
```

### 5.2 Flujo principal (Motor de Brechas)

```
Usuario ingresa pregunta
        ↓
[Presidio] Detecta y redacta PII
        ↓
Pregunta anonimizada → almacenar en Supabase (tabla: preguntas)
        ↓
[Gemini embedding-001] Genera vector 768-dim
        ↓
[Supabase pgvector] match_datasets()   cosine similarity top-k
        ↓
[calcularCalidadAuto()] Score S1-S4 por cada dataset encontrado
        ↓
[Gemini 2.5 Flash] Síntesis narrativa de la brecha
        ↓
Respuesta: datasets, marcos normativos, scores, síntesis
```

### 5.3 Decisión sobre Gradio vs HTML existente

El frontend se migrará a **Gradio** por las siguientes razones:
- Elimina la necesidad de mantener un servidor de archivos estáticos separado.
- Gradio se monta directamente dentro de FastAPI (`gr.mount_gradio_app`).
- Permite conservar el design system CSS del prototipo v4 mediante CSS personalizado en Gradio.
- Reduce la superficie de ataque XSS al no usar `innerHTML` directamente.

El prototipo HTML v4 se preserva como referencia de diseño y como conjunto de fixtures de prueba (DATOS_MOCK → test fixtures).

---

## 6. Arquitectura en Alto Nivel

```
┌─────────────────────────────────────────────────────────┐
│                 HuggingFace Space (Docker)                │
│                                                          │
│  ┌──────────────┐    ┌──────────────────────────────┐   │
│  │   Gradio UI   │    │        FastAPI Backend        │   │
│  │  (port 7860)  │◄──►│  /gaps  /monitor  /auth     │   │
│  └──────────────┘    └──────────┬───────────────────┘   │
│                                  │                        │
│                     ┌────────────▼──────────────┐        │
│                     │     Service Layer          │        │
│                     │  anonymizer  │  embeddings │        │
│                     │  gap_engine  │  llm_synth  │        │
│                     └─────────────┬─────────────┘        │
│                                   │                        │
│           ┌───────────────────────▼──────────┐           │
│           │    Presidio (runs locally)        │           │
│           │    spaCy es_core_news_sm          │           │
│           └──────────────────────────────────┘           │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS
        ┌──────────────────▼────────────────────┐
        │           Supabase (free tier)         │
        │  PostgreSQL + pgvector extension       │
        │  Tablas: datasets, normativas,         │
        │          preguntas, revisiones         │
        └──────────────────┬────────────────────┘
                           │ API calls
        ┌──────────────────▼────────────────────┐
        │        Google AI Studio (free)         │
        │  gemini-embedding-001 (embeddings)     │
        │  gemini-2.5-flash (síntesis)           │
        └───────────────────────────────────────┘
```

---

## 7. Guías Técnicas de Herramientas Externas

Esta sección documenta paso a paso la configuración de las dos plataformas externas del stack que requieren trabajo fuera del código Python: Supabase y HuggingFace Spaces. Está escrita para alguien que nunca ha usado ninguna de las dos.

---

### 7.1 Supabase   Guía de configuración completa

Supabase es una base de datos PostgreSQL gestionada en la nube con una interfaz web. Para este proyecto la usamos como la única fuente de persistencia: datasets, normativas, preguntas anonimizadas, y resultados de curación viven aquí.

#### 7.1.1 Crear el proyecto

1. Ir a [supabase.com](https://supabase.com) y crear una cuenta (se puede usar GitHub OAuth).
2. Hacer clic en **"New project"**.
3. Llenar el formulario:
   - **Name:** `infracoop`
   - **Database Password:** generar una contraseña fuerte y guardarla   se necesita si alguna vez se conecta directamente vía psql.
   - **Region:** elegir `South America (São Paulo)` o `US East`   lo más cercano a los usuarios.
   - **Plan:** Free tier.
4. Esperar 1–2 minutos mientras Supabase provisiona la base de datos.

#### 7.1.2 Obtener las credenciales

Una vez creado el proyecto, ir a **Settings → API** en el menú lateral izquierdo. Ahí están las variables para el `.env`:

```
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Usar la key marcada como **"anon public"**. Supabase tiene dos: `anon` (pública) y `service_role` (acceso total, nunca exponer en el código del repo).

#### 7.1.3 Habilitar pgvector

pgvector es la extensión que permite almacenar y buscar vectores de embeddings. En el free tier está disponible pero hay que habilitarla:

1. En el menú lateral, ir a **Database → Extensions**.
2. Buscar `vector` en el buscador.
3. Activar el toggle.

O desde el SQL Editor:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

#### 7.1.4 Ejecutar el schema SQL

1. En el menú lateral, ir a **SQL Editor → New query**.
2. Pegar el contenido completo de `db/schema.sql`.
3. Hacer clic en **Run** (o `Ctrl+Enter`).
4. Repetir con `db/metrics.sql`.

**Verificación:** Ir a **Table Editor**   deben aparecer las tablas `datasets`, `normativas`, `preguntas` y las tablas de auditoría.

El error más común es `extension "vector" does not exist`   resolverlo habilitando pgvector primero (paso anterior) y volviendo a ejecutar el schema.

#### 7.1.5 Crear las funciones de búsqueda vectorial

Las funciones `match_datasets` y `match_normativas` ejecutan la búsqueda por similitud. Ejecutar en SQL Editor:

```sql
CREATE OR REPLACE FUNCTION match_datasets(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid, nombre text, descripcion text,
  pais text, agenda text, anio_actualizacion int,
  calidad text, url text, similarity float
)
LANGUAGE sql STABLE AS $$
  SELECT
    id, nombre, descripcion, pais, agenda,
    anio_actualizacion, calidad, url,
    1 - (embedding <=> query_embedding) AS similarity
  FROM datasets
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

CREATE OR REPLACE FUNCTION match_normativas(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid, nombre text, tipo text,
  pais text, descripcion text, similarity float
)
LANGUAGE sql STABLE AS $$
  SELECT
    id, nombre, tipo, pais, descripcion,
    1 - (embedding <=> query_embedding) AS similarity
  FROM normativas
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
```

El operador `<=>` es la distancia de coseno de pgvector. `1 - distancia` la convierte en similitud (1.0 = idéntico, 0.0 = sin relación).

#### 7.1.6 Verificar los datos después de la ingesta

Después de ejecutar `import_xlsx.py`:

1. Ir a **Table Editor → datasets**.
2. Confirmar que hay filas con datos.
3. Hacer clic en cualquier fila y verificar que el campo `embedding` tiene un valor (array de números), no NULL.

Si `embedding` aparece NULL en todas las filas, el script falló al llamar a la API de Gemini. Revisar los logs del script.

#### 7.1.7 Configurar Row Level Security (RLS)   mínimo para la demo

Por defecto Supabase bloquea todas las operaciones con RLS activo. Política mínima:

1. Ir a **Authentication → Policies**.
2. Para la tabla `datasets`: crear política que permita `SELECT` a todos (consultas públicas del Motor de Brechas).
3. Para `INSERT` y `UPDATE`: el backend FastAPI usa la `service_role` key internamente para estas operaciones   esta key bypasea RLS. Documentar como deuda técnica migrar a RLS completo.

#### 7.1.8 Límites del free tier relevantes para la demo

| Recurso | Límite | Impacto estimado |
|---|---|---|
| Almacenamiento | 500 MB | ~3 KB por dataset con embedding 768-dim → hasta ~160K datasets sin problemas |
| Usuarios activos | 50K/mes | Para 20 usuarios de demo: sin problema |
| Pausa por inactividad | 1 semana | Si la BD se pausa: ir al dashboard → "Restore project" |

Para ver el uso actual: **Settings → Usage** en el dashboard.

---

### 7.2 HuggingFace Spaces   Guía de deploy completa

HuggingFace Spaces es la plataforma de hosting del sistema. Se usa el tipo **Docker SDK** que permite correr cualquier aplicación en un contenedor, a diferencia de los Spaces de Gradio puro que son más restrictivos.

#### 7.2.1 Crear la cuenta y el Space

1. Ir a [huggingface.co](https://huggingface.co) y crear una cuenta.
2. Hacer clic en el avatar → **"New Space"**.
3. Llenar el formulario:
   - **Space name:** `infracoop` (la URL resultante será `tuusuario-infracoop.hf.space`)
   - **License:** MIT
   - **SDK:** seleccionar **Docker**   no Gradio ni Streamlit
   - **Visibility:** `Public`   necesario para que los 20 usuarios accedan sin cuenta de HF
4. Hacer clic en **"Create Space"**.

#### 7.2.2 Bloque YAML obligatorio en el README.md

HuggingFace Spaces lee el `README.md` del repo para configurar el Space. Sin este bloque al inicio del archivo, el Space no sabe qué puerto exponer y el deploy falla silenciosamente:

```yaml
---
title: Infra.Coop Motor de Brechas
emoji: 🔍
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# Infra.Coop Motor de Brechas
...resto del README normal...
```

El campo `app_port: 7860` debe coincidir exactamente con el puerto en el `Dockerfile` y en el `CMD` de uvicorn.

#### 7.2.3 Requisitos del Dockerfile para HF Spaces

HuggingFace impone restricciones de seguridad sobre los contenedores. El Dockerfile debe cumplir estas reglas o el deploy falla:

```dockerfile
FROM python:3.11-slim

# Dependencias del sistema necesarias para spaCy y compilación
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# CRÍTICO: crear usuario no-root con UID 1000
# HF Spaces rechaza contenedores que corren como root
RUN useradd -m -u 1000 appuser

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Descargar modelo de spaCy durante el build (~50 MB, aceptable)
RUN python -m spacy download es_core_news_sm

COPY --chown=appuser:appuser . .

# CRÍTICO: cambiar al usuario no-root antes del CMD
USER appuser

# CRÍTICO: puerto 7860 (requerido por HF Spaces)
EXPOSE 7860

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
```

Errores frecuentes en el build y sus causas:

| Error en los logs | Causa | Solución |
|---|---|---|
| `Permission denied` | Contenedor corre como root | Agregar `USER 1000` al Dockerfile |
| `Port not found` | `app_port` del README no coincide con `EXPOSE` | Sincronizar ambos a 7860 |
| Build timeout (>10 min) | Descarga de archivos grandes durante el build | Verificar que no hay modelos GGUF u otros archivos >500 MB en el Dockerfile |
| `OSError: Can't find model 'es_core_news_sm'` | El `spacy download` falló en el build | Verificar que `build-essential` está instalado antes del pip install |

#### 7.2.4 Configurar los Secrets (variables de entorno)

Las credenciales nunca deben estar en el repositorio. HuggingFace las inyecta al contenedor como variables de entorno mediante el sistema de Secrets:

1. En la página del Space → **Settings** (engranaje en la esquina superior derecha).
2. Ir a la sección **"Repository secrets"**.
3. Agregar cada variable de `.env.example` como un Secret separado:

| Nombre del Secret | Cómo obtener el valor |
|---|---|
| `SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `SUPABASE_KEY` | Supabase → Settings → API → anon public key |
| `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com) → Get API key |
| `JWT_SECRET_KEY` | Generar con: `openssl rand -hex 32` en terminal |
| `ADMIN_USERNAME` | Elegir el nombre de usuario del panel de curación |
| `ADMIN_PASSWORD_HASH` | Generar con: `python -c "from passlib.context import CryptContext; print(CryptContext(schemes=['bcrypt']).hash('la-contraseña'))"` |

Los Secrets son específicos del Space. Si el Space se duplica o transfiere, hay que reconfigurarlos manualmente.

#### 7.2.5 Hacer el deploy   dos métodos

**Método A   Push directo al Space (para empezar rápido):**

```bash
# Agregar el remote de HuggingFace (usa las credenciales de HF)
git remote add space https://huggingface.co/spaces/tuusuario/infracoop

# Push   pide usuario y contraseña (o token de HF)
git push space main
```

El Space construye automáticamente la imagen Docker al recibir el push. Los logs del build aparecen en tiempo real en la pestaña **"Logs"** del Space.

**Método B   Sincronización automática desde GitHub (para flujo continuo):**

1. En la página del Space → **Settings → Repository**.
2. En la sección **"Link to GitHub repository"**, conectar el repo de GitHub.
3. Configurar `main` como la branch que dispara el rebuild.
4. A partir de ese momento, cada `git push origin main` trigerea un rebuild automático del Space.

Este método es el recomendado para el flujo de trabajo de los 4 días: se trabaja en GitHub y el deploy a HF es automático.

#### 7.2.6 Leer los logs del build y runtime

Cuando algo falla, los logs son la única fuente de diagnóstico:

1. En la página del Space → pestaña **"Logs"** (o ícono de terminal).
2. Hay dos fases de logs:
   - **Build logs:** lo que ocurre durante `docker build`. Errores de `pip install`, falta de dependencias, permisos, modelos que no se descargan.
   - **Container logs:** lo que imprime la aplicación ya corriendo. Errores de conexión a Supabase, imports fallidos de Python, errores de uvicorn.
3. Si el Space queda en estado "Building" por más de 15 minutos y los logs se detienen, generalmente es un timeout por descarga de archivos grandes.

#### 7.2.7 Comportamiento de sleep y warm-up

El free tier de HuggingFace pone el Space a dormir tras **48 horas de inactividad**. Cuando alguien visita un Space dormido, tarda 30–60 segundos en despertar (el contenedor se reinicia).

Protocolo para la demo:
1. **5 minutos antes de la demo:** abrir la URL del Space en el navegador para despertarlo.
2. Hacer una búsqueda de prueba para verificar que todo está funcionando.
3. Avisar a los usuarios: "Si el sistema tarda en cargar la primera vez, es normal   esperar 60 segundos."

Documentar este comportamiento en el README del proyecto.

---

## 8. Pruebas Sugeridas

### 7.1 Pruebas de integración del Motor de Brechas

| Escenario | Input | Resultado esperado |
|---|---|---|
| Pregunta con PII | "Juan García pregunta sobre feminicidios en CDMX" | Nombre redactado, resultado sobre feminicidios |
| Pregunta mínima | "aborto" | Al menos 1 dataset relevante, score calculado |
| Pregunta ambigua | "datos de mujeres" | Resultados por similitud semántica, no por keywords |
| Pregunta sin match | "precio del aguacate en Guerrero" | Score bajo, mensaje de brecha explicativo |
| Filtro por país | Pregunta + filtro "México" | Solo datasets de México |
| Misma pregunta 2 veces | Cualquier pregunta | **Mismo score exacto** (verifica que Math.random() fue eliminado) |

### 7.2 Pruebas de persistencia

- Ingresar 5 preguntas → recargar página → verificar que el Monitor Colectivo muestra 5 preguntas acumuladas.
- Ingresar dataset desde panel backend → verificar que aparece en búsquedas posteriores.

### 7.3 Pruebas de anonimización

- Input con email → verificar `[EMAIL_REDACTED]` en Supabase.
- Input con nombre propio → verificar `[PERSON_REDACTED]` en Supabase.
- Input sin PII → verificar que el texto llega sin modificación a la API de embeddings.

### 7.4 Pruebas de autenticación

- Acceder al panel backend sin token → debe retornar 401.
- Acceder con credenciales inválidas → debe retornar 401.
- Acceder con credenciales válidas → debe retornar token JWT.

### 7.5 Pruebas de deploy

- Clonar repo limpio → `docker compose up` → sistema funcional en <5 minutos.
- Verificar que el Space en HuggingFace despliega desde el Dockerfile sin errores.

---

## 9. Seguridad

### 8.1 XSS
- Todo contenido dinámico insertado en el DOM debe pasar por `escapeHTML()` en el frontend.
- El backend usa `bleach.clean()` en todos los campos de texto libre antes de almacenarlos.

### 8.2 Autenticación del panel de curación
- JWT con `python-jose[cryptography]`.
- Contraseñas hasheadas con `passlib[bcrypt]`.
- Para la demo v5: un único usuario admin cuyas credenciales se configuran via `.env`.
- El panel de curación en Gradio debe verificar el token JWT antes de mostrar controles de curación.

### 8.3 Privacidad
- La pregunta original **nunca** se almacena. Solo la versión anonimizada.
- Los logs de uvicorn se configuran para no incluir el body de las requests.
- Las API keys (Gemini, Supabase) nunca se hardcodean   siempre desde `.env`.

### 8.4 Rate limiting (mínimo)
- El endpoint `/gaps` tiene un límite de 10 req/minuto por IP via middleware de FastAPI.
- Esto protege el límite diario de Gemini (1,500 req/día) de un uso accidental abusivo.

---

## 10. Criterios de Aceptación

El sistema v5 se considera aceptado cuando:

- [ ] **CA-01:** La misma pregunta ingresada dos veces produce **exactamente el mismo score** de brecha.
- [ ] **CA-02:** Una pregunta con el nombre "María García" se almacena en Supabase como texto con el nombre redactado.
- [ ] **CA-03:** El Monitor Colectivo muestra el número correcto de preguntas acumuladas después de recargar la página.
- [ ] **CA-04:** El panel de curación retorna 401 al acceder sin credenciales válidas.
- [ ] **CA-05:** El endpoint `GET /health` retorna 200 con el estado de la conexión a Supabase.
- [ ] **CA-06:** El deploy en HuggingFace Spaces es accesible públicamente via URL `*.hf.space`.
- [ ] **CA-07:** Los filtros de Agenda, País y Calidad modifican los resultados de búsqueda.
- [ ] **CA-08:** El repositorio GitHub tiene README completo con instrucciones de setup.
- [ ] **CA-09:** `docker compose up` levanta el sistema localmente sin errores en una máquina limpia.
- [ ] **CA-10:** Los 5 escenarios del `DATOS_MOCK` original producen resultados coherentes como queries reales.

---

## 11. Plan de Ejecución

> Ventana total: 4 días laborales. 1 desarrollador + Claude Code.
> Estrategia: backend-first. Sin backend real, el frontend no tiene valor.

### Día 1   Fundaciones (Infraestructura y datos)
**Meta del día:** Supabase conectado, schema desplegado, datos seed importados, repo inicializado.

- Inicializar repositorio GitHub con estructura de directorios del RFC.
- Limpiar y adaptar `infracoop_schema.sql` → `db/schema.sql` (eliminar nombres con paréntesis, ajustar para pgvector).
- Configurar proyecto Supabase: habilitar extensión pgvector, desplegar schema.
- Escribir `db/seeds/import_xlsx.py`: leer el `.xlsx`, generar embeddings en batch con Gemini, insertar en Supabase.
- Ejecutar ingesta y verificar datos en Supabase Dashboard.
- Crear `Dockerfile` + `docker-compose.yml` base.
- Configurar `.env.example` con todas las variables requeridas.

### Día 2   Backend core (Motor de Brechas)
**Meta del día:** `POST /gaps` funcional con datos reales, sin frontend.

- Implementar `app/services/anonymizer.py` (Presidio + spaCy).
- Implementar `app/services/embeddings.py` (Gemini client).
- Implementar `app/services/quality_classifier.py` (portar `calcularCalidadAuto()` a Python).
- Implementar `app/services/gap_engine.py` (búsqueda vectorial + scoring).
- Implementar `app/services/llm_synthesis.py` (Gemini 2.5 Flash narrative).
- Implementar `app/routes/gaps.py` con el endpoint `POST /gaps`.
- Implementar `app/routes/monitor.py` con agregaciones reales desde Supabase.
- Implementar `app/routes/auth.py` (JWT básico).
- Test manual con curl/httpie de todos los endpoints.

### Día 3   Frontend Gradio + integración
**Meta del día:** Sistema completo funcionando localmente.

- Implementar `frontend/app.py`: tabs Motor de Brechas, Monitor Colectivo, Panel Curación.
- Conectar UI a los endpoints FastAPI.
- Aplicar CSS del design system v4 a Gradio (variables `:root`, tipografía).
- Implementar filtros funcionales (Agenda, País, Calidad) conectados al endpoint.
- Implementar visualizaciones del Monitor Colectivo con datos reales.
- Test end-to-end de todos los flujos.
- Refactor del HTML v4: separar CSS/JS en archivos independientes (para preservar como referencia).

### Día 4   Deploy, hardening y documentación
**Meta del día:** Sistema desplegado en HuggingFace Spaces, README completo, criterios de aceptación verificados.

- Ajustar `Dockerfile` para HuggingFace Spaces (puerto 7860, usuario no-root).
- Crear HuggingFace Space y hacer push del repo.
- Verificar deploy público.
- Agregar rate limiting al endpoint `/gaps`.
- Revisar y sanitizar todos los puntos de inserción de datos dinámicos.
- Escribir README completo.
- Ejecutar checklist de criterios de aceptación (CA-01 a CA-10).
- Documentar preguntas abiertas resueltas y pendientes.

---

## 12. Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| El `.xlsx` tiene estructura inconsistente que requiere limpieza manual | Media | Alto | Reservar 2–3 horas del Día 1 para data cleaning. Si bloquea, usar los 5 DATOS_MOCK como seed mínimo. |
| El free tier de Gemini (1,500 req/día) se agota durante la ingesta | Media | Alto | Hacer la ingesta en batch con delay entre requests. Alternativamente usar Cohere `embed-multilingual-v3.0` (1,000 calls/mes). |
| El schema SQL necesita más ajustes de los esperados para pgvector | Baja-Media | Medio | El schema existente está bien documentado. Reservar 1–2 horas del Día 1. |
| HuggingFace Spaces tiene problemas de cold start para la demo | Media | Medio | Documentar el comportamiento de sleep en el README. Hacer un "warm-up" antes de la demo. |
| Gradio no soporta suficiente personalización visual para replicar el design system | Baja-Media | Bajo | El diseño visual no es un criterio de aceptación de esta iteración. Funcionalidad > estética. |
| El modelo `es_core_news_sm` de spaCy no detecta PII en textos cortos en español latinoamericano | Baja | Medio | Agregar reglas regex adicionales en Presidio para patrones comunes (CURP, RUT, cédula). |

---

## 13. Preguntas Abiertas

| ID | Pregunta | Responsable | Prioridad |
|---|---|---|---|
| Q-01 | ¿El schema SQL (`infracoop_schema.sql`) tiene la estructura de columnas vectoriales ya definida, o hay que agregar la columna `embedding vector(768)` manualmente? | Equipo técnico | Alta |
| Q-02 | ¿Cuántas filas tiene el `.xlsx` de datasets/normativas? Esto determina el tiempo y el costo de la ingesta en batch. | Equipo de datos | Alta |
| Q-03 | ¿Las credenciales del panel de curación (usuario admin) para la demo serán compartidas entre curadores, o se necesitan usuarios separados? | Equipo de curación | Media |
| Q-04 | ¿El sistema debe soportar preguntas en idiomas distintos al español (portugués, inglés)? Esto afecta el modelo de anonimización. | Equipo de producto | Baja |
| Q-05 | ¿La sección "¿Qué datos queremos?" del diseño v4 debe implementarse en esta iteración o queda como deuda técnica documentada? | Equipo de producto | Media |
| Q-06 | ¿El flujo cooperativo de 3 revisores debe ser funcional para la demo, o es suficiente con que el panel de curación básico (aprobar/rechazar) funcione? | Equipo de curación | Media |
