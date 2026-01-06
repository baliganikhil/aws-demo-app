# Serverless Todo Demo

A minimal serverless todo app for teaching AWS basics. It includes:
- Express + TypeScript backend running on Lambda
- DynamoDB storage
- Angular frontend hosted on S3 + CloudFront
- CDK stack to deploy everything in one command

## Prerequisites
- Node.js 18+
- AWS CLI configured (`aws configure`)
- CDK bootstrapped in your account/region (`npx cdk bootstrap`)

## Quick start
```bash
npm run setup
npm run deploy
```

After deploy, the CDK outputs include the CloudFront URL and API endpoint.
Open the CloudFront URL and the frontend will call `/api/*` routed to Lambda.

The deploy command runs `cdk bootstrap`, `cdk synth`, and `cdk deploy` using the
AWS profile `desire-dev`.

## Deploy to AWS
```bash
npm run setup
npm run deploy
```

Make sure the AWS profile `desire-dev` is configured and has permissions to
create CloudFormation stacks, Lambda, API Gateway, DynamoDB, S3, and CloudFront.

## Local development
This uses DynamoDB Local in Docker, an Express API on port 3000, and Angular on port 4200.
```bash
npm run setup
npm run dev
```

If you want to start/stop DynamoDB Local manually:
```bash
docker compose up -d
docker compose down
```

The API automatically creates a local `TodosLocal` table on startup.

## API endpoints
All endpoints are prefixed with `/api`.
- `GET /api/todos`
- `POST /api/todos` with `{ "text": "..." }`
- `PATCH /api/todos/:id` with `{ "text": "..." }` or `{ "completed": true }`
- `DELETE /api/todos/:id`

## Teardown
```bash
npm run destroy
```

The destroy command uses the AWS profile `desire-dev`.

## Deploy to LocalStack
This spins up LocalStack, builds the frontend, and deploys the same CDK stack to a
local AWS emulator.
```bash
npm run setup
npm run localstack:deploy
```

To destroy the LocalStack stack:
```bash
npm run localstack:destroy
```

LocalStack defaults used by the scripts:
- Account: `000000000000`
- Region: `us-east-1`
- Access keys: `test` / `test`

If you need different values, export `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`,
`AWS_DEFAULT_REGION`, `CDK_DEFAULT_ACCOUNT`, or `CDK_DEFAULT_REGION` before running
the scripts.

### LocalStack limitations
- CloudFront in LocalStack is limited; the app may be reachable directly from S3
  but not always through a CloudFront URL.
- If CloudFront is unavailable, use the S3 website URL from the stack outputs.

## Notes
- The DynamoDB table and S3 bucket use `RemovalPolicy.DESTROY` to keep teardown simple.
- Build output must exist at `frontend/dist/todo-frontend` before `cdk deploy`.
