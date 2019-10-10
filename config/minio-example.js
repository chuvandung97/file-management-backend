var Minio = require('minio')
var minioClient = new Minio.Client({
    endPoint: 'play.min.io',
    port: 9000,
    useSSL: true,
    accessKey: '',
    secretKey: ''
});

module.exports = minioClient