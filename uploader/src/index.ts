import path from "path";
import express from "express";
import "dotenv/config";
import cors from "cors";
import simpleGit from "simple-git";
import _ from "underscore";

import { getAllFiles } from "./files";
import { uploadFile, sendIdToSQS, getDeploymentStatus, addIdToDynamoDB } from "./aws";

const PORT = 3000 || process.env.PORT;
const app = express();

app.use(cors());
app.use(express.json());

app.get("/status", (req, res) => {
    res.send({
        status: "OK",
    });
});

app.post("/upload", async (req, res) => {
    const repoUrl = req.body.repoUrl;
    const id = Math.random().toString(36).substring(7);
    // 1. Clone the repo
    await simpleGit().clone(repoUrl, path.join(__dirname, `output/${id}`));
    // 2. Get all files in the repo
    const files = getAllFiles(path.join(__dirname, `output/${id}`));
    // 3. Upload all files to S3
    _.each(files, async (file) => {
        await uploadFile(file.slice(__dirname.length + 1), file);
    });
    // 4. Send ID to SQS for deployer to process
    await sendIdToSQS(id);
    // await readIdFromSQS();
    // 5. Add ID to DynamoDB for status
    await addIdToDynamoDB(id, "UPLOADED");
    res.send({
        id: id
    });
});

app.get("/status/:id", async (req, res) => {
    const id = req.params.id;
    const status = await getDeploymentStatus(id);
    res.send({
        id: id,
        status: status
    });
});

app.listen(PORT);
