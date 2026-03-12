import { Image } from 'expo-image';
import { Platform, StyleSheet, TouchableOpacity, View, Animated, Text } from 'react-native';
import React, { useRef } from 'react';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Premium shadow for cards across platforms
const premiumShadow = Platform.OS === 'ios' ? {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.1,
  shadowRadius: 12,
} : {
  elevation: 5,
};

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const AnimatedButton = ({ onPress, style, children }: { onPress: () => void, style: any, children: React.ReactNode }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <AnimatedTouchableOpacity
      activeOpacity={0.8}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
      style={[style, { transform: [{ scale: scaleValue }] }]}
    >
      {children}
    </AnimatedTouchableOpacity>
  );
};

export default function HomeScreen() {
  const { signOut, user, profile } = useAuth();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: theme.tint, dark: theme.tint }}
      headerImage={
        <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 40) }]}>
          <IconSymbol name="pawprint.fill" size={80} color="#fff" style={{opacity: 0.2, position: 'absolute', right: -20, bottom: -20}} />
          <Text style={styles.headerTitle}>DogShare</Text>
          <Text style={styles.headerSubtitle}>L'entraide entre maîtres</Text>
        </View>
      }>
      <ThemedView style={styles.titleContainer}>
        <View style={{ flex: 1 }}>
          <ThemedText type="title" style={{fontSize: 28}}>
            Bonjour {profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0]} 👋
          </ThemedText>
        </View>
      </ThemedView>

      <View style={[styles.balanceCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <View style={styles.balanceInfo}>
          <ThemedText style={{ color: theme.icon, fontSize: 16 }}>Solde actuel</ThemedText>
          <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 12}}>
             <IconSymbol name="star.fill" size={32} color={theme.accent} />
             <ThemedText style={{ fontSize: 36, fontWeight: '800', marginLeft: 12, color: theme.text, lineHeight: 44 }}>
               {profile?.credits || 0}
             </ThemedText>
             <ThemedText style={{ fontSize: 18, color: theme.icon, marginLeft: 8, marginTop: 6, fontWeight: '600' }}>Crédits</ThemedText>
          </View>
        </View>
        
        <AnimatedButton 
          style={[styles.primaryAction, { backgroundColor: theme.tint }]}
          onPress={() => router.push('/sittings/create' as any)}
        >
          <IconSymbol name="plus" size={20} color="#fff" />
          <Text style={styles.primaryActionText}>Demander</Text>
        </AnimatedButton>
      </View>
      <View style={styles.featuresGrid}>
        <AnimatedButton 
          style={[styles.featureCard, { backgroundColor: theme.cardBackground }]}
          onPress={() => router.push('/explore' as any)}
        >
          <View style={[styles.featureIconBox, { backgroundColor: theme.tint + '20' }]}>
            <IconSymbol name="map.fill" size={24} color={theme.tint} />
          </View>
          <ThemedText style={styles.featureTitle}>Trouver une garde</ThemedText>
          <ThemedText style={[styles.featureDesc, { color: theme.icon }]}>Voir les annonces autour de vous</ThemedText>
        </AnimatedButton>

        <AnimatedButton 
          style={[styles.featureCard, { backgroundColor: theme.cardBackground }]}
          onPress={() => router.push('/dogs' as any)}
        >
          <View style={[styles.featureIconBox, { backgroundColor: theme.accent + '20' }]}>
            <IconSymbol name="pawprint.fill" size={24} color={theme.accent} />
          </View>
          <ThemedText style={styles.featureTitle}>Mes Chiens</ThemedText>
          <ThemedText style={[styles.featureDesc, { color: theme.icon }]}>Gérer vos profils de chiens</ThemedText>
        </AnimatedButton>
      </View>

      <TouchableOpacity 
        style={[styles.logoutButton, { backgroundColor: theme.background, borderColor: theme.border }]}
        onPress={signOut}
      >
        <IconSymbol name="arrow.right.circle.fill" size={20} color={theme.icon} />
        <ThemedText style={[styles.logoutText, { color: theme.icon }]}>Déconnexion</ThemedText>
      </TouchableOpacity>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  headerContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: '#fff',
    marginTop: 20,
  },
  headerSubtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    marginTop: 8,
  },
  balanceCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 30,
    borderWidth: 0,
    ...premiumShadow,
  },
  balanceInfo: {
    marginBottom: 20,
  },
  primaryAction: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...premiumShadow,
  },
  primaryActionText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginBottom: 40,
  },
  featureCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 20,
    padding: 20,
    ...premiumShadow,
  },
  featureIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 40, // Padding for the bottom bar
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  }
});
