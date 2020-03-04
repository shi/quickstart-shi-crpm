# AWS Quick Start

Create a CI/CD pipeline that watches itself for changes,
and an IDE that can be used to edit the pipeline.

## Create stacks

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

## Terminate stacks

```
aws cloudformation delete-stack \
    --stack-name quick-start-ide

aws cloudformation delete-stack \
    --stack-name quick-start
```
