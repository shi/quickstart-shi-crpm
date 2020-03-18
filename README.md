# AWS Quick Start

Create a CI/CD pipeline that watches itself for changes, and an
an IDE that can be used to edit the pipeline infrastructure code.

## Infrastructure Diagram

![Infrastructure Diagram](https://raw.githubusercontent.com/shi/quickstart-shi-crpm/master/img/img.png)

## Getting Started

This isn't an official AWS Quick Start yet, so here's how to use it in the meantime.

1.  Log into the [AWS Console](https://aws.amazon.com/console) and create a new [AWS Cloud9](https://aws.amazon.com/cloud9) environment.
2.  Open the new Cloud9 environment once it has been created, and clone this GitHub repo in it on the command line.
    ```
    git clone https://github.com/shi/quickstart-shi-crpm.git
    cd quickstart-shi-crpm
    ```
3.  Follow the instructions below.  You will end up with 2 Cloud9 environments when you are all done, and can delete the first one after the second one has been created.

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
```

## Usage



## Terminate Stacks

```
aws cloudformation delete-stack \
    --stack-name quick-start-ide

aws cloudformation delete-stack \
    --stack-name quick-start
```
