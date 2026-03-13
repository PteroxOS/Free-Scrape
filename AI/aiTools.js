const axios = require('axios');
const crypto = require('crypto');
const CryptoJS = require('crypto-js');

// Konfigurasi dari script nano
const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCwlO+boC6cwRo3UfXVBadaYwcX
0zKS2fuVNY2qZ0dgwb1NJ+/Q9FeAosL4ONiosD71on3PVYqRUlL5045mvH2K9i8b
AFVMEip7E6RMK6tKAAif7xzZrXnP1GZ5Rijtqdgwh+YmzTo39cuBCsZqK9oEoeQ3
r/myG9S+9cR5huTuFQIDAQAB
-----END PUBLIC KEY-----`;

const APP_ID = "aifaceswap";
const U_ID = "1H5tRtzsBkqXcaJ";
const THEME_VERSION = "83EmcUoQTUv50LhNx0VrdcK8rcGexcP35FcZDcpgWsAXEyO4xqL5shCY6sFIWB2Q";

// Helper functions
function generateRandomString(len) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let res = "";
  for (let i = 0; i < len; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
  return res;
}

function aesenc(data, key) {
  const k = CryptoJS.enc.Utf8.parse(key);
  const encrypted = CryptoJS.AES.encrypt(data, k, {
    iv: k,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  return encrypted.toString();
}

function rsaenc(data) {
  const buffer = Buffer.from(data, 'utf8');
  const encrypted = crypto.publicEncrypt(
    {
      key: PUBLIC_KEY,
      padding: crypto.constants.RSA_PKCS1_PADDING,
    },
    buffer
  );
  return encrypted.toString('base64');
}

function gencryptoheaders(type, fp = null) {
  const e = new Date();
  const n = Math.floor(new Date(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate(), e.getUTCHours(), e.getUTCMinutes(), e.getUTCSeconds()).getTime() / 1000);
  const r = crypto.randomUUID();
  const i = generateRandomString(16);
  const fingerPrint = fp || crypto.randomBytes(16).toString('hex');
  const s = rsaenc(i);

  let signStr = (type === 'upload') ? `${APP_ID}:${r}:${s}` : `${APP_ID}:${U_ID}:${n}:${r}:${s}`;

  return {
    'fp': fingerPrint,
    'fp1': aesenc(`${APP_ID}:${fingerPrint}`, i),
    'x-guide': s,
    'x-sign': aesenc(signStr, i),
    'x-code': Date.now().toString()
  };
}

// Objek utama
const live3d = {
  // Generate satu fingerprint untuk semua request
  fp: crypto.randomBytes(16).toString('hex'),

  // 1. Optimasi prompt (opsional, bisa di-skip jika tidak diperlukan)
  optimizePrompt: async (text) => {
    try {
      const headers = {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'origin': 'https://live3d.io',
        'referer': 'https://live3d.io/',
        'theme-version': THEME_VERSION,
        ...gencryptoheaders('create', live3d.fp) // Gunakan tipe 'create' karena tidak ada tipe khusus optimize
      };
      const { data } = await axios.post('https://app.live3d.io/aitools/of/prompt/optimize', {
        prompt: text,
        fn_name: "demo-prompt-optimize",
        request_from: 9,
        origin_from: "8f3f0c7387123ae0"
      }, { headers });
      return data.code === 200 ? data.data : text;
    } catch {
      return text; // Jika gagal, gunakan prompt asli
    }
  },

  // 2. Buat task generate gambar
  createTask: async (finalPrompt) => {
    const headers = {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
      'origin': 'https://live3d.io',
      'referer': 'https://live3d.io/',
      'theme-version': THEME_VERSION,
      ...gencryptoheaders('create', live3d.fp)
    };
    const payload = {
      fn_name: "demo-image-editor",
      call_type: 3,
      input: {
        model: "nano_banana_pro", // Gunakan model terbaru
        source_images: [],
        prompt: finalPrompt,
        aspect_radio: "1:1",
        request_from: 9
      },
      request_from: 9,
      origin_from: "8f3f0c7387123ae0"
    };
    const { data } = await axios.post('https://app.live3d.io/aitools/of/create', payload, { headers });
    if (data.code !== 200) throw new Error(`Gagal buat task: ${JSON.stringify(data)}`);
    return data.data.task_id;
  },

  // 3. Polling status hingga selesai
  checkStatus: async (taskId) => {
    while (true) {
      const headers = {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'origin': 'https://live3d.io',
        'referer': 'https://live3d.io/',
        'theme-version': THEME_VERSION,
        ...gencryptoheaders('check', live3d.fp)
      };
      const payload = {
        task_id: taskId,
        fn_name: "demo-image-editor",
        call_type: 3,
        request_from: 9,
        origin_from: "8f3f0c7387123ae0"
      };
      const { data } = await axios.post('https://app.live3d.io/aitools/of/check-status', payload, { headers });

      if (data.data.status === 2) {
        // Gunakan domain temp.live3d.io (sesuai contoh nano)
        return `https://temp.live3d.io/${data.data.result_image}`;
      }

      console.log(">> Masih diproses, tunggu 3 detik...");
      await new Promise(r => setTimeout(r, 3000));
    }
  },

  // Fungsi utama
  generate: async (prompt) => {
    try {
      console.log(">> Optimasi prompt...");
      const optimized = await live3d.optimizePrompt(prompt);

      console.log(">> Membuat task...");
      const taskId = await live3d.createTask(optimized);

      console.log(">> Polling hasil (Task ID: " + taskId + ")...");
      const imageUrl = await live3d.checkStatus(taskId);

      return {
        status: true,
        author: "AgungDevX",
        prompt: optimized,
        result: imageUrl
      };
    } catch (err) {
      return { status: false, msg: err.message };
    }
  }
};

// Contoh penggunaan
live3d.generate("Car").then(res => console.log(JSON.stringify(res, null, 2)));

module.exports = live3d;

/** results Json'
{
  "status": true,
  "author": "AgungDevX",
  "prompt": "coloring page, black and white, white background, line art,  \nA classic car with elegant curves and detailed chrome accents is parked beside a winding cobblestone path, its windows slightly open and tires rendered with intricate treads and realistic hubcaps. The car’s sleek body features visible handles, distinct headlight contours, and lines tracing every panel and mirror. Children play nearby, skipping with a jump rope while a dog sits under a shade tree with overhanging branches, casting organic shadows across the road. A street lamp rises from the sidewalk, and distant row houses with flowering window boxes and brick patterns complete a lively urban setting. In the background, winding trails, bushes, and a stylized city skyline add depth. Wisps of clouds drift overhead and birds perch on utility wires, creating a vibrant, interactive atmosphere filled with subtle movement and fine detail, making the car the central focus.",
  "result": "https://temp.live3d.io/ai-demo/image-editor/52e03d0291b2df074e87f2d4ce8a6fc0.webp"
}
**/