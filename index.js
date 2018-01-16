const fs = require('fs');
const download = require('download');

download('http://www.nytimes.com/images/2018/01/15/nytfrontpage/scan.pdf', 'dist').then(() => {
    console.log('done');
});