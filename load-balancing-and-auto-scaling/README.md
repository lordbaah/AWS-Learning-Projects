# 🚀 AWS Load Balancer and Auto Scaling Deployment

![AWS](https://img.shields.io/badge/AWS-AutoScaling-orange)

This project demonstrates how to build a **highly available, fault-tolerant, and scalable** web application architecture using **Amazon EC2**, **Application Load Balancer (ALB)**, and **Auto Scaling Group (ASG)** within a custom **Virtual Private Cloud (VPC)**.

The web application is deployed across **multiple Availability Zones (AZs)** in the `us-east-1` (N. Virginia) region to ensure continuous availability, even in case of AZ failures. Auto Scaling dynamically adjusts the number of EC2 instances based on **CPU utilization**.

## 📚 Key Concepts

- Custom VPC with isolated networking
- Public subnets in multiple AZs
- Launch Template with Apache pre-installed using a custom user-data script
- Application Load Balancer (ALB) to distribute traffic
- Target Group with health checks on each instance
- Auto Scaling Group (ASG) triggered by CPU metrics
- Dynamic Availability Zone (AZ) detection on webpage via EC2 instance metadata

## 🗺️ Architecture Diagram

![Architecture Diagram](./auto-scaling-diagram.png)

## 🛠️ Step-by-Step Deployment Guide

### ✅ 1. Create a Custom VPC

- Name: MyCustomVpc
- IPv4 CIDR Block: 10.0.0.0/16

![VPC Created](./screenshots/vpc-created.png)

### ✅ 2. Create Two Public Subnets

| Subnet Name    | CIDR Block  | Availability Zone |
| -------------- | ----------- | ----------------- |
| PublicSubnet-1 | 10.0.1.0/24 | us-east-1a        |
| PublicSubnet-2 | 10.0.2.0/24 | us-east-1b        |

- Enable Auto-assign public IPv4 address for both subnets

![Public Subnets](./screenshots/public-subnets-1.png)
![Public Subnets](./screenshots/public-subnets-2.png)
![Public Subnets Created](./screenshots/public-subnets-created.png)
![Enable Auto Assign IP](./screenshots/enable-auto-ip.png)

### ✅ 3. Internet Gateway and Route Table

- Create Internet Gateway and attach to VPC
- Add route 0.0.0.0/0 to IGW in a Route Table
- Associate Route Table with both public subnets

![Internet Gateway](./screenshots/internet-gateway-created.png)
![Internet Gateway Attached to VPC](./screenshots/internet-gateway-attach.png)
![Route Table Created](./screenshots/route-table-created.png)
![Route Table IGW route](./screenshots/route-table-attached-IGW.png)
![Route Table Subnet Association](./screenshots/route-table-asso-Subnet.png)

### ✅ 4. Create Security Groups

**ALB Security Group**

- HTTP (80) from anywhere 0.0.0.0/0  
  ![ALB Security Group](./screenshots/alb-security-group.png)

**EC2 Security Group**

- HTTP (80) from ALB Security Group
- SSH (22) from anywhere 0.0.0.0/0 _(lock in production)_

![EC2 Security Group](./screenshots/ec2-security-group.png)
![EC2 Security Group](./screenshots/ec2-security-group-2.png)

### ✅ 5. Create Launch Template

- OS: Amazon Linux 2023
- Instance type: t2.micro
- Attach: Web Server Security Group
- **Important: Enable Auto-assign Public IP under Advanced network settings**
- User Data: `/user-data.sh`

![Launch Template Part1](./screenshots/launch-template-1.png)
![Launch Template Part2](./screenshots/launch-template-2.png)

#### 🔧 Network Interface in Launch Template

![Network Interface Setup](./screenshots/launch-template-network.png)
![User Data](./screenshots/user-script.png)

-User script used
[Insert this user Script](user-script.sh)

### ✅ 6. Create Target Group

- Type: Instance
- Protocol: HTTP, Port: 80
- VPC: Custom VPC
- Health Check Path: /health.html

![Creating Target Group](./screenshots/target-group-1.png)
![Creating Target Group](./screenshots/target-group.png)
![Target Group Created](./screenshots/target-group-created.png)

### ✅ 7. Create Application Load Balancer

- Internet-facing
- Listener: HTTP (80)
- VPC: Custom VPC
- Use both public subnets
- Use ALB Security Group
- Forward to Target Group

![Creating Load Balancer](./screenshots/load-balancer-1.png)
![Creating Load Balancer](./screenshots/load-balancer-2.png)
![Creating Load Balancer](./screenshots/load-balancer-3.png)

### ✅ 8. Create Auto Scaling Group

- Launch Template: Use the one created earlier
- Don’t override template settings
- VPC + Subnets: Select both public subnets
- Attach to Target Group
- Desired Capacity: 2
- Minimum Capacity: 1
- Maximum Capacity: 3
- **Scaling Policy**:
  - Type: Target tracking
  - Metric: Average CPU utilization
  - **Target value: 50%**
  - Cool-down period: 300 seconds

![Creating Auto Scaling](./screenshots/auto-scaling-1.png)
![Creating Auto Scaling](./screenshots/auto-scaling-2.png)
![Creating Auto Scaling](./screenshots/auto-scaling-3.png)
![Creating Auto Scaling](./screenshots/auto-scaling-4.png)
![Auto Scaling Summary](./screenshots/auto-scaling-summary.png)

### ✅ 9. Test Auto Scaling

![Two Instances launched by Auto Scaling](./screenshots/instance-launched-by-autoscaling.png)

- Two instances launched in `us-east-1a` and `us-east-1b`

![One Instance Running](./screenshots/one-instance-running.png)

- Minimum of 1 instance running when there’s no load

SSH into Instance:

```bash
sudo yum install stress -y
stress --cpu 2 --timeout 300
```

![Stress Test](./screenshots/stress-test.png)

## 🌍 Access the Web Application

```bash
http://<your-alb-dns-name>
```

![Web testing](./screenshots/test-webapp-1a.png)
![Web testing](./screenshots/test-webapp-1b.png)

Each refresh may land on a different AZ!

## 📈 Auto Scaling Activity

Check the EC2 > Auto Scaling Groups > Activity history tab

![Activity history](./screenshots/activity-history-1.png)
![Activity history](./screenshots/activity-history-2.png)
![New Instance Launched in us-east-1a](./screenshots/new-instance-launched-again.png)

## 📊 CloudWatch

Check CloudWatch > Alarms and Metrics

![CloudWatch Alarm](./screenshots/cloud-watch-alarm.png)

## 🧹 Cleanup

- Delete ASG, Launch Template, ALB, Target Group, EC2, and VPC

## ✅ Next Improvements

- Add HTTPS via ACM
- Store logs in S3 or CloudWatch
- Replace static web with Node.js app
