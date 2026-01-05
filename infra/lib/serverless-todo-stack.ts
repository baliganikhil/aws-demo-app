import { CfnOutput, Duration, Fn, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as path from "node:path";

export class ServerlessTodoStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // DynamoDB table for todo items (id as partition key).
    const table = new dynamodb.Table(this, "TodosTable", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY
    });

    // Lambda runs the Express API and reads/writes the table.
    const apiHandler = new nodejs.NodejsFunction(this, "TodoApiFunction", {
      entry: path.join(__dirname, "../../backend/src/handler.ts"),
      runtime: lambda.Runtime.NODEJS_18_X,
      timeout: Duration.seconds(10),
      environment: {
        TODOS_TABLE_NAME: table.tableName
      },
      bundling: {
        target: "es2022"
      }
    });

    table.grantReadWriteData(apiHandler);

    // HTTP API Gateway fronts the Lambda with a simple /api/* route.
    const httpApi = new apigwv2.HttpApi(this, "TodoHttpApi", {
      corsPreflight: {
        allowMethods: [
          apigwv2.CorsHttpMethod.GET,
          apigwv2.CorsHttpMethod.POST,
          apigwv2.CorsHttpMethod.PATCH,
          apigwv2.CorsHttpMethod.DELETE,
          apigwv2.CorsHttpMethod.OPTIONS
        ],
        allowOrigins: ["*"]
      }
    });

    const lambdaIntegration = new integrations.HttpLambdaIntegration(
      "TodoLambdaIntegration",
      apiHandler
    );

    httpApi.addRoutes({
      path: "/api/{proxy+}",
      methods: [apigwv2.HttpMethod.ANY],
      integration: lambdaIntegration
    });

    // Private S3 bucket stores the Angular build output.
    const siteBucket = new s3.Bucket(this, "TodoSiteBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    // API Gateway domain becomes the CloudFront origin for /api/* requests.
    const apiDomain = Fn.select(2, Fn.split("/", httpApi.apiEndpoint));
    const apiOrigin = new origins.HttpOrigin(apiDomain);

    // CloudFront uses an origin access identity to read the private bucket.
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      "TodoOriginAccessIdentity"
    );
    siteBucket.grantRead(originAccessIdentity);

    // CloudFront serves the SPA and proxies /api/* to the HTTP API.
    const distribution = new cloudfront.Distribution(this, "TodoDistribution", {
      defaultRootObject: "index.html",
      defaultBehavior: {
        origin: new origins.S3Origin(siteBucket, { originAccessIdentity }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
      },
      additionalBehaviors: {
        "api/*": {
          origin: apiOrigin,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER
        }
      },
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: "/index.html"
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html"
        }
      ]
    });

    // Upload the built frontend to S3 and invalidate the CloudFront cache.
    new s3deploy.BucketDeployment(this, "DeployWebsite", {
      sources: [
        s3deploy.Source.asset(path.join(__dirname, "../../frontend/dist/todo-frontend"))
      ],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ["/*"]
    });

    new CfnOutput(this, "CloudFrontUrl", {
      value: `https://${distribution.distributionDomainName}`
    });

    new CfnOutput(this, "ApiEndpoint", {
      value: httpApi.apiEndpoint
    });

    new CfnOutput(this, "TableName", {
      value: table.tableName
    });
  }
}
