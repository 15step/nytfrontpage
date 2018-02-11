const fs = require('fs');
const download = require('download');
require('dot-env').config();


download('https://static01.nyt.com/images/2018/02/09/nytfrontpage/scan.pdf', 'dist').then(() => {
    console.log('done');
}); 