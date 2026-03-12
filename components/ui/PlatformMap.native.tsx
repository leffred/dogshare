import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Colors } from '@/constants/theme';
import { IconSymbol } from './icon-symbol';

export const PlatformMap = ({ sittings, userLat, userLng, theme, onMarkerPress }: any) => {
  if (!userLat || !userLng) {
    return (
      <View style={[styles.fallbackContainer, { backgroundColor: theme.background }]}>
         <IconSymbol name="map" size={50} color={theme.icon} />
         <Text style={[styles.fallbackText, { color: theme.text }]}>Vos coordonnées sont introuvables.</Text>
      </View>
    );
  }

  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: userLat,
        longitude: userLng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
      showsUserLocation={true}
      showsMyLocationButton={true}
    >
      {/* Marqueurs pour les annonces */}
      {sittings.map((sitting: any) => {
        if (!sitting.profiles?.lat || !sitting.profiles?.lng) return null;
        
        return (
          <Marker
            key={sitting.id}
            coordinate={{
              latitude: sitting.profiles.lat,
              longitude: sitting.profiles.lng,
            }}
            title={`Chien: ${sitting.dogs?.name}`}
            description={`Demande par ${sitting.profiles?.full_name} (${sitting.credits_cost} cr.)`}
            onPress={() => onMarkerPress && onMarkerPress(sitting)}
            pinColor={Colors.light.tint}
          />
        );
      })}
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: '100%',
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fallbackText: {
    marginTop: 15,
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  }
});
