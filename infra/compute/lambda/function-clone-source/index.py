import boto3, json, shutil, urllib3, zipfile

http = urllib3.PoolManager()

def lambda_handler(event, context):
    print('Event:', event['RequestType'])
    
    artifact_bucket_name = event['ResourceProperties']['artifactBucketName']
    print('Artifact Bucket Name:', artifact_bucket_name)
    
    if (event['RequestType'] != 'Create'):
        send(event, context, 'SUCCESS')
    
    try:
        with http.request('GET', 'https://codeload.github.com/shi/quickstart-shi-crpm/zip/master', preload_content=False) as res, open('/tmp/github.zip', 'wb') as out_file:
            shutil.copyfileobj(res, out_file)
        
        with zipfile.ZipFile('/tmp/github.zip', 'r') as zf:
            zf.extractall('/tmp')
        
        shutil.make_archive('/tmp/source', 'zip', '/tmp/quickstart-shi-crpm-master')
        
        s3 = boto3.client('s3')
        with open('/tmp/source.zip', 'rb') as f:
            s3.upload_fileobj(f, artifact_bucket_name, 'quick-start/Source/quickstart-shi-crpm.zip')
        
        print('Copied quick start source from GitHub to S3')
    except:
        send(event, context, 'FAILED', 'Could not copy quick start source from GitHub to S3')
    
    send(event, context, 'SUCCESS')

def send(event, context, status, data=''):
    body = {
        'Status': status,
        'Reason': 'See the details in CloudWatch Log Stream: ' + context.log_stream_name,
        'PhysicalResourceId': context.log_stream_name,
        'StackId': event['StackId'],
        'RequestId': event['RequestId'],
        'LogicalResourceId': event['LogicalResourceId'],
        'NoEcho': False,
        'Data': {'Data': data}
    }
    
    json_body = json.dumps(body)
    
    headers = {
        'content-type': '',
        'content-length': str(len(json_body))
    }
    
    http.request('PUT', event['ResponseURL'], body=json_body, headers=headers)
