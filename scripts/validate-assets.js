const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const sourcesPath = path.join(root, "assets", "sources.json");
const allowedAnswers = new Set(["goose", "duck"]);
const requiredFields = [
  "id",
  "title",
  "answer",
  "file",
  "clue",
  "provider"
];
const optionalUrlFields = ["downloadUrl", "sourceUrl"];

const errors = [];

function fail(message) {
  errors.push(message);
}

if (!fs.existsSync(sourcesPath)) {
  fail("assets/sources.json is missing.");
}

let records = [];
if (errors.length === 0) {
  try {
    records = JSON.parse(fs.readFileSync(sourcesPath, "utf8"));
  } catch (error) {
    fail(`assets/sources.json is not valid JSON: ${error.message}`);
  }
}

if (!Array.isArray(records)) {
  fail("assets/sources.json must be a JSON array.");
}

const seenIds = new Set();
const seenFiles = new Set();

if (Array.isArray(records)) {
  records.forEach((record, index) => {
    const label = record && record.id ? record.id : `entry #${index + 1}`;

    requiredFields.forEach((field) => {
      if (typeof record?.[field] !== "string" || record[field].trim() === "") {
        fail(`${label}: "${field}" must be a non-empty string.`);
      }
    });

    if (record?.id) {
      if (seenIds.has(record.id)) {
        fail(`${label}: duplicate id "${record.id}".`);
      }
      seenIds.add(record.id);
    }

    if (record?.answer && !allowedAnswers.has(record.answer)) {
      fail(`${label}: answer must be "goose" or "duck".`);
    }

    if (record?.file) {
      if (!record.file.startsWith("assets/")) {
        fail(`${label}: file must be a relative assets/ path.`);
      }
      if (seenFiles.has(record.file)) {
        fail(`${label}: duplicate file "${record.file}".`);
      }
      seenFiles.add(record.file);

      const filePath = path.join(root, record.file);
      if (!fs.existsSync(filePath)) {
        fail(`${label}: image file does not exist at ${record.file}.`);
      }
    }

    optionalUrlFields.forEach((field) => {
      if (record?.[field] && !/^https?:\/\//.test(record[field])) {
        fail(`${label}: ${field} must start with http:// or https://.`);
      }
    });
  });
}

if (errors.length > 0) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log(`Validated ${records.length} image source records.`);
