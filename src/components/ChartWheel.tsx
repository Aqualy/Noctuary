import { Canvas, Circle, Group, Image, Line, Skia, TileMode, FilterMode, MipmapMode, Paint, useImage, vec } from '@shopify/react-native-skia';
import { useMemo } from 'react';
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

const RING = 40;
const nearest = { filter: FilterMode.Nearest, mipmap: MipmapMode.None };

type Placed = { glyph: string; angle: number; ring: number; key: string };

// Planets close together move inwards, so their signs do not cover each other.
function place(chart: Chart): Placed[] {
  const sorted = [...chart.planets].sort((a, b) => a.longitude - b.longitude);
  const done: Placed[] = [];
  for (const p of sorted) {
    let ring = 0;
    while (ring < 2 && done.some((d) => d.ring === ring && Math.abs(((d.angle - p.longitude + 540) % 360) - 180) < 12)) ring++;
    done.push({ glyph: PLANET_GLYPHS[p.name] ?? '•', angle: p.longitude, ring, key: p.name });
  }
  return done;
}

// A checker of printed dots.
function useDots() {
  return useMemo(() => {
    const surface = Skia.Surface.Make(6, 6);
    if (!surface) return null;
    const paint = Skia.Paint();
    paint.setColor(Skia.Color(colors.ink));
    surface.getCanvas().drawRect(Skia.XYWHRect(0, 0, 2, 2), paint);
    surface.getCanvas().drawRect(Skia.XYWHRect(3, 3, 2, 2), paint);
    const fill = Skia.Paint();
    fill.setShader(surface.makeImageSnapshot().makeShaderOptions(TileMode.Repeat, TileMode.Repeat, FilterMode.Nearest, MipmapMode.None));
    return fill;
  }, []);
}

export function ChartWheel({ chart, size }: { chart: Chart; size: number }) {
  const moon = useImage(require('../../assets/images/moon-print.png'));
  const dots = useDots();
  const r = size / 2;
  const start = chart.ascendant === null ? 0 : Math.floor(chart.ascendant / 30) * 30; // the rising sign starts on the left
  const at = (longitude: number, radius: number) => {
    const a = ((180 + longitude - start) * Math.PI) / 180;
    return { x: r + Math.cos(a) * radius, y: r - Math.sin(a) * radius };
  };
  const glyph = (key: string, text: string, longitude: number, radius: number, style: object) => {
    const { x, y } = at(longitude, radius);
    return <Text key={key} style={[styles.glyph, style, { left: x - 15, top: y - 15 }]} allowFontScaling={false}>{plain(text)}</Text>;
  };
  const label = chart.planets.map((p) => `${p.name} in ${p.sign}${p.certain ? '' : ', uncertain'}`).join(', ');
  const face = size * 0.3;

  return (
    <View
      style={{ width: size, height: size, alignSelf: 'center' }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Birth chart. ${label}${chart.ascendant === null ? '' : `, ${signOf(chart.ascendant)} rising`}`}
    >
      <Canvas style={styles.fill}>
        {dots && (
          <Group layer={<Paint />}>
            <Circle cx={r} cy={r} r={r - 2} paint={dots} />
          </Group>
        )}
        <Circle cx={r} cy={r} r={r - 2} color={colors.ink} style="stroke" strokeWidth={2} />
        <Circle cx={r} cy={r} r={r - RING} color={colors.paper} />
        <Circle cx={r} cy={r} r={r - RING} color={colors.ink} style="stroke" strokeWidth={2} />
        {SIGNS.map((s, i) => {
          const a = at(i * 30, r - RING);
          const b = at(i * 30, r - 2);
          return <Line key={s} p1={vec(a.x, a.y)} p2={vec(b.x, b.y)} color={colors.ink} strokeWidth={2} />;
        })}
        {SIGNS.map((s, i) => {
          const m = at(i * 30 + 15, r - RING / 2 - 1);
          return <Circle key={s} cx={m.x} cy={m.y} r={14} color={colors.paper} />;
        })}
        {moon && <Image image={moon} x={r - face / 2} y={r - face / 2} width={face} height={face} fit="fill" sampling={nearest} />}
        {chart.ascendant !== null && <Circle c={vec(at(chart.ascendant, r - RING).x, at(chart.ascendant, r - RING).y)} r={6} color={colors.ink} />}
      </Canvas>
      {SIGNS.map((s, i) => glyph(s, SIGN_GLYPHS[i], i * 30 + 15, r - RING / 2 - 1, styles.sign))}
      {place(chart).map((p) => glyph(p.key, p.glyph, p.angle, r - RING - 18 - p.ring * 25, styles.planet))}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  glyph: { position: 'absolute', width: 30, height: 30, lineHeight: 30, textAlign: 'center', color: colors.ink },
  sign: { fontSize: 18 },
  planet: { fontSize: 22 },
});
