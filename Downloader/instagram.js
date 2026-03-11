const axios = require('axios');
const cheerio = require('cheerio');

/**
 * INSTAGRAM DOWNLOADER SCRAPER
 * Source: indown.io
 */
const igDown = {
    // Fungsi jang nyieun IP acak (bypass rate limit)
    generateIP: () => {
        const octet = () => Math.floor(Math.random() * 256);
        return `${octet()}.${octet()}.${octet()}.${octet()}`;
    },

    download: async (url) => {
        try {
            if (!url.includes('instagram.com')) throw new Error("Link Instagram teu valid lur!");

            const randomIP = igDown.generateIP();
            const client = axios.create({
                baseURL: 'https://indown.io',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'x-forwarded-for': randomIP,
                    'x-real-ip': randomIP
                }
            });

            // 1. Cokot Token jeung Cookie mimitina
            const getHome = await client.get('/');
            const $ = cheerio.load(getHome.data);
            const token = $('input[name="_token"]').val();
            const cookies = getHome.headers['set-cookie']?.join('; ');

            if (!token) throw new Error("Gagal nyokot token sési!");

            // 2. Kirim Data ka /download
            const params = new URLSearchParams();
            params.append('referer', 'https://indown.io/');
            params.append('locale', 'en');
            params.append('_token', token);
            params.append('link', url);

            const { data: resultHtml } = await client.post('/download', params, {
                headers: {
                    'Cookie': cookies,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            // 3. Bedah hasilna (Video atawa Gambar)
            const $res = cheerio.load(resultHtml);
            const media = [];

            // Cék Video
            const video = $res('div.container.mt-4 video source').attr('src');
            if (video) {
                media.push(video);
            } else {
                // Cék Gambar (Mun carousel/slide)
                $res('div.container.mt-4 img').each((i, el) => {
                    const img = $res(el).attr('src');
                    if (img && !img.includes('logo')) media.push(img);
                });
            }

            if (media.length === 0) throw new Error("Media teu kapanggih lur, pariksa deui linkna.");

            return {
                status: true,
                author: "AgungDevX",
                results: media
            };

        } catch (err) {
            return {
                status: false,
                msg: err.message
            };
        }
    }
};

// ==========================================
// TEST JALANKEUN DI TERMUX
// ==========================================
// node ig.js
// ==========================================
const igUrl = "https://www.instagram.com/reel/CsC2PQCNgM1/"; // Ganti ku link nu bener

igDown.download(igUrl).then(res => {
    console.log(JSON.stringify(res, null, 2));
});

module.exports = igDown;

/** results JSON
{
  "status": true,
  "author": "AgungDevX",
  "results": [
    "https://scontent-arn2-1.cdninstagram.com/o1/v/t2/f2/m82/AQPBR7k7Xf2FVNZaTAVrpT4cpBX_6lua_VVVEyODW6B500oAydMRw7o6cD9EeD6Ad94zwjk5IaVrA_32Q8DnslPIDCAohxQVXhTbHEA.mp4?_nc_cat=108&_nc_sid=5e9851&_nc_ht=scontent-arn2-1.cdninstagram.com&_nc_ohc=WppNxxYREW8Q7kNvwEExLxD&efg=eyJ2ZW5jb2RlX3RhZyI6Inhwdl9wcm9ncmVzc2l2ZS5JTlNUQUdSQU0uQ0xJUFMuQzMuNzIwLmRhc2hfYmFzZWxpbmVfMV92MSIsInhwdl9hc3NldF9pZCI6NjIzNDE5MjAzMDQ1MTcwLCJhc3NldF9hZ2VfZGF5cyI6MTAzNiwidmlfdXNlY2FzZV9pZCI6MTAwOTksImR1cmF0aW9uX3MiOjExLCJ1cmxnZW5fc291cmNlIjoid3d3In0%3D&ccb=17-1&_nc_gid=kwEuNa4U4EJGybKK67LqmA&_nc_ss=8&_nc_zt=28&vs=f2b617bb2cd5da&_nc_vs=HBksFQIYT2lnX3hwdl9yZWVsc19wZXJtYW5lbnRfcHJvZC9EQjRCOTJGMDVDQzIyMkQyQzMwNDNDOTEzODgzQ0Q4MV92aWRlb19kYXNoaW5pdC5tcDQVAALIARIAFQIYOnBhc3N0aHJvdWdoX2V2ZXJzdG9yZS9HRDZUcEJUQ0FsVk1RTG9DQUxHdmRwQnFFUTBvYnFfRUFBQUYVAgLIARIAKAAYABsCiAd1c2Vfb2lsATEScHJvZ3Jlc3NpdmVfcmVjaXBlATEVAAAm5JymguO_mwIVAigCQzMsF0AmVP3ztkWiGBJkYXNoX2Jhc2VsaW5lXzFfdjERAHX-B2XmnQEA&oh=00_AfxIZDEF_JXAW_jIF0oVQ2fS8qPTSaMW8cCnxO2Dhhw_Mg&oe=69B3AC4D"
  ]
}
**/