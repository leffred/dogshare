import React, { useState } from 'react';
import { StyleSheet, View, TextInput, Text, TouchableOpacity, ScrollView, Alert, Platform, Modal, FlatList } from 'react-native';
import { supabase } from '@/utils/supabase';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { Image } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';

const COMMON_BREEDS = [
  "Beagle",
  "Berger Allemand",
  "Berger Australien",
  "Berger Belge (Malinois)",
  "Bouledogue Français",
  "Bouvier Bernois",
  "Cane Corso",
  "Cavalier King Charles",
  "Chihuahua",
  "Cocker Spaniel Anglais",
  "Épagneul Breton",
  "Golden Retriever",
  "Husky Sibérien",
  "Jack Russell Terrier",
  "Labrador Retriever",
  "Pomsky",
  "Setter Anglais",
  "Spitz Allemand",
  "Staffordshire Bull Terrier",
  "Teckel",
  "Yorkshire Terrier",
  "Autre"
];

export default function AddDogScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'error' | 'success'} | null>(null);

  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [otherBreed, setOtherBreed] = useState('');
  const [showBreedPicker, setShowBreedPicker] = useState(false);
  const [photoData, setPhotoData] = useState<ImagePicker.ImagePickerAsset | null>(null);
  
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [character, setCharacter] = useState('');

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPhotoData(result.assets[0]);
    }
  };

  async function saveDog() {
    if (!user) return;
    if (!name.trim()) {
      setMessage({ type: 'error', text: 'Le nom du chien est obligatoire.' });
      return;
    }
    
    setLoading(true);
    setMessage(null);

    let photo_url = null;
    
    if (photoData && photoData.base64) {
      const filePath = `${user.id}/${Date.now()}_avatar.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('dogs')
        .upload(filePath, decode(photoData.base64), {
          contentType: 'image/jpeg',
        });

      if (uploadError) {
        console.error("Storage upload error", uploadError);
        setMessage({ text: "Erreur lors de l'upload de la photo.", type: 'error' });
        setLoading(false);
        return;
      }
      
      const { data: urlData } = supabase.storage.from('dogs').getPublicUrl(filePath);
      photo_url = urlData.publicUrl;
    }

    const finalBreed = breed === 'Autre' ? otherBreed.trim() : breed;

    const newDog = {
      owner_id: user.id,
      name: name.trim(),
      breed: finalBreed || null,
      age: age ? parseInt(age, 10) : null,
      weight: weight ? parseFloat(weight) : null,
      character: character.trim() || null,
      photo_url,
    };

    const { error } = await supabase.from('dogs').insert([newDog]);

    if (error) {
      setMessage({ text: error.message, type: 'error' });
    } else {
      if(Platform.OS !== 'web') Alert.alert('Succès', 'Votre chien a été ajouté !');
      // Go back to the dogs list
      router.back();
    }
    
    setLoading(false);
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
         <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
           <Text style={[{ color: theme.tint, fontSize: 16 }]}>Retour</Text>
         </TouchableOpacity>
         <Text style={[styles.title, { color: theme.text }]}>Ajouter un chien</Text>
      </View>

      {message && (
        <View style={[styles.messageBox, message.type === 'error' ? styles.messageError : styles.messageSuccess]}>
          <Text style={[styles.messageText, message.type === 'error' ? styles.messageTextError : styles.messageTextSuccess]}>
            {message.text}
          </Text>
        </View>
      )}

      <View style={styles.photoContainer}>
        <TouchableOpacity onPress={pickImage} style={[styles.photoButton, { borderColor: theme.icon }]}>
          {photoData ? (
             <Image source={{ uri: photoData.uri }} style={styles.photoPreview} />
          ) : (
             <View style={styles.photoPlaceholder}>
                <IconSymbol name="camera.fill" size={30} color={theme.icon} />
                <Text style={{color: theme.icon, marginTop: 5, fontSize: 12}}>Ajouter une photo</Text>
             </View>
          )}
        </TouchableOpacity>
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: theme.text }]}>Nom *</Text>
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.icon }]}
          onChangeText={setName}
          value={name}
          placeholder="Rex"
          placeholderTextColor={theme.icon}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: theme.text }]}>Race</Text>
        <TouchableOpacity 
          style={[styles.input, styles.dropdownButton, { borderColor: theme.icon }]} 
          onPress={() => setShowBreedPicker(true)}
        >
          <Text style={{ color: breed ? theme.text : theme.icon, fontSize: 16 }}>
            {breed || "Sélectionner une race"}
          </Text>
        </TouchableOpacity>
      </View>

      {breed === 'Autre' && (
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.text }]}>Précisez la race</Text>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.icon }]}
            onChangeText={setOtherBreed}
            value={otherBreed}
            placeholder="Ex: Corgi"
            placeholderTextColor={theme.icon}
          />
        </View>
      )}

      {/* Modal Breed Picker */}
      <Modal visible={showBreedPicker} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Sélectionner une race</Text>
              <TouchableOpacity onPress={() => setShowBreedPicker(false)}>
                <Text style={{ color: theme.tint, fontSize: 16, fontWeight: 'bold' }}>Fermer</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={COMMON_BREEDS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.breedItem, { borderBottomColor: theme.icon + '40' }]}
                  onPress={() => {
                    setBreed(item);
                    setShowBreedPicker(false);
                  }}
                >
                  <Text style={[styles.breedItemText, { color: theme.text }]}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      <View style={styles.row}>
        <View style={[styles.inputContainer, styles.halfInput]}>
          <Text style={[styles.label, { color: theme.text }]}>Âge (années)</Text>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.icon }]}
            onChangeText={setAge}
            value={age}
            keyboardType="numeric"
            placeholder="3"
            placeholderTextColor={theme.icon}
          />
        </View>
        
        <View style={[styles.inputContainer, styles.halfInput]}>
          <Text style={[styles.label, { color: theme.text }]}>Poids (kg)</Text>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.icon }]}
            onChangeText={setWeight}
            value={weight}
            keyboardType="numeric"
            placeholder="25"
            placeholderTextColor={theme.icon}
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: theme.text }]}>Caractère et infos UTILES</Text>
        <TextInput
          style={[styles.textArea, { color: theme.text, borderColor: theme.icon }]}
          onChangeText={setCharacter}
          value={character}
          multiline={true}
          numberOfLines={4}
          placeholder="Il adore jouer à la balle, mais déteste les chats !"
          placeholderTextColor={theme.icon}
          textAlignVertical="top"
        />
      </View>

      <View style={[styles.verticallySpaced, styles.mt20]}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.tint }]}
          onPress={saveDog}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Enregistrement...' : 'Ajouter mon chien'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    position: 'relative',
    justifyContent: 'center'
  },
  backButton: {
    position: 'absolute',
    left: 0,
    padding: 10,
    marginLeft: -10,
    zIndex: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: 'stretch',
  },
  mt20: {
    marginTop: 20,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingTop: 15,
    fontSize: 16,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  messageBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
  },
  messageError: {
    backgroundColor: '#ffebee',
    borderColor: '#ffcdd2',
  },
  messageSuccess: {
    backgroundColor: '#e8f5e9',
    borderColor: '#c8e6c9',
  },
  messageText: {
    fontSize: 14,
    textAlign: 'center',
  },
  messageTextError: {
    color: '#c62828',
  },
  messageTextSuccess: {
    color: '#2e7d32',
  },
  dropdownButton: {
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  breedItem: {
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  breedItemText: {
    fontSize: 16,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  photoButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  }
});
