#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)

AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID:-test}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY:-test}
AWS_DEFAULT_REGION=${AWS_DEFAULT_REGION:-us-east-1}
CDK_DEFAULT_ACCOUNT=${CDK_DEFAULT_ACCOUNT:-000000000000}
CDK_DEFAULT_REGION=${CDK_DEFAULT_REGION:-$AWS_DEFAULT_REGION}

export AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_DEFAULT_REGION
export CDK_DEFAULT_ACCOUNT CDK_DEFAULT_REGION

cd "$ROOT_DIR"

docker compose -f docker-compose.localstack.yml up -d

npm --prefix frontend run build

npm --prefix infra run cdk:local -- bootstrap aws://$CDK_DEFAULT_ACCOUNT/$CDK_DEFAULT_REGION
npm --prefix infra run cdk:local -- synth
npm --prefix infra run cdk:local -- deploy --require-approval never
