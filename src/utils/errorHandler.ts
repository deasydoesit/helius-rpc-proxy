import { Env } from "../types";
import { CloudWatchLogsClient, PutLogEventsCommand } from "@aws-sdk/client-cloudwatch-logs";

const errorCommandBuilder = ({ 
	env,
	requestMethod, 
	statusCode, 
	statusMessage,
	responseBody
}: { 
	env: Env,
	requestMethod: string,
	statusCode: number, 
	statusMessage: string,
	responseBody: string,  
}): PutLogEventsCommand => {
	const today = new Date();
	const year = today.getFullYear();
	const month = today.getMonth() + 1 < 10 ? `0${today.getMonth() + 1}` : today.getMonth() + 1;
	const day = today.getDate() < 10 ? `0${today.getDate()}` : today.getDate();
	const currentDate = `${year}-${month}-${day}`;

	return new PutLogEventsCommand({
    logGroupName: env.AWS_CLOUDWATCH_LOG_GROUP,
    logStreamName: currentDate,
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
		env,
		requestMethod: req.method,
		statusCode: res.status, 
		statusMessage: res.statusText,
		responseBody: responseBody
	};
	const command = errorCommandBuilder(arg);

	const awsRes = await client.send(command);

	console.log(`Helius response: ${JSON.stringify(arg)}`);
	console.log(`CloudWatch response: ${JSON.stringify(awsRes)}`);

	return;
}