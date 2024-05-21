const config = {
    connectionString: process.env.MONGO_DB_URI,
    secret: process.env.APP_SECRET,
    apiUrl: process.env.API_URL,
    env: process.env.ENVIRONMENT,
    aws: {
        s3: {
            appBucketAccessKey: process.env.AWS_S3_APP_BUCKET_ACCESS_KEY,
            appBucketSecretAccessKey: process.env.AWS_S3_APP_BUCKET_SECRET_ACCESS_KEY,
            appBucketName: process.env.AWS_S3_APP_BUCKET_NAME,
            appBucketUrl: process.env.AWS_S3_APP_BUCKET_URL,
            appPODBucketName: process.env.AWS_S3_APP_POD_BUCKET_NAME,
            appPODBucketUrl: process.env.AWS_S3_APP_POD_BUCKET_URL,
            getSignedUrlExpiry: process.env.AWS_S3_APP_ORDERS_ATTACHMENT_SIGNEDKEY_EXPIRY
        }
    },
    imagesUrl: process.env.IMG_CONTENT_URL,
    maxApiRateLimit: process.env.MAX_API_RATE_LIMIT,
    appUrl: process.env.APP_URL,
    appLoginUrl: process.env.APP_LOGIN_URL,
    sendGrid: {
        apiKey: process.env.SENDGRID_API_KEY,
        fromAddress: process.env.SENDGRID_FROM_ADDRESS,
        fromName: process.env.SENDGRID_FROM_NAME
    }
};

module.exports = config;
