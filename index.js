const fs = require('fs');
const Twitter = require('twitter');
const download = require('download');
const schedule = require('node-schedule');
const AWS = require('aws-sdk');
require('dotenv').config();

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_REGION
});

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

function saveImage(data) {
        let s3 = new AWS.S3();
        let base64data = new Buffer(data, 'binary');
        let bucket = 'nytimes-thumbnails';
        let title = generateFileName();
        s3.putObject({
            Bucket: bucket,
            Key: title,
            Body: base64data,
        }, (res) => {
            console.log(res);
            console.log(`Successfully uploaded front page ${title}`);
        });
}

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
    return new Promise((resolve, reject) => {
        download(url).then(data => {
            saveImage(data);
            resolve(data);
            })
            .catch(err => {
                reject(err);
            });
        });
    }

function removeTempPDF() {
    let s3 = new AWS.S3();
    let title = generateFileName();
    let bucket = 'nytimes-thumbnails';
    
    s3.deleteObject({
        Bucket: bucket,
        Key: title,
    }, (err, data) => {
        if(!err) {
            console.log(`Successfully removed temporary PDF for: ${title}`);
        }
    });
}

function appendPhoto() {
    
}

function generateFileName() {
    let date = new Date()
    let day = ('0' + date.getDate()).slice(-2);
    let month = ('0' + (date.getMonth() + 1)).slice(-2);
    let year = date.getFullYear();
    let title = `nytimes-${day}-${month}-${year}.pdf`;
  
    return title;
}
  

// saveImage();

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
    console.log("Front page downloaded");
    })
    .catch((err) => {
        console.log(err);
        console.error("Error downloading front page");
    })

// download('https://static01.nyt.com/images/2018/02/09/nytfrontpage/scan.pdf', 'dist').then(() => {
//     console.log('done');
// }); 