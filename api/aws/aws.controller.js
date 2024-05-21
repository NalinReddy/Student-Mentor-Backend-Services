const express = require('express');
const router = express.Router();
const authorize = require('../_middleware/authorize');
const Role = require('../_helpers/role');
const awsService = require('./aws.service');

const singleUpload = awsService.upload.single('image');

router.post('/image-upload', authorize([Role.Admin, Role.SuperAdmin]), uploadImage);
router.post('/base64-upload', authorize([Role.Admin, Role.SuperAdmin]), uploadBase64);

function uploadImage(req, res) {
    console.log(`entered aws.controller.uploadImage`);

    singleUpload(req, res, function (err) {
        if (err) {
            return res.status(422).json({ errors: [{ title: 'Image Upload Error', detail: err.message }] });
        }

        return res.json({ imageUrl: req.file.location });
    });
}

function uploadMultipleAttachments(req, res) {
    console.log(`entered aws.controller.uploadMultipleAttachments`);
    awsService.multipleAttachmentUploads(req, res);
}

async function generateOrdersAttachmentSignedUrl(req, res) {
    console.log(`entered aws.controller.generateOrdersAttachmentSignedUrl`);
    await awsService.generateOrdersAttachmentSignedUrl(req.body.key).then(urlRes => {
        res.json({urlRes});
    }).catch(err => {
        console.log(err);
        res.status(500).json({message: 'Something went wrong, please try again later.'})
    })
}

async function uploadBase64(req, res) {
    console.log(`entered aws.controller.uploadBase64`);

    try {
        const response = await awsService.bufferUpload(req.body.base64Img);

        return res.json({ imageUrl: response });
    } catch (err) {
        return res.status(422).json({ errors: [{ title: 'Image Buffer Upload Error', detail: err.message }] });
    }
}

async function deleteOrderAttachment(req, res) {
    console.log(`entered aws.controller.deleteOrderAttachment`);

    const fileName = req.body.fileName;
    const orderId = req.params.orderId;
    if (!fileName || !orderId) res.status(400).json({message: 'Bad request, missing required params'});
    try {
        await awsService.deleteAttachment(fileName, orderId, req.user);
        res.json({message: `File ${fileName} deleted successfully.`});
    } catch (err) {
        console.error(`Error deleting file ${fileName} from S3:`, err);
        res.status(422).json({message: err});
    }
}

module.exports = router;
