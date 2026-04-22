# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Infra.Coop — Motor de Brechas v0.3** is a prototype dashboard for **Data Cooperativas Latinas** (Mozilla Fellowship 2024–2026). It analyzes gender data gaps in Latin America by comparing user questions against a corpus of datasets and legal frameworks.

The current version is a **fully static HTML prototype** — no backend, no API, no persistence. All data is mocked. The SQL schema and diagrams define the intended production architecture.

## Repo Structure

```
dashboard_v4/
├── index.html              ← The entire dashboard (HTML + CSS + JS, ~1,710 lines)
├── CLAUDE.md               ← This file
├── .gitignore
│
├── db/
│   ├── schema.sql          ← PostgreSQL 15+ schema (pgvector). Run this first.
│   └── metrics.sql         ← Audit triggers + daily snapshot function. Run second.
│
├── docs/
│   ├── DIAGNÓSTICO v4.md  ← Full technical audit: all issues, risks, untied ends
│   ├── metodologia.pdf     ← Methodology document
│   ├── nota-concepto.docx  ← Original concept note
│   └── diagrams/
│       ├── prototype-workflow.svg
│       ├── pipeline-pregunta-resultado.svg
│       └── pipeline-anonimizacion.svg
│
├── data/
│   └── datasets-normativas.xlsx  ← Seed data for datasets + frameworks tables
│
└── archive/
    ├── motor-brechas-v2.html     ← Previous version (reference only)
    └── tablero-20dias.html       ← Earlier tablero prototype (reference only)
```

## Architecture of index.html

Everything lives in one file. Three layers:

**CSS** (lines ~10–302): Design system via `:root` custom properties. All colors, fonts, and radii are defined there — never hardcode hex values.

**HTML** (lines ~303–798): Five panels toggled by `showPanel(id)`:
- `panel-about` — editable project description
- `panel-motor` — the gap engine (question input → search → results)
- `panel-mapa` — Monitor Colectivo (collective gap map by topic/agenda)
- `panel-capa3` — "¿Qué datos queremos?" (weekly evolution charts)
- `panel-backend` — internal curator forms (dataset + framework intake, cooperative review flow)

**JavaScript** (lines ~799–end): All logic. Key objects and functions:
- `DATOS_MOCK` — 5 hardcoded gap scenarios (keyword-matched by `matchQuery()`)
- `buscarBrecha()` — simulates a 2.6s async search, then calls `matchQuery()`
- `calcularCalidadAuto()` — real weighted quality classifier (S1 20% / S2 30% / S3 30% / S4 20%)
- `renderMapa()`, `renderCapa3()` — render monitor panels from mock data
- Cooperative review flow: `analizarDataset()` → `analizarPostFundamento()` → `escalarAlNodo()` → `votarRC()` → `verificarConsenso()` → `publicarRegistro()`

## Gap Score Formula
```
score = (1 - max_sim_dataset) * 0.6 + cobertura_norma * 0.4
```
- `0.0` = dato completamente cubierto · `1.0` = brecha crítica
- Categories: `critica` (purple `#534AB7`) · `parcial` (light purple `#7F77DD`) · `cubierta` (green `#1d6e4a`)

## Design System (CSS custom properties)
| Token | Value | Use |
|---|---|---|
| `--ink` | `#1a1916` | Primary text |
| `--accent` | `#534AB7` | Brand purple, interactive elements |
| `--gap-crit` | `#534AB7` | Critical gap color |
| `--gap-part` | `#7F77DD` | Partial gap color |
| `--gap-cov` | `#1d6e4a` | Covered gap color |
| `--serif` | DM Serif Display | Headings, large numbers |
| `--sans` | Instrument Sans | Body text |
| `--mono` | DM Mono | Labels, metadata, code |

## Three Agendas
- **Agenda Tecnológica** — `#0C447C` / `#E6F1FB`
- **Agenda de Datos** — `#3C3489` / `#EEEDFE`
- **Agenda de Género** — `#72243E` / `#FBEAF0`

## Five Thematic Topics (DB seed)
`salud-reproductiva` · `justicia-litigios` · `violencia-genero` · `tecnologias-datos` · `interseccionalidad`

## Database (planned — PostgreSQL 15 + pgvector)
Run `db/schema.sql` then `db/metrics.sql`. Core tables: `datasets`, `frameworks`, `topics`, `questions`, `gaps`, `gap_datasets`, `gap_frameworks`, `audit_eventos`, `metricas_snapshot`. Embeddings: `vector(768)` using `paraphrase-multilingual-mpnet-base-v2`.

## Known Issues (see docs/DIAGNÓSTICO v4.md for full list)
- All search results are mock/keyword-matched — not real semantic search
- Agenda scores in results use `Math.random()` — change every render
- Filters (Agenda, País, Calidad) are decorative — not wired to any function
- "Descargar PDF/JPG" opens a print dialog, does not produce a file
- Backend panel has no authentication — any user can access it
- All backend data lives in memory — lost on page refresh
- Everything is in Spanish — keep it that way
