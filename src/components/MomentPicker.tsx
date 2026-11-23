import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import { EARLIEST, readable, toTime } from '../profile/dates';
import { colors } from '../theme';
import { Button } from './Button';

type Props = { mode: 'date' | 'time'; value: Date; onChange: (value: Date) => void };

// iOS shows its wheels in place, Android opens its own dialog.
export function MomentPicker({ mode, value, onChange }: Props) {
  const limits = mode === 'date' ? { minimumDate: EARLIEST, maximumDate: new Date() } : {};

  if (Platform.OS === 'android') {
    return (
      <Button
        label={mode === 'date' ? readable(value) : toTime(value)}
        onPress={() => DateTimePickerAndroid.open({ mode, value, is24Hour: true, ...limits, onValueChange: (_event, date) => onChange(date) })}
      />
    );
  }
  return (
    <DateTimePicker
      mode={mode}
      display="spinner"
      themeVariant="light"
      textColor={colors.ink}
      locale="en-GB"
      value={value}
      {...limits}
      onValueChange={(_event, date) => onChange(date)}
    />
  );
}
