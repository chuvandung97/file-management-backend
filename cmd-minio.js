module.exports = {
    createPolicy(alias) {
        return 'mc admin policy add ' + alias + ' readwrite policy/readwrite.json'
    }, 
    createUser(alias, email, password) {
        return 'mc admin user add ' + alias + ' ' + email + ' ' + password
    }, 
    setUserPolicy(alias, email) {
        return 'mc admin policy set ' + alias + ' readwrite user=' + email
    },
    setAwsAccessKeyId(key) {
        return 'set AWS_ACCESS_KEY_ID=' + key
    },
    setAwsSecretAccessKey(key) {
        return 'set AWS_SECRET_ACCESS_KEY=' + key
    },
    createResticBucketBackup(bucket) {
        return 'restic -r s3:http://localhost:9000/' + bucket + ' init'
    },
    saveBucketBackup(bucket, folder) {
        return 'restic -r s3:http://localhost:9000/' + bucket + ' backup ' + folder
    }
}