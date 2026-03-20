import { Router, Request, Response } from 'express';
const router = Router();

router.get('/', async (req: Request, res: Response) => {
    const { address } = req.query;
    if (!address || typeof address !== 'string') {
        res.status(400).json({ error: 'Address query param required' });
        return;
    }
    try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.status === 'OK' && data.results.length > 0) {
            const { lat, lng } = data.results[0].geometry.location;
            res.json({ lat, lng, formatted_address: data.results[0].formatted_address });
        } else {
            res.json({ lat: null, lng: null, status: data.status });
        }
    } catch (err) {
        console.error('Geocoding error:', err);
        res.status(500).json({ error: 'Geocoding failed' });
    }
});

export default router;