#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)

if [[ "${LOCALSTACK_ENABLED:-false}" != "true" ]]; then
  echo "LocalStack destroy is disabled. Set LOCALSTACK_ENABLED=true to continue."
  exit 1
fi

AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID:-test}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY:-test}
AWS_DEFAULT_REGION=${AWS_DEFAULT_REGION:-us-east-1}
CDK_DEFAULT_ACCOUNT=${CDK_DEFAULT_ACCOUNT:-000000000000}
CDK_DEFAULT_REGION=${CDK_DEFAULT_REGION:-$AWS_DEFAULT_REGION}

export AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_DEFAULT_REGION
export CDK_DEFAULT_ACCOUNT CDK_DEFAULT_REGION

cd "$ROOT_DIR/infra"
cdklocal destroy --force
