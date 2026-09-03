*[Español](README.md) · **English***

# Gincana

An app for a hospital staff field day: 10 teams rotating through 10 five-minute stations, one
judge per station recording from their phone, and a TV showing results live.

**Live demo: <https://gincana-hegi.web.app>** — loaded with rehearsal data so you can walk
through it. Enter as a judge (station 1, PIN `6108`), watch the TV screens, or open the awards
ceremony (PIN `2580`).

It ran at a real event. That edition's data (photos and names of hospital staff) was deleted
afterwards; this repository is code only, and the demo uses made-up teams.

> **A note on language.** The UI, the code and the comments are in Spanish, because that is the
> language of the domain: ten Colombian judges used this outdoors with muddy hands. Names like
> `rankearPrueba`, `ordenDeLlegada` or `equiposListos` read better next to the thing they model
> than a half-translated mix would. This page is the map for English readers.

## Why it is built this way

The event took place in a small town where the internet drops. That drove nearly every decision:

- **Offline first.** Firestore with a persistent cache: a judge saves without signal, the data
  stays on their phone and uploads itself on reconnect. The app is a PWA, so it opens even with
  no network at all to load the page.
- **Nobody administers anything on event day.** The organiser was in another country. Everything
  is prepared beforehand and judges just open their station and record.
- **Three safety nets when saving:** an explicit button, an automatic save when switching teams,
  and an automatic save if the phone locks mid-entry.
- **One field per station.** It started with three or four fields per challenge and they were cut
  back: fewer things to watch with muddy hands, fewer mistakes.
- **Rotation is computed.** Each judge sees teams in the order they will actually arrive at that
  station, not 1 through 10 (`src/lib/rotacion.ts`).
- **Paper as a last resort.** A printable tally sheet per station, in case a phone fails.

The scoring engine (`src/lib/puntaje.ts`), the rotation logic and the challenge configuration are
covered by 32 automated tests: standard competition ranking with ties, tie-breaking by time,
missing entries, and edge cases such as "a challenge nobody managed to record".

**Stack:** React + TypeScript + Vite · Firebase (Firestore + Hosting + anonymous auth) · Vitest.

---

Four screens:

| Screen | Who uses it | What for |
| --- | --- | --- |
| `#/juez` | The 10 judges, on their phones | Record their station's results |
| `#/tv` | The TV in the central area | Team introductions, live performance, final podium |
| `#/admin` | Organisers, before the event | Create teams with photos and members, backups |
| `#/imprimir` | Organisers, before the event | One printable sheet per station with link, PIN and paper tally. Reached from Admin and gated by the same PIN, since it lists all 10 station PINs |

---

## 1. Try it without configuring anything

```bash
cd gincana-app && npm install && npm run dev
```

Open <http://localhost:5173>. It starts in **local mode**: everything is stored in the browser
itself, which is fine for rehearsing, but the TV will not see what judges record. For that you
need Firebase (step 2).

To fill it with fake data and see how it all looks:
**Admin → Backup → Load rehearsal data**.

---

## 2. Connect Firebase

Free, no credit card required. Done once.

1. Go to <https://console.firebase.google.com> **with a personal Google account** and create a
   project. Google Analytics can be turned off.

   > Use a personal account, not an institutional one (`@university.edu`, `@company.com`). With
   > an organisation account, Google forces the project under an organisation folder: its admins
   > can see or delete it, and their policies may block things like anonymous authentication.

2. In the left menu, **Build → Firestore Database → Create database**. Pick the closest region
   (for example `southamerica-east1`) and **production mode** (the correct rules go up in step 6).
3. **Build → Authentication → Get started → Anonymous → Enable.**
   This is what lets the app get in without a username or password.

   > The Firebase console menu is reorganised every so often. If something is missing, use the
   > product search above the menu. The **Spark (free)** plan covers all of this.
4. Top left, ⚙ **Project settings → Your apps → `</>` (Web)**. Register the app under any
   nickname. It then shows a `firebaseConfig` block with six values.
5. Copy `gincana-app/.env.example` to `gincana-app/.env.local` and paste those six values in.
6. Publish the security rules:

   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add
   firebase deploy --only firestore:rules
   ```

Restart `npm run dev`: the "local mode" warning on the home screen should be gone.

---

## 3. Deploy

```bash
cd gincana-app && npm run build && cd ..
firebase deploy --only hosting
```

It returns an address like `https://your-project.web.app`. **That is the one that goes on the
judges' sheets.** Repeat both commands after any change.

---

## 4. Before the event

1. Open `#/admin` with the organiser PIN and create the teams: name, colour, the five members and
   a photo. Photos are compressed in the browser, so straight-from-the-phone is fine.
2. In **Admin → Judges' sheets**, check that the app address is the final one and **print**. You
   get one sheet per station with a QR code, the PIN, what to watch for, and a paper tally.
3. Ask every judge to **open the link while they have signal the day before** and tap "Add to home
   screen". The app then lives on their phone and works even with no internet on the day.
4. Download a backup from **Admin → Backup → Full backup (JSON)**.
5. If you rehearsed with fake data, hit **Delete everything** before the real day.

## 5. On the day

Judges just open the app, pick their station, type their PIN and record. Nobody has to administer
anything.

- Each judge moves between teams with the `‹ Team ›` arrows. The numbered chips below turn green
  as they record, so they can see at a glance which ones are missing.
- The badge at the top reads **All synced**, **Uploading…** or **No signal · saved here**. As long
  as it shows any of the three, the data is safe: with no signal it stays on the phone and uploads
  as soon as the connection returns. The mid-event water break is the natural moment for everyone
  to sync.
- On the TV, switch screens with the three buttons at the bottom right or the `1`, `2` and `3`
  keys. In the team introductions, `←` and `→` move between teams.
- The final results screen asks for a PIN, so nobody opens it by accident and spoils the surprise.
  Inside it is a step-by-step awards ceremony: third place is announced with the photo covered,
  then revealed, and so on up to first; the podium and points table come last. Advance with a
  click, `→`, space or Enter; `←` goes back.

## 6. PINs

| What for | PIN |
| --- | --- |
| Admin (`#/admin`) | `1379` |
| Final results on the TV | `2580` |
| Each station | See the `pin` field in `gincana-app/src/config/pruebas.ts` |

They all live in `gincana-app/src/config/pruebas.ts`. Change them if you want, and reprint the
judges' sheets afterwards.

---

## 7. How points are calculated

Every challenge is worth the same. At each station teams are ordered by performance and points are
handed out: **1st place 10, 2nd 9, 3rd 8**, and so on.

Ties use standard competition ranking: if three teams tie for second, all three take 9 points and
the next one lands in fifth, with 6.

**Overall tie-break:** if two teams finish on the same total, the one with the **faster stretcher
transport time** comes out ahead. That challenge was chosen because it is the one closest to the
hospital staff's actual job and, being measured in time, the least likely to tie again. If they
tie there too, the tie stands. A team with no stretcher record loses the tie-break. The
tie-breaking challenge is set by `ID_PRUEBA_DESEMPATE` in `gincana-app/src/config/pruebas.ts`.

Details worth knowing:

- The stretcher challenge is won by the **lowest** time. Every other one by the highest number.
- **A recorded 0** is a legitimate result and ranks above a team with **no record at all**.
- A team with **no data** for a challenge scores **0 points**, not last-place points. Otherwise a
  challenge nobody managed to record would hand everyone 10 points through a tie. Those gaps show
  up in red under **Admin → Captured data**.
- Each station asks for **one number** (the one that decides the ranking) plus notes. Everything
  else was deliberately left out: fewer things to watch, fewer mistakes.
- If a team does not finish a challenge, the judge leaves the entry unsaved and explains it in the
  notes. That team scores 0 for that station.

The logic lives in `gincana-app/src/lib/puntaje.ts` and is covered by automated tests:

```bash
cd gincana-app && npm test
```

---

## 8. If something goes wrong

- **A judge lost their phone or closed everything.** Whatever had synced is in the cloud; the rest
  is recovered from the paper tally. Any judge can re-enter it from any device with that station's
  PIN.
- **The internet was down all day.** Judges keep recording without trouble. The TV does not update,
  but as soon as anyone gets signal everything uploads and the podium is correct.
- **Wrong data got saved.** Fix it from the judge view: navigate to the team and save again. The
  button reads "Update" when there is already a record.
- **Everything needs rebuilding.** **Admin → Backup → Restore** loads a previously downloaded JSON.

---

## Layout

```
gincana-app/src/
  config/pruebas.ts    ← the 10 stations: fields, scoring criteria and PINs
  lib/puntaje.ts       ← ranking and points (with automated tests)
  lib/almacen.ts       ← data: Firestore with offline cache, or localStorage without Firebase
  vistas/Juez.tsx      ← capture on the phone (judge view)
  vistas/Admin.tsx     ← teams, data review and backups
  vistas/TV.tsx        ← the three TV screens
  vistas/Imprimir.tsx  ← judges' printable sheets
firestore.rules        ← database security rules
```

<sub>Glossary for the names above: <i>prueba</i> = challenge · <i>puntaje</i> = score ·
<i>almacén</i> = store · <i>juez</i> = judge · <i>vistas</i> = views · <i>imprimir</i> = print ·
<i>equipo</i> = team · <i>rotación</i> = rotation · <i>ensayo</i> = rehearsal.</sub>
