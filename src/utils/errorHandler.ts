import { Env } from "../types";
import { CloudWatchLogsClient, PutLogEventsCommand } from "@aws-sdk/client-cloudwatch-logs";

const errorCommandBuilder = ({ 
	requestMethod, 
	statusCode, 
	statusMessage,
	responseBody
}: { 
	requestMethod: string,
	statusCode: number, 
	statusMessage: string,
	responseBody: string,  
}): PutLogEventsCommand => {
	return new PutLogEventsCommand({
    logGroupName: '/CloudFlare',
    logStreamName: 'RPCProxy',
    logEvents: [{
      timestamp: Date.now(),
      message: `Error ${requestMethod} ${statusCode} ${statusMessage} ${responseBody}`
    }]
  });
}

export const errorHandler = async ({ 
	env, 
	req,
	res 
}: { 
	env: Env, 
	req: Request,
	res: Response,
}): Promise<void> => {
	const client = new CloudWatchLogsClient({ 
		region: env.AWS_REGION, 
		credentials: {
			accessKeyId: env.AWS_ACCESS_KEY_ID,
			secretAccessKey: env.AWS_SECRET_ACCESS_KEY
		}
	});

	const responseBody = await res.text();
	const arg = {
		requestMethod: req.method,
		statusCode: res.status, 
		statusMessage: res.statusText,
		responseBody: responseBody
	};
	const command = errorCommandBuilder(arg);

	const awsRes = await client.send(command);

	console.log(`Helius response: ${JSON.stringify(arg)}`);
	console.log(`CloudWatch response: ${awsRes}`);

	return;
}