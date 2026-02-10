

# Integratie DUO Schooldata en Onderwijsregio's

## Wat gaan we bouwen?

Een nieuwe pagina **"Scholen"** (of uitbreiding van bestaande pagina's) die live schooldata toont uit de openbare DUO CKAN API, gefilterd op de regio Rotterdam. Gebruikers kunnen scholen zoeken, filteren op sector (PO/VO/MBO) en zien welke scholen zijn aangesloten bij de onderwijsregio.

## Databronnen

| Bron | Gebruik | Toegang |
|------|---------|---------|
| DUO CKAN API (PO/VO/MBO) | Adressen en vestigingen van scholen | Openbaar, geen API-key nodig |
| Onderwijsregio lijsten (PDF) | "Aangesloten" badge bij scholen | Eenmalig scrapen of handmatig importeren |
| Onderwijsregio pagina's | Link naar regionale info | Statische links |

## Aanpak

### Stap 1: Edge function voor DUO data ophalen

Een backend function die de DUO CKAN API bevraagt en de resultaten cachet in de database.

- Bevraagt 3 endpoints (PO, VO, MBO vestigingen) gefilterd op `gemeente=Rotterdam`
- Cachet resultaten in een nieuwe `duo_schools` tabel (vergelijkbaar met hoe `scraped_events` nu werkt)
- Cache verloopt na 7 dagen (data wijzigt niet vaak)

**DUO API endpoints die worden gebruikt:**
- PO: `resource_id=dcc9c9a5-6d01-410b-967f-810557588ba4`
- VO: `resource_id=5187f8d5-ff9c-4284-8e06-4311f0354956`
- MBO: `resource_id=1a946297-a7ca-48d5-9ae8-19ad73bf8176`

### Stap 2: Database tabel voor cache

Nieuwe tabel `duo_schools` met kolommen:
- `id` (uuid)
- `sector` (text: PO/VO/MBO)
- `schools_data` (jsonb -- array van schoolrecords)
- `scraped_at`, `expires_at`, `created_at`, `updated_at`

RLS: iedereen mag lezen (openbare data), alleen service_role mag schrijven.

### Stap 3: Aangesloten vestigingen

De PDF's van onderwijsregio.nl bevatten lijsten van aangesloten scholen. Twee opties:

- **Optie A (aanbevolen):** Firecrawl gebruiken om de PDF-pagina's te scrapen en de lijsten te extraheren via de edge function
- **Optie B:** Handmatig een JSON-bestand maken met BRIN-codes van aangesloten scholen

We gaan voor optie A: een aparte edge function die via Firecrawl de lijsten ophaalt en matcht met DUO data.

### Stap 4: Frontend -- nieuwe "Scholen" pagina

Route: `/scholen`

Bevat:
- PageHero header (bestaand patroon)
- Filter-balk: sector (PO/VO/MBO), toggle "Alleen aangesloten"
- Zoekbalk op schoolnaam
- Grid/lijst met schoolkaarten die tonen:
  - Schoolnaam
  - Adres
  - Sector-badge
  - "Aangesloten" badge indien van toepassing
  - Link naar website (indien beschikbaar)
- Externe links sectie naar onderwijsregio Rotterdam pagina's

### Stap 5: React Query hook

`useSchools()` hook die:
1. Eerst kijkt naar gecachte data in `duo_schools`
2. Zo niet, de edge function triggert
3. Data retourneert met sector-filters

---

## Technische details

### Edge function: `fetch-duo-schools/index.ts`

```text
Client -> Edge Function -> DUO CKAN API (3 calls)
                        -> Opslaan in duo_schools tabel
                        -> Return data
```

De DUO API is openbaar en gratis, geen API-key nodig. We gebruiken de `datastore_search` endpoint met filter op gemeente Rotterdam en een hoog limit (500+).

### Edge function: `fetch-affiliated-schools/index.ts`

Gebruikt Firecrawl (al geconfigureerd) om de onderwijsregio pagina's te scrapen en een lijst van aangesloten scholen/BRIN-codes te extraheren.

### Database migratie

```sql
CREATE TABLE public.duo_schools (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sector text NOT NULL,
  schools_data jsonb NOT NULL DEFAULT '[]',
  scraped_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE duo_schools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view duo schools"
  ON duo_schools FOR SELECT USING (true);
```

### Navigatie

De Header component wordt uitgebreid met een link naar `/scholen`.

## Wat dit oplevert

- Live schooldata uit officiele DUO bronnen, automatisch bijgewerkt
- Duidelijk overzicht welke scholen aangesloten zijn bij de onderwijsregio Rotterdam
- Herkenbare UI die past bij de rest van de applicatie (zelfde patronen als Vacatures en Events pagina's)
- Data beschikbaar voor DOORai chatbot om gebruikers te helpen bij het vinden van scholen

