const express = require('express');
const router = express.Router();
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./api/swagger.yaml');

router.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

module.exports = router;
