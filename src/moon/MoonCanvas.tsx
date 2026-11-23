// For src/moon/. Expects the maps in assets/moon/. Not yet run on a phone.
import { PixelRatio, StyleSheet, useWindowDimensions } from 'react-native';
import { Canvas, Fill, FilterMode, ImageShader, MipmapMode, Shader, Skia, useImage } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import { MOON_SKSL } from './moonShader';
import { useMoonPose, type PoseProps } from './useMoonPose';

const effect = Skia.RuntimeEffect.Make(MOON_SKSL)!;
const sampling = { filter: FilterMode.Linear, mipmap: MipmapMode.None };

export type MoonProps = PoseProps & {
  sun: [number, number, number]; // unit vector, view space
  lowQuality?: boolean;
};

export function MoonCanvas({ sun, lowQuality = false, ...rest }: MoonProps) {
  const { width, height } = useWindowDimensions();
  const packImage = useImage(lowQuality ? require('../../assets/moon/moon-pack-low.jpg') : require('../../assets/moon/moon-pack.jpg'));
  const normalImage = useImage(lowQuality ? require('../../assets/moon/moon-normal-low.jpg') : require('../../assets/moon/moon-normal.jpg'));
  const moonPose = useMoonPose(rest);

  const atlasW = packImage?.width() ?? 1;
  const atlasH = packImage?.height() ?? 1;
  const uniforms = useDerivedValue(() => ({
    uRes: [width, height],
    uAtlas: [atlasW, atlasH],
    uRadius: 0.86,
    uSun: sun,
    uShine: 0.2 + 0.4 * (0.5 - 0.5 * sun[2]),
    uDither: 1,
    uCell: Math.max(1, 4 / PixelRatio.get()),
    uShadows: lowQuality ? 0 : 1,
    ...moonPose.value,
  }), [width, height, atlasW, atlasH, sun, lowQuality]);

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
