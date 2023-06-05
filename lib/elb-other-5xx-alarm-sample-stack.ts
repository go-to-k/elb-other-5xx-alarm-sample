import * as cdk from "aws-cdk-lib";
import { SnsAction } from "aws-cdk-lib/aws-cloudwatch-actions";
import { SecurityGroup, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import { ApplicationLoadBalancer, ListenerAction } from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Topic } from "aws-cdk-lib/aws-sns";
import { Construct } from "constructs";
import { ELBOther5XXAlarm } from "elb-other-5xx-alarm";

export class ElbOther5XxAlarmSampleStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new Vpc(this, "VPC", {
      natGateways: 0,
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 28,
          name: "public",
          subnetType: SubnetType.PUBLIC,
        },
      ],
    });

    const albSecurityGroup = new SecurityGroup(this, "ALBSecurityGroup", {
      allowAllOutbound: true,
      securityGroupName: "alb-sg",
      vpc,
    });

    const alb501 = new ApplicationLoadBalancer(this, "ALB501", {
      internetFacing: true,
      loadBalancerName: "alb501",
      securityGroup: albSecurityGroup,
      vpc,
      vpcSubnets: { subnets: vpc.publicSubnets },
    });

    alb501.addListener("Listener501", {
      defaultAction: ListenerAction.fixedResponse(501, {
        contentType: "application/json",
      }),
      open: true,
      port: 80,
    });

    const alb503 = new ApplicationLoadBalancer(this, "ALB503", {
      internetFacing: true,
      loadBalancerName: "alb503",
      securityGroup: albSecurityGroup,
      vpc,
      vpcSubnets: { subnets: vpc.publicSubnets },
    });

    alb503.addListener("Listener503", {
      defaultAction: ListenerAction.fixedResponse(503, {
        contentType: "application/json",
      }),
      open: true,
      port: 80,
    });

    const topic = new Topic(this, "Topic", {});
    const alarmActions = [new SnsAction(topic)];

    new ELBOther5XXAlarm(this, "ELBOther5XXAlarmFor501", {
      loadBalancerFullName: alb501.loadBalancerFullName,
      alarmName: "my-alarm-501",
      alarmActions: alarmActions,
      period: cdk.Duration.seconds(60),
      threshold: 1,
      evaluationPeriods: 1,
    });

    new ELBOther5XXAlarm(this, "ELBOther5XXAlarmFor503", {
      loadBalancerFullName: alb503.loadBalancerFullName,
      alarmName: "my-alarm-503",
      alarmActions: alarmActions,
      period: cdk.Duration.seconds(60),
      threshold: 1,
      evaluationPeriods: 1,
    });
  }
}
