"use client";

import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { useState } from "react";

export default function Home() {
  const BACKEND_UPLOAD_URL = "http://localhost:3000";

  const [repoUrl, setRepoUrl] = useState("");
  const [uploadId, setUploadId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deployed, setDeployed] = useState(false);
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Deploy your GitHub Repository</CardTitle>
          <CardDescription>
            Enter the URL of your GitHub repository to deploy it
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Label>Github Repository URL</Label>
          <Input
            type="url"
            placeholder="https://github.com/username/repo"
            onChange={(e) => {
              setRepoUrl(e.target.value);
            }}
          />
        </CardContent>
        <CardFooter>
          <Button
            onClick={async () => {
              setUploading(true);
              const res = await axios.post(`${BACKEND_UPLOAD_URL}/deploy`, {
                repoUrl: repoUrl,
              });
              setUploadId(res.data.id);
              setUploading(false);
              const interval = setInterval(async () => {
                const response = await axios.get(
                  `${BACKEND_UPLOAD_URL}/status?id=${res.data.id}`
                );

                if (response.data.status === "DEPLOYED") {
                  clearInterval(interval);
                  setDeployed(true);
                }
              }, 3000);
            }}
            disabled={uploadId !== "" || uploading}
          >
            Deploy
          </Button>
        </CardFooter>
      </Card>
      {deployed && (
        <Card className="w-full max-w-md mt-8">
          <CardHeader>
            <CardTitle className="text-xl">Deployment Status</CardTitle>
            <CardDescription>
              Your website is successfully deployed!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="deployed-url">Deployed URL</Label>
              <Input
                id="deployed-url"
                readOnly
                type="url"
                value={`http://${uploadId}.dev.100xdevs.com:3001/index.html`}
              />
            </div>
            <br />
            <Button className="w-full" variant="outline">
              <a
                href={`http://${uploadId}.10kdevs.com/index.html`}
                target="_blank"
              >
                Visit Website
              </a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
