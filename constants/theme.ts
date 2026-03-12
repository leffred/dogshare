/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#2D5A27'; // Vert Forêt profond
const tintColorDark = '#4CAF50';  // Vert plus clair pour ressortir sur fond sombre
const accentColor = '#E9C46A';    // Sable chaleureux

export const Colors = {
  light: {
    text: '#1A1D1A', // Noir très légèrement teinté de vert
    background: '#F8F9FA', // Coquille d'œuf
    tint: tintColorLight,
    accent: accentColor,
    icon: '#687066',
    tabIconDefault: '#687066',
    tabIconSelected: tintColorLight,
    cardBackground: '#FFFFFF',
    border: '#E8EBE8',
  },
  dark: {
    text: '#ECF0EC',
    background: '#121512', // Noir teinté vert forêt
    tint: tintColorDark,
    accent: accentColor,
    icon: '#9AA49A',
    tabIconDefault: '#9AA49A',
    tabIconSelected: tintColorDark,
    cardBackground: '#1E231E', // Légèrement plus clair que le fond
    border: '#2C332C',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
