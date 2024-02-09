import fs from "fs";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
} from "@aws-sdk/client-dynamodb";

const AWS_REGION = "ap-south-2";
const s3 = new S3Client({ region: AWS_REGION });
const sqs = new SQSClient({ region: AWS_REGION });
const ddb = new DynamoDBClient({ region: AWS_REGION });
const s3BucketName = "vercel-deployment-bucket";
const sqsQueueUrl = "https://sqs.ap-south-2.amazonaws.com/172685186580/Vercel-Deployment-Queue";
const ddbTableName = "vercel-deployment";

export const uploadFile = async (fileName: string, localFilePath: string) => {
  const fileContent = fs.readFileSync(localFilePath);
  await s3.send(
    new PutObjectCommand({
      Bucket: s3BucketName,
      Key: fileName,
      Body: fileContent,
    })
  );
};

export const sendIdToSQS = async (id: string) => {
  await sqs.send(
    new SendMessageCommand({
      QueueUrl: sqsQueueUrl,
      MessageBody: id,
    })
  );
};

export const addIdToDynamoDB = async (id: string, status: string) => {
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

export const getDeploymentStatus = async (id: string) => {
  const data = await ddb.send(
    new GetItemCommand({
      TableName: ddbTableName,
      Key: {
        deploymentId: { S: id },
      },
    })
  );
  if (data.Item) {
    return data.Item.status.S;
  } else {
    return "NOT_FOUND";
  }
};
