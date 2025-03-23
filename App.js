import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import axios from 'axios';
import { useEffect, useState } from 'react';

export default function App() {
  const [location, setLocation] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const API_KEY = 'AIzaSyCGs9GRJMLmoFu2hNG_Dix9p3hD3NQnMUo';

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
      fetchNearbyRestaurants(location.coords.latitude, location.coords.longitude);
    })();
  }, []);

  const fetchNearbyRestaurants = async (latitude, longitude) => {
    try {
      setLoading(true);
      const response = await axios.post(
        'https://places.googleapis.com/v1/places:searchNearby',
        {
          includedTypes: ['restaurant'],
          maxResultCount: 10,
          rankPreference: 'DISTANCE',
          locationRestriction: {
            circle: {
              center: { latitude, longitude },
              radius: 8500.0
            }
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': API_KEY,
            'X-Goog-FieldMask': 'places.displayName,places.photos,places.id,places.formattedAddress,places.rating'
          }
        }
      );

      console.log('Nearby Restaurants Response:', response.data);

      // Process restaurants with photo URLs
      const restaurantsWithPhotos = response.data.places.map(place => {
        const photoUrl = place.photos && place.photos.length > 0 
          ? `https://places.googleapis.com/v1/${place.photos[0].name}/media?maxHeightPx=400&maxWidthPx=400&key=${API_KEY}`
          : null;
        
        return {
          id: place.id,
          name: place.displayName?.text || 'Unknown Restaurant',
          rating: place.rating || 'No rating',
          address: place.formattedAddress || 'Address not available',
          photoUrl
        };
      });

      setRestaurants(restaurantsWithPhotos);
    } catch (error) {
      console.error('Error fetching nearby restaurants:', 
        error.response ? error.response.data : error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderStars = (rating) => {
    if (!rating || rating === 'No rating') return 'No rating';
    
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;
    
    return (
      <View style={styles.starContainer}>
        {[...Array(fullStars)].map((_, i) => <Text key={`full-${i}`} style={styles.star}>★</Text>)}
        {halfStar ? <Text style={styles.star}>✭</Text> : null}
        {[...Array(emptyStars)].map((_, i) => <Text key={`empty-${i}`} style={styles.emptyStar}>☆</Text>)}
        <Text style={styles.ratingText}> ({rating})</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nearby Restaurants</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {restaurants.map((restaurant) => (
            <View key={restaurant.id} style={styles.restaurantItem}>
              <View style={styles.headerRow}>
                <Text style={styles.restaurantName}>{restaurant.name}</Text>
                <View style={styles.ratingContainer}>
                  {renderStars(restaurant.rating)}
                </View>
              </View>
              
              <TouchableOpacity onPress={() => toggleExpand(restaurant.id)}>
                {restaurant.photoUrl ? (
                  <Image 
                    source={{ uri: restaurant.photoUrl }} 
                    style={styles.image}
                    onError={(e) => console.error('Image loading error:', e.nativeEvent.error)}
                  />
                ) : (
                  <View style={styles.noImagePlaceholder}>
                    <Text>No image available</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              {expandedId === restaurant.id && (
                <View style={styles.expandedContent}>
                  <Text style={styles.addressLabel}>Address:</Text>
                  <Text style={styles.addressText}>{restaurant.address}</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}
      
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  scrollContent: {
    padding: 10,
  },
  restaurantItem: {
    marginBottom: 20,
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    color: '#FFD700',
    fontSize: 16,
  },
  emptyStar: {
    color: '#FFD700',
    fontSize: 16,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  noImagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#e1e1e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedContent: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    marginTop: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  addressLabel: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  addressText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  }
});