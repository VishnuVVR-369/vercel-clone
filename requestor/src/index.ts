import express from "express";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const AWS_REGION = "ap-south-2";
const s3 = new S3Client({ region: AWS_REGION });
const s3BucketName = "vercel-deployment-bucket";

const app = express();

app.get("/*", async (req, res) => {
  const host = req.hostname;

  const id = host.split(".")[0];
  const filePath = req.path;

  const contents = await s3.send(
    new GetObjectCommand({
      Bucket: s3BucketName,
      Key: `output/${id}${filePath}`,
    })
  );

  const type = filePath.endsWith("html")
    ? "text/html"
    : filePath.endsWith("css")
    ? "text/css"
    : "application/javascript";
  res.set("Content-Type", type);

  res.send(contents.Body);
});

app.listen(3001);
