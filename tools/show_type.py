"""Mark each show as a festival or Fred's own show, from its title/location.
Run: python3 tools/show_type.py  (after tools/countries.py)"""
import json, re
FEST = ["Festival","Fest ","Primavera","Parklife","Lollapalooza","Coachella","Glastonbury","Pilton","Pukkelpop","Lowlands",
 "Biddinghuizen","Rock en Seine","Roskilde","Way Out West","Flow Festival","Sziget","Osheaga","Bonnaroo","Electric Forest","EDC",
 "III Points","Laneway","Estéreo Picnic","Axe Ceremonia","Tecate","Pa'l Norte","CRSSD","Portola Music","Reading, England","Leeds",
 "All Points East","Forwards","Repercussion","Connect Festival","Electric Picnic","Melt!","Montreux","Garorock","Rock Werchter",
 "Piknic","Syd For Solen","South Facing","Summer Fest","Mojave","Perry's","What Stage","Sherwood Court","Mind Melt","circuitGROUND",
 "T-Mobile Stage","Montagne Stage","Ocean View","adidas Stage","Main Stage","Indio","Lollapalooza 2023"]
NOT = ["Aftershows","pre-party"]
if __name__ == "__main__":
    ev = json.load(open("data/events.json")); n = {"festival":0,"own":0}
    for e in ev:
        if e.get("kind") != "show": continue
        txt = e["title"] + " | " + e["location"]
        fest = any(k in txt for k in FEST) and not any(k in txt for k in NOT)
        e["setting"] = "festival" if fest else "own"; n[e["setting"]] += 1
    json.dump(ev, open("data/events.json","w"), indent=2, ensure_ascii=False)
    print(n)
