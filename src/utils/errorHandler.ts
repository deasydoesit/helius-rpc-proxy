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

	console.log("errorHandler res body before");
	const responseBody = await res.text();
	console.log("errorHandler res body after");
	const command = errorCommandBuilder({ 
		requestMethod: req.method,
		statusCode: res.status, 
		statusMessage: res.statusText,
		responseBody: responseBody
	});
	console.log(JSON.stringify(command));

	const awsRes = await client.send(command);
	console.log(awsRes);
}