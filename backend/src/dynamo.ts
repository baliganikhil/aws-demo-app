import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const localEndpoint = process.env.DDB_ENDPOINT;
const isLocal = Boolean(localEndpoint);

const client = new DynamoDBClient({
  endpoint: localEndpoint,
  region: process.env.AWS_REGION ?? "us-east-1",
  credentials: isLocal
    ? {
        accessKeyId: "local",
        secretAccessKey: "local"
      }
    : undefined
});

export const ddbDoc = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true
  }
});

export function getTableName(): string | undefined {
  return process.env.TODOS_TABLE_NAME;
}
