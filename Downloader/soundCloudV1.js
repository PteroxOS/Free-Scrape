const axios = require('axios');

/**
 * SoundCloud Downloader Scraper
 * Taktik: Init Download -> Polling Progress -> Get Direct Link
 */
const soundcloud = {
    download: async (scUrl) => {
        try {
            console.log(`>> Ngamimitian prosés: ${scUrl}`);

            // 1. Lengkah kahiji: Init Download (Ménta ID)
            const initRes = await axios.get('https://p.savenow.to/ajax/download.php', {
                params: {
                    format: '720', // Format standar
                    url: scUrl,
                    api: 'dfcb6d76f2f6a9894gjkege8a4ab232222' // API Key ti hasil sniff manéh
                },
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36',
                    'Referer': 'https://downcloud.cc/'
                }
            });

            const data = initRes.data;
            if (!data.success) throw new Error("Gagal init download lur!");

            const trackId = data.id;
            const progressUrl = data.progress_url;
            console.log(`>> Meunang ID: ${trackId}. Keur nungguan konversi...`);

            // 2. Lengkah kadua: Polling Progress (Nungguan nepi ka Finished)
            let isFinished = false;
            let finalResult = null;

            while (!isFinished) {
                const check = await axios.get(progressUrl, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36' }
                });

                if (check.data.success === 1 && check.data.text === "Finished") {
                    finalResult = check.data.download_url;
                    isFinished = true;
                } else {
                    // Jeda 2 detik améh teu dianggap spam
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }

            return {
                status: true,
                author: "AgungDevX",
                title: data.title || "SoundCloud Track",
                thumb: data.info?.image || null,
                download_url: finalResult
            };

        } catch (err) {
            return {
                status: false,
                msg: err.message
            };
        }
    }
};

// TEST JALANKEUN DI TERMUX
const scLink = "https://soundcloud.com/jroomy/birds-sound";
soundcloud.download(scLink).then(res => {
    console.log(JSON.stringify(res, null, 2));
});

module.exports = soundcloud;

/** 
*** hasil json
***
{
  "status": true,
  "author": "AgungDevX",
  "title": "https://www.facebook.com/share/r/1WCkXg8fsT/",
  "thumb": "https://logo.clearbit.com/www.facebook.com?size=256",
  "download_url": "https://erin89.savenow.to/pacific/?Ahd9tWDvYjHD4XB83L4oijT"
}
**)