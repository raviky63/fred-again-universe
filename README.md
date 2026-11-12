# The Fred again.. Universe

An unofficial, fan-made interactive map of Fred again..'s world: every release, track, collaborator and iconic moment, linked together as one web.

## How it works

- `index.html` – the page shell (layout and styling)
- `app.js` – reads the data and draws the web (D3.js)
- `data/` – **the database**. Edit these files to change the site; the code never needs to change for new content.

| File | What's in it | Shape on the map |
|---|---|---|
| `center.json` | Fred himself | big orange circle |
| `artists.json` | collaborators | circles |
| `releases.json` | albums, singles, features | square sleeves (with cover) |
| `tracks.json` | individual songs, linked to releases and artists | small squares |
| `events.json` | shows, DJ sets, radio mixes and moments (with tracklists where known) | diamonds |
| `crew.json` | the people behind the scenes: creative direction, photo, film, sound, lights | lavender circles |
| `merch.json` | merch drops and physical releases | lime hexagons |
| `meta.json` | site title, last update | – |

## Linking things together

Everything is connected through `id`s:

- a release's `with` and `tracks` lists point to artist and track ids
- a track's `releases` and `with` lists point to release and artist ids
- an event's `with` and `tracks` lists point to artist and track ids

Add an id to one of those lists and a new line appears on the map.

## Research

`research/` holds the raw notes from each source (Spotify, Wikipedia, 1001Tracklists, Instagram, SoundCloud, press). `tools/build_from_research.py` turns them into the `data/` files:

```
python tools/build_from_research.py
```

## Privacy & ethics (non-negotiable)

Community sources (Discord, Reddit, fan messages) are handled like this:

- **No personal data, ever.** Usernames, @mentions, user IDs, emails, phone numbers, personal social links, photos or videos of fans are stripped before anything is used. `tools/clean_export.py` does this automatically.
- **Raw exports never go into this repo** (`raw-exports/` is git-ignored). Only cleaned, anonymous text lands in `research/community/`.
- **Facts first.** From community sources we take dates, setlists, venues, releases and moments, and check them against a second source before they go on the site.
- **Personal stories** (who someone went with, what they went through) only go on the site when the person who wrote them says yes.
- Anyone can ask for something to be removed, and it gets removed.

## Rules for content

- Every item has a `source` and `verified` (`false` = shown with a dashed outline until checked).
- Images (`photo`, `cover`, `thumbnail`): only official images, licensed ones (e.g. Wikimedia Commons, with `photo_credit`) or our own.
- Video: links only (YouTube, Instagram, TikTok) in `media`. No fan footage from phone-free shows (USB002 tour).
- Dates as `YYYY-MM-DD` where known, otherwise `YYYY-MM` or `YYYY`.

## Running it locally

The page loads the JSON files, so open it through a small local server instead of double-clicking:

```
python -m http.server
```

then visit http://localhost:8000.

## Checklist before adding more data
`CHECKLIST.md` lists everything that still needs a human check (unverified items, fan-reported facts, missing dates or sources, open questions).
It is generated: run `python3 tools/verify_list.py` after every data change. Manual questions go in `research/open-questions.md`.

## Prototypes
The web (`index.html` + `web.js`) uses the chosen combo: open & close, names only where there is room, shows per tour, size by collabs, era colours, and a story mode. The old web is kept as `app-classic.js`.
`prototypes.html` lets you switch the readability ideas for the web on and off (open & close, names on zoom, shows per tour, size by collabs, story mode, era colours).

See [ROADMAP.md](ROADMAP.md) for the plan ahead.
