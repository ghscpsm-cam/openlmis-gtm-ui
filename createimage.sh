#!/bin/bash
export AWS_ECR_URL=399841653713.dkr.ecr.us-east-2.amazonaws.com
docker build -f Dockerfile . -t ${AWS_ECR_URL}/openlmis-ui:latest
aws ecr get-login-password | docker login --username AWS --password-stdin $AWS_ECR_URL
docker push ${AWS_ECR_URL}/openlmis-ui:latest

