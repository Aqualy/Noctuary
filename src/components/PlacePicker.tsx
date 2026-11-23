import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePlaceSearch, type FoundPlace } from '../profile/places';
import { colors, fonts } from '../theme';
import { Button } from './Button';
import { Field } from './Field';
import { Words } from './Section';

type Props = { value: FoundPlace | null; onChange: (place: FoundPlace | null) => void };

export function PlacePicker({ value, onChange }: Props) {
  const [text, setText] = useState(value?.label ?? '');
  const [attempt, setAttempt] = useState(0);
  const { status, places } = usePlaceSearch(value ? '' : text, attempt);

  return (
    <View>
      <Field
        value={text}
        onChangeText={(next) => {
          setText(next);
          onChange(null); // typing again drops the earlier choice
        }}
        placeholder="City"
        accessibilityLabel="City of birth"
        autoCorrect={false}
        autoCapitalize="words"
      />
      {status === 'searching' && <Words dim>Searching the maps…</Words>}
      {status === 'error' && (
        <>
          <Words>The maps could not be reached.</Words>
          <Button label="Try again" onPress={() => setAttempt(attempt + 1)} plain />
        </>
      )}
      {status === 'done' && places.length === 0 && <Words>No city found with that name.</Words>}
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
  place: { minHeight: 48, paddingHorizontal: 14, justifyContent: 'center', borderBottomWidth: 2, borderColor: colors.line },
  pressed: { backgroundColor: colors.band },
  text: { color: colors.ink, fontFamily: fonts.body, fontSize: 21, textDecorationLine: 'underline' },
});
