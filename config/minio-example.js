var Minio = require('minio')
var minioClient = new Minio.Client({
    endPoint: 'play.min.io',
    port: 9000,
    useSSL: true, //true is https, false is http
    accessKey: '',
    secretKey: ''
});

module.exports = minioClient