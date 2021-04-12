const http = require("http");
const express = require("express");
const bodyParser = require("body-parser");
const AzureStorageBlob = require("@azure/storage-blob");
const { BlobServiceClient } = require("@azure/storage-blob");
var cors = require("cors");
const fileUpload = require("express-fileupload");
const fs = require("fs");
const {
  FormRecognizerClient,
  AzureKeyCredential,
} = require("@azure/ai-form-recognizer");

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const hostname = "127.0.0.1";

const port = process.env.PORT || "3002";
app.set("port", port);

const server = http.createServer(app);
server.listen(port);

// enable files upload
app.use(
  fileUpload({
    createParentPath: true,
  })
);

app.use((req, res, next) => {
  console.log("Enter CORS");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, DELETE, OPTIONS, PUT"
  );
  next();
});

app.options("*", cors()); // include before other routes

app.use("/api/analyze", (req, res, next) => {
  if (!req.files) {
    return res.status(400).send("No files were uploaded.");
  }
  let file = req.files.file;
  uploadPath = __dirname + "\\uploads\\" + new Date().getTime() + ".jpg";
  file.mv(uploadPath, async () => {
    recognizeForm(uploadPath).then((result) => {
      return res.status(200).json({
        output: result,
      });
    });
  });
});

async function recognizeForm(file) {
  const endpoint = "https://myformanalyzeryr.cognitiveservices.azure.com/";
  const apiKey = "5145bd97af024ad7b2f11c0e9de8849e";
  const modelId = "24055ea7-35e6-4bb4-b24e-af767aada9fd";
  console.log("Entering Forms Recognizer");

  let fileStream = fs.createReadStream(file);

  const client = new FormRecognizerClient(
    endpoint,
    new AzureKeyCredential(apiKey)
  );
  const poller = await client.beginRecognizeCustomForms(modelId, fileStream, {
    contentType: "image/jpeg",
    onProgress: (state) => {
      console.log(`status: ${state.status}`);
    },
  });
  const forms = await poller.pollUntilDone();

  console.log("Forms:");
  for (const form of forms || []) {
    console.log(`${form.formType}, page range: ${form.pageRange}`);
    console.log("Pages:");
    for (const page of form.pages || []) {
      console.log(`Page number: ${page.pageNumber}`);
      console.log("Tables");
      for (const table of page.tables || []) {
        for (const cell of table.cells) {
          console.log(
            `cell (${cell.rowIndex},${cell.columnIndex}) ${cell.text}`
          );
        }
      }
    }

    console.log("Fields:");
    for (const fieldName in form.fields) {
      // each field is of type FormField
      const field = form.fields[fieldName];
      console.log(
        `Field ${fieldName} has value '${field.value}' with a confidence score of ${field.confidence}`
      );
    }
  }
  fs.unlinkSync(uploadPath);
  return forms;
}

