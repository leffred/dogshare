import React, { createElement } from 'react';

export const PlatformDatePicker = ({ value, onChange, theme }: any) => {
  // Ajustement fuseau horaire pour éviter les décalages dans l'input local
  const localDate = new Date(value.getTime() - value.getTimezoneOffset() * 60000);
  
  return createElement('input', {
    type: 'datetime-local',
    value: localDate.toISOString().slice(0, 16),
    onChange: (e: any) => {
      if(e.target.value) {
        onChange(new Date(e.target.value));
      }
    },
    style: {
      height: 50,
      width: '100%',
      borderRadius: 8,
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: theme.icon,
      paddingHorizontal: 15,
      fontSize: 16,
      backgroundColor: 'transparent',
      color: theme.text,
      fontFamily: 'inherit',
      outline: 'none',
      boxSizing: 'border-box'
    }
  });
};
