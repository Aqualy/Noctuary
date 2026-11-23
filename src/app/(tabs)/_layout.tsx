import { Tabs } from 'expo-router/js-tabs';
import type { ComponentProps } from 'react';
import { useEffect, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { Page } from '../../components/Page';
import { colors, fonts } from '../../theme';

type BarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

// Page tabs: the open one joins the paper.
function PageTabs({ state, descriptors, emitter, navigateToTab }: BarProps) {
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const on = Keyboard.addListener('keyboardDidShow', () => setTyping(true));
    const off = Keyboard.addListener('keyboardDidHide', () => setTyping(false));
    return () => {
      on.remove();
      off.remove();
    };
  }, []);

  if (typing) return null;
  return (
    <View style={styles.bar} accessibilityRole="tablist">
      {state.routes.map((route, i) => {
        const open = state.index === i;
        return (
          <Pressable
            key={route.key}
            style={[styles.tab, open && styles.open]}
            onPress={() => {
              const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!open && !event.defaultPrevented) navigateToTab(route.key);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: open }}
            accessibilityLabel={descriptors[route.key].options.title}
          >
            <Text style={[styles.label, open && styles.labelOpen]}>{descriptors[route.key].options.title?.toUpperCase()}</Text>
          </Pressable>
        );
      })}
      <View style={styles.rest} />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Page>
      <Tabs tabBar={(props) => <PageTabs {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.paper } }}>
        <Tabs.Screen name="index" options={{ title: 'Moon' }} />
        <Tabs.Screen name="almanac" options={{ title: 'Almanac' }} />
        <Tabs.Screen name="chart" options={{ title: 'Chart' }} />
      </Tabs>
    </Page>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', backgroundColor: colors.band },
  tab: { minHeight: 52, paddingHorizontal: 16, justifyContent: 'center', borderTopWidth: 2, borderColor: colors.line },
  open: { backgroundColor: colors.paper, borderTopColor: colors.paper },
  rest: { flex: 1, borderTopWidth: 2, borderColor: colors.line },
  label: { color: colors.dim, fontFamily: fonts.body, fontSize: 20 },
  labelOpen: { color: colors.ink },
});
