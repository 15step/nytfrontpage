const fs = require('fs');
const Twitter = require('twitter');
const download = require('download');
const schedule = require('node-schedule');
require('dotenv').config();


const client = new Twitter({
    consumer_key: process.env.TWITTER_API_KEY,
    consumer_secret: process.env.TWITTER_API_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN,
    access_token_secret: process.env.TWITTER_ACCESS_SECRET
});

let params = {screenName: 'nodejs'};

// schedule.scheduledJobs('0 0 * * *', () => {
//     //post tweet everyday at midnight
// });

function getFrontPageUrl() {
    let url = 'https://static01.nyt.com/images/';
    try {
        let date = new Date();
        let day = ('0' + date.getDate()).slice(-2);
        let month = ('0' + (date.getMonth() + 1)).slice(-2);
        let year = date.getFullYear();
        url += `${year}/${month}/${day}/nytfrontpage/scan.pdf`;    
    } catch(e) {
        console.log("Error creating url");
        url = null;
        throw e;
    }
    return url;
}

function downloadFrontPage() {
    let url = getFrontPageUrl();
    let dir = './dist';
    return new Promise((resolve, reject) => {
        if(!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        download(url).then(data => {
                fs.writeFileSync('dist/mynytimes.pdf', data);
                resolve(data);
            })
            .catch(err => {
                reject(err);
            });
        });
    
}

// function postTweet() {
//     client.post('/statuses/update', {status: 'This is a test...'}, (err, tweet, res) => {
//         if(err) {
//             console.log(err);
//             throw err;
//         }
//         console.log('tweeted this:')
//         console.log(tweet);
//     });    
// }

downloadFrontPage().then((result) => {
    console.log("Downloaded front page");
    })
    .catch((err) => {
        console.log(err);
        console.log("I erred");
    })

// download('https://static01.nyt.com/images/2018/02/09/nytfrontpage/scan.pdf', 'dist').then(() => {
//     console.log('done');
// }); 