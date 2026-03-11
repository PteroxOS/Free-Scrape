const axios = require('axios');

/**
 * LAHELU MEME SCRAPER
 * Taktik: Direct API Request (get-search)
 */
const lahelu = {
    /**
     * Neangan meme dumasar query
     * @param {string} query - Kata kunci (misal: 'Spongebob')
     */
    search: async (query) => {
        try {
            if (!query) throw new Error("Asupkeun kata kuncina lur!");

            const { data } = await axios.get(`https://lahelu.com/api/post/get-search`, {
                params: { query: query },
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36'
                }
            });

            const posts = data.postInfos;
            if (!posts || posts.length === 0) {
                return { status: false, msg: "Meme teu kapanggih lur, néang nu séjén!" };
            }

            // Ngolah data sangkan jadi JSON profesional
            const results = posts.map(item => ({
                title: item.title,
                author: item.userUsername,
                media: item.media, // Ieu link gambar/videona
                post_id: item.postID,
                hashtags: item.hashtags || []
            }));

            return {
                status: true,
                author: "AgungDevX",
                total: results.length,
                results: results
            };

        } catch (err) {
            return {
                status: false,
                msg: "Gagal nyokot data ti Lahelu!",
                error: err.message
            };
        }
    }
};

// ==========================================
// TEST JALANKEUN DI TERMUX
// ==========================================
// node lahelu.js
// ==========================================
const keyword = "Spongebob"; 

lahelu.search(keyword).then(res => {
    console.log(JSON.stringify(res, null, 2));
});

module.exports = lahelu;

/** result Json'

{                                                                 "status": true,
  "author": "AgungDevX",
  "total": 6,
  "results": [
    {
      "title": "Meme Puasa By William Vangeance, Spongebob, Mahoraga, Dan Tok Dalang",
      "author": "bimaaulama7355314",                                  "media": "https://cache.lahelu.com/595fdc21-01c0-4d7d-82bd-ae2cb04d6543.mp4",                                                   "post_id": "PQcGRdS3o",
      "hashtags": [
        "puasa",                                                        "spongebob-squarepants",
        "jujutsu-kaisen",
        "upin-ipin",
        "ramadhanlhl3"
      ]
    },
    {
      "title": "Spongebob delete scene",
      "author": "baller_sus",
      "media": "https://cache.lahelu.com/633b5080-665a-4c52-8c36-979dd3d4b10b.mp4",
      "post_id": "PVT9uwOxU",
      "hashtags": [
        "ambatukam",
        "spongebob",
        "wtf"
      ]
    },
    {
      "title": "Meme Spongebob",
      "author": "prabowo_el_sawit",
      "media": "https://cache.lahelu.com/6aba111c-a584-45ef-871d-80903b997d64.mp4",
      "post_id": "PUwCywhIm",
      "hashtags": [
        "roblox"
      ]
    },
    {
      "title": "Spongebob sedang mencari 19 juta lapangan pekerjaan wkwkwk",
      "author": "mraarra",
      "media": "https://cache.lahelu.com/13a71ff8-0c15-4c97-9123-27d82f5909d0.webp",
      "post_id": "PglxfTQiP",
      "hashtags": [
        "relate"
      ]
    },
    {
      "title": "He is spongebob 🧀",
      "author": "cecep_suka_blue_archive_",
      "media": "https://cache.lahelu.com/a8126477-7a36-41a4-bace-c7d8c6c79e6a.mp4",
      "post_id": "Pk2MM4Rvg",
      "hashtags": [
        "spongebob",
        "lagu-spongebob",
        "wtf"
      ]
    },
    {
      "title": "Spongebob director cut",
      "author": "ko_xi",
      "media": "https://cache.lahelu.com/ce51080c-608b-4b4b-9b31-8670aea192e5.mp4",
      "post_id": "PEHH14Jj8",
      "hashtags": [
        "wtf"
      ]
    }
  ]
}
**/