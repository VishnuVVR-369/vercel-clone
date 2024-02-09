import "dotenv/config";

import { readIdFromSQS, downloadS3Folder, copyFinalDist, updateIdInDynamoDB } from "./aws";
import { buildProject } from "./build";

async function main() {
    while (true) {
        const data = await readIdFromSQS();
        const id = data.Messages?.[0].Body;
        if (id) {
            console.log(`Received message with id: ${id}`);
            // Download the deployment folder from S3
            const folderPath = `output/${id}`;
            await downloadS3Folder(folderPath);
            // Build the project
            await buildProject(id);
            // Copy the final dist folder to S3
            await copyFinalDist(id);
            // Update the status of the deployment in DynamoDB
            await updateIdInDynamoDB(id, "DEPLOYED");
        } else {
            console.log("No message received");
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }
}

main();
