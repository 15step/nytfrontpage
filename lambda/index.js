var async = require("async");
var gm = require("gm").subClass({imageMagick: true});
var fs = require("fs");
var mktemp = require("mktemp");
const AWS = require('aws-sdk');
const Twitter = require('twitter');


var THUMB_KEY_PREFIX = "thumbnails/",
    THUMB_WIDTH = 512,
    THUMB_HEIGHT = 1024,
    ALLOWED_FILETYPES = ['png', 'jpg', 'jpeg', 'bmp', 'tiff', 'pdf', 'gif'];

var utils = {
  decodeKey: function(key) {
    return decodeURIComponent(key).replace(/\+/g, ' ');
  }
};

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_REGION
});

const client = new Twitter({
    consumer_key: process.env.TWITTER_API_KEY,
    consumer_secret: process.env.TWITTER_API_SECRET ,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN,
    access_token_secret: process.env.TWITTER_ACCESS_SECRET
});

var s3 = new AWS.S3();

function getTweetText() {
  let date = new Date();
  let locale = "en-us";
  let day = ('0' + date.getDate()).slice(-2);
  let month = date.toLocaleString(locale, {month: "long"});
  let year = date.getFullYear();
  let title = `${month} ${day}, ${year}`;

  return title
}

function generateFileName() {
  let date = new Date()
  let day = ('0' + date.getDate()).slice(-2);
  let month = ('0' + (date.getMonth() + 1)).slice(-2);
  let year = date.getFullYear();
  let title = `nytimes-${day}-${month}-${year}.pdf`;

  return title;
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
  
exports.handler = function(event, context) {
  var bucket = event.Records[0].s3.bucket.name,
  srcKey = utils.decodeKey(event.Records[0].s3.object.key),
  dstKey = THUMB_KEY_PREFIX + srcKey.replace(/\.\w+$/, ".png"),
  fileType = srcKey.match(/\.\w+$/);

  if(srcKey.indexOf(THUMB_KEY_PREFIX) === 0) {
    return;
  }

  if (fileType === null) {
    console.error("Invalid filetype found for key: " + srcKey);
    return;
  }

  fileType = fileType[0].substr(1);

  if (ALLOWED_FILETYPES.indexOf(fileType) === -1) {
    console.error("Filetype " + fileType + " not valid for thumbnail, exiting");
    return;
  }


  async.waterfall([
    function download(next) {
      //Download the image from S3
      s3.getObject({
        Bucket: bucket,
        Key: srcKey
      }, next);
    },
    
    function createThumbnail(response, next) {
        var temp_file, image;

        if(fileType === "pdf") {
          temp_file = mktemp.createFileSync("/tmp/XXXXXXXXXX.pdf")
          console.log("writing to temp file");
          fs.writeFileSync(temp_file, response.Body);
          image = gm(temp_file + "[0]");
        } else if (fileType === 'gif') {
          temp_file = mktemp.createFileSync("/tmp/XXXXXXXXXX.gif")
          fs.writeFileSync(temp_file, response.Body);
          image = gm(temp_file + "[0]");
        } else {
          image = gm(response.Body);
        }

        image.size(function(err, size) {
          console.log('resizing image');
          // var scalingFactor = Math.min(THUMB_WIDTH / size.width, THUMB_HEIGHT / size.height),
          // width = scalingFactor * size.width,
          // height = scalingFactor * size.height;

          // this.resize(width, height)
          this.resize(THUMB_WIDTH, THUMB_HEIGHT)
          .toBuffer("png", function(err, buffer) {
            if(temp_file) {
              fs.unlinkSync(temp_file);
            }

            if (err) {
              next(err);
            } else {
              next(null, response.contentType, buffer);
            }
          });
        });
      },

      function uploadThumbnail(contentType, data, next) {
        console.log('uploading thumnail');
        s3.putObject({
          Bucket: bucket,
          Key: dstKey,
          Body: data,
          ContentType: "image/png",
          // ACL: 'public-read',
          Metadata: {
            thumbnail: 'TRUE'
          }
        }, next);
      },
      
      function removeTempFilesAndTweet(next) {
        let s3 = new AWS.S3();
        let title = generateFileName();
        let bucket = 'nytimes-thumbnails';
        console.log("Removing temporary pdf");
        s3.deleteObject({
            Bucket: bucket,
            Key: title,
        }, (err, data) => {
          if(err) {
            console.log(err);
          }
          console.log(`Successfully removed temporary PDF for: ${title}`);
          s3.getObject({
            Bucket: bucket,
            Key: dstKey
          }, (err, data) => {
            if(err) {
              console.log(err);
            }
            console.log(data);
          client.post('media/upload', {media: data.Body}, (err, media, res) => {
            if(err) {
              console.log(err);
              return;
            }
            console.log(media)
            let status = {
              status: getTweetText(),
              media_ids: media.media_id_string
            };
            client.post('/statuses/update', status, (err, tweet, res) => {  
              if(err) {
                console.log(err);
                throw err;
              }   
              console.log('tweeted this:')
              console.log(tweet);
            });
          });
      });
    })
  }
  ],
    function(err) {
        if (err) {
          console.error(
            "Unable to generate thumbnail for '" + bucket + "/" + srcKey + "'" +
            " due to error: " + err
            );
        } else {
          console.log("Created thumbnail for '" + bucket + "/" + srcKey + "'");
        }

        context.done();
      });
};

