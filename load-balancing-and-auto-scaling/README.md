# AWS Load Balancer and Auto Scaling Deployment

This project demonstrates how to build a highly available web application using **Amazon EC2**, **Application Load Balancer**, and **Auto Scaling Group** in a custom VPC. The app is deployed across two Availability Zones in **us-east (N. Virginia)** to ensure scalability and fault tolerance.

## 🧠 Key Concepts

- Custom VPC with multiple public subnets
- EC2 Launch Template with Apache setup
- Application Load Balancer (ALB) with health checks
- Auto Scaling Group triggered by CPU usage
- Real-time display of Availability Zone via EC2 metadata

## 🗺️ Architecture Diagram

_(Insert architecture image here, e.g. `architecture/auto-scaling-diagram.png`)_

## 🛠️ Step-by-Step Deployment Guide

### ✅ 1. Create a Custom VPC

- Name: `MyCustomVpc`
- IPv4 CIDR block: `1.0.0.0/16`

### ✅ 2. Create Public Subnets

- `PublicSubnet-1`
  - CIDR: `1.0.1.0/24`
  - AZ: `us-east-1a`
- `PublicSubnet-2`
  - CIDR: `10.0.2.0/24`
  - AZ: `us-east-1b`
- Enable Auto-assign Public IP for both subnets

### ✅ 3. Internet Gateway and Routing

- Create an **Internet Gateway** and attach it to `MyCustomVpc`
- Create a **Route Table**:
  - Add route: `0.0.0.0/0` → Internet Gateway
  - Associate with both public subnets

### ✅ 4. Create Security Groups

- **ALB Security Group**
  - Inbound: HTTP (80) from Anywhere `0.0.0.0/0`
- **Web Server Security Group**
  - Inbound:
    - HTTP (80) from ALB Security Group
    - SSH (22) from Anywhere `0.0.0.0/0`

### ✅ 5. Create Launch Template

- Use **Amazon Linux 2023**
- Instance Type: `t2.micro`
- Use the script below in **Advanced → User data** during template creation:
  ![Script](./user-script.sh)

### ✅ 6. Create a Target Group

- Target type: **Instances**
- Protocol: **HTTP**
- Port: **80**
- Health check path: `/health.html`

### ✅ 7. Create Application Load Balancer

- Scheme: **Internet-facing**
- Network mapping: Select both public subnets
- Security Group: **ALB Security Group**
- Listener: Forward to the **Target Group**

### ✅ 8. Create Auto Scaling Group

- Use the **Launch Template**
- VPC: `MyCustomVpc`
- Subnets: Both public subnets
- Attach to **Target Group**
- **Scaling Policy**:
  - Type: Target tracking
  - Metric: **Average CPU utilization**
  - Target value: **30%**

### ✅ 9. Test Auto Scaling

SSH into one of the EC2 instances and run:

```bash
sudo yum install stress -y
stress --cpu 2 --timeout 300
```

This will simulate CPU load and trigger scaling actions.

## 🌍 Access the Web Application

Visit the ALB DNS Name in your browser:

```bash
http://<your-alb-dns-name>
```

Each refresh may land on a different AZ!
