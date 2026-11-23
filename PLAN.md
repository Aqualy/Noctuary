# Noctuary: app plan

Working title. Read this before every task. Background and alternatives are in `PROJECT-PLAN.md`, one folder up; if they disagree, this file wins.

**Status: approved 23 November 2026.**

## Who and when

- **Who:** someone curious about the Moon who enjoys ritual and symbolism, but is not an astronomer.
- **When and where:** at night, outside looking up or in bed, for one to three minutes, one hand free, eyes used to the dark.
- **Now:** moon-phase apps give numbers without wonder; astrology apps give wonder without the real sky. Noctuary joins them: the character *is* the data.

## Core task

> Meet tonight's real Moon and ask it one thing.

The true Moon is visible within seconds of opening; asking is one tap away. Everything else supports this. A feature that does not is cut first.

## Idea: astronomy is body language

The Moon is a carved stone face that speaks gibberish with subtitles.

| Real sky | What the character does |
|---|---|
| Sun angle | Lights the true part of the face; near new moon mostly eyes and earthshine |
| Libration | Slow turn of the head |
| Phase | Temper: new = secretive, waxing = curious, full = grand, waning = nostalgic |
| Distance | Nearer = larger and louder |
| Below the horizon | Speaks "from under the world" |

## API

**CycleCalcs v2**: https, free, no key, 300 requests a minute and 5,000 a day per IP; results may be used freely. Docs: https://www.cyclecalcs.com/api.html. All endpoints below answered 200 on 23 November 2026.

Endpoint to present: `GET https://www.cyclecalcs.com/v2/moon?lat=51.22&lon=4.40`

| Field in `data` | Use | Screen |
|---|---|---|
| `phase.name`, `phase.illumination_percent`, `phase.age_days` | Status line | Moon |
| `phase.waxing`, `phase.code` | Temper | Moon |
| `phase.illumination_phase_angle_deg` + `bright_limb.orientation_angle_deg` | Direction of sunlight | Moon |
| `bright_limb.parallactic_angle_deg` | Tilt as seen from here | Moon |
| `position_geocentric.distance_km` | Size and voice | Moon |
| `position_topocentric.horizontal.altitude_refracted_deg`, `.compass` | Above or below horizon, where to look | Moon |
| `tropical_sign.name` | Symbolic line | Moon |
| `rise_set.rise`, `rise_set.set` | Tonight's times (either can be absent on a given day) | Almanac |
| `next_phases[]`: `name`, `instant` | Coming phases | Almanac |

Second endpoint: `/v2/libration?lat=..&lon=..`: `libration_topocentric.longitude_deg` and `.latitude_deg` (head turn), `topocentric.axis_position_angle_deg` (minus the parallactic angle: how far the face leans).

Third endpoint: `/v2/eclipses` → `eclipses[]`: `label`, `peak`. These are global: an eclipse is not necessarily visible from the user's place, and the app says so.

Other services: **Open-Meteo geocoding** (city search, no key); **Groq** (conversation, only through a Supabase Edge Function); **astronomy-engine** (on the phone: offline fallback and birth chart). NASA Dial-A-Moon is used by us to check the rendering, not by the app.

## Screens and flow

```
Gate -> first visit: ritual -> Moon <-> Almanac <-> Chart -> Memory
        returning:            Moon (tabs)                   -> sign out
```

1. **Gate.** Moon in the dark behind two choices: email or Google. Wrong password gives a clear message. The session survives a restart.
2. **Moon** (home, first tab). Moon fills the upper screen; one status line below ("Waxing gibbous, 99% lit, east, 26° up"). "Ask the Moon" sits in thumb reach and opens a chat sheet; the Moon stays visible while it answers. Drag turns it, release returns it to the truth. *Data: `/v2/moon`, messages.*
3. **Almanac** (tab). Tonight's rise and set, next four phases, next eclipse, one piece of folklore for this phase, saved nights. "Save this night" button. *Data: `/v2/moon`, `/v2/eclipses`, nights.*
4. **Chart** (tab). Birth-chart wheel and one symbolic reading, kept after it is made. *Data: profile, on-device calculation, readings.*
5. **Memory** (from Chart). What the Moon remembers, delete one or all, sign out. *Data: memories, profile.*

The first-visit ritual is scripted, not AI: the Moon asks name, birth date, birth time ("I do not know" is allowed) and birthplace, one at a time, with native pickers. Every step can be skipped. Location permission is asked only when needed; picking a city is the alternative.

## States

| | Loading | Empty | Error or offline |
|---|---|---|---|
| **Gate** | Button shows progress | n/a | Clear message; input kept |
| **Moon** | Moon calculated on the phone, "the instrument is being aligned" | Chat: three suggested questions | Saved data under three hours old, with its time; otherwise the calculated Moon, labelled (older data would show the wrong Moon); Retry |
| **Almanac** | Placeholder lines | "No saved nights yet", with Save | Last saved data and Retry |
| **Chart** | Wheel outline | Birth details missing: start the ritual. Time unknown: no ascendant or houses | Wheel still shows; reading offers Retry |
| **Memory** | Placeholder lines | "The Moon knows nothing of you yet" | Retry; nothing looks deleted until it is |

**First open:** Gate → ritual → Moon, opening its eyes. **Location refused:** city search. **AI limit or error:** the Moon is "tired", says when to return, and offers a bundled phrase.

## Look

A dark-fantasy almanac, not a purple astrology app. References: 1-bit dithered engraving with parchment panels (`videoframe_22774.png`); centred serif with swash italics around an ornate object (`a4c31...jpg`). *No Man's Land* gives mood only; nothing is copied from it.

- **Colour:** ink `#0E120D` background, moss `#2C3A24` surfaces, bone `#F4EEDD` text, parchment `#E6DCC3` panels, brass `#A58B4F` lines and accents.
- **Type:** ornate serif with swash italics for the Moon's voice; pixel blackletter for short headings only; plain readable serif for body, 16px or larger. Fonts still to be chosen, with a licence that allows embedding.
- **Moon:** our own carved stone Moon in soft light, printed in a few inks with ordered dither, strongest in the shadows. Stylised, not photographic. Pixel look, chosen on the phone: pixel size 2, light inner lines 0.10, dark outlines 0.60, full dither.
- **Feel:** slow, quiet motion; light haptic ticks; Reduce Motion respected.
- **Mobile:** key buttons in thumb reach, at least 44 pt; strong contrast at night; native back gestures and tab bar.
- **Moodboard:** still to be made, beside this file. At least half app UI screens (chat sheets, dark almanacs, onboarding questions), as the teacher asked.

## Technology

- Expo SDK 58 in Expo Go, Expo Router, TypeScript, function components, `StyleSheet`.
- Moon: `@shopify/react-native-skia` fragment shader with Reanimated (built in `moon-asset/`).
- Supabase: login (email and Google), tables, Edge Function. Audio: `expo-audio`.
- `.env.local` holds only the Supabase URL and publishable key. The Groq key is a Supabase secret; the Google client secret stays in Supabase.

**Tables**, all with RLS and `user_id = auth.uid()`: `profiles`, `nights`, `messages`, `memories`, `readings`. `usage` (daily limit) is closed to the app. SQL lives in `supabase/schema.sql`.

**Conversation:** `speak` checks the login and limit (20 questions per user per day), adds sky facts and at most 8 memories, and returns speech, a mood (calm, joy, sorrow, stern, wonder) and things to remember. The Moon never calculates numbers itself. It admits to being an AI if asked sincerely, gives no medical, legal or financial predictions, and points to real help in a crisis. Before the first question the app says messages go to an AI service. Birth date and place are never sent, only derived signs.

**Voice:** syllables recorded by the maker; the same schedule drives audio, jaw and subtitles. Subtitles always show; sound can be muted.

## Build order

Each step is committed on its own and tested on the phone before the next.

**A. Ready for the design review**
1. Expo starter and repository *(done before this plan)*
2. Moon on the real phone, at least 30 fps. *Done when:* renderer and style are chosen. If it fails: `expo-gl`, then a flat lit disk.
3. Live data on the Moon screen. *Done when:* phase and tilt match Dial-A-Moon, and airplane mode shows the offline state.
4. Email login, then Google. *Done when:* session survives a restart and wrong password is clear.
5. Save a night. *Done when:* account B cannot see account A's nights.

**B. The living Moon:** 6. libration, gestures, blink; 7. ritual; 8. `speak` and chat.
**C. Depth:** 9. voice and lips; 10. memory; 11. full almanac; 12. chart and reading.
**D. Polish:** 13. icon, splash, haptics, accessibility, slow-phone mode, presentation rehearsal.

**Cut order if late:** chart wheel → familiarity (tone that changes with nights visited) → extra expressions → voice (subtitles stay).
**Never cut:** live data, login, RLS, every state, the lit Moon.
**Not in version 1:** full star sky, notifications, AR, streaming replies.

## Risks

| Risk | Response |
|---|---|
| Moon too slow on a phone | Test first; low quality turns off cast shadows |
| AI limit reached during presentation | Keep quota free that day; bundled phrases |
| Supabase paused after a week idle | Open it weekly and the day before |
| Google login breaks when the IP changes | Update Site URL; email login as the demo route |

## Open decisions

1. Final name: Noctuary?
2. Are Chart and astrology in version 1, or only if time allows? Proposed: last to build, first to cut.
3. Fonts.

## Next step

Part A and steps 6 and 7 are built and tested on the phone. Make the moodboard; then step 8 (`speak` and chat).
