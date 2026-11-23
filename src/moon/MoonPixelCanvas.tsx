// Pixel version of MoonCanvas, same props plus pixelSize. Not yet run on a phone.
// Renders into a small offscreen surface, then upscales it with nearest-neighbour.
import { useMemo } from 'react';
import { PixelRatio, StyleSheet, useWindowDimensions } from 'react-native';
import { Canvas, FilterMode, Image, MipmapMode, Skia, TileMode, useImage, type SkSurface } from '@shopify/react-native-skia';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';
import type { MoonProps } from './MoonCanvas';
import { MOON_PIXEL_SKSL } from './moonPixelShader';
import { useMoonPose } from './useMoonPose';

const effect = Skia.RuntimeEffect.Make(MOON_PIXEL_SKSL)!;
const names = Array.from({ length: effect.getUniformCount() }, (_, i) => effect.getUniformName(i));
const nearest = { filter: FilterMode.Nearest, mipmap: MipmapMode.None };

type Props = MoonProps & { pixelSize?: number }; // pixelSize in points

export function MoonPixelCanvas({ sun, pixelSize = 3, lowQuality = false, ...rest }: Props) {
  const { width, height } = useWindowDimensions();
  const packImage = useImage(require('../../assets/moon/moon-pack-pixel.png'));
  const normalImage = useImage(require('../../assets/moon/moon-normal-pixel.png'));
  const moonPose = useMoonPose(rest);
  const surface = useSharedValue<SkSurface | null>(null);

  // whole device pixels per art pixel, so every art pixel is equally large
  const size = PixelRatio.roundToNearestPixel(pixelSize);
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
      uRadius: 0.86,
      uSun: sun,
      uShine: 0.2 + 0.4 * (0.5 - 0.5 * sun[2]),
      uDither: 1,
      uCell: 1,
      uShadows: lowQuality ? 0 : 1,
      uNormalEdge: 0.3,
      uDepthEdge: 0.4,
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
  }, [maps, w, h, atlasW, atlasH, sun, lowQuality]);

  if (!maps) return null;
  return (
    <Canvas style={styles.fill}>
      <Image image={frame} x={(width - w * size) / 2} y={(height - h * size) / 2} width={w * size} height={h * size} fit="fill" sampling={nearest} />
    </Canvas>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
