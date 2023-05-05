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
	aws_region, 
	req,
	res 
}: { 
	aws_region: string, 
	req: Request,
	res: Response ,
}): Promise<void> => {
	const client = new CloudWatchLogsClient({ region: aws_region });
	console.log(res);

	const body = await res.text();
	const command = errorCommandBuilder({ 
		requestMethod: req.method,
		statusCode: res.status, 
		statusMessage: res.statusText,
		responseBody: body
	});

	const awsRes = await client.send(command);
	console.log(awsRes);
}