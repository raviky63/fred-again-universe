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
| `events.json` | shows, sets and moments | diamonds |
| `meta.json` | site title, last update | – |

## Linking things together

Everything is connected through `id`s:

- a release's `with` and `tracks` lists point to artist and track ids
- a track's `releases` and `with` lists point to release and artist ids
- an event's `with` and `tracks` lists point to artist and track ids

Add an id to one of those lists and a new line appears on the map.

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
