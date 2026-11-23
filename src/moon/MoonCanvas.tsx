// For src/moon/. Expects the maps in assets/moon/.
import { PixelRatio, StyleSheet } from 'react-native';
import { Canvas, Fill, FilterMode, ImageShader, MipmapMode, Shader, Skia, useImage } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import { MOON_SKSL } from './moonShader';
import { useMoonPose, type PoseProps } from './useMoonPose';

const effect = Skia.RuntimeEffect.Make(MOON_SKSL)!;
const sampling = { filter: FilterMode.Linear, mipmap: MipmapMode.None };

export type MoonProps = PoseProps & {
  sun: [number, number, number]; // unit vector, view space
  width: number; // points
  height: number;
  lowQuality?: boolean;
};

export function MoonCanvas({ sun, width, height, lowQuality = false, ...rest }: MoonProps) {
  const packImage = useImage(lowQuality ? require('../../assets/moon/moon-pack-low.jpg') : require('../../assets/moon/moon-pack.jpg'));
  const normalImage = useImage(lowQuality ? require('../../assets/moon/moon-normal-low.jpg') : require('../../assets/moon/moon-normal.jpg'));
  const moonPose = useMoonPose(rest);

  const atlasW = packImage?.width() ?? 1;
  const atlasH = packImage?.height() ?? 1;
  // Read outside the worklet: PixelRatio's static methods do not exist on the UI thread.
  const cell = Math.max(1, 4 / PixelRatio.get());
  const uniforms = useDerivedValue(() => ({
    uRes: [width, height],
    uAtlas: [atlasW, atlasH],
    uRadius: 0.86,
    uSun: sun,
    uShine: 0.2 + 0.4 * (0.5 - 0.5 * sun[2]),
    uDither: 1,
    uCell: cell,
    uShadows: lowQuality ? 0 : 1,
    ...moonPose.value,
  }));

  if (!packImage || !normalImage) return null;
  return (
    <Canvas style={styles.fill}>
      <Fill>
        <Shader source={effect} uniforms={uniforms}>
          <ImageShader image={packImage} sampling={sampling} />
          <ImageShader image={normalImage} sampling={sampling} />
        </Shader>
      </Fill>
    </Canvas>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
