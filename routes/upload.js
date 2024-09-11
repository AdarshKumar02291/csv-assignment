const express = require("express");
const multer = require("multer");
const csvParser = require("csv-parser");
const stream = require("stream");

const uploadRouter = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const validateCSVFormat = (parsedData) => {
  if (!Array.isArray(parsedData) || parsedData.length === 0) {
    return { isValid: false, error: "CSV data is empty or not an array" };
  }

  const requiredFields = ["S.No", "Product Name", "Input Image Urls"];
  const isValidStructure = parsedData.every((row) => {
    return requiredFields.every((field) => field in row);
  });

  if (!isValidStructure) {
    return { isValid: false, error: "CSV is missing required fields" };
  }

  const isValidContent = parsedData.every((row) => {
    const isValidSNo = /^\d+$/.test(row["S.No"]);
    const isValidProductName = row["Product Name"].trim() !== "";
    const isValidImageUrls = row["Input Image Urls"]
      .split(",")
      .every(
        (url) =>
          url.trim().startsWith("https://") && url.trim().endsWith(".jpg")
      );

    return isValidSNo && isValidProductName && isValidImageUrls;
  });

  if (!isValidContent) {
    return { isValid: false, error: "CSV contains invalid data" };
  }

  return { isValid: true };
};

uploadRouter.post("/input", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  const results = [];

  const bufferStream = new stream.PassThrough();
  bufferStream.end(req.file.buffer);

  bufferStream
    .pipe(csvParser())
    .on("data", (data) => results.push(data))
    .on("end", () => {
      const validationResult = validateCSVFormat(results);

      if (!validationResult.isValid) {
        return res.status(400).json({
          message: "CSV file validation failed",
          error: validationResult.error,
        });
      }
      res.json({ message: "CSV file processed successfully", data: results });
    })
    .on("error", (err) => {
      res
        .status(500)
        .json({ message: "Error parsing file", error: err.message });
    });
});

module.exports = uploadRouter;
