# AWS Quick Start

Create a CI/CD pipeline that watches itself for changes, and an IDE that can be used to edit the pipeline infrastructure code.

## Infrastructure Diagram

![Infrastructure Diagram](https://raw.githubusercontent.com/shi/quickstart-shi-crpm/master/img/diagram.png)

## Getting Started

This isn't an official [AWS Quick Start](https://aws.amazon.com/quickstart) yet, so here's how to use it in the meantime.
The easiest way to launch the quick start, is to do it from a Cloud9 environment.

1.  Log into the [AWS Console](https://aws.amazon.com/console) and create a new [AWS Cloud9](https://aws.amazon.com/cloud9) environment.
2.  Open the new Cloud9 environment once it has been created, and clone this GitHub repo in it on the command line.
    
    ```
    git clone https://github.com/shi/quickstart-shi-crpm.git
    cd quickstart-shi-crpm
    ```
3.  Follow the instructions below.  You will end up with two Cloud9 environments when you are all done, and can delete this first one created in the **Getting Started** section after the second one below (quick-start-ide) has been created.

## Create Stacks

```
npm i
npm run build

crpm synth infra/developer-tools/codepipeline/pipeline

aws cloudformation create-stack \
    --stack-name quick-start \
    --template-body file://infra/developer-tools/codepipeline/pipeline/stack.template.json \
    --capabilities CAPABILITY_NAMED_IAM

aws cloudformation wait stack-create-complete \
    --stack-name quick-start

crpm synth infra/developer-tools/cloud9/environment-ec2

aws cloudformation create-stack \
    --stack-name quick-start-ide \
    --template-body file://infra/developer-tools/cloud9/environment-ec2/stack.template.json \
    --capabilities CAPABILITY_NAMED_IAM

aws cloudformation wait stack-create-complete \
    --stack-name quick-start-ide
```

## Usage

1.  Wait for the above stacks to finish being created.
2.  In the [AWS Console](https://aws.amazon.com/console), open the new [AWS Cloud9](https://aws.amazon.com/cloud9) environment named **quick-start-ide**.
3.  In **quick-start-ide**, try changing some property value in some *props.yaml* file inside *quick-start/infra/*. For example, you could change the build server type from **BUILD_GENERAL1_SMALL** to **BUILD_GENERAL1_MEDIUM** as seen in the screenshot below.
    
    ![Screenshot](https://raw.githubusercontent.com/shi/quickstart-shi-crpm/master/img/screenshot1.png)
4.  On the command line, commit the change and push it to AWS CodeCommit to kick off the AWS CodePipeline named **quick-start**.
    
    ```
    git add .
    git commit -m "Try changing a property to test the infrastructure pipeline"
    git push
    ```
5.  In the [AWS Console](https://aws.amazon.com/console), open the [AWS CodePipeline](https://aws.amazon.com/codepipeline) named **quick-start**.
6.  Approve the change set and wait for the pipeline to finish.
7.  Navigate in the console to the resource whose property you changed and verify that it changed.

## Terminate Stacks

```
aws cloudformation delete-stack \
    --stack-name quick-start-ide

aws cloudformation delete-stack \
    --stack-name quick-start
```
