"""Guess the country (ISO 3166 alpha-2) of each show from its location text.
Rules are checked in order; the first keyword found wins. Run: python3 tools/countries.py"""
import json, re

MULTI = {"Japan & South Korea": ["JP", "KR"], "Delhi, Mumbai & Bengaluru": ["IN"]}
NONE = ["Twitch", "Piano Live"]  # online, no single place (Twitch, Canada is handled below)
RULES = [
 ("Twitch, Canada","CA"),("Latraac","GR"),
 ("Netherlands","NL"),("Amsterdam","NL"),("Lowlands","NL"),("Biddinghuizen","NL"),
 ("Belgium","BE"),("Brussels","BE"),("Pukkelpop","BE"),("Rock Werchter","BE"),
 ("Ireland","IE"),("Dublin","IE"),("Electric Picnic","IE"),
 ("Scotland","GB"),("Glasgow","GB"),("Connect Festival","GB"),("London","GB"),("Manchester","GB"),
 ("Bristol","GB"),("Sheffield","GB"),("England","GB"),("Glastonbury","GB"),("Pilton","GB"),
 ("Parklife","GB"),("Leeds Festival","GB"),("All Points East","GB"),("Forwards","GB"),("Repercussion","GB"),
 ("Arun's Roof","GB"),("Studio Live","GB"),
 ("France","FR"),("Paris","FR"),("Lyon","FR"),("Rock en Seine","FR"),("Garorock","FR"),
 ("Germany","DE"),("Berlin","DE"),("Hamburg","DE"),("Cologne","DE"),("Melt!","DE"),
 ("Italy","IT"),("Milan","IT"),("Naples","IT"),("Rome","IT"),("Roma","IT"),("Verona","IT"),
 ("Primavera Sound Porto","PT"),("Madrid","ES"),("Primavera Sound","ES"),
 ("Montreux","CH"),("Greece","GR"),("Athens","GR"),("Budapest","HU"),("Sziget","HU"),
 ("Copenhagen","DK"),("Roskilde","DK"),("Way Out West","SE"),("Helsinki","FI"),("Flow Festival","FI"),
 ("Toronto","CA"),("Montreal","CA"),("Osheaga","CA"),("Vancouver","CA"),
 ("Mexico","MX"),("CDMX","MX"),("Pa'l Norte","MX"),
 ("Argentina","AR"),("Buenos Aires","AR"),("Chile","CL"),("Brazil","BR"),("São Paulo","BR"),
 ("Bogotá","CO"),("Estéreo Picnic","CO"),
 ("New Zealand","NZ"),("Australia","AU"),("Sydney","AU"),("Melbourne","AU"),("Laneway","AU"),
 ("Perth","AU"),("Adelaide","AU"),
 ("Japan","JP"),("Osaka","JP"),("South Korea","KR"),("Singapore","SG"),("Thailand","TH"),
 ("Bangkok","TH"),("Indonesia","ID"),("Bali","ID"),
 # everything left with a US city, state or festival
 ("New York","US"),("NYC","US"),("NY","US"),("Brooklyn","US"),("Los Angeles","US"),("LA Memorial","US"),
 ("San Francisco","US"),("Stanford","US"),("Portola","US"),("San Diego","US"),("CRSSD","US"),
 ("Chicago","US"),("Lollapalooza 2023","US"),("Coachella","US"),("Indio","US"),("Denver","US"),
 ("Washington","US"),("Boston","US"),("Atlanta","US"),("Detroit","US"),("Minneapolis","US"),
 ("Fort Worth","US"),("Wisconsin","US"),(", WI","US"),(", UT","US"),(", WA","US"),(", CA","US"),
 ("Bellvue","US"),("Miami","US"),("III Points","US"),("Bonnaroo","US"),("Electric Forest","US"),
 ("Las Vegas","US"),("Buffalo","US"),("Lot Radio","US"),("H0L0","US"),
]

def country(loc):
    if loc in MULTI: return MULTI[loc]
    for k, c in RULES:
        if k in loc: return [c]
    if any(k in loc for k in NONE): return []
    return None

if __name__ == "__main__":
    ev = json.load(open("data/events.json"))
    unknown = set()
    for e in ev:
        if e.get("kind") == "mix":
            continue
        c = country(e["location"])
        if c is None:
            unknown.add(e["location"]); continue
        e["country"] = c
    json.dump(ev, open("data/events.json", "w"), indent=2, ensure_ascii=False)
    print("unknown:", sorted(unknown))
