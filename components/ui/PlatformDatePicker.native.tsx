import React, { useState } from 'react';
import { Platform, TouchableOpacity, Text, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

export const PlatformDatePicker = ({ value, onChange, theme }: any) => {
  const [show, setShow] = useState(false);

  const formatDateTimeNative = (date: Date) => {
    return date.toLocaleString('fr-FR', { 
      day: '2-digit', month: '2-digit', year: 'numeric', 
      hour: '2-digit', minute: '2-digit'
    }).replace(',', ' à');
  };

  return (
    <>
      <TouchableOpacity 
        style={[styles.input, { borderColor: theme.icon }]}
        onPress={() => setShow(true)}
      >
        <Text style={{ color: theme.text }}>{formatDateTimeNative(value)}</Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={value}
          mode="datetime"
          display="default"
          onChange={(event: any, date?: Date) => {
            setShow(Platform.OS === 'ios');
            if (event.type === 'set' && date) onChange(date);
            if (event.type === 'dismissed') setShow(false);
          }}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    justifyContent: 'center',
  }
});
