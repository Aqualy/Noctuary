import { Tabs } from 'expo-router/js-tabs';
import { Text, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../theme';

// U+FE0E asks for the plain glyph instead of an emoji
const icon = (glyph: string) =>
  function Icon({ color }: { color: ColorValue }) {
    return <Text style={{ color, fontSize: 22 }} accessible={false}>{`${glyph}︎`}</Text>;
  };

export default function TabsLayout() {
  const { bottom } = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.ink },
        tabBarStyle: { backgroundColor: colors.ink, borderTopColor: colors.brass, height: 62 + bottom, paddingTop: 4 },
        tabBarActiveTintColor: colors.bone,
        tabBarInactiveTintColor: colors.brassLight,
        tabBarLabelStyle: { fontFamily: fonts.body, fontSize: 14 },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Moon', tabBarIcon: icon('☾') }} />
      <Tabs.Screen name="almanac" options={{ title: 'Almanac', tabBarIcon: icon('❧') }} />
      <Tabs.Screen name="chart" options={{ title: 'Chart', tabBarIcon: icon('✶') }} />
    </Tabs>
  );
}
