# Noctuary: plan

Working title. Read this before every task.

## Who and when

Someone outside or in bed at night who is curious about the Moon and likes ritual and symbolism. A visit takes one to three minutes.

## Core task

Meet tonight's real Moon and ask it one thing. The true phase is visible within seconds; speaking to the Moon is one tap away.

## API

CycleCalcs v2 (https, no key): `GET https://www.cyclecalcs.com/v2/moon?lat=51.22&lon=4.40`. Documentation: https://www.cyclecalcs.com/api.html

Fields used:

- `data.phase.name`, `data.phase.illumination_percent`, `data.phase.age_days`: the live status line
- `data.bright_limb.orientation_angle_deg`, `data.bright_limb.parallactic_angle_deg`: which side is lit
- `data.libration`: the turn of the head
- `data.distance_km`: size and voice
- `data.tropical_sign`: the Moon's sign

Also: Open-Meteo geocoding for birthplace search. Supabase holds what belongs to one user (login, saved nights, messages, memories), with RLS on every table. The conversation uses an LLM (Groq) through a Supabase Edge Function.

## Screens

1. **Gate**: log in with email or Google, with clear errors.
2. **Moon** (home): the living Moon, live status, chat with subtitles, first-visit ritual.
3. **Almanac**: next phases, rise and set, eclipses, folklore, saved nights.
4. **Chart**: birth chart and symbolic reading.
5. **Memory**: what the Moon remembers; delete one or all; sign out.

Tabs: Moon, Almanac, Chart. Memory opens from Chart. Chat is a bottom sheet over the Moon.

## States

- **Loading**: the Moon from an on-device calculation, "the instrument is being aligned".
- **Error or offline**: last saved data with its time and a Retry button; otherwise the calculated Moon, labelled as calculated.
- **Empty**: suggested questions in chat; no saved nights in Almanac; birth details missing in Chart.
- **First open**: after login the Moon asks name, birth date, time and place; every step can be skipped.
- **Moon is tired**: LLM limit or error; says when to return.

## Look

Dark-fantasy almanac: engraved plates, parchment panels, dithered shadows.

- Ink `#0E120D`, moss `#2C3A24`, parchment `#E6DCC3`, bone `#F4EEDD`, tarnished brass `#A58B4F`
- Ornate serif with swash italics for the Moon's voice; pixel blackletter for short headings only; legible serif for body, at least 16px
- Key buttons within thumb reach and at least 44 pt; Reduce Motion respected

Moodboard: still to be added beside this file, including app UI screens.

## Next step

Run the Moon test screen on a real phone and check its frame rate. Then show live CycleCalcs data on the Moon screen, with every state.
