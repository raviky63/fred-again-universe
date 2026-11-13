"""Build the full review list (everything worth checking by hand) as rows, for the review sheet."""
import json, re, sys
L = lambda f: json.load(open(f'data/{f}.json'))
R, T, E, A, M, MS, ER = L('releases'), L('tracks'), L('events'), L('artists'), L('merch'), L('milestones'), L('eras')
rows = []
def add(p, cat, item, what, src, where):
    rows.append([p, cat, item, what, src or "", where])
fan = lambda s: bool(re.search(r'r/fredagain|reddit|fan report|Discord', s or "", re.I))
# open questions
for line in open('research/open-questions.md'):
    m = re.match(r'- \[ \] (.*)', line.strip())
    if m: add("1 hoog", "Open vraag", m.group(1)[:90], m.group(1), "", "zie research/open-questions.md")
for r in R:
    if r.get('verified') is False or 'check' in (r.get('story') or '').lower():
        add("1 hoog", "Release", f"{r['title']} ({r.get('date','')})", "Verhaal en datum kloppen? Story bevat een 'nog checken'-notitie", r.get('source'), "Wikipedia, Spotify, persbericht")
for e in E:
    t = f"{e['title']} ({e.get('date','')})"
    if e.get('verified') is False:
        add("1 hoog", "Show/mix (unverified)", t, "Bestaat dit echt / is het Freds eigen mix? Tweede bron zoeken", e.get('source'), "Radiozender-site, SoundCloud/YouTube upload, socials")
    if e.get('support') and fan(e.get('support_source')):
        add("1 hoog", "Voorprogramma (fan)", t, f"Voorprogramma: {', '.join(e['support'])}. Tweede onafhankelijke bron", e.get('support_source'), "Venue-site, poster, Instagram van de opener, setlist.fm")
for a in A:
    if a.get('verified') is False:
        add("1 hoog", "Artiest", a['name'], "Klopt de samenwerking met Fred?", a.get('source'), "Credits op Spotify/Apple Music, Discogs")
for x in R + T + E:
    if x.get('date') and len(x['date']) < 10:
        add("2 middel", "Datum incompleet", f"{x['title']} ({x['date']})", "Exacte releasedatum (dag/maand) vinden", x.get('source'), "Spotify, Discogs, SoundCloud uploaddatum, Wikipedia")
for r in R:
    if not r.get('cover'):
        add("2 middel", "Cover ontbreekt", r['title'], "Officiële cover vinden (Spotify oEmbed)", r.get('source'), "Spotify")
for t in T:
    if 'usb-release-dates' in (t.get('source') or ''):
        add("2 middel", "USB-datum", f"{t['title']} ({t['date']})", "Datum dat de track echt uitkwam (niet Spotify's 2022)", t.get('source'), "research/usb-release-dates.md, Freds Instagram, pers")
for e in E:
    if e.get('kind') == 'mix': continue
    t = f"{e['title']} ({e.get('date','')})"
    if not e.get('setting'):
        add("2 middel", "Festival of eigen show?", t, "Was dit een festival of een eigen show?", e.get('source'), "setlist.fm, festival-line-up")
    if not e.get('country'):
        add("2 middel", "Land ontbreekt", t, "Land toevoegen (of 'online')", e.get('source'), "")
for e in E:
    if (e.get('source') or '').startswith('1001Tracklists') and e.get('verified') is not False:
        add("3 laag", "Alleen 1001Tracklists", f"{e['title']} ({e.get('date','')})", "Datum + plaats bevestigen met een tweede bron", e.get('source'), "setlist.fm, venue/festival-site, socials, YouTube")
for m in MS:
    add("2 middel", "USB-moment", f"{m['title']} ({m['date']})", "Datum en tekst kloppen?", m.get('source'), "Bron in de tekst")
for er in ER:
    add("2 middel", "Era-grens", f"{er['name']} (start {er['start']})", "Begint deze era op de goede datum / klopt de omschrijving?", er.get('note','')[:80], "Releasedata, community")
for m in M:
    add("3 laag", "Merch", m['title'], "Datum, plaatje en recht om het plaatje te gebruiken", m.get('source'), "Officiële store, socials")
rels = {}
for t in T:
    if (t.get('source') or '').startswith('Spotify album'):
        rels.setdefault((t.get('releases') or ['?'])[0], []).append(t)
for rid, ts in rels.items():
    rt = next((r['title'] for r in R if r['id'] == rid), rid)
    add("3 laag", "Tracklist + features", f"{rt} ({len(ts)} tracks)", "Alle tracks aanwezig? Featuring-artiesten (with) kloppen?", "Spotify album tracklist", "Spotify, Apple Music credits")
add("3 laag", "Steekproef", "Festival vs eigen show (248 shows)", "Pak 20 willekeurige shows en check of 'festival' klopt", "tools/show_type.py (gegokt uit naam)", "setlist.fm")
add("3 laag", "Steekproef", "Vlaggen per show", "Pak 20 shows en check het land; let op online/multi-land items", "tools/countries.py (gegokt uit plaatsnaam)", "")
add("3 laag", "Foto's", f"{sum(1 for a in A if a.get('photo'))} artiestfoto's", "Licentie + credit kloppen (alleen CC/CC0), juiste persoon op de foto", "Wikimedia Commons", "research/artist-photos.md")
add("3 laag", "Foto's", f"{sum(1 for a in A if not a.get('photo'))} artiesten zonder foto", "Vrije foto (CC) zoeken of initialen houden", "", "Wikimedia Commons")
json.dump(rows, sys.stdout, ensure_ascii=False)
