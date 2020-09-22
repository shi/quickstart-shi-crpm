# AWS Quick Start

Create a CI/CD pipeline that watches itself for changes, and an IDE that can be used to edit the pipeline infrastructure code.

## Infrastructure Diagram

![Infrastructure Diagram](https://raw.githubusercontent.com/shi/quickstart-shi-crpm/master/img/diagram.png)

## Getting Started

This isn't an official [AWS Quick Start](https://aws.amazon.com/quickstart) yet, so here's how to use it in the meantime.
The easiest way to launch the quick start, is to do it from an [AWS Cloud9](https://aws.amazon.com/cloud9) environment.

1.  Log into the [AWS Console](https://aws.amazon.com/console) and create a new Cloud9 environment.
2.  Open the new Cloud9 environment once it has been created.
3.  Follow the instructions below.  You will end up with two Cloud9 environments when you are all done, and can delete this first one created in the **Getting Started** section after the second one below, **quick-start-ide**, has been created.

## Create Stacks

```bash
# Install dependencies
npm i -g crpm typescript

# Clone the quick start code and install the CDK app
git clone https://github.com/aws-quickstart/quickstart-shi-crpm
cd quickstart-shi-crpm
npm i

# Deploy the infrastructure CI/CD stack and the nested IDE stack as well
cdk deploy quickstart
```

## Usage

1.  Wait for the above stacks to finish being created.
2.  In the [AWS Console](https://aws.amazon.com/console), open the new [AWS Cloud9](https://aws.amazon.com/cloud9) environment named **quickstart-shi-crpm-ide**.
3.  In **quickstart-shi-crpm-ide**, try changing some property value in any *props.yaml* file in one of the nested directories in *quick-start/res/*. For example, you could change the build server type from **BUILD_GENERAL1_SMALL** to **BUILD_GENERAL1_MEDIUM** as seen in the screenshot below. [You can learn more about **crpm** and properties files here](https://shi.github.io/crpm).
    
    ![Screenshot](https://raw.githubusercontent.com/shi/quickstart-shi-crpm/master/img/screenshot1.png)
4.  On the command line, commit the change and push it to AWS CodeCommit to kick off the AWS CodePipeline as seen in the screenshot below.
    
    ![Screenshot](https://raw.githubusercontent.com/shi/quickstart-shi-crpm/master/img/screenshot2.png)
5.  In the [AWS Console](https://aws.amazon.com/console), open the [AWS CodePipeline](https://aws.amazon.com/codepipeline) that was created.  Then, scroll down to the **Review** stage, click the **Review** button, enter a message, and click the **Approve** button as seen in the screenshot below.
    
    *Note: The first time the quick start is launched, the pipeline will run automatically.  You can approve it and let it continue completing, as it will not update anything.*
    
    ![Screenshot](https://raw.githubusercontent.com/shi/quickstart-shi-crpm/master/img/screenshot3.png)
6.  After the **Deploy** stage has finished, navigate in the console to the resource whose property you changed, and verify that it has changed.

## Destroy Stacks

```bash
# Destroy the IDE and infrastructure CI/CD pipeline
cdk destroy quickstart
```
