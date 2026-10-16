// Swagger/OpenAPI wiring for the ResumeLens API.
//
// The full spec lives in ./openapi.yaml (generated from the route files
// and controllers — it documents the real API, no invented endpoints).
// This module loads it and exposes the pieces needed to mount the docs:
//
//   const { swaggerUi, swaggerSpec } = require("./docs/swagger");
//   app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
//
// NOTE: mounting in app.js is done centrally by the parent stage — do not
// mount here.
const path = require("path");
const fs = require("fs");
const YAML = require("yaml");
const swaggerUi = require("swagger-ui-express");

const specPath = path.join(__dirname, "openapi.yaml");
const swaggerSpec = YAML.parse(fs.readFileSync(specPath, "utf8"));

module.exports = { swaggerUi, swaggerSpec };
