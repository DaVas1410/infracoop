
# Infra.Coop   Análisis de Stack Técnico y Opciones de Arquitectura

---

## 1. Análisis del Alcance del Proyecto

### 1.1 Qué es Infra.Coop

Infra.Coop es una infraestructura tecnosocial para detectar brechas de datos en información social y de género en América Latina. No es un chatbot genérico ni un motor de búsqueda. Tiene tres módulos centrales:

**Motor de Brechas:** El usuario hace una pregunta en lenguaje natural (ej. "¿Cuántos feminicidios hay por estado?"). El sistema analiza qué conjuntos de datos existen para responder a esa pregunta, qué datos faltan, qué marcos normativos aplican y genera una puntuación de brecha (gap score).

**Monitor Colectivo:** Agrega las preguntas de múltiples usuarios a lo largo del tiempo. Revela patrones: qué preguntas se hacen más, qué regiones carecen de datos, qué agendas temáticas tienen las brechas más grandes.

**¿Qué datos queremos?:** Visualiza la evidencia acumulada: qué datos necesita la comunidad pero no tiene, clasificados por tema, geografía y tipo de dato.

### 1.2 Estado Actual (según Diagnóstico v4)

El prototipo es un único archivo HTML de 1,710 líneas que simula todo:

- La búsqueda es un `setTimeout` + un `if/else` de palabras clave que devuelve datos simulados (mock) fijos.
- Las puntuaciones se generan con `Math.random()`   la misma pregunta da puntuaciones diferentes cada vez.
- El Monitor Colectivo es un array estático que nunca cambia.
- Los gráficos de evolución semanal son datos fabricados.
- Los filtros (Agenda, País, Calidad) son completamente decorativos   no están conectados a ningún código.
- El panel de backend tiene cero autenticación   cualquiera puede acceder.
- Todos los datos viven en la memoria del navegador   se pierden al recargar la página.
- Sin embeddings, sin pgvector, sin anonimización   el esquema SQL existe pero nada se conecta a él.

### 1.3 Brecha entre Prototipo y Producción

| Componente | Estado Actual | Qué Falta |
|-----------|--------------|----------------|
| Motor de búsqueda de brechas | `if/else` en 5 palabras clave | Búsqueda semántica vía embeddings + similitud de vectores |
| Cálculo de puntuación | `Math.random()` | Fórmula ponderada determinista |
| BD de datasets/marcos | Objetos JS integrados | Base de datos relacional persistente con datos semilla reales |
| Anonimización | Solo diagrama de flujo SVG | Detección y eliminación real de PII basada en NER |
| Monitor Colectivo | Arrays estáticos simulados | Consultas de agregación sobre preguntas anonimizadas almacenadas |
| Autenticación | Ninguna | Control de acceso en el panel de backend/curador |
| Frontend | 1 archivo HTML monolítico | Separación de responsabilidades o UI basada en frameworks |
| Capa de API | Ninguna | Endpoints del lado del servidor para todas las operaciones |
| Ingesta de datos | Copiar-pegar manual en formularios | Pipeline de carga estructurada y procesamiento |
| Protección XSS | `innerHTML` en todas partes | Sanitización de entradas en todo el contenido dinámico |

### 1.4 Activos a Preservar

- **`calcularCalidadAuto()`**   Clasificador de calidad ponderado de 4 señales (S1: metadatos 20%, S2: frecuencia 30%, S3: desagregación geográfica 30%, S4: accesibilidad 20%) con reglas de bloqueo coherentes (>3 años → Nula). Esta es lógica real y probada.
- **Flujo de revisión cooperativa**   Proceso de consenso de 3 revisores (auto → revisor principal → escalamiento a nodo → consenso unánime → confirmación final). UX bien diseñada.
- **Sistema de diseño CSS**   Variables `:root`, tipografía consistente, componentes visuales bien estructurados. Base sólida.
- **Esquema SQL**   `infracoop_schema.sql` e `infracoop_metricas_backup.sql` están listos para producción con triggers de auditoría y funciones de snapshot.
- **`INCIDENCIA_CONFIG`**   4 tipos de incidencia (OGP, DDHH, Digital, Cooperativa) con marcos normativos curados. Contenido real.
- **`DATOS_MOCK`**   5 ejemplos de escenarios de alta calidad. Valiosos como accesorios de prueba y datos de demostración.

### 1.5 Observación Crítica

El sistema es fundamentalmente un **problema de búsqueda semántica**, no un problema de chatbot. El 80% de su valor proviene de emparejar correctamente la pregunta de un usuario con los conjuntos de datos y marcos normativos existentes a través de similitud de embeddings. El 20% restante es el LLM generando una síntesis narrativa de por qué existe la brecha. Esto significa que el modelo de embedding y la base de datos vectorial importan mucho más que la elección del LLM.

---

## 2. Opción de Arquitectura A: APIs en la Nube (Nivel Gratuito)

### 2.1 Filosofía

Utilizar APIs de nube en su nivel gratuito para embeddings y análisis de LLM. Implementación más sencilla, inferencia más rápida, dependiente de servicios externos y sus límites de tasa (rate limits).

### 2.2 Componentes del Stack

**Hosting   HuggingFace Spaces (Docker SDK, nivel gratuito)**
- 2 vCPU, 16 GB RAM, 50 GB de disco efímero.
- URL pública en `tunombre-infracoop.hf.space`.
- Se suspende tras 48 horas de inactividad, se activa al visitar.
- El SDK de Docker permite un control total del entorno.

**Framework de Backend   FastAPI**
- Framework de Python asíncrono, ligero, genera documentación OpenAPI automáticamente.
- Maneja todos los endpoints de API que el diagnóstico identifica como faltantes: búsqueda de brechas, CRUD de datasets, CRUD de marcos, ingesta de datos, agregación del monitor.

**Frontend   Gradio**
- Se aloja junto con FastAPI dentro del mismo HuggingFace Space en el puerto 7860.
- Ajuste natural para el patrón de interacción "hacer una pregunta, obtener análisis" del Motor de Brechas.
- No requiere experiencia en desarrollo frontend   Python puro.
- Alternativa: Streamlit (mejor para vistas densas de dashboards como el Monitor Colectivo, peor para la interacción de búsqueda).

**Embeddings   Google Gemini `gemini-embedding-001`**
- Completamente gratuito vía Google AI Studio.
- Vectores de 768 dimensiones, fuerte rendimiento multilingüe (crítico para el español).
- Límite de tasa: 1,500 solicitudes/día.
- Alternativa: Cohere `embed-multilingual-v3.0` (nivel gratuito, 1,000 llamadas/mes).
- Alternativa: Jina AI embeddings (nivel de prueba gratuita, multilingüe).

**LLM para análisis de brechas   Google Gemini 2.5 Flash**
- Nivel gratuito: 1,500 solicitudes/día.
- Usado solo para sintetizar la explicación narrativa de la brecha   no para la búsqueda.
- Tiempo de respuesta: 1-3 segundos.
- Alternativa: Groq (Llama 3.3 70B, nivel gratuito, inferencia extremadamente rápida a más de 300 tokens/segundo).
- Alternativa: Mistral nivel gratuito (500K tokens/minuto, límite de 1 req/seg).

**Base de datos   Supabase (nivel gratuito)**
- PostgreSQL con extensión `pgvector` disponible.
- 500 MB de almacenamiento, 50,000 usuarios activos mensuales.
- Seguridad a Nivel de Fila (RLS) integrada para el panel de backend/curador.
- Sistema de autenticación integrado.
- API REST generada automáticamente desde el esquema.
- El esquema SQL existente se porta directamente.
- Persistente   los datos sobreviven a los reinicios de HuggingFace Space.

**Anonimización   Microsoft Presidio**
- Código abierto, se ejecuta localmente dentro del Space (sin llamada a API).
- Detecta y redacta PII: nombres, correos, números de teléfono, direcciones.
- Soporta texto en español a través del modelo de spaCy `es_core_news_sm`.
- Se aplica antes de que la pregunta se almacene o se envíe a cualquier API externa.

**Procesamiento de datos   pandas + openpyxl**
- Para procesar el archivo semilla `.xlsx` existente de datasets y marcos normativos.
- Para cualquier limpieza y transformación de datos durante la ingesta.

**Seguridad   bleach + python-jose**
- `bleach` para sanitización de HTML (reemplaza la vulnerabilidad XSS de `innerHTML`).
- `python-jose` para autenticación basada en JWT en el panel de backend.
- `passlib` para hashing de contraseñas.

### 2.3 Lista Completa de Dependencias

| Categoría | Librería | Propósito |
|----------|---------|---------|
| Framework Web | `fastapi`, `uvicorn` | Servidor de API |
| Frontend | `gradio` | Interfaz de usuario |
| Cliente de BD | `supabase`, `asyncpg`, `pgvector` | Conexión Supabase + operaciones vectoriales |
| Embeddings | `google-generativeai` | Cliente API de embeddings de Gemini |
| Anonimización | `presidio-analyzer`, `presidio-anonymizer`, `spacy` | Detección y eliminación de PII |
| Procesamiento | `pandas`, `openpyxl` | Parseo de Excel y manipulación de datos |
| Seguridad | `python-jose[cryptography]`, `passlib[bcrypt]`, `bleach` | Autenticación + prevención XSS |
| Utilidades | `python-dotenv`, `httpx`, `pydantic` | Configuración, cliente HTTP, validación |

### 2.4 Fortalezas

- Inferencia rápida: 1-3 segundos de tiempo de respuesta para el análisis de brechas.
- Síntesis narrativa de mayor calidad desde un LLM de clase frontera.
- Excelentes embeddings multilingües (768 dimensiones).
- Implementación simple   sin archivos de modelos grandes en la imagen Docker.
- Más margen de RAM para tareas de procesamiento de datos.
- Puede manejar 10-20 usuarios concurrentes sin colas.

### 2.5 Debilidades

- Las preguntas de los usuarios (tras anonimización) se envían a la API de Google.
- Techo de 1,500 solicitudes/día   si la herramienta gana tracción, choca con el límite.
- Dependencia de los términos de nivel gratuito continuos de Google.
- Si la API cae, toda la función de análisis de brechas deja de funcionar.
- Tensión con la filosofía de soberanía cooperativa de Infra.Coop   depender de una API corporativa para una herramienta de datos de derechos humanos.

---

## 3. Opción de Arquitectura B: LLM Local en HuggingFace Spaces

### 3.1 Filosofía

Todo se ejecuta dentro del contenedor de HuggingFace Space   sin llamadas a APIs externas para inferencia. Soberanía total de datos. Más lento, pero independiente y alineado con el ethos cooperativo.

### 3.2 Presupuesto de RAM (la restricción crítica)

El HuggingFace Space gratuito proporciona 16 GB de RAM en total. Esto debe distribuirse entre todos los procesos en ejecución:

| Componente | Uso Estimado de RAM |
|-----------|-------------------|
| OS + Runtime de Python | ~2.0 GB |
| FastAPI + Gradio + dependencias | ~0.5 GB |
| Presidio + spaCy (es_core_news_sm) | ~0.5 GB |
| Modelo de sentence-transformers | ~0.5 GB |
| llama-cpp-python + Qwen2.5-3B Q4_K_M | ~3.0 GB (modelo ~2.2 GB + KV cache ~0.8 GB) |
| **Total usado** | **~6.5 GB** |
| **Margen para procesamiento de datos** | **~9.5 GB** |

Esto encaja cómodamente. Un modelo de 7B (~5 GB) también funcionaría pero con menos margen de maniobra.

### 3.3 Componentes del Stack

**Hosting   HuggingFace Spaces (Docker SDK, nivel gratuito)**
- Igual que la Opción A.

**Framework de Backend   FastAPI**
- Igual que la Opción A.

**Frontend   Gradio**
- Igual que la Opción A, con la adición de un indicador de carga que establezca expectativas realistas sobre el tiempo de respuesta ("Analizando... esto toma 15-30 segundos").

**Motor de LLM   llama-cpp-python**
- Bindings directos de Python para llama.cpp   sin la sobrecarga del demonio de Ollama.
- Servidor de API compatible con OpenAI integrado.
- Inferencia solo por CPU en 2 núcleos.
- Lee archivos de modelo en formato GGUF.
- Por qué no Ollama: Ollama añade una capa de servicio extra ejecutándose como demonio, lo cual es una sobrecarga innecesaria en un contenedor Docker. `llama-cpp-python` es más ligero, da control directo desde Python y evita gestionar un proceso separado.

**Modelo LLM   Qwen2.5-3B-Instruct Q4_K_M**
- Tamaño de archivo de ~2.2 GB en cuantización GGUF Q4_K_M.
- La mejor calidad de razonamiento en la escala de 3 mil millones de parámetros.
- Fuerte capacidad multilingüe (chino, inglés, español).
- Velocidad de inferencia en 2 núcleos de CPU: ~5-10 tokens/segundo.
- Una respuesta de análisis de 200 palabras toma aproximadamente 15-30 segundos.
- Alternativa: Gemma-3-4B-IT Q4_K_M (~2.8 GB)   modelo de Google, fuerte en análisis estructurado, ligeramente más grande.
- Alternativa: Phi-3-mini-4k-instruct Q4_K_M (~2.3 GB)   modelo de Microsoft, rápido, buenas salidas estructuradas.
- No recomendado: TinyLlama (1.1B)   calidad demasiado baja para texto analítico en español.
- Posible esfuerzo extra: Mistral-7B-Instruct-v0.3 Q4_K_M (~4.4 GB)   cabe en RAM pero la inferencia cae a ~2-5 tokens/segundo.

**Modelo de Embedding   paraphrase-multilingual-MiniLM-L12-v2**
- ~480 MB, se ejecuta completamente en CPU.
- Vectores de 384 dimensiones.
- Soporta más de 50 idiomas incluyendo español   esto no es negociable para una herramienta latinoamericana.
- Velocidad de inferencia: ~50ms por consulta (casi instantáneo).
- Alternativa: all-MiniLM-L6-v2 (~90 MB)   solo inglés, NO apto para consultas en español.
- Alternativa: bge-small-en-v1.5 (~130 MB)   también solo inglés, no apto.

**Base de datos   Supabase (nivel gratuito)**
- Igual que la Opción A, pero con vectores de 384 dimensiones en lugar de 768.
- La dimensión del vector afecta solo al tamaño del índice y la velocidad de búsqueda (384 es de hecho más rápido de buscar).

**Anonimización   Microsoft Presidio**
- Igual que la Opción A   se ejecuta localmente, sin dependencia de API.

**Procesamiento de datos   pandas + openpyxl**
- Igual que la Opción A.

**Seguridad   bleach + python-jose**
- Igual que la Opción A.

### 3.4 Lista Completa de Dependencias

| Categoría | Librería | Propósito |
|----------|---------|---------|
| Framework Web | `fastapi`, `uvicorn` | Servidor de API |
| Frontend | `gradio` | Interfaz de usuario |
| Cliente de BD | `supabase`, `asyncpg`, `pgvector` | Conexión Supabase + operaciones vectoriales |
| Inferencia LLM | `llama-cpp-python` | Inferencia de modelo GGUF local |
| Embeddings | `sentence-transformers`, `torch` (versión CPU) | Generación de embeddings local |
| Anonimización | `presidio-analyzer`, `presidio-anonymizer`, `spacy` | Detección y eliminación de PII |
| Procesamiento | `pandas`, `openpyxl` | Parseo de Excel y manipulación de datos |
| Seguridad | `python-jose[cryptography]`, `passlib[bcrypt]`, `bleach` | Autenticación + prevención XSS |
| Utilidades | `python-dotenv`, `pydantic` | Configuración, validación |

Nota: `torch` debe instalarse como versión solo-CPU (vía `--index-url https://download.pytorch.org/whl/cpu`) para evitar la descarga de ~2 GB de librerías CUDA innecesarias.

### 3.5 Fortalezas

- Soberanía total de datos   ningún texto de pregunta sale jamás del contenedor.
- Sin límites de tasa de API   funciona con cualquier nivel de tráfico (aunque lentamente).
- Sin dependencias externas para la funcionalidad principal   no se romperá si Google cambia los términos.
- Mejor alineación para temas sensibles   los datos de violencia de género no deberían pasar por APIs de terceros.
- Se alinea con la filosofía de infraestructura cooperativa de Infra.Coop.
- Reproducibilidad autocontenida   cualquiera puede clonar y ejecutar exactamente el mismo sistema.

### 3.6 Debilidades

- Inferencia lenta: 15-30 segundos por análisis de brecha (vs 1-3 segundos con API).
- Síntesis narrativa de menor calidad: un modelo de 3B no puede igualar a un LLM de frontera.
- Límite de usuarios concurrentes: 2-3 usuarios simultáneos experimentarán colas.
- Imagen Docker grande: ~8-10 GB debido a los archivos de los modelos.
- Arranque en frío tras 48h de suspensión: reconstruir y cargar los modelos toma varios minutos.
- El modelo de embedding (384-dim) captura menos matices semánticos que el de Gemini de 768-dim.



## 4. Comparativa Frente a Frente

| Dimensión | Opción A (APIs Gratuitas) | Opción B (LLM Local) |
|-----------|---------------------|---------------------|
| Tiempo de respuesta | 1-3 segundos | 15-30 segundos |
| Calidad de análisis LLM | Frontera (Gemini Flash) | Buena pero limitada (modelo 3B) |
| Calidad de Embedding | 768-dim, excelente multilingüe | 384-dim, buen multilingüe |
| Soberanía de datos | Preguntas enviadas a Google (post-anonimización) | Todo permanece en el contenedor |
| Límites de tasa | 1,500 req/día | Ilimitado (solo lento) |
| Usuarios concurrentes | 10-20 cómodamente | 2-3 antes de formar cola |
| Complejidad de despliegue | Simple | Moderada (descarga modelos, gestión RAM) |
| Dependencias externas | Disponibilidad de API de Google | Ninguna para funcionalidad central |
| Tamaño imagen Docker | ~1-2 GB | ~8-10 GB |
| Tiempo arranque en frío | ~30 segundos | ~3-5 minutos |
| Alineación ética | API corporativa para herram. DDHH | Soberanía total de infraestructura |
| Costo | $0 | $0 |
| Soporte idioma español | Excelente (Gemini) | Bueno (Qwen2.5 + embeddings multilingües) |
| Modo de falla | API caída → función fuera de línea | Lento pero siempre funciona |

---

## 5. Enfoque Recomendado: Arquitectura Híbrida

Dado que Infra.Coop maneja datos sensibles de género y derechos humanos, y dada su filosofía de soberanía cooperativa, la recomendación es una arquitectura híbrida:

**Opción B como predeterminada** (LLM local + embeddings locales), **con la Opción A como acelerador activable** mediante una única variable de entorno.

### 5.1 Por qué Híbrida

La base de código es idéntica en ambas opciones   solo cambia el backend de inferencia. Las rutas de FastAPI, el frontend de Gradio, el esquema de Supabase, la anonimización de Presidio y el motor de puntuación son compartidos. La única divergencia es si los embeddings se generan localmente vía `sentence-transformers` o vía la API de Gemini, y si la síntesis narrativa es producida por un modelo Qwen local o por Gemini Flash.

Esto significa:
- El despliegue por defecto funciona de forma totalmente local   cooperativo, soberano, sin llamadas a APIs externas.
- Para demos, presentaciones o talleres donde la velocidad importa, cambiar la variable de entorno permite obtener respuestas de Gemini Flash en 2 segundos.
- No hay penalización arquitectónica por soportar ambas   es un condicional en la capa de servicio.

### 5.2 Perspectiva Arquitectónica

La capa de búsqueda semántica (embeddings → pgvector → coincidencia por similitud) es el motor que hace que Infra.Coop funcione. Esta capa rinde de forma idéntica en ambas opciones   la única diferencia es la dimensión del embedding (384 vs 768). El LLM es un consumidor posterior que genera texto legible por humanos a partir de los resultados de búsqueda. Incluso con un modelo local de 3B, la funcionalidad central de identificar qué datasets existen y cuáles faltan es impulsada enteramente por la búsqueda de embeddings, que es rápida y precisa en ambos casos.

---

## 6. Descripciones de Flujos de Trabajo

### 6.1 Flujo Central: El Usuario Hace una Pregunta (Motor de Brechas)

```
Usuario escribe pregunta en Gradio
        ↓
Presidio escanea texto en busca de PII (nombres, correos, teléfonos, direcciones)
        ↓
    [¿PII encontrada?]
     sí → redactar y reemplazar con marcadores de posición
     no → pasar sin cambios
        ↓
Pregunta anonimizada → modelo de embedding → vector (384-dim o 768-dim)
        ↓
Búsqueda de similitud de coseno en pgvector contra:
  - Tabla de embeddings de Datasets
  - Tabla de embeddings de Marcos Normativos
        ↓
Recuperación de los Top-N datasets y marcos más similares
        ↓
Cálculo de puntuación determinista usando la lógica de calcularCalidadAuto() portada:
  - S1: completitud de metadatos (20%)
  - S2: frecuencia de actualización (30%)
  - S3: desagregación geográfica (30%)
  - S4: accesibilidad (20%)
  - Regla de bloqueo: datos de más de 3 años → puntuación "Nula"
  - Puntuaciones por agenda (Tecnológica, Datos, Género) calculadas con
    la misma fórmula ponderada   NO al azar
        ↓
Pregunta + mejores coincidencias → LLM (local o API)
  Prompt estructurado solicitando:
  - Qué datos existen para responder a esta pregunta
  - Qué datos faltan
  - Qué marcos normativos son relevantes
  - Por qué importa la brecha
        ↓
Pregunta anonimizada + resultados almacenados en Supabase
  (esto alimenta el Monitor Colectivo con el tiempo)
        ↓
Tarjeta de brecha renderizada en Gradio:
  - Puntuación de brecha general
  - Puntuaciones por agenda
  - Datasets coincidentes con indicadores de calidad
  - Marcos normativos relevantes
  - Síntesis narrativa
```

### 6.2 Flujo: Monitor Colectivo (Evidencia Colectiva)

```
Se ejecuta consulta de agregación contra la tabla de preguntas en Supabase
        ↓
Agrupar preguntas anonimizadas por:
  - Agenda temática detectada
  - Contexto de país/región
  - Período de tiempo (bloques semanales)
        ↓
Calcular:
  - Temas de preguntas más frecuentes
  - Regiones con mayor densidad de brechas
  - Áreas de agenda con brechas más críticas
  - Tendencia en el tiempo (conteo semanal de preguntas, puntuación promedio de brecha)
        ↓
Renderizar visualizaciones en Gradio:
  - Densidad de brechas por región
  - Radar/gráfico de barras de cobertura de agenda
  - Evolución semanal (datos reales, no EVOLUCION_MOCK)
```

### 6.3 Flujo: Ingesta de Datos (Panel de Backend)

```
Curador autenticado accede al panel de backend
  (protegido por JWT o Auth Básica HTTP   NO abierto a todos los usuarios)
        ↓
El curador carga información del dataset vía formulario o archivo
        ↓
El sistema valida los datos:
  - Campos obligatorios presentes
  - Formatos de fecha correctos
  - Clasificación geográfica válida
        ↓
`calcularCalidadAuto()` se ejecuta automáticamente:
  - Asigna clasificación de calidad (Completa / Parcial / Nula)
  - Genera texto de justificación de calidad
        ↓
Flujo de revisión cooperativa:
  1. Clasificación automática mostrada al revisor principal
  2. El revisor principal valida o ajusta
  3. Si hay disputa → escalamiento a nodo (3 revisores)
  4. Consenso unánime requerido para publicar
  5. Confirmación final
        ↓
Tras aprobación:
  - Registro del dataset almacenado en Supabase
  - Embedding generado para la descripción del dataset
  - Embedding almacenado en pgvector para futuras búsquedas de similitud
  - Registro de evento de auditoría
```

### 6.4 Flujo: Pipeline de Anonimización

```
Llega el texto original de la pregunta del usuario
        ↓
El modelo spaCy es_core_news_sm realiza NER (Reconocimiento de Entidades Nombradas)
        ↓
El analizador Presidio detecta entidades PII:
  - PERSON (nombres)
  - EMAIL_ADDRESS
  - PHONE_NUMBER
  - LOCATION (configurable   el contexto geográfico es útil, 
    pero las direcciones personales deben ser redactadas)
        ↓
El anonimizador Presidio reemplaza entidades detectadas con marcadores:
  "María García vive en Calle Reforma 123, CDMX"
  → "<PERSON> vive en <LOCATION>, <LOCATION>"
        ↓
Solo la versión anonimizada es:
  - Enviada al modelo de embedding
  - Enviada al LLM para análisis
  - Almacenada en la base de datos
  - Nunca se almacena: texto original con PII
```

### 6.5 Flujo: Generación de Embeddings para Datos Semilla

```
Archivo .xlsx existente con datasets y marcos normativos
        ↓
pandas lee y limpia los datos de Excel:
  - Valida columnas requeridas
  - Normaliza campos de texto
  - Maneja valores faltantes
        ↓
Para cada dataset y marco:
  - Concatenar campos de texto relevantes (nombre, descripción, fuente, tema)
  - Generar vector de embedding vía el modelo de embedding elegido
        ↓
Almacenar registros + embeddings en tablas de Supabase pgvector
        ↓
Construir índice IVFFlat en columnas de embedding para búsqueda rápida de similitud
```

---

## 7. Detalles de Evaluación de Tecnologías

### 7.1 Por qué FastAPI sobre otros frameworks

- **Django**: demasiado pesado para este caso de uso   Infra.Coop no necesita un ORM, panel de administración o motor de plantillas cuando usa Gradio para el frontend y Supabase para la base de datos.
- **Flask**: viable pero carece de soporte asíncrono nativo, lo cual es importante cuando la inferencia del LLM toma 15-30 segundos y no se desea bloquear otras solicitudes.
- **FastAPI**: asíncrono por defecto, genera documentación de API automáticamente (útil para el desarrollo colaborativo descrito en los requisitos), validación nativa de Pydantic para esquemas de solicitud/respuesta y se integra limpiamente con Gradio.

### 7.2 Por qué Gradio sobre Streamlit o Frontend Personalizado

- **HTML/CSS/JS Personalizado**: el diagnóstico identifica explícitamente el archivo HTML monolítico como un problema de mantenimiento. Reconstruirlo como un frontend personalizado requiere experiencia que el equipo podría no tener.
- **Streamlit**: bueno para dashboards, pero su modelo de interacción (re-ejecutar todo el script en cada interacción) es incómodo para el patrón de "hacer pregunta, esperar análisis".
- **Gradio**: diseñado para el patrón de interacción exacto que Infra.Coop necesita   campo de entrada, procesamiento, salida estructurada. Tiene soporte nativo para estados de carga, interfaces con pestañas (Motor de Brechas / Monitor Colectivo / ¿Qué datos queremos?) y carga de archivos para el panel de ingesta de datos.

### 7.3 Por qué Supabase sobre otras bases de datos

- **SQLite**: sin extensión de búsqueda vectorial, sin acceso remoto, datos perdidos si el disco de HF Space se reinicia.
- **Neon PostgreSQL**: excelente nivel gratuito pero carece de autenticación integrada, RLS y API REST   tendrías que construirlos tú mismo.
- **Pinecone/Weaviate/Chroma**: bases de datos solo vectoriales que requieren una base relacional separada para los metadatos, duplicando la infraestructura.
- **Supabase**: PostgreSQL + pgvector + auth integrado + RLS + API REST autogenerada en un solo servicio gratuito. El esquema SQL con triggers de auditoría se porta directamente. El documento de requisitos solicita tanto datos relacionales (datasets, marcos, métricas) como búsqueda vectorial   Supabase maneja ambos en un solo lugar.

### 7.4 Por qué Presidio sobre otras herramientas de anonimización

- **Regex simple**: pierde PII dependiente del contexto (ej. "Dra. López" es un nombre, "López Obrador" podría ser una referencia a una figura pública que debería mantenerse).
- **Faker/anonymizedf**: enmascaramiento a nivel de columna para datos tabulares   no funciona en preguntas de texto libre.
- **anjana**: anonimato-k/diversidad-l formal para datos tabulares   herramienta incorrecta para eliminación de PII en texto libre.
- **Presidio**: construida específicamente para detectar y eliminar PII de texto libre, soporta reconocedores de entidades personalizados, funciona con modelos spaCy NER incluyendo español y se ejecuta localmente sin dependencia de API.

### 7.5 Por qué llama-cpp-python sobre Ollama (Opción B)

- **Ollama**: se ejecuta como un proceso demonio de fondo. En un contenedor Docker, esto significa gestionar dos procesos (demonio Ollama + FastAPI), manejar la condición de carrera del arranque del demonio y comunicarse vía HTTP localhost. Añade ~500 MB de sobrecarga por el demonio en sí. La ventaja principal es una CLI conveniente, que es irrelevante dentro de un contenedor donde el modelo se integra en la imagen al construirla.
- **llama-cpp-python**: llamada directa a librería de Python. Sin demonio, sin comunicación entre procesos, sin condiciones de carrera. Provee un servidor de API compatible con OpenAI si es necesario. El modelo se carga en el proceso, dando más control sobre la gestión de memoria y asignación de hilos.

### 7.6 Por qué paraphrase-multilingual-MiniLM-L12-v2 sobre otros modelos (Opción B)

- **all-MiniLM-L6-v2**: el modelo más recomendado, pero es solo para inglés. Las preguntas de Infra.Coop serán en español. Usarlo produciría una calidad de búsqueda degradada.
- **bge-small-en-v1.5**: también solo para inglés.
- **paraphrase-multilingual-MiniLM-L12-v2**: entrenado en más de 50 idiomas incluyendo español, produce vectores de 384-dim, tamaño de ~480 MB, inferencia rápida en CPU. La capacidad multilingüe no es negociable.
- **Para la Opción A**: Los embeddings de Gemini tienen soporte multilingüe excelente nativo, por lo que esta elección solo importa para la Opción B.

### 7.7 Por qué Qwen2.5-3B sobre otros LLMs pequeños (Opción B)

- **TinyLlama (1.1B)**: cabe fácil en RAM pero produce texto analítico pobre en español. El análisis de brechas requiere razonamiento sobre completitud de datos y relevancia normativa   1.1B de parámetros son insuficientes.
- **Phi-3-mini (3.8B)**: fuerte en salidas estructuradas pero soporte multilingüe más débil que Qwen.
- **Gemma-3-4B**: modelo de Google, bueno en tareas de análisis, tamaño de archivo ligeramente mayor (~2.8 GB Q4). Alternativa viable.
- **Qwen2.5-3B**: mejor calidad de razonamiento en la escala 3B, fuerte capacidad multilingüe incluyendo español, ~2.2 GB en cuantización Q4_K_M, deja margen de RAM cómodo.
- **Mistral-7B**: produciría mejor análisis pero a ~4.4 GB Q4 e inferencia mucho más lenta (~2-5 tok/s en 2 núcleos).

### 7.8 Trade-off de Dimensiones de Embedding

| | 384 dimensiones (local) | 768 dimensiones (Gemini API) |
|---|---|---|
| Precisión semántica | Buena   captura el significado central | Excelente   distinciones más finas |
| Almacenamiento por vector | 1.5 KB | 3 KB |
| Velocidad de búsqueda | Más rápida (índice pequeño) | Ligeramente más lenta |
| Para el catálogo de Infra.Coop (cientos a miles de entradas) | Más que suficiente | Excesivo pero disponible gratis |

Dado el tamaño relativamente pequeño del catálogo de datos (el archivo semilla no tiene millones de registros), 384 dimensiones es más que adecuado para una búsqueda de similitud precisa.

---

## 8. Restricciones y Consideraciones de Infraestructura

### 8.1 Límites del Nivel Gratuito de HuggingFace Spaces

- 2 núcleos vCPU   este es el cuello de botella para la inferencia local de LLM.
- 16 GB RAM   cómodo para cualquier opción de arquitectura.
- 50 GB disco efímero   suficiente para archivos de modelos, pero los datos se pierden al reiniciar.
- Se suspende tras 48h de inactividad   se activa cuando alguien lo visita.
- Sin disco persistente en nivel gratuito   todos los datos persistentes deben vivir en Supabase.
- Se requiere Docker SDK para entornos personalizados.
- El puerto 7860 es el único expuesto externamente.

### 8.2 Límites del Nivel Gratuito de Supabase

- 500 MB almacenamiento de base de datos   suficiente para el catálogo, marcos y preguntas anonimizadas por meses.
- 2 GB de ancho de banda   adecuado para patrones de uso basados en API.
- 50,000 usuarios activos mensuales   muy por encima del uso esperado.
- Extensión pgvector disponible   habilita búsqueda de similitud vectorial.
- Pausa automática tras 1 semana de inactividad   se activa con la siguiente solicitud.

### 8.3 Consideraciones de Tamaño de Imagen Docker

La Opción A produce una imagen de ~1-2 GB. La Opción B produce una de ~8-10 GB porque los modelos GGUF, sentence-transformers y spaCy se incluyen al construirla. HuggingFace permite hasta 50 GB, así que ambas caben, pero la imagen mayor implica tiempos de construcción y arranques en frío más largos.

### 8.4 Concurrencia bajo Carga

El documento de requisitos menciona que el sistema debe soportar múltiples usuarios. Bajo la Opción A, esto no es problema (llamadas API no bloqueantes). Bajo la Opción B, el LLM es el cuello de botella: mientras se analiza una pregunta (~20 seg de inferencia), otras solicitudes deben esperar. Para una herramienta de investigación con uso ocasional, esto es aceptable. En talleres activos, la cola se hará notar a partir de 3+ usuarios simultáneos.

---

## 9. Resumen

La arquitectura recomendada es una **híbrida** que prioriza la inferencia local (Opción B) por alineación con la soberanía de datos, con la capacidad de cambiar a APIs gratuitas (Opción A) mediante una variable de entorno cuando se necesite velocidad. Los componentes compartidos  FastAPI, Gradio, Supabase, Presidio y el motor de puntuación— constituyen la mayor parte del sistema.

La idea fundamental es que el valor de Infra.Coop reside en su capacidad de búsqueda semántica (emparejar preguntas con datasets y marcos), no en la generación del LLM. Por tanto, el sistema funciona bien incluso con un modelo local modesto de 3B, ya que el trabajo pesado lo realiza la capa de búsqueda vectorial, que es rápida y precisa en ambas opciones.