import fetch from 'node-fetch';
import sharp from 'sharp';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Only POST allowed' });
    }

    try {
        const { imageUrl } = req.body;

        if (!imageUrl) {
            return res.status(400).json({ error: 'Missing imageUrl' });
        }

        const imgResponse = await fetch(imageUrl);
        const imgBuffer = await imgResponse.buffer();

        const metadata = await sharp(imgBuffer).metadata();
        const size = Math.min(metadata.width, metadata.height);

        const squareBuffer = await sharp(imgBuffer)
            .extract({
                left: Math.floor((metadata.width - size) / 2),
                top: Math.floor((metadata.height - size) / 2),
                width: size,
                height: size
            })
            .resize(32, 32, { fit: 'fill' })
            .ensureAlpha()
            .raw()
            .toBuffer();

            const hexColors = [];
            for (let i = 0; i < squareBuffer.length; i += 4) {
                const r = squareBuffer[i];
                const g = squareBuffer[i + 1];
                const b = squareBuffer[i + 2];
                hexColors.push(
                  `${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
                );
            }
            

        return res.status(200).json({ pixels: hexColors });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Image processing failed' });
    }
}
