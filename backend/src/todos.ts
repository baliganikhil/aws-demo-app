import {
  DeleteCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand
} from "@aws-sdk/lib-dynamodb";
import { ddbDoc, getTableName } from "./dynamo";
import { randomUUID } from "node:crypto";

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

function requireTableName(): string {
  const tableName = getTableName();
  if (!tableName) {
    throw new Error("TODOS_TABLE_NAME is not set");
  }
  return tableName;
}

export async function listTodos(): Promise<TodoItem[]> {
  const response = await ddbDoc.send(
    new ScanCommand({
      TableName: requireTableName()
    })
  );
  const items = (response.Items ?? []) as TodoItem[];
  return items.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function createTodo(text: string): Promise<TodoItem> {
  const now = new Date().toISOString();
  const item: TodoItem = {
    id: randomUUID(),
    text,
    completed: false,
    createdAt: now,
    updatedAt: now
  };

  await ddbDoc.send(
    new PutCommand({
      TableName: requireTableName(),
      Item: item
    })
  );

  return item;
}

export async function updateTodo(
  id: string,
  updates: { text?: string; completed?: boolean }
): Promise<TodoItem | null> {
  const updateExpressions: string[] = [];
  const expressionNames: Record<string, string> = {};
  const expressionValues: Record<string, unknown> = {};

  if (typeof updates.text === "string") {
    updateExpressions.push("#text = :text");
    expressionNames["#text"] = "text";
    expressionValues[":text"] = updates.text;
  }

  if (typeof updates.completed === "boolean") {
    updateExpressions.push("completed = :completed");
    expressionValues[":completed"] = updates.completed;
  }

  if (updateExpressions.length === 0) {
    return null;
  }

  updateExpressions.push("updatedAt = :updatedAt");
  expressionValues[":updatedAt"] = new Date().toISOString();

  const response = await ddbDoc.send(
    new UpdateCommand({
      TableName: requireTableName(),
      Key: { id },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeNames: Object.keys(expressionNames).length
        ? expressionNames
        : undefined,
      ExpressionAttributeValues: expressionValues,
      ReturnValues: "ALL_NEW"
    })
  );

  return (response.Attributes as TodoItem) ?? null;
}

export async function deleteTodo(id: string): Promise<void> {
  await ddbDoc.send(
    new DeleteCommand({
      TableName: requireTableName(),
      Key: { id }
    })
  );
}
