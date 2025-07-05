import fetch from 'node-fetch';
import sharp from 'sharp';

const userAgents = [
  // A list of common user agents — desktop, mobile, browsers, bots etc.
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15',
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  'Mozilla/5.0 (compatible; Bingbot/2.0; +http://www.bing.com/bingbot.htm)',
  // ... add more as you want
];

const referers = [
  'https://www.google.com/',
  'https://www.bing.com/',
  'https://www.yahoo.com/',
  'https://www.duckduckgo.com/',
  '',
  // maybe empty or some random domains
];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') body = JSON.parse(body);

    const { imageUrl } = body;
    if (!imageUrl) {
      return res.status(400).json({ error: 'Missing imageUrl' });
    }

    // Randomize headers for each fetch
    const headers = {
      'User-Agent': getRandomItem(userAgents),
      'Referer': getRandomItem(referers),
      // Add more headers if you want, e.g. Accept, Accept-Language, etc.
    };

    const imgResponse = await fetch(imageUrl, { headers });

    if (!imgResponse.ok) {
      return res.status(imgResponse.status).json({ error: 'Failed to fetch image', status: imgResponse.status });
    }

    const arrayBuffer = await imgResponse.arrayBuffer();
    const imgBuffer = Buffer.from(arrayBuffer);

    const metadata = await sharp(imgBuffer).metadata();
    const size = Math.min(metadata.width, metadata.height);

    const squareBuffer = await sharp(imgBuffer)
      .extract({
        left: Math.floor((metadata.width - size) / 2),
        top: Math.floor((metadata.height - size) / 2),
        width: size,
        height: size,
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
        `${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
      );
    }

    return res.status(200).json({ pixels: hexColors });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Image processing failed', message: err.message });
  }
}
