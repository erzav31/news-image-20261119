# The World in One Day — Thursday 19 November 2026

[![make.fun · news-image-20261119](https://make.fun/badge/news-image-20261119.svg)](https://make.fun/bounty/news-image-20261119?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261119)
[![rank](https://make.fun/badge/news-image-20261119/erzav31/news-image-20261119/rank.svg)](https://make.fun/bounty/news-image-20261119/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261119)
[![reward](https://make.fun/badge/news-image-20261119/erzav31/news-image-20261119/reward.svg)](https://make.fun/bounty/news-image-20261119?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261119)

One image, one day: **40 stories from 7 regions**, all of which happened or
were first reported on Thursday 19 November 2026. Led by the first-ever
trilateral summit of Trump, Xi and Putin in Shenzhen, with the ICJ's historic
Myanmar genocide ruling, Anthropic's record $81.3bn IPO, Cyclone Akvan's
evacuations in Odisha, GTA VI's worldwide launch, and a day-by-the-clock UTC
timeline plus a dotted world map. Every story is date-checked — see
`DATE CHECK` on the poster.

## The day in numbers

- **3** leaders at one table (Shenzhen)
- **$81.3bn** — biggest IPO ever (Anthropic, +17% on debut)
- **−1,100** Dow points lost
- **300,000** evacuated in Odisha ahead of Cyclone Akvan
- **141** Russian drones launched at Ukraine overnight
- **1st** state ever found guilty of genocide by the ICJ

## Stories by region

| Region | Stories |
|---|---|
| Asia-Pacific | 10 |
| North America | 7 |
| Europe | 7 |
| Latin America | 4 |
| Middle East | 4 |
| Africa | 4 |
| Oceania | 4 |
| **Total** | **40** |

Sources include Reuters, AP, BBC, Al Jazeera, Le Monde, NYT, NASA, IMD,
Rockstar Games, APEC and HPCwire. The poster is drawn entirely by hand with
code (Python/PIL) — no photos, no copyrighted images.

## Run

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
# writes out/entry.png (1024x1024, 224,626 bytes)
```

Node 22, standard library only, no network. `main.ts` copies `entry.png` to
`/output/entry.png`; two runs produce identical bytes.
