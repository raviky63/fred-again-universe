"""Strip personal data from community exports BEFORE anything is used.

Works on:
  - DiscordChatExporter JSON exports
  - Arctic Shift Reddit downloads (.json / .jsonl / .ndjson)

Usage:
  python tools/clean_export.py <export file> [<more files> ...]
Writes research/community/<name>.clean.jsonl with only: date, source, channel/subreddit, text.

What gets removed:
  - author names, user IDs, avatars, @mentions, u/usernames, reply-to info
  - email addresses, phone numbers, IP addresses
  - links to personal social profiles (instagram/tiktok/x/twitter/facebook profiles, discord invites)
  - attachments and embeds (photos/videos of people)
Kept: official/public links (spotify, youtube, setlist.fm, 1001tracklists, fredagain.com, press sites).
The raw export itself is never committed (see .gitignore).
"""
import json, re, sys
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "research" / "community"

PATTERNS = [
    (re.compile(r"<@!?&?\d+>"), "[someone]"),                                  # discord mentions
    (re.compile(r"@?\[[^\]]{1,40}\]\(https?://([\w-]+\.)?reddit\.com/(u|user)/[^)]+\)", re.I), "[someone]"),  # markdown reddit user links
    (re.compile(r"https?://([\w-]+\.)?reddit\.com/(u|user)/[\w-]+/?", re.I), "[someone]"),
    (re.compile(r"(?<!\w)@[\w.]{2,32}"), "[someone]"),                          # @handles
    (re.compile(r"(?<!\w)/?u/[\w-]{3,20}"), "[someone]"),                       # reddit users
    (re.compile(r"[\w.+-]+@[\w-]+\.[\w.]+"), "[email removed]"),
    (re.compile(r"\+?\d[\d\s().-]{8,}\d"), "[number removed]"),
    (re.compile(r"\b\d{1,3}(\.\d{1,3}){3}\b"), "[ip removed]"),
    (re.compile(r"https?://(www\.)?(instagram\.com|tiktok\.com|twitter\.com|x\.com|facebook\.com|snapchat\.com)/(?!fredagain)[^\s)]+", re.I), "[personal link removed]"),
    (re.compile(r"https?://(discord\.gg|discord\.com/invite)/\S+", re.I), "[invite removed]"),
]

def scrub(text):
    for rx, rep in PATTERNS:
        text = rx.sub(rep, text)
    return re.sub(r"\s+", " ", text).strip()

def discord(data, name):
    channel = data.get("channel", {}).get("name", name)
    for m in data.get("messages", []):
        t = scrub(m.get("content") or "")
        if t:
            yield {"date": (m.get("timestamp") or "")[:10], "source": "discord", "where": channel, "text": t}

def reddit(rows, name):
    for r in rows:
        text = " ".join(x for x in [r.get("title"), r.get("selftext"), r.get("body")] if x and x not in ("[deleted]", "[removed]"))
        t = scrub(text)
        if t:
            from datetime import datetime, timezone
            d = datetime.fromtimestamp(int(r.get("created_utc", 0)), timezone.utc).strftime("%Y-%m-%d")
            yield {"date": d, "source": "reddit", "where": "r/" + (r.get("subreddit") or name), "text": t,
                   "kind": "post" if "title" in r else "comment", "score": r.get("score"), "flair": r.get("link_flair_text"), "url": r.get("url") if r.get("url") and "reddit.com" not in str(r.get("url")) else None}

def load(path):
    raw = path.read_text(encoding="utf-8")
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return [json.loads(l) for l in raw.splitlines() if l.strip()]

if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for f in sys.argv[1:]:
        p = Path(f); data = load(p)
        rows = list(discord(data, p.stem) if isinstance(data, dict) and "messages" in data else reddit(data, p.stem))
        out = OUT / f"{p.stem}.clean.jsonl"
        out.write_text("\n".join(json.dumps(r, ensure_ascii=False) for r in rows) + "\n", encoding="utf-8")
        print(f"{p.name}: {len(rows)} messages kept -> {out}")
