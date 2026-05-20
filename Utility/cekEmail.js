// scrap.js
const https = require('https');
const http = require('http');

// Fungsi untuk melakukan request POST
function postRequest(url, data, headers) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const protocol = urlObj.protocol === 'https:' ? https : http;
        
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname,
            method: 'POST',
            headers: {
                ...headers,
                'Content-Length': Buffer.byteLength(JSON.stringify(data))
            }
        };
        
        const req = protocol.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: responseData
                });
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.write(JSON.stringify(data));
        req.end();
    });
}

// Email yang akan di-check
const emails = [
    "bibirjuna@gmail.com",
    "memekjuna@gmail.com", 
    "kontoljuna@gmail.com",
    "susujuna@gmail.com"
];

// Fungsi utama untuk scraping
async function scrapeGmailVer() {
    try {
        console.log('🚀 Memulai proses pengecekan email...\n');
        
        // Step 1: POST ke key.php untuk mendapatkan key
        console.log('📡 Step 1: Mendapatkan key dari server...');
        const keyUrl = 'https://gmailver.com/php/key.php';
        const keyData = { mail: emails };
        const keyHeaders = {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json;charset=utf-8'
        };
        
        const keyResponse = await postRequest(keyUrl, keyData, keyHeaders);
        console.log(`Response status: ${keyResponse.statusCode}`);
        
        // Ambil key dari response (bersihkan HTML error jika ada)
        let key = keyResponse.body.trim();
        console.log(`Raw key response: ${key}`);
        
        // Step 2: POST ke check1.php untuk mengecek status email
        console.log('\n📡 Step 2: Mengecek status email...');
        const checkUrl = 'https://gmailver.com/php/check1.php';
        const checkData = {
            mail: emails,
            key: key,
            fastCheck: false
        };
        const checkHeaders = {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json;charset=utf-8'
        };
        
        const checkResponse = await postRequest(checkUrl, checkData, checkHeaders);
        console.log(`Response status: ${checkResponse.statusCode}`);
        
        // Parse response JSON
        try {
            const result = JSON.parse(checkResponse.body);
            console.log('\n✅ Hasil pengecekan email:');
            console.log('=========================');
            console.log(`Status: ${result.status}`);
            console.log(`Message: ${result.message}`);
            console.log(`Request count: ${result.request_count}`);
            console.log('\nDetail email:');
            console.log('-------------');
            
            result.data.forEach(item => {
                let statusIcon = '❓';
                if (item.status === 'live') statusIcon = '✅';
                else if (item.status === 'Unregistered') statusIcon = '📧';
                else if (item.status === 'Disabled') statusIcon = '⚠️';
                
                console.log(`${statusIcon} ${item.email}: ${item.status} (Index: ${item.index})`);
            });
            
            console.log('\n📊 Ringkasan:');
            console.log(`Total email dicek: ${result.data.length}`);
            const liveCount = result.data.filter(item => item.status === 'live').length;
            const unregCount = result.data.filter(item => item.status === 'Unregistered').length;
            const disabledCount = result.data.filter(item => item.status === 'Disabled').length;
            
            console.log(`✅ Live: ${liveCount}`);
            console.log(`📧 Unregistered: ${unregCount}`);
            console.log(`⚠️ Disabled: ${disabledCount}`);
            
        } catch (parseError) {
            console.log('❌ Gagal memparse response JSON:');
            console.log(checkResponse.body);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Jalankan fungsi scraping
console.log('🔍 Gmail Email Checker Scraper');
console.log('===============================');
console.log(`Email yang akan dicek: ${emails.length} buah`);
console.log('');

scrapeGmailVer();