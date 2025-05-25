# loose-ends

loose-ends is a lean, productivity-oriented task tracker designed to ensure you tie up all your loose ends.

It is built with a relatively minimal stack and comes eith CDK templates for deployment to AWS.

the AWS deployment is designed to be low-cost, with a serverless backend. a non-exhaustive sequence diagram demonstrating a typical request flow through the relevant services can be found below:

```mermaid
sequenceDiagram;
	actor Browser as Client;
	create participant CloudFront;
	Browser ->> CloudFront: Unauthenticated request;
	create participant Cognito;
	CloudFront ->> Cognito: Lambda@Edge;
	Cognito -->> Browser: Login form;
	Browser ->> Cognito: Credentials + 2FA;
	destroy Cognito;
	Cognito -->> Browser: Auth token;
	Browser ->> CloudFront: Authenticated request;
	create participant S3;
	destroy CloudFront;
	CloudFront ->> S3: Lambda@Edge;
	destroy S3;
	S3 -->> Browser: SPA;
	create participant API Gateway;
	Browser ->> API Gateway: CRUD operation;
	create participant Lambda;
	API Gateway ->> Lambda: Serverless payload;
	create participant DynamoDB;
	Lambda ->> DynamoDB: Persist data;
	destroy DynamoDB;
	DynamoDB -->> Lambda: Persisted data;
	destroy Lambda;
	Lambda -->> API Gateway: Serverless response;
	destroy API Gateway;
	API Gateway -->> Browser: CRUD response;
```