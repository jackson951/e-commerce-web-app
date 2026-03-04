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

// Import L for icon fix - only on client side
const L = typeof window !== 'undefined' ? require('leaflet') : null;

// Fix for default marker icons in Leaflet - only on client side
if (typeof window !== 'undefined' && L) {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  });
}

interface GoogleMapsAutocompleteProps {
  onAddressSelect: (address: string, location: { lat: number; lng: number }) => void;
  initialAddress?: string;
  initialLocation?: { lat: number; lng: number };
}

export function GoogleMapsAutocomplete({
  onAddressSelect,
  initialAddress,
  initialLocation
}: GoogleMapsAutocompleteProps) {
  const [address, setAddress] = useState(initialAddress || '');
  const [location, setLocation] = useState(initialLocation || { lat: -26.2041, lng: 28.0473 }); // Default to Johannesburg
  const mapRef = useRef<any>(null);

  // Configure Google Places Autocomplete
  const GoogleAutocomplete = dynamic(() => import('react-google-autocomplete').then(mod => mod.default), { ssr: false });
  
  const handlePlaceSelected = (place: any) => {
    if (place.formatted_address && place.geometry?.location) {
      const newAddress = place.formatted_address;
      const newLocation = {
        lat: place.geometry?.location.lat(),
        lng: place.geometry?.location.lng()
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

  // Map click handler component
  const MapClickHandler = useCallback(() => {
    const MapEvents = () => {
      if (typeof window !== 'undefined' && window.google && window.google.maps) {
        const { useMapEvents } = require('react-leaflet');
        useMapEvents({
          click: (e: any) => {
            const { lat, lng } = e.latlng;
            setLocation({ lat, lng });
            
            // Reverse geocode to get address
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
              if (status === 'OK' && results && results[0]) {
                const newAddress = results[0].formatted_address;
                setAddress(newAddress);
                onAddressSelect(newAddress, { lat, lng });
              }
            });
          }
        });
      }
      return null;
    };
    return <MapEvents />;
  }, [onAddressSelect]);

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
            }}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            defaultValue={address}
            onChange={(e: any) => setAddress(e.target.value)}
          />
        ) : (
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter your delivery address..."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          />
        )}
      </div>

      {/* Map */}
      <div className="rounded-lg overflow-hidden border border-slate-200">
        {typeof window !== 'undefined' ? (
          <MapContainer
            center={[location.lat, location.lng]}
            zoom={15}
            style={{ height: '300px', width: '100%' }}
            ref={mapRef}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <Marker position={[location.lat, location.lng]} />
            <MapClickHandler />
          </MapContainer>
        ) : (
          <div className="h-72 bg-slate-100 flex items-center justify-center text-slate-500">
            Map loading...
          </div>
        )}
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