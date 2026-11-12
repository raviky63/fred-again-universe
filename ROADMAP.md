# Roadmap: The Fred again.. Universe

> Concept, versie 13 november 2026. Een levend document: schuif, schrap en voeg toe.
> Wat er concreet nog geverifieerd moet worden staat in [CHECKLIST.md](CHECKLIST.md). Deze roadmap gaat over de richting.

## Waar we nu staan

- **Web**: een connectie-web met hubs (♪ Singles & collabs, ♦ Live), uitklappen, highlight bij klikken, gestippelde "also"-lijnen, "Open everything".
- **Timeline**: horizontaal, per era, sleepbaar, met USB-momenten. Kaartjes klappen open boven of onder de lijn.
- **Story mode**: de brug tussen web en timeline, in drie lengtes (10, 30 en 69 stops).
- **Data**: releases, tracks, artiesten (56 met CC-foto), shows met vlag en voorprogramma, mixes en radio, milestones. Alles met bron.
- **Ethiek**: geen persoonsgegevens, scrub-pipeline, fan-feiten blijven "to verify" tot er een tweede onafhankelijke bron is.

## Spelregels die voor elke fase gelden

1. Niets de data in zonder bron. Fan-bron betekent "to verify" tot er een tweede bron is.
2. Geen usernames of persoonsgegevens. Verhalen alleen met opt-in, en ze gaan eruit op verzoek.
3. Ruwe exports worden nooit gepubliceerd.
4. Unofficial en non-commercial. Geen merch-links met affiliate, geen ads.
5. Elke datawijziging: `tools/verify_list.py` draaien, zodat CHECKLIST.md klopt.
6. Leesbaarheid gaat vóór hoeveelheid: liever minder op het scherm dan onleesbaar.

---

## Fase 1: Fundament en betrouwbaarheid
*Doel: de site breekt niet en de data is te vertrouwen.*

**Techniek**
- [x] Cache-busting (`?v=` op scripts, `no-cache` op data), zodat een update de site niet half-oud, half-nieuw maakt.
- [ ] `tools/validate.py` schrijven, met deze checks:
  - elk item heeft een bron
  - ids zijn uniek
  - elke verwijzing (`part_of`, `with`, `release`, `support`) bestaat
  - geen losse nodes
  - datums zijn geldig
  - elke foto heeft een credit en licentie
- [ ] Een `tools/bump_version.py` die het `?v=`-nummer bij elke deploy ophoogt, of hem in de validatie meenemen.
- [ ] Een simpele rooktest (Playwright): web en timeline laden zonder JS-errors, één kaart openen, story mode starten.

**Data**
- [ ] Checklist-items afwerken:
  - de 4 guest mixes
  - Rinse FM 2019
  - de voorprogramma's die alleen fans melden
  - op welke avond de USB naar een fan ging
  - LATIN MAFIA
  - de vroege singles
- [ ] De grenzen tussen de eras definitief vastleggen, met bron per grens.
- [ ] De Reddit-comments na 3 okt 2025 opnieuw downloaden, in maandblokken.
- [ ] Een tweede bron zoeken voor alle items die nu `unverified` zijn.

**Klaar als:** de validatie groen is, CHECKLIST.md korter is dan nu, en de timeline na een deploy direct werkt.

---

## Fase 2: Mobiel en polish
*Doel: fans openen dit vooral op hun telefoon, dus het moet daar goed voelen.*

- [ ] **Timeline mobiel:**
  - swipe in plaats van slepen
  - een open kaart wordt een bottom sheet in plaats van een kaart boven of onder de lijn
  - de era-balk scrollt horizontaal
- [ ] **Web mobiel:**
  - pinch-zoom
  - tap = selecteren, tweede tap = uitklappen
  - zijpaneel als bottom sheet
  - "Open everything" lichter op mobiel
- [ ] **Story mode mobiel:** de kaart onderin, swipen naar volgende en vorige.
- [ ] **Performance:**
  - labels en simulatie tunen bij veel nodes
  - lazy-load van foto's
  - de simulatie pauzeren als hij stilstaat
- [ ] **Fallbacks:** een nette placeholder als een cover, YouTube-thumbnail of vlag niet laadt.
- [ ] **Linkpreviews:** Open Graph-plaatje en -titel voor de site en per item (`#ten-days`).
- [ ] **Toegankelijkheid:**
  - alles bedienbaar met toetsenbord
  - focus-states
  - contrast checken
  - `prefers-reduced-motion` respecteren (minder animatie)
- [ ] Een **startscherm**: één zin over wat dit is, met knoppen "Bekijk het web", "Volg de tijdlijn" en "Vertel me het verhaal".

**Klaar als:** je het hele verhaal op je telefoon kunt volgen zonder te knijpen of te zoeken.

---

## Fase 3: Diepgang in de content
*Doel: van "mooie kaart" naar "hier leer je echt iets".*

- [ ] **Crewpagina:** de fotografen en de visual/live-crew achter de shows, met hun werk en credits. Alleen publiek werk, met toestemming of onder een licentie.
- [ ] **De mensen ín de nummers:** de stemmen en samples waar tracks omheen gebouwd zijn, als eigen soort connectie (bijvoorbeeld een stippellijn "voice in"). Strikt alleen met bron.
- [ ] **Remixes en edits** als aparte laag: wie remixte Fred, wie remixte Fred.
- [ ] **Tracklists van grote sets** (Boiler Room, MSG, Coliseum, USB002-shows): welke tracks hij speelde, gelinkt aan de tracks in het web.
- [ ] **Era-verhalen:** per era een korte intro met wat er speelde, wat er veranderde en de belangrijkste momenten.
- [ ] **Plaatsen:** een kaartweergave van alle shows (wereldkaart met stippen per stad, filter per jaar of tour).

**Klaar als:** elke grote release en show een verhaal, connecties en ten minste één link heeft.

---

## Fase 4: Nieuwe manieren om te verkennen
*Doel: de wow-factor, en spelen met de data (hier zit jouw Data Science-kant).*

- [ ] **"Hoe zijn X en Y verbonden?":** kies twee artiesten of tracks en het web laat het kortste pad zien.
- [ ] **Statistiekenpagina:**
  - meest samengewerkt
  - shows per land en per jaar
  - releases per era
  - gemiddelde tijd tussen releases
- [ ] **Netwerkanalyse:**
  - centraliteit (wie is de "brug" in Freds netwerk)
  - clusters (UK rap, house, ambient)
  - als visualisatie én als korte uitleg
- [ ] **Filters in het web:** per era, per soort samenwerking, per land.
- [ ] **Zoeken 2.0:** suggesties tijdens het typen, zoeken op stad of land ("alle shows in Nederland").
- [ ] **Story mode uitbreiden:** thematische verhalen zoals "De USB-saga", "Fred & Four Tet & Skrillex" en "De weg naar de stadions".
- [ ] **Geluid (optioneel, juridisch checken):** alleen officiële embeds (Spotify/YouTube) in het paneel, nooit zelf audio hosten.

**Klaar als:** iemand die de site voor het eerst ziet er een kwartier in blijft hangen.

---

## Fase 5: Community, met opt-in en zonder Discord-perms
*Doel: fans kunnen bijdragen zonder dat de privacyregels geschonden worden.*

- [ ] **Pagina "Over & privacy":** unofficial, non-commercial, hoe bronnen werken, hoe je iets laat verwijderen, contact.
- [ ] **Correctieformulier:** een GitHub issue-template of een simpel formulier, met de velden "wat klopt niet" en "bron".
- [ ] **Verhalen-opt-in:**
  - een apart formulier
  - expliciete toestemming
  - zelf kiezen: anoniem of met handle
  - op elk moment terug te trekken
- [ ] **Moderatieflow:** elk ingezonden feit gaat eerst naar CHECKLIST.md als "to verify", en pas met een tweede bron de data in.
- [ ] **Credits-pagina:** wie heeft wat bijgedragen (alleen met toestemming).
- [ ] **De mods opnieuw benaderen** met een werkende link en de vraag om feedback, niet om perms. Daarna eventueel een kanaal waar fans zelf hun verhaal posten en zelf het formulier invullen.

**Klaar als:** er een eerste correctie en een eerste verhaal via het formulier binnen zijn, en de flow werkt.

---

## Fase 6: Onderhoud en groei
*Doel: de site bijhouden kost weinig tijd.*

- [ ] **GitHub Action** bij elke push:
  - validatie
  - CHECKLIST opnieuw genereren
  - linkchecker
  - rooktest
- [ ] **Release-workflow:** een template plus een script om een nieuwe release, track of show in een paar minuten toe te voegen.
- [ ] **Changelog-pagina** ("wat is er nieuw in de Universe").
- [ ] **Data als open dataset** (de opgeschoonde JSON met bronnen, nooit de ruwe exports), met een licentie, zodat anderen erop kunnen bouwen.
- [ ] **Eigen domein** (optioneel), bijvoorbeeld een naam zonder "fred" erin om merkproblemen te vermijden.
- [ ] **Backup** van de onderzoeksmappen die bewust niet in git staan (research/community, raw-exports), lokaal of versleuteld.

---

## Ideeënbak (nog niet ingepland)

- Een vergelijk-modus: twee eras naast elkaar.
- "Waar was jij?": fans markeren anoniem op welke show ze waren, alleen als aantal per show en nooit per persoon.
- Een printbare poster van het hele web als export.
- Meertalig (NL/EN).
- Een donkere en een lichte modus.
- Een mini-quiz in story mode.

## Voorgestelde volgorde

| Wanneer | Wat |
|---|---|
| Volgende sessie | Fase 1: validate.py, rooktest, 3 à 4 checklist-items |
| Daarna | Fase 2: eerst timeline en story mode mobiel, daarna het web |
| Daarna | Fase 3: crewpagina en tracklists van grote sets |
| Als het af voelt | Fase 5: privacy-pagina en formulieren, daarna de mods opnieuw benaderen |
| Doorlopend | Fase 4 en 6 tussendoor, als er zin of tijd is |
