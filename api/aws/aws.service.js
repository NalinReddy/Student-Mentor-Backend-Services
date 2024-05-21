const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const config = require('../config/config');
const { isAllowedAttachmentUpload } = require('../_helpers/utils');

aws.config.update({
    secretAccessKey: config.aws.s3.appBucketSecretAccessKey,
    accessKeyId: config.aws.s3.appBucketAccessKey,
    region: 'us-east-1'
});

const s3 = new aws.S3();


const fileFilter = (req, file, cb) => {
    if (isAllowedAttachmentUpload(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type, only JPEG, PNG, PDF and MS office files are allowed!'), false);
    }
};

const upload = multer({
    fileFilter,
    storage: multerS3({
        acl: 'private',
        s3,
        bucket: config.aws.s3.appBucketName,
        metadata: function (req, file, cb) {
            cb(null, { fieldName: 'signature' });
        },
        key: function (req, file, cb) {
            const fileExt = file.originalname.slice(((file.originalname.lastIndexOf(".") - 1) >>> 0) + 2);
            cb(null, Date.now().toString() + '.' + fileExt);
        }
    })
});


/**
 * Returns an image buffer from a base64 url
 * @param {*} base64 
 * @returns 
 */
function getImgBuffer(base64) {
    console.log(`aws.service.getImgBuffer entered`);
    const base64Str = base64.replace(/^data:image\/\w+;base64,/, '');
    return Buffer.from(base64Str, 'base64');
}

const bufferUpload = async (base64) => {
    console.log(`aws.service.bufferUpload entered`);
    const path = Date.now().toString();
    const buffer = getImgBuffer(base64);
    var data = {
        Key: path,
        Body: buffer,
        ContentEncoding: 'base64',
        ContentType: 'image/png',
        ACL: 'private',
        Bucket: config.aws.s3.appPODBucketName
    };
    console.log(`aws.service.bufferUpload pre-promise`);
    return new Promise((resolve, reject) => {
        s3.putObject(data, async function (err, output) {
            if (err) {
                console.log(`Error uploading data ${JSON.stringify(err)}`);
                reject(err);
            } else {
                console.log(`successfully uploaded the image! data: ${JSON.stringify(output)}`);
                const signedUrl = await generatePODAttachmentSignedUrl(path);
                resolve(signedUrl);
            }
        });
    });
};


async function deleteFileFromS3Bucket(fileName) {
    console.log(`aws.service.deleteFileFromS3Bucket entered`);
    const params = {
      Bucket: config.aws.s3.appBucketName,
      Key: fileName,
    };
  
    return s3.deleteObject(params);
  }

module.exports = {
    bufferUpload,
    deleteFileFromS3Bucket,
    multipleAttachmentUploads,
    deleteAttachment
};
