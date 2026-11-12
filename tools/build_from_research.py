"""Merge the research notes (research/*.md) into the site database (data/*.json).

Run from the repo root:  python tools/build_from_research.py
It keeps hand-written stories/links already in data/ and adds what the research found.
"""
import json, re, unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
D = ROOT / "data"
R = ROOT / "research"
load = lambda n: json.loads((D / f"{n}.json").read_text())
save = lambda n, o: (D / f"{n}.json").write_text(json.dumps(o, indent=2, ensure_ascii=False) + "\n")

def slug(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    s = s.lower().replace("&", " and ")
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")

ALIAS = {"ca7riel-and-paco-amoroso": "ca7riel-paco", "ca7riel": "ca7riel-paco", "paco-amoroso": "ca7riel-paco", "amyl-and-the-sniffers": "amyl-and-the-sniffers",
         "i-jordan": "india-jordan", "bia": "bia", "fred-again": "fred-again"}
def aid(name):
    s = slug(name)
    return ALIAS.get(s, s)

center = load("center")
artists = {a["id"]: a for a in load("artists") if ALIAS.get(a["id"], a["id"]) == a["id"]}
old_releases = {r["id"]: r for r in load("releases")}
old_tracks = {t["id"]: t for t in load("tracks")}
old_events = {e["id"]: e for e in load("events")}

def ensure_artist(name, bio="", source="Spotify credits"):
    i = aid(name)
    if i == "fred-again" or not i:
        return None
    if i not in artists:
        artists[i] = {"id": i, "name": name.strip(), "bio": bio, "photo": "", "photo_credit": "",
                      "source": source, "verified": True}
    return i

# ---------------------------------------------------------------- releases
SP = "https://open.spotify.com/album/"
COV = "https://i.scdn.co/image/ab67616d00001e02"
releases = {}
def rel(id, title, kind, date, spotify="", cover="", story="", source="Wikipedia discography / Spotify", with_=(), verified=True):
    old = old_releases.get(id, {})
    releases[id] = {"id": id, "title": title, "kind": kind, "date": date, "with": list(with_),
                    "cover": old.get("cover") or (COV + cover if cover else ""),
                    "story": old.get("story") or story,
                    "links": {"spotify": SP + spotify if spotify else old.get("links", {}).get("spotify", ""), "youtube": ""},
                    "source": source, "verified": verified, "tracks": []}

rel("actual-life", "Actual Life (April 14 – December 17 2020)", "album", "2021-04-16", "6o86bV7TAt5x4exc2qLDqC", "723d4df900fd02eff83579d9")
rel("actual-life-2", "Actual Life 2 (February 2 – October 15 2021)", "album", "2021-11-19", "0SFtIrRytNI4kcf93Tbhdf", "c506dbc3f05d3ce4daf355c4")
rel("actual-life-3", "Actual Life 3 (January 1 – September 9 2022)", "album", "2022-10-28", "5q2iMctlDvEMYVIawF6Vop", "7f8859341a395010424f106b")
rel("ten-days", "ten days", "album", "2024-09-06", "3DQueEd1Ft9PHWgovDzPKh", "9574df129a4a2f4fa4990286")
rel("secret-life", "Secret Life", "album", "2023-05-05", "1FJVbtVFLARPKbn1HepNh1", "a9b0cf4827dd4bc73f2f0699", with_=["brian-eno"])
rel("usb", "USB / USB001 / USB002", "album", "2022-01-18", "2ClZ9xWAYg1BH8zkR96dJo", "4018b70099d433d9c8aabb12",
    story="His ongoing compilation: started as an EP in January 2022, collected as USB001 (June 2024) and USB002 (December 2025). During the phone-free USB002 tour every stop came with a new track, often with guests who also played.")
rel("skepta-fred", "Skepta .. Fred", "ep", "2025-08-29", "7x9gF8DtACwxkejv2xBndT", "096a7117356251107f00c8d8", with_=["skepta"],
    story="Joint EP with Skepta on Epic. Victory Lap sits on it too.")
rel("nine-months", "9 Months & 50 Hours", "mixtape", "2026-07-31", "4HZ3fF1dwSZLwztlLwoDYA", "2fe1ee03a5bed6b4a2e73296", with_=["latin-mafia"],
    story="Mixtape with the Mexican family band LATIN MAFIA, worked on over many months. A few hours after finishing it they played it to a full Palacio de los Deportes in Mexico City.")
rel("two-more-days", "two more days", "ep", "2024-12-13", "0tMLTrwCaJcqioPLMwxZBc", "2ba0b2f14c22b038bdb94c31",
    story="Two extra songs added to ten days.")
rel("gang", "GANG (with Headie One)", "mixtape", "2020-04-03", with_=["headie-one"],
    story="Mixtape with London drill rapper Headie One on Relentless, UK #49. Includes Charades, Gang and Don't Judge Me (with FKA twigs).")
rel("actual-life-ep", "Actual Life (EP)", "ep", "2020-05-15", story="The first Actual Life EP on his own Again.. Records.")
rel("sexy-magic", "Sexy Magic (from Grand Theft Auto VI: The Album)", "feature", "2026", "0CkBYPmr1j7EEWSQMHDBLg", "428173abda5ff463c0a8c27d",
    with_=["ca7riel-paco", "pinkpantheress", "etienne-de-crecy"], story="Ca7riel & Paco Amoroso single with PinkPantheress, Fred and Étienne de Crécy, on the GTA VI soundtrack.")
ensure_artist("Étienne de Crécy", "French house producer, on Sexy Magic.")
ensure_artist("PinkPantheress", "UK singer-producer.")
ensure_artist("Headie One", "London drill rapper. Made the GANG mixtape with Fred.")

# non-album singles (Wikipedia singles table)
for id, title, date, with_ in [
    ("julie-stay", "Julie (Stay)", "2019", []), ("jessie", "Jessie (I Miss You)", "2020", []),
    ("dont-judge-me", "Don't Judge Me", "2021", ["FKA twigs", "Headie One"]),
    ("stay-high-again", "Stay High Again..", "2021", ["Brittany Howard", "Joy Anonymous"]),
    ("diana", "Diana (You Don't Even Know)", "2021", ["Jayda G"]),
    ("baxter", "Baxter (These Are My Friends)", "2021", ["Baxter Dury"]),
    ("strong", "Strong", "2022", ["Romy"]),
    ("mike-desert-island-duvet", "Mike (Desert Island Duvet)", "2023-03", ["The Streets", "Dermot Kennedy"]),
    ("air-maxes", "Air Maxes", "2025", ["KETTAMA", "Shady Nasty"]),
    ("kyren", "Kyren (My Son)", "2020-05", []), ("eazi", "Eazi (DoItNow)", "2019-10", ["Mr Eazi"]),
    ("octavian", "Octavian (MyOwnWorld)", "2019-09", ["Octavian"]),
]:
    ws = [ensure_artist(w) for w in with_]
    story = {"diana": "Released on Jayda G's DJ-Kicks.", "mike-desert-island-duvet": "On Fabric Presents The Streets, with Mike Skinner.",
             "air-maxes": "On Kettama's album Archangel.", "strong": "On Romy's album Mid Air. Grammy-nominated.",
             "eazi": "Early SoundCloud upload (2019).", "octavian": "Early SoundCloud upload (2019).",
             "kyren": "SoundCloud upload (2020)."}.get(id, "")
    rel(id, title, "single", date, story=story, with_=[w for w in ws if w])
    releases[id]["cover"] = old_releases.get(id, {}).get("cover", "")

# ---------------------------------------------------------------- tracks
tracks = {}
def add_track(title, artist_names, release_id, date):
    clean = re.sub(r"\s*\[feat\..*?\]", "", title).strip()
    tid = slug(clean)
    if tid in releases:  # avoid id clash with a release
        tid += "-track"
    ws = [ensure_artist(n) for n in artist_names]
    ws = [w for w in ws if w]
    if tid in tracks:
        t = tracks[tid]
        if release_id not in t["releases"]: t["releases"].append(release_id)
        for w in ws:
            if w not in t["with"]: t["with"].append(w)
    else:
        tracks[tid] = {"id": tid, "title": clean, "releases": [release_id], "date": date, "with": ws,
                       "cover": "", "links": {"spotify": "", "youtube": ""}, "source": "Spotify album tracklist", "verified": True}
    if tid not in releases[release_id]["tracks"]:
        releases[release_id]["tracks"].append(tid)
    return tid

HDR = {"ten days": "ten-days", "Actual Life 3": "actual-life-3", "Actual Life (April": "actual-life", "Actual Life 2": "actual-life-2",
       "USB": "usb", "Secret Life": "secret-life", "Skepta .. Fred": "skepta-fred", "9 Months": "nine-months", "Two More Days": "two-more-days"}
cur = None
for line in (R / "spotify-tracklists.md").read_text().splitlines():
    if line.startswith("## "):
        cur = next((v for k, v in HDR.items() if line[3:].startswith(k)), None)
        continue
    if not cur or " — " not in line or line.startswith("("):
        continue
    left, right = line.split(" — ", 1)
    names = [n.strip() for n in re.sub(r"\(.*?\)", "", right).split(",") if n.strip() and n.strip() != "all Fred again.., Brian Eno"]
    if right.startswith("all "):
        names = ["Brian Eno"]
    for t in [x.strip() for x in left.split(" / ")]:
        if t:
            add_track(t, names, cur, releases[cur]["date"])

# singles with their own cover/links (from the first version of the data)
SINGLE_COVERS = {"rumble": None, "victory-lap": "victory-lap", "adore-u": "adore-u", "leavemealone": "leavemealone",
                 "places-to-be": "places-to-be", "talk-of-the-town": "talk-of-the-town", "turn-on-the-lights-again-feat-future": "turn-on-the-lights",
                 "marea-we-ve-lost-dancing": "marea", "ten": "ten", "lights-burn-dimmer": "lights-burn-dimmer", "delilah-pull-me-out-of-this": "delilah", "jungle": "jungle"}
for tid, oid in SINGLE_COVERS.items():
    o = old_releases.get(oid or "", {})
    if tid in tracks and o:
        tracks[tid]["cover"] = o.get("cover", "")
        tracks[tid]["links"]["spotify"] = o.get("links", {}).get("spotify", "")
        tracks[tid]["story"] = o.get("story", "")
        tracks[tid]["date"] = o.get("date") or tracks[tid]["date"]
EXTRA = {"jungle": ("2022-06-29", "https://i.scdn.co/image/ab67616d00001e0235bae471c1b8b904cd293052", "3iDLGLmecmdkmdxYmuol5d"),
         "baby-again": ("2023-03-17", "https://i.scdn.co/image/ab67616d00001e02479a2e72d1ae8abaf4178bb5", "7J7redEXgOUEsUBXukhkUF"),
         "stayinit": ("2024-02-28", "https://i.scdn.co/image/ab67616d00001e02591a9aec98af75664276eecf", "0DeGmYq33W6Svw1eTgnxDF"),
         "i-luv-u": ("2025-12-12", "https://i.scdn.co/image/ab67616d00001e0211e3c1daf378abe0b819de9d", "5TMeo9RZrBOvQXDXt8EFsm"),
         "winny": ("2025-11-21", "https://i.scdn.co/image/ab67616d00001e02b33612692e5bfd24060e634b", "63ITryjqkiwjmk3GABslAj"),
         "solo": ("2025-12-05", "https://i.scdn.co/image/ab67616d00001e02a558e977ecdbbe6e5a447795", "1FdXEZw2E4Z7HBsmhkV5E7"),
         "ok-ok": ("2025-10", "https://i.scdn.co/image/ab67616d00001e02dbd77ed6012bfa6573c72276", "0d9SgHDCP04wphWMeEMArX"),
         "feisty": ("2025-11-28", "https://i.scdn.co/image/ab67616d00001e0230963ea5204f1a9e17899430", "4XZZAJujVu3Li8LiiNB6vk"),
         "beto-s-horns-fred-remix": ("2025-11-07", "https://i.scdn.co/image/ab67616d00001e027cad32f23c5af8d22f184fab", "4CC0Q6wTtZ15OWHtNTGvnU"),
         "light-dark-light": ("2024-12-13", "https://i.scdn.co/image/ab67616d00001e028017c1a5e9b88af1ef620047", "1IEciM4FXTPO7mdfKuOCIB"),
         "little-mystery": ("2024-12-13", "https://i.scdn.co/image/ab67616d00001e028f1b9d4ecf5b3f01b0b41fa3", "7qKbSNVGjmSyprfPLGMG33")}
for tid, (d, c, s) in EXTRA.items():
    if tid in tracks:
        tracks[tid].update(date=d, cover=c); tracks[tid]["links"]["spotify"] = SP + s
DATES = {"rumble": "2023-01-04", "victory-lap": "2025-06-17", "leavemealone": "2023-12-08", "places-to-be": "2024-05-31",
         "you-re-a-star": "2025-10-03", "hardstyle-2": "2025-10-31", "talk-of-the-town": "2025-10-31", "facilita": "2025-10-24",
         "ambery": "2025-10-24", "icey": "2025-11-28", "scared": "2026-01-23", "lights-burn-dimmer": "2026-02-13",
         "back-2-back": "2025-08", "london": "2025-08", "last-1s-left": "2025-08", "21-years": "2025-08", "adore-u": "2023",
         "ten": "2023-10-13", "lights-out": "2022", "admit-it-u-dont-want-2": "2022-02-10", "turn-on-the-lights-again-feat-future": "2022-07-29",
         "berwyngesaffneighbours": "2024", "te-estoy-correteando": "2026"}
for k, v in DATES.items():
    if k in tracks: tracks[k]["date"] = v
STORIES = {
    "hannah-the-sun": "Its video was made from clips fans sent in from 96 countries.",
    "marea-we-ve-lost-dancing": "A lockdown song about missing the dance floor. It later appeared in the Palme d'Or winner Triangle of Sadness.",
    "turn-on-the-lights-again-feat-future": "Released the same week as his Boiler Room set; built on Future's 2012 song.",
    "rumble": "Won the Grammy for Best Dance/Electronic Recording.",
    "victory-lap": "Grew out of a streamed studio session with PlaqueBoyMax. Followed by remixes adding Denzel Curry, Hanumankind, That Mexican OT, D Double E and LYNY.",
    "cmon-latin-mafia-and-fred-edit": "A LATIN MAFIA edit of 'Cmon' from Secret Life, so Brian Eno shows up on a 2026 mixtape too.",
    "angie-i-ve-been-lost": "Angie McMahon, who sings here in 2020, came back for light dark light in 2024.",
}
for k, v in STORIES.items():
    if k in tracks: tracks[k]["story"] = v
VICTORY_REMIX = ["Denzel Curry", "Hanumankind", "That Mexican OT", "D Double E", "LYNY"]
if "victory-lap" in tracks:
    for n in VICTORY_REMIX:
        i = ensure_artist(n, "On a Victory Lap remix.")
        if i not in tracks["victory-lap"]["with"]: tracks["victory-lap"]["with"].append(i)

# ---------------------------------------------------------------- events
events = {}
def ev(id, title, date, location, with_=(), story="", source="", kind="show", tracks_=(), verified=True, **extra):
    o = old_events.get(id, {})
    e = {"id": id, "title": title, "date": date, "location": location, "kind": kind,
         "with": [w for w in with_ if w], "tracks": [t for t in tracks_ if t in tracks],
         "thumbnail": o.get("thumbnail", ""), "story": o.get("story") or story, "media": o.get("media", []),
         "source": source or o.get("source", ""), "verified": verified}
    e.update(extra)
    events[id] = e

# curated events from the first version keep their ids and stories
for o in old_events.values():
    if o["id"].startswith("usb002-"):
        continue  # rebuilt below
    ev(o["id"], o["title"], o["date"], o["location"], o.get("with", []), o.get("story", ""), o.get("source", ""), verified=o.get("verified", True))

BR = [l.split(". ", 1)[1] for l in (R / "set-tracklists.md").read_text().split("## Fred again.. b2b")[0].splitlines() if re.match(r"^\d+\. ", l)]
events["boiler-room-2022"].update(date="2022-07-29", tracklist=BR)
events["bangalter-2026"].update(date="2026-02-27", location="Alexandra Palace, London",
    title="b2b with Thomas Bangalter, USB002 finale",
    story="The last night of the USB002 run at Alexandra Palace. Daft Punk's Thomas Bangalter was revealed as the surprise guest only hours before doors: his first DJ set in the UK in almost 19 years. They opened and closed with One More Time.",
    source="Mixmag (full tracklist); Electronic Groove", tracklist_link="https://mixmag.net/feature/this-is-the-full-tracklist-from-fred-again-and-thomas-bangalters-b2b-at-alexandra-palace")
events["lowlands-2024"]["verified"] = False

USB = [("2025-10-03", "Glasgow", "Scottish Events Campus", ["you-re-a-star"]), ("2025-10-10", "Brussels", "Gare Maritime", ["ok-ok"]),
       ("2025-10-17", "Madrid", "IFEMA Madrid", ["the-floor-fred-remix"]), ("2025-10-24", "Lyon", "Halle Tony Garnier", ["facilita", "ambery"]),
       ("2025-10-31", "Dublin", "The Button Factory & RDS Simmonscourt", ["hardstyle-2", "talk-of-the-town"]),
       ("2025-11-14", "Toronto", "YZD Hangar 5", []), ("2025-11-21", "Chicago", "Navy Pier", ["winny"]),
       ("2025-11-28", "Vancouver", "Vancouver Convention Centre", ["icey", "feisty"]), ("2025-12-05", "San Francisco", "Cow Palace", ["solo"]),
       ("2025-12-12", "Mexico City", "Expo Santa Fe", ["i-luv-u"])]
GUESTS = {"Lyon": ["caribou", "floating-points"], "Toronto": ["four-tet"], "Chicago": ["sammy-virji"], "Vancouver": ["skream", "benga"],
          "San Francisco": ["oppidan", "hamdi"], "Glasgow": ["amyl-and-the-sniffers"]}
for n in ["Skream", "Benga", "Oppidan", "Hamdi"]:
    ensure_artist(n, "Played with Fred during the USB002 tour.", "1001Tracklists")
for i, (d, city, venue, tr) in enumerate(USB, 1):
    ev(f"usb002-{slug(city)}", f"USB002 #{i}: {city}", d, f"{venue}, {city}", GUESTS.get(city, []),
       "Phone-free show. Each week of the tour came with new music." + ("" if tr else " No new track this week."),
       "Wikipedia (USB002 Tour); 1001Tracklists", tracks_=tr, tour="USB002")
ev("usb002-nyc-residency", "USB002 residency: New York", "2026-01", "East End Studios, Woodside, New York", ["caribou", ensure_artist("Brux", "Played the USB002 New York residency.", "1001Tracklists")],
   "Six USB shows in New York in January 2026.", "Instagram (2026-02-09); 1001Tracklists; Milk Studios", tour="USB002")
ev("usb002-london-residency", "USB002 residency: Alexandra Palace", "2026-02", "Alexandra Palace, London",
   [ensure_artist("Ezra Collective", "London jazz group; played the USB002 London residency.", "1001Tracklists"), "joy-anonymous", "berwyn"],
   "Four nights at Ally Pally that closed the whole USB002 run. The final night was the b2b with Thomas Bangalter.", "Instagram (2025-12-13); Electronic Groove; 1001Tracklists", tour="USB002")
ev("india-2026", "First India shows", "2026-12-05", "Delhi, Mumbai & Bengaluru", [],
   "His first shows in India: Delhi (5 Dec), Mumbai (8–9 Dec) and Bengaluru (12–13 Dec 2026). Upcoming.", "fredagain.com tour dates; Instagram (2026-06-23)", kind="upcoming")
ev("palacio-2026", "LATIN MAFIA mixtape premiere, Palacio de los Deportes", "2026-07-30", "Palacio de los Deportes, Mexico City", ["latin-mafia"],
   "Played the brand-new 9 Months & 50 Hours mixtape live with LATIN MAFIA a few hours after finishing it.", "Instagram; 1001Tracklists", tracks_=["te-estoy-correteando", "alvafro", "quiereme"])
ev("la-coliseum-2024", "LA Memorial Coliseum: first stadium show", "2024-06-14", "Los Angeles", [],
   "His first-ever stadium show. Sound engineer Jamie Tinsley said the trick was finding a stadium without a roof.", "Rolling Stone; 1001Tracklists; Instagram")
ev("asia-2025", "First shows in Asia (Fuji Rock & Tokyo)", "2025-07-25", "Japan & South Korea", [],
   "Fuji Rock (25 Jul), Tachikawa Stage Garden Tokyo (29 Jul) and KINTEX Seoul (23 Jul). Shot on film by Theo Batterham and Charlie Hutchins.", "1001Tracklists; Instagram (2025-07-25)")

# exact dates for the curated moments (so the 1001Tracklists list doesn't duplicate them)
for k, d in {"coachella-2023": "2023-04-23", "msg-2023": "2023-02-18", "tiny-desk-2023": "2023-04-10", "glastonbury-2023": "2023-06-23",
             "reading-2024": "2024-08-24", "lowlands-2024": "2024-08-17", "shm-b2b-2022": "2022-08-04"}.items():
    if k in events: events[k]["date"] = d
if "shm-b2b-2022" in events: events["shm-b2b-2022"]["location"] = "H0L0, New York"

# all other DJ sets / shows from 1001Tracklists
taken = {e["date"] for e in events.values()} | {"2025-11-01", "2025-11-15", "2026-01-23", "2026-01-24", "2026-02-12", "2026-02-13"}
for line in (R / "dj-sets-1001tracklists.md").read_text().splitlines():
    m = re.match(r"^(\d{4}-\d\d-\d\d) \| (.+)$", line)
    if not m: continue
    d, rest = m.groups()
    if d in taken: continue
    title = re.sub(r"\s*\((\d+h ?)?\d*m?\)\s*(—.*)?$", "", rest).strip()
    title = re.sub(r"\s*\[.*?\]", "", title)
    who, _, where = title.partition(" @ ")
    names = [n.strip() for n in re.split(r" & |, | \+ ", re.sub(r" – .*", "", who)) if n.strip() and "Fred again" not in n and n.strip() != "more"]
    with_ = [ensure_artist(n, "Shared the decks with Fred.", "1001Tracklists") for n in names if len(n) < 30]
    kind = "show" if where else "mix"
    nice = where or re.sub(r"^.*? – ", "", who)
    ev(f"set-{d}-{slug(nice)[:30]}", nice, d, where or "Radio / online mix", with_,
       "", "1001Tracklists (fan-made tracklist)", kind=kind)

# ---------------------------------------------------------------- crew & merch
crew = [
    ("loose", "LOOSE (Lucy Hickling)", "Creative director", "Fred's creative director and tour photographer. Directed the videos for Clara and places to be, co-directed stayinit, and filmed the early Actual Life videos.",
     ["clara-the-night-is-dark", "places-to-be", "stayinit", "julia-deep-diving", "la-coliseum-2024"], "onepointfour.co; Rolling Stone; shots.net; Instagram"),
    ("theo-batterham", "Theo Batterham", "Photographer", "Has been photographing Fred's world for about five years, from the 2021 Mixmag cover shoot to the USB002 residencies and the first Asia shows.",
     ["usb002-nyc-residency", "asia-2025", "usb002-london-residency"], "Milk Studios / The Agents Club; DJ Mag; Instagram (17 tags)"),
    ("charlie-hutchins", "Charlie Hutchins", "Camera / film", "Behind the camera on early videos (2021), the fan-made Hannah (the sun) video, and a film-camera photo series from the first Asia shows.",
     ["hannah-the-sun", "asia-2025"], "Instagram (2021-05-04, 2021-10-21, 2025-07-25)"),
    ("donny-dop", "Donny Dop", "Camera", "Filmed the Julia video (2020) and the 2021 Actual Life videos with LOOSE.", ["julia-deep-diving"], "Instagram"),
    ("jamie-tinsley", "Jamie Tinsley", "Front-of-house sound", "Runs the sound at all of Fred's live shows.", ["la-coliseum-2024"], "Rolling Stone; TPi Magazine"),
    ("matt-pittman", "Matt Pittman", "Production & lighting designer", "Production and lighting design for the live show.", [], "Visual Endeavors"),
    ("grant-draper", "Grant Draper", "Tour director", "Tour director.", [], "Visual Endeavors"),
    ("dermot-lynch", "Dermot Lynch", "Production manager", "Production manager on tour.", [], "Visual Endeavors"),
    ("ed-warren", "Ed Warren", "Lighting & lasers", "Designed the lighting and lasers for the Skrillex / Fred / Four Tet Madison Square Garden rave.", ["msg-2023"], "EDM.com interview"),
    ("explorers-club", "Explorers Club (Aaron Skipper)", "Tour identity design", "LA studio behind the USB002 tour identity, built so fans could remix it themselves.", ["usb", "usb002-london-residency"], "Hypebot; Creative Bloq"),
    ("rubberband", "rubberband. (Jason Sondock & Simon Davis)", "Music video directors", "Directed the 2026 trilogy of black-and-white slow-motion videos, including Lights Burn Dimmer.", ["lights-burn-dimmer", "scared"], "Promonews; Hero Magazine; shots"),
    ("2ms-studio", "2ms studio", "Live visuals", "Worked with Fred on the first live show from February 2020 and the Angie video.", ["angie-i-ve-been-lost"], "Creative Commission; Instagram"),
    ("boris-acket", "Boris Acket", "Kinetic installation artist", "Made the moving kinetic systems for a recent Fred tour.", [], "Hypebeast"),
]
crew_out = [{"id": i, "name": n, "role": role, "bio": bio, "links_to": [x for x in lt if x in tracks or x in events or x in releases],
             "photo": "", "photo_credit": "", "source": src, "verified": True} for i, n, role, bio, lt, src in crew]

merch = [
    ("merch-store-2022", "First merch store + Actual Life 2 vinyl", "2022-03-14", "Clothing and the Actual Life 2 vinyl went on sale.", ["actual-life-2"], "Instagram"),
    ("tiny-desk-vinyl", "Tiny Desk vinyl", "2023-12-28", "A very limited vinyl run of the full NPR Tiny Desk set.", ["tiny-desk-2023"], "Instagram"),
    ("usb-vol1-vinyl", "USB Vol. 1 vinyl", "2024-04-10", "Pre-order of the first USB collection on vinyl.", ["usb"], "Instagram"),
    ("mschf-cloud-tee", "MSCHF x Fred again.. Cloud Tee", "2024-10", "A plain white tee that reveals a blue sky with clouds in sunlight, a nod to the ten days cover.", ["ten-days"], "Hypebeast"),
    ("irl-vinyl-series", "IRL vinyl series", "2024-11-14", "A series of limited vinyl runs.", [], "Instagram"),
    ("usb002-usb-stick", "Handmade 128GB USB stick", "2025-12-03", "A handmade USB stick made for the USB002 tour.", ["usb"], "Instagram"),
    ("usb002-vinyl", "USB002 vinyl", "2025-12-16", "The USB002 collection on vinyl.", ["usb"], "Instagram; shop.fredagain.com"),
    ("cpfm-usb002", "Cactus Plant Flea Market x USB002", "2026-02-28", "Tour merch with CPFM: puff prints, green jerseys, retro desktop graphics and city pieces like a 101010 New York hoodie.", ["usb002-london-residency", "usb002-nyc-residency"], "Complex; Hypebeast"),
]
merch_out = [{"id": i, "title": t, "date": d, "story": s, "links_to": [x for x in lt if x in tracks or x in events or x in releases],
              "image": "", "source": src, "verified": True} for i, t, d, s, lt, src in merch]

# ---------------------------------------------------------------- tidy & save
used = set()
for coll in (releases.values(), tracks.values(), events.values()):
    for x in coll: used.update(x.get("with", []))
for x in artists.values():
    x.setdefault("photo", ""); x.setdefault("photo_credit", "")
artists_out = sorted([a for a in artists.values() if a["id"] in used], key=lambda a: a["name"].lower())
for a in artists_out:
    if not a.get("bio"):
        a["bio"] = "Collaborator. More to add."

save("artists", artists_out)
save("releases", sorted(releases.values(), key=lambda r: r["date"]))
save("tracks", sorted(tracks.values(), key=lambda t: (t["date"] or "", t["title"])))
save("events", sorted(events.values(), key=lambda e: e["date"]))
save("crew", crew_out)
save("merch", merch_out)
meta = load("meta"); meta["updated"] = "2026-11-12"; save("meta", meta)
print(f"artists {len(artists_out)} | releases {len(releases)} | tracks {len(tracks)} | events {len(events)} | crew {len(crew_out)} | merch {len(merch_out)}")
