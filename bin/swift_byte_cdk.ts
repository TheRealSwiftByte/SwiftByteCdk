#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { SwiftByteCdkStack } from '../lib/swift_byte_cdk-stack';

const app = new cdk.App();
new SwiftByteCdkStack(app, 'SwiftByteCdkStack', {env:{
    account: "519845367156",
    region: "ap-southeast-2"
}});
