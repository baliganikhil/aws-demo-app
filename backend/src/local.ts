process.env.TODOS_TABLE_NAME = process.env.TODOS_TABLE_NAME ?? "TodosLocal";
process.env.DDB_ENDPOINT = process.env.DDB_ENDPOINT ?? "http://localhost:8000";
process.env.AWS_REGION = process.env.AWS_REGION ?? "us-east-1";

import { DynamoDBClient, CreateTableCommand, DescribeTableCommand } from "@aws-sdk/client-dynamodb";

async function ensureTable(): Promise<void> {
  const client = new DynamoDBClient({
    endpoint: process.env.DDB_ENDPOINT,
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: "local",
      secretAccessKey: "local"
    }
  });

  const tableName = process.env.TODOS_TABLE_NAME as string;

  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }));
  } catch (error) {
    await client.send(
      new CreateTableCommand({
        TableName: tableName,
        BillingMode: "PAY_PER_REQUEST",
        AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
        KeySchema: [{ AttributeName: "id", KeyType: "HASH" }]
      })
    );
  }
}

async function start(): Promise<void> {
  await ensureTable();
  const { app } = await import("./app");
  const port = Number.parseInt(process.env.PORT ?? "3000", 10);
  app.listen(port, () => {
    console.log(`Local API running on http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start local API", error);
  process.exit(1);
});
