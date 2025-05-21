# EC2 Deployment with NGINX using Terraform

This project demonstrates how to deploy an EC2 instance with **NGINX installed**, using **Terraform**. It also includes the creation of a **custom VPC**, **subnet**, **internet gateway**, and **route table** to enable public internet access. The setup is managed via Terraform and AWS CLI.

To deploy, run the following commands:

```bash
terraform init
terraform plan
terraform apply
```

## Features

- EC2 instance deployment
- NGINX web server installation
- Custom VPC setup
- Custom subnet configuration
- Internet Gateway and Route Table for public access
- SSH access to EC2 instance
- Managed using AWS CLI and Terraform

## Proof of Deployment

### 1. AWS CLI Configuration

_Configured using `aws configure` with IAM credentials and default region._

![AWS Configure](./screenshots/aws_configure.png)

---

### 2. Terraform Apply in VS Code

_Provisioned infrastructure using Terraform in VS Code._

![Terraform Apply](./screenshots/terraform_apply.png)

---

### 3. Custom VPC Created

![Custom VPC](./screenshots/vpc_created.png)

---

### 4. Custom Subnet Created

![Custom Subnet](./screenshots/subnet_created.png)

---

### 5. Internet Gateway Attached

![Internet Gateway](./screenshots/internet_gateway.png)

---

### 6. Route Table with Public Route

![Route Table](./screenshots/route_table.png)

---

### Security Group Configured

![Security Group Configured](./screenshots/security_groups.png)

---

### 7. EC2 Instance Running

_Verified the EC2 instance is up and running._

![Instance Running](./screenshots/instance_running.png)

---

### 8. SSH into EC2 Instance

_Accessed the EC2 instance via SSH._

![SSH into Instance](./screenshots/ssh_into_instance.png)

---

### 9. NGINX Website Running on EC2 Public IP

_Confirmed NGINX is serving the default page on the public IP._

![Website on Public IP](./screenshots/nginx_running.png)

---

### 10. Terraform Code

_Terraform script used to define infrastructure._

![Terraform Code](./screenshots/terraform_code.png)

---

### 11. Terraform Destroy Output

_Resources destroyed successfully via Terraform._

![Terraform Destroy 1](./screenshots/terraform_destroy_1.png)  
![Terraform Destroy 2](./screenshots/terraform_destroy_2.png)

---

### 12. EC2 Instance Terminated

_Confirmed the EC2 instance is terminated post-destroy._

![Instance Terminated](./screenshots/instance_terminated.png)
