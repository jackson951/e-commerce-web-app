import React, { useState, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

// TypeScript types for Google Maps
declare global {
  interface Window {
    google: any;
  }
}

// Dynamically import MapContainer and related components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });

// Dynamically import Google Autocomplete
const GoogleAutocomplete = dynamic(() => import('react-google-autocomplete').then(mod => mod.default), { ssr: false });

interface GoogleMapsAutocompleteProps {
  onAddressSelect: (address: string, location: { lat: number; lng: number }) => void;
  initialAddress?: string;
  initialLocation?: { lat: number; lng: number };
}

// Map click handler component - moved outside to avoid hooks issues
function MapClickHandler({ setLocation, onAddressSelect }: { 
  setLocation: (location: { lat: number; lng: number }) => void;
  onAddressSelect: (address: string, location: { lat: number; lng: number }) => void;
}) {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.google && window.google.maps) {
      // Use a simpler approach that doesn't rely on hooks
      const handleMapClick = (e: any) => {
        const { lat, lng } = e.latlng;
        setLocation({ lat, lng });
        
        // Reverse geocode to get address
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
          if (status === 'OK' && results && results[0]) {
            const newAddress = results[0].formatted_address;
            onAddressSelect(newAddress, { lat, lng });
          }
        });
      };

      // Add the click handler directly to the map using a timeout to ensure map is ready
      setTimeout(() => {
        import('react-leaflet').then(({ useMap }) => {
          try {
            const map = useMap();
            map.on('click', handleMapClick);
            
            // Cleanup function
            return () => {
              map.off('click', handleMapClick);
            };
          } catch (error) {
            console.warn('Map not ready yet, will retry:', error);
          }
        });
      }, 100);
    }
  }, [setLocation, onAddressSelect]);

  return null;
}

export function GoogleMapsAutocomplete({
  onAddressSelect,
  initialAddress,
  initialLocation
}: GoogleMapsAutocompleteProps) {
  const [address, setAddress] = useState(initialAddress || '');
  const [location, setLocation] = useState(initialLocation || { lat: -26.2041, lng: 28.0473 }); // Default to Johannesburg
  const mapRef = useRef<any>(null);

  // Fix for default marker icons in Leaflet - only on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('leaflet').then(L => {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
        });
      });
    }
  }, []);

  const handlePlaceSelected = (place: any) => {
    if (place && place.formatted_address && place.geometry?.location) {
      const newAddress = place.formatted_address;
      const newLocation = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      };
      
      setAddress(newAddress);
      setLocation(newLocation);
      onAddressSelect(newAddress, newLocation);
      
      // Pan map to selected location
      if (mapRef.current) {
        mapRef.current.setView([newLocation.lat, newLocation.lng], 15);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Address Input */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Search and select your address
        </label>
        {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
          <GoogleAutocomplete
            apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
            onPlaceSelected={handlePlaceSelected}
            options={{
              types: ['address'],
              componentRestrictions: { country: 'za' },
              fields: ['formatted_address', 'geometry.location'],
              strictBounds: false,
            }}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            defaultValue={address}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddress(e.target.value)}
            onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                // Trigger search when Enter is pressed
                const input = e.target as HTMLInputElement;
                if (input.value.trim()) {
                  // Use Google Maps Geocoding API to search
                  if (typeof window !== 'undefined' && window.google && window.google.maps) {
                    const geocoder = new window.google.maps.Geocoder();
                    geocoder.geocode({ 
                      address: input.value.trim(), 
                      componentRestrictions: { country: 'ZA' } 
                    }, (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
                      if (status === 'OK' && results && results.length > 0) {
                        const place = results[0];
                        const newAddress = place.formatted_address || '';
                        const geometry = place.geometry?.location;
                        
                        if (geometry && newAddress) {
                          const newLocation = {
                            lat: geometry.lat(),
                            lng: geometry.lng()
                          };
                          
                          setAddress(newAddress);
                          setLocation(newLocation);
                          onAddressSelect(newAddress, newLocation);
                          
                          // Pan map to selected location
                          if (mapRef.current) {
                            mapRef.current.setView([newLocation.lat, newLocation.lng], 15);
                          }
                        }
                      } else {
                        console.warn('Geocoding failed:', status);
                      }
                    });
                  }
                }
              }
            }}
          />
        ) : (
          <div className="space-y-2">
            <input
              type="text"
              value={address}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddress(e.target.value)}
              placeholder="Enter your delivery address..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
            <p className="text-xs text-amber-600">
              Google Maps API key not configured. Address validation may not work properly.
            </p>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="rounded-lg overflow-hidden border border-slate-200 relative z-10">
        <MapContainer
          center={[location.lat, location.lng]}
          zoom={15}
          style={{ height: '300px', width: '100%' }}
          ref={mapRef}
          className="relative z-10"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <Marker position={[location.lat, location.lng]} />
          <MapClickHandler setLocation={setLocation} onAddressSelect={onAddressSelect} />
        </MapContainer>
      </div>

      {/* Selected Address Display */}
      {address && (
        <div className="p-3 bg-slate-50 rounded-lg">
          <p className="text-sm text-slate-600">Selected Address:</p>
          <p className="text-sm font-medium text-slate-900 mt-1">{address}</p>
          <p className="text-xs text-slate-500 mt-1">
            Location: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
          </p>
        </div>
      )}
    </div>
  );
}