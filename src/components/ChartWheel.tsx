import { StyleSheet, Text, View } from 'react-native';
import type { Chart } from '../sky/chart';
import { SIGNS, signOf } from '../sky/chart';
import { colors } from '../theme';

const PLAIN = '︎'; // the plain glyph instead of an emoji
const SIGN_GLYPHS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
export const PLANET_GLYPHS: Record<string, string> = {
  Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂', Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇',
};
export const plain = (glyph: string) => glyph + PLAIN;

type Placed = { glyph: string; angle: number; ring: number; key: string };

// Planets close together move inwards, so their signs do not cover each other.
function place(chart: Chart): Placed[] {
  const sorted = [...chart.planets].sort((a, b) => a.longitude - b.longitude);
  const done: Placed[] = [];
  for (const p of sorted) {
    let ring = 0;
    while (ring < 3 && done.some((d) => d.ring === ring && Math.abs(((d.angle - p.longitude + 540) % 360) - 180) < 11)) ring++;
    done.push({ glyph: PLANET_GLYPHS[p.name] ?? '•', angle: p.longitude, ring, key: p.name });
  }
  return done;
}

export function ChartWheel({ chart, size }: { chart: Chart; size: number }) {
  const r = size / 2;
  const start = chart.ascendant === null ? 0 : Math.floor(chart.ascendant / 30) * 30; // the rising sign starts on the left
  const at = (longitude: number, radius: number) => {
    const a = ((180 + longitude - start) * Math.PI) / 180;
    return { x: r + Math.cos(a) * radius, y: r - Math.sin(a) * radius };
  };
  const glyph = (key: string, text: string, longitude: number, radius: number, style: object) => {
    const { x, y } = at(longitude, radius);
    return <Text key={key} style={[styles.glyph, style, { left: x - 16, top: y - 16 }]} allowFontScaling={false}>{plain(text)}</Text>;
  };
  const label = chart.planets.map((p) => `${p.name} in ${p.sign}${p.certain ? '' : ', uncertain'}`).join(', ');

  return (
    <View
      style={{ width: size, height: size, alignSelf: 'center' }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Birth chart. ${label}${chart.ascendant === null ? '' : `, ${signOf(chart.ascendant)} rising`}`}
    >
      <View style={[styles.circle, { width: size, height: size, borderRadius: r }]} />
      <View style={[styles.circle, { left: 40, top: 40, width: size - 80, height: size - 80, borderRadius: r - 40 }]} />
      {SIGNS.map((s, i) => {
        const inner = r - 40;
        const a = 180 + i * 30 - start;
        // a spoke between two signs
        const mid = at(i * 30, inner + 20);
        return <View key={s} style={[styles.spoke, { left: mid.x - 20, top: mid.y - 0.5, transform: [{ rotate: `${-a}deg` }] }]} />;
      })}
      {SIGNS.map((s, i) => glyph(s, SIGN_GLYPHS[i], i * 30 + 15, r - 20, styles.sign))}
      {place(chart).map((p) => glyph(p.key, p.glyph, p.angle, r - 60 - p.ring * 26, styles.planet))}
      {chart.ascendant !== null && (() => {
        const { x, y } = at(chart.ascendant, r - 40);
        return <View style={[styles.dot, { left: x - 5, top: y - 5 }]} />;
      })()}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { position: 'absolute', borderWidth: 1, borderColor: colors.brass },
  spoke: { position: 'absolute', width: 40, height: 1, backgroundColor: colors.brass },
  glyph: { position: 'absolute', width: 32, height: 32, lineHeight: 32, textAlign: 'center' },
  sign: { color: colors.brassLight, fontSize: 18 },
  planet: { color: colors.bone, fontSize: 22 },
  dot: { position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: colors.bone },
});
