// The Moon printed on paper, same props as MoonCanvas.
// Renders into a small offscreen surface, then upscales it with nearest-neighbour.
import { useMemo } from 'react';
import { PixelRatio, StyleSheet } from 'react-native';
import { Canvas, FilterMode, Image, MipmapMode, Skia, TileMode, useImage, type SkSurface } from '@shopify/react-native-skia';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';
import type { MoonProps } from './MoonCanvas';
import { MOON_PRINT_SKSL } from './moonPrintShader';
import { useMoonPose } from './useMoonPose';

const effect = Skia.RuntimeEffect.Make(MOON_PRINT_SKSL)!;
const names = Array.from({ length: effect.getUniformCount() }, (_, i) => effect.getUniformName(i));
const nearest = { filter: FilterMode.Nearest, mipmap: MipmapMode.None };

const DOT = 1.34; // points

export function MoonPrintCanvas({ sun, width, height, lowQuality = false, ...rest }: MoonProps) {
  const packImage = useImage(require('../../assets/moon/moon-pack-low.jpg'));
  const normalImage = useImage(require('../../assets/moon/moon-normal-low.jpg'));
  const moonPose = useMoonPose(rest);
  const surface = useSharedValue<SkSurface | null>(null);

  // whole device pixels per printed dot, so every dot is equally large
  const size = PixelRatio.roundToNearestPixel(lowQuality ? DOT * 1.5 : DOT);
  const w = Math.ceil(width / size);
  const h = Math.ceil(height / size);

  const maps = useMemo(() => {
    if (!packImage || !normalImage) return null;
    return [packImage, normalImage].map((m) => m.makeShaderOptions(TileMode.Clamp, TileMode.Clamp, FilterMode.Linear, MipmapMode.None));
  }, [packImage, normalImage]);
  const atlasW = packImage?.width() ?? 1;
  const atlasH = packImage?.height() ?? 1;

  const frame = useDerivedValue(() => {
    if (!maps) return null;
    let target = surface.value;
    if (!target || target.width() !== w || target.height() !== h) {
      target = Skia.Surface.MakeOffscreen(w, h);
      if (!target) return null;
      surface.value = target;
    }
    const values: Record<string, number | number[]> = {
      uRes: [w, h],
      uAtlas: [atlasW, atlasH],
      uRadius: 0.94,
      uSun: sun,
      uShine: 0.2 + 0.4 * (0.5 - 0.5 * sun[2]),
      uDither: 0,
      uCell: 1,
      uShadows: lowQuality ? 0 : 1,
      uContrast: 1.5,
      uLines: 1,
      ...moonPose.value,
    };
    const flat: number[] = [];
    for (let i = 0; i < names.length; i++) {
      const v = values[names[i]];
      if (typeof v === 'number') flat.push(v);
      else for (let k = 0; k < v.length; k++) flat.push(v[k]);
    }
    const paint = Skia.Paint();
    paint.setShader(effect.makeShaderWithChildren(flat, maps));
    target.getCanvas().drawPaint(paint);
    target.flush();
    return target.makeImageSnapshot();
  });

  if (!maps) return null;
  return (
    <Canvas style={styles.fill}>
      <Image image={frame} x={(width - w * size) / 2} y={(height - h * size) / 2} width={w * size} height={h * size} fit="fill" sampling={nearest} />
    </Canvas>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
