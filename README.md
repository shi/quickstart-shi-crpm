# AWS Quick Start

Create a CI/CD pipeline that watches itself for changes, and an IDE that can be used to edit the pipeline infrastructure code.

## Infrastructure Diagram

![Infrastructure Diagram](https://raw.githubusercontent.com/shi/quickstart-shi-crpm/master/img/diagram.png)

## Getting Started

This isn't an official [AWS Quick Start](https://aws.amazon.com/quickstart) yet, so here's how to use it in the meantime.
The easiest way to launch the quick start, is to do it from an [AWS Cloud9](https://aws.amazon.com/cloud9) environment.

1.  Log into the [AWS Console](https://aws.amazon.com/console) and create a new Cloud9 environment.
2.  Open the new Cloud9 environment once it has been created, and clone this GitHub repo in it on the command line.
    
    ```
    git clone https://github.com/shi/quickstart-shi-crpm.git
    cd quickstart-shi-crpm
    ```
3.  Follow the instructions below.  You will end up with two Cloud9 environments when you are all done, and can delete this first one created in the **Getting Started** section after the second one below, **quick-start-ide**, has been created.

    *Note: The first time you run the crpm command, it will ask you to agree to the Apache 2.0 license.*

## Create Stacks

```
npm uninstall -g cdk
npm install -g aws-cdk@1.57.0 crpm@1.13.0
npm install
npm run build

# Synthesize the CloudFormation template stack.template.json
crpm synth infra/developer-tools/codepipeline/pipeline

# Start creating the pipeline CloudFormation stack
aws cloudformation create-stack \
    --stack-name quick-start \
    --template-body file://infra/developer-tools/codepipeline/pipeline/stack.template.json \
    --capabilities CAPABILITY_NAMED_IAM

# Wait for the stack to be created
aws cloudformation wait stack-create-complete \
    --stack-name quick-start

# Synthesize the CloudFormation template stack.template.json
crpm synth infra/developer-tools/cloud9/environment-ec2

# Start creating the IDE CloudFormation stack
aws cloudformation create-stack \
    --stack-name quick-start-ide \
    --template-body file://infra/developer-tools/cloud9/environment-ec2/stack.template.json \
    --capabilities CAPABILITY_NAMED_IAM

# Wait for the stack to be created
aws cloudformation wait stack-create-complete \
    --stack-name quick-start-ide
```

## Usage

1.  Wait for the above stacks to finish being created.
2.  In the [AWS Console](https://aws.amazon.com/console), open the new [AWS Cloud9](https://aws.amazon.com/cloud9) environment named **quick-start-ide**.
3.  In **quick-start-ide**, try changing some property value in some *props.yaml* file inside *quick-start/infra/*. For example, you could change the build server type from **BUILD_GENERAL1_SMALL** to **BUILD_GENERAL1_MEDIUM** as seen in the screenshot below. [You can learn more about **crpm** and properties files here](https://shi.github.io/crpm).
    
    ![Screenshot](https://raw.githubusercontent.com/shi/quickstart-shi-crpm/master/img/screenshot1.png)
4.  On the command line, commit the change and push it to AWS CodeCommit to kick off the AWS CodePipeline named **quick-start** as seen in the screenshot below.
    
    ![Screenshot](https://raw.githubusercontent.com/shi/quickstart-shi-crpm/master/img/screenshot2.png)
5.  In the [AWS Console](https://aws.amazon.com/console), open the [AWS CodePipeline](https://aws.amazon.com/codepipeline) named **quick-start**, scroll down to the **Review** stage, click the **Review** button, enter a message, and click the **Approve** button as seen in the screenshot below.
    
    *Note: The first time the quick start is launched, the pipeline will run automatically.  You can approve it and let it continue completing, as it will not update anything.*
    
    ![Screenshot](https://raw.githubusercontent.com/shi/quickstart-shi-crpm/master/img/screenshot3.png)
6.  After the **Deploy** stage has finished, navigate in the console to the resource whose property you changed, and verify that it has changed.

## Terminate Stacks

```
aws cloudformation delete-stack \
    --stack-name quick-start-ide

aws cloudformation delete-stack \
    --stack-name quick-start
```
