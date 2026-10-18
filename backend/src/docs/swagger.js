const path = require("path");
const fs = require("fs");
const YAML = require("yaml");
const swaggerUi = require("swagger-ui-express");

const specPath = path.join(__dirname, "openapi.yaml");
const swaggerSpec = YAML.parse(fs.readFileSync(specPath, "utf8"));

module.exports = { swaggerUi, swaggerSpec };
