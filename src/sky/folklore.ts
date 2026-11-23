// One piece of folklore per phase. Told as tradition, not as fact.
const ENTRIES: Record<string, string> = {
  'New Moon': 'The night without a Moon was long feared, and also counted: in many old calendars a new month begins when the first thin crescent is seen again.',
  'Waxing Crescent': 'An old sailors’ saying holds that a crescent lying on its back holds water, and one standing on its tip pours it out as rain.',
  'First Quarter': 'Half lit, half dark: gardeners who plant by the Moon sow what grows above the ground while the light is still growing.',
  'Waxing Gibbous': 'Almost round. Chinese and Japanese tellers see a rabbit in the dark patches, pounding in a mortar.',
  'Full Moon': 'Farmers named the full moons after their work. The Harvest Moon, nearest the autumn equinox, lit the fields after sunset.',
  'Waning Gibbous': 'Northern tales put a man in the Moon with a bundle of sticks, sent there for gathering wood on a day of rest.',
  'Last Quarter': 'What grows under the ground was sown while the light shrinks. Wood cut now was said to dry well.',
  'Waning Crescent': 'The last sliver rises just before dawn. In Norse myth the wolf Hati runs behind the Moon, and one day will catch it.',
};

export const folkloreFor = (phase: string): string => ENTRIES[phase] ?? ENTRIES['New Moon'];
