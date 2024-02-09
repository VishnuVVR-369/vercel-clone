import fs from "fs";
import path from "path";
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from "@aws-sdk/client-sqs";
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

import { getAllFiles } from "./files";

const AWS_REGION = "ap-south-2";
const sqs = new SQSClient({ region: AWS_REGION });
const s3 = new S3Client({ region: AWS_REGION });
const ddb = new DynamoDBClient({ region: AWS_REGION });
const sqsQueueUrl =
  "https://sqs.ap-south-2.amazonaws.com/172685186580/Vercel-Deployment-Queue";
const s3BucketName = "vercel-deployment-bucket";
const ddbTableName = "vercel-deployment";

const uploadFile = async (fileName: string, localFilePath: string) => {
  const fileContent = fs.readFileSync(localFilePath);
  await s3.send(
    new PutObjectCommand({
      Bucket: s3BucketName,
      Key: fileName,
      Body: fileContent,
    })
  );
};

export const readIdFromSQS = async () => {
  const data = await sqs.send(
    new ReceiveMessageCommand({
      QueueUrl: sqsQueueUrl,
    })
  );
  if (data.Messages) {
    await sqs.send(
      new DeleteMessageCommand({
        QueueUrl: sqsQueueUrl,
        ReceiptHandle: data.Messages[0].ReceiptHandle,
      })
    );
  }
  return data;
};

export const downloadS3Folder = async (prefix: string) => {
  const allFiles = await s3.send(
    new ListObjectsV2Command({
      Bucket: s3BucketName,
      Prefix: prefix,
    })
  );
  if (allFiles.Contents) {
    const allPromises = allFiles.Contents.map(async ({ Key }) => {
      return new Promise(async (resolve) => {
        if (!Key) {
          resolve("");
          return;
        }
        const finalOutputPath = path.join(__dirname, Key);
        const outputFile = fs.createWriteStream(finalOutputPath);
        const dirName = path.dirname(finalOutputPath);
        if (!fs.existsSync(dirName)) {
          fs.mkdirSync(dirName, { recursive: true });
        }
        const { Body } = await s3.send(
          new GetObjectCommand({
            Bucket: s3BucketName,
            Key: Key,
          })
        );
        if (Body) {
          // @ts-ignore
          Body.pipe(outputFile).on("finish", () => {
            resolve("");
          });
        }
      });
    });
    await Promise.all(allPromises);
  }
};

export const copyFinalDist = async (id: string) => {
  const folderPath = path.join(__dirname, `output/${id}/dist`);
  const allFiles = getAllFiles(folderPath);
  allFiles.forEach((file) => {
    uploadFile(`dist/${id}/` + file.slice(folderPath.length + 1), file);
  });
};

export const updateIdInDynamoDB = async (id: string, status: string) => {
  await ddb.send(
    new PutItemCommand({
      TableName: ddbTableName,
      Item: {
        deploymentId: { S: id },
        status: { S: status },
      },
    })
  );
};
