const fs = require('fs');
const Twitter = require('twitter');
const download = require('download');
require('dotenv').config();


const client = new Twitter({
    consumer_key: process.env.TWITTER_API_KEY,
    consumer_secret: process.env.TWITTER_API_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN,
    access_token_secret: process.env.TWITTER_ACCESS_SECRET
});

let params = {screenName: 'nodejs'};

client.post('/statuses/update', {status: 'This is a test...'}, (err, tweet, res) => {
    if(err) {
        console.log(err);
        throw err;
    }
    console.log('tweeted this:')
    console.log(tweet);
});


// client.get('favorites/list', params, (err, tweets, res) => {
//     if(err) {
//         console.log(err);
//         return;
//     }
//     console.log(tweets);
// });

// download('https://static01.nyt.com/images/2018/02/09/nytfrontpage/scan.pdf', 'dist').then(() => {
//     console.log('done');
// }); 