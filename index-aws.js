const download = require('download');
const AWS = require('aws-sdk');


function generateFileName() {
    let date = new Date()
    let day = ('0' + (date.getDate()-1)).slice(-2);
    let month = ('0' + (date.getMonth() + 1)).slice(-2);
    let year = date.getFullYear();
    let title = `nytimes-${day}-${month}-${year}.pdf`;
  
    return title;
  }

  function getFrontPageUrl() {
    let url = 'https://static01.nyt.com/images/';
    try {
        let date = new Date();
        let day = ('0' + (date.getDate()-1)).slice(-2);
        let month = ('0' + (date.getMonth() + 1)).slice(-2);
        let year = date.getFullYear();
        url += `${year}/${month}/${day}/nytfrontpage/scan.pdf`;    
    } catch(e) {
        console.log("Error creating url");
        url = null;
        throw e;
    }
    console.log('URL');
    console.log(url);
    return url;
}

function downloadFrontPage() {
    let url = getFrontPageUrl();
    return new Promise((resolve, reject) => {
        download(url).then(data => {
            if(!data) {
                reject("There was an error downloading the page")
            }
            resolve(data);
        })
        .catch(err => {
                reject(err);
            });
        });
    }
    
    function saveImage(data) {
        console.log('----attempting to save image----')
        return new Promise((resolve, reject) => {
            let s3 = new AWS.S3();
            let base64data = new Buffer(data, 'binary');
            let bucket = 'nytimes-thumbnails';
            let title = generateFileName();
            s3.putObject({
                Bucket: bucket,
                Key: title,
                Body: base64data,
            }, (err, data) => {
                if(err) {
                    console.log('Error');
                    console.log(err);
                    reject(err);
                }
                resolve(data);
                console.log(`Successfully uploaded front page ${title}`);
            });     
        });
    }


    function appendPhoto() {
      let fileName = generateFileName();
      let bucket = 'nytimes-thumbnails';
      let s3 = new AWS.S3();
      s3.getObject({
          Bucket: bucket,
          Key: fileName
      }, (err, data) => {
          if(err) {
              console.log(err);
              return;
          }
          return data;
      });   
  }
  

exports.handler = (event, context, callback) => {
    downloadFrontPage().then((data) => {
        console.log("Front page downloaded");
            saveImage(data).then((result) =>{
                console.log('result');
                console.log(result);
            });       
        })
        .catch((err) => {
            console.log(err);
            console.error("Error downloading front page");
        });    
};