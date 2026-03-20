const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const apiUrl = process.env.FRONTEND_API_URL || 'http://localhost:3000/api';
const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY || '';
const production = process.env.NODE_ENV === 'production';

const env = `export const environment = {
  production: ${production},
  apiUrl: '${apiUrl}',
  googleMapsApiKey: '${googleMapsApiKey}'
};
`;

fs.mkdirSync(path.resolve(__dirname, 'frontend/src/environments'), {
  recursive: true,
});

fs.writeFileSync(
  path.resolve(__dirname, 'frontend/src/environments/environment.ts'),
  env
);

console.log('environment.ts generated from environment variables');