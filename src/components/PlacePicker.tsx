import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { usePlaceSearch, type FoundPlace } from '../profile/places';
import { colors } from '../theme';
import { Button } from './Button';

type Props = { value: FoundPlace | null; onChange: (place: FoundPlace | null) => void };

export function PlacePicker({ value, onChange }: Props) {
  const [text, setText] = useState(value?.label ?? '');
  const [attempt, setAttempt] = useState(0);
  const { status, places } = usePlaceSearch(value ? '' : text, attempt);

  return (
    <View style={styles.box}>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={(next) => {
          setText(next);
          onChange(null); // typing again drops the earlier choice
        }}
        placeholder="City"
        placeholderTextColor={colors.parchment}
        accessibilityLabel="City of birth"
        autoCorrect={false}
        autoCapitalize="words"
      />
      {status === 'searching' && <Text style={styles.text}>Searching the maps…</Text>}
      {status === 'error' && (
        <>
          <Text style={styles.text}>The maps could not be reached.</Text>
          <Button label="Try again" onPress={() => setAttempt(attempt + 1)} />
        </>
      )}
      {status === 'done' && places.length === 0 && <Text style={styles.text}>No city found with that name.</Text>}
      {places.map((place) => (
        <Pressable
          key={place.id}
          style={({ pressed }) => [styles.place, pressed && styles.pressed]}
          accessibilityRole="button"
          onPress={() => {
            setText(place.label);
            onChange(place);
          }}
        >
          <Text style={styles.text}>{place.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: 8 },
  input: {
    minHeight: 48, paddingHorizontal: 12, color: colors.bone, fontSize: 18,
    borderWidth: 1, borderColor: colors.brass, backgroundColor: colors.moss,
  },
  place: { minHeight: 48, paddingHorizontal: 12, justifyContent: 'center', borderBottomWidth: 1, borderColor: colors.moss },
  pressed: { opacity: 0.6 },
  text: { color: colors.bone, fontSize: 16 },
});
