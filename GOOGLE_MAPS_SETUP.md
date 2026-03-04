# Google Maps API Setup Guide

## Issue Summary
The address search functionality in your e-commerce site was not working due to several configuration issues:

1. **Missing Google Maps API Key**: The environment variable was not configured
2. **Missing Dependencies**: react-leaflet and leaflet packages were missing
3. **Component Issues**: Dynamic import problems and TypeScript errors

## Fixed Issues

### 1. Environment Configuration
- Added `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to `.env` file
- **IMPORTANT**: You need to replace `YOUR_GOOGLE_MAPS_API_KEY_HERE` with your actual API key

### 2. Dependencies Added
- Added `leaflet: ^1.9.4` to package.json
- react-leaflet was already present but now properly configured

### 3. Component Improvements
- Fixed dynamic import issues in `GoogleMapsAutocomplete.tsx`
- Improved TypeScript handling and error management
- Better fallback when API key is not configured

## How to Get Your Google Maps API Key

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a new project** or select an existing one
3. **Enable APIs**:
   - Google Maps JavaScript API
   - Places API
   - Geocoding API
4. **Create API Key**:
   - Go to "Credentials" in the left menu
   - Click "Create Credentials" → "API Key"
5. **Set Restrictions** (Recommended):
   - Application restrictions: HTTP referrers
   - Add your domain(s): `localhost`, `yourdomain.com`, etc.
   - API restrictions: Restrict to the APIs you enabled

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Edit your `.env` file and replace the placeholder:
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

### 3. Restart Development Server
```bash
npm run dev
```

## Testing the Address Search

### Test Scenarios

1. **Basic Address Search**:
   - Go to Cart page
   - Select "Delivery" option
   - Enter an address in the search box
   - Verify autocomplete suggestions appear
   - Select an address from suggestions

2. **Map Interaction**:
   - After selecting an address, verify the map centers on that location
   - Click on the map to select a different location
   - Verify the address updates based on the clicked location

3. **Form Validation**:
   - Try to checkout without selecting an address (should show error)
   - Verify selected address is properly passed to checkout session

4. **Error Handling**:
   - Test with invalid addresses
   - Test without API key (should show fallback message)

## Expected Behavior

### When API Key is Configured:
- Address autocomplete suggestions appear as you type
- Map centers on selected address
- Clicking on map updates address via reverse geocoding
- Address validation works properly

### When API Key is Missing:
- Fallback text input field with warning message
- Map still displays but without Google integration
- Basic functionality preserved

## Troubleshooting

### Common Issues:

1. **"API key not configured" message**:
   - Check `.env` file has correct API key
   - Restart development server after changes

2. **"This page can't load Google Maps correctly"**:
   - Verify API key has correct permissions
   - Check billing is enabled on Google Cloud project
   - Ensure APIs are enabled (Maps JavaScript, Places, Geocoding)

3. **Autocomplete not working**:
   - Check browser console for errors
   - Verify API key restrictions allow your domain
   - Test with API key restrictions temporarily disabled

4. **Map not displaying**:
   - Check if react-leaflet and leaflet are properly installed
   - Verify no CSS conflicts affecting map container

### Debug Steps:

1. Open browser developer tools
2. Check Console tab for JavaScript errors
3. Check Network tab for failed API requests
4. Verify environment variables are loaded:
   ```javascript
   console.log(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
   ```

## Next Steps

1. **Get your API key** from Google Cloud Console
2. **Update the .env file** with your actual API key
3. **Test the functionality** using the scenarios above
4. **Monitor usage** in Google Cloud Console to ensure you stay within free tier limits

## API Usage Limits

- **Free tier**: $200 monthly credit (~40,000 map loads)
- **Places Autocomplete**: $17 per 1000 requests
- **Geocoding**: $5 per 1000 requests
- **Maps JavaScript**: $7 per 1000 loads

Monitor your usage in Google Cloud Console to avoid unexpected charges.