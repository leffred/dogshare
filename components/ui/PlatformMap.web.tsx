import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
// Seulement dispo sur web
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { IconSymbol } from './icon-symbol';
import L from 'leaflet';

// Fix the default Leaflet icon paths in React (common bug)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png')
});

// Custom Icon for dogshare theme
const customMarkerIcon = new L.Icon({
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'dogshare-marker'
});

export const PlatformMap = ({ sittings, userLat, userLng, theme, onMarkerPress }: any) => {
  if (Platform.OS !== 'web') return null;
  
  if (!userLat || !userLng) {
    return (
      <View style={[styles.fallbackContainer, { backgroundColor: theme.background }]}>
         <IconSymbol name="map" size={50} color={theme.icon} />
         <Text style={[styles.fallbackText, { color: theme.text }]}>Vos coordonnées sont introuvables.</Text>
      </View>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <MapContainer 
        center={[userLat, userLng]} 
        zoom={13} 
        style={{ height: "100%", width: "100%", zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* User Location Marker (Blueish to differentiate) */}
        <Marker position={[userLat, userLng]}>
          <Popup>
            <strong>Vous êtes ici</strong>
          </Popup>
        </Marker>

        {/* Marqueurs pour les annonces */}
        {sittings.map((sitting: any) => {
          if (!sitting.profiles?.lat || !sitting.profiles?.lng) return null;
          
          return (
            <Marker
              key={sitting.id}
              position={[sitting.profiles.lat, sitting.profiles.lng]}
              icon={customMarkerIcon}
              eventHandlers={{
                click: () => onMarkerPress && onMarkerPress(sitting),
              }}
            >
              <Popup>
                <div style={{ textAlign: 'center' }}>
                  <strong>{sitting.dogs?.name}</strong> <br/>
                  Demande par {sitting.profiles?.full_name} <br/>
                  <span style={{ color: '#0a7ea4', fontWeight: 'bold' }}>{sitting.credits_cost} crédits</span>
                  <br/>
                  <button 
                    onClick={() => onMarkerPress && onMarkerPress(sitting)}
                    style={{
                      marginTop: 8,
                      backgroundColor: '#0a7ea4',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      padding: '5px 10px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    Voir l'annonce
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      <style>
         {`
           .dogshare-marker { filter: hue-rotate(150deg); }
         `}
      </style>
    </div>
  );
};

const styles = StyleSheet.create({
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
