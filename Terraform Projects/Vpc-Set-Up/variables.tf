# ===========================
# AWS Provider Configuration
# ===========================

variable "region" {
  description = "The AWS region to deploy resources in"
  type        = string
  default     = "us-east-1"
}

# ===========================
# VPC Configuration
# ===========================

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "vpc_name" {
  description = "Name tag for the VPC"
  type        = string
  default     = "MyCustomVpc"
}

# ===========================
# Subnet Configuration
# ===========================

variable "public_subnet_cidr" {
  description = "CIDR block for the public subnet"
  type        = string
  default     = "10.0.1.0/24"
}

variable "subnet_name" {
  description = "Name tag for the public subnet"
  type        = string
  default     = "MyCustomSubnet"
}

variable "availability_zone" {
  description = "The AZ to deploy the subnet"
  type        = string
  default     = "us-east-1a"
}

# ===========================
# Internet Gateway
# ===========================

variable "igw_name" {
  description = "Name tag for the Internet Gateway"
  type        = string
  default     = "MyCustomIGW"
}

# ===========================
# EC2 Instance Configuration
# ===========================

variable "instance_name" {
  description = "Name tag for the EC2 instance"
  type        = string
  default     = "MyWebInstance"
}

variable "instance_type" {
  description = "The type of EC2 instance to deploy"
  type        = string
  default     = "t3.micro"
}

variable "ami_id" {
  description = "AMI ID to use for the EC2 instance"
  type        = string
  default     = "ami-0c02fb55956c7d316"  # Amazon Linux 2 for us-east-1
}

variable "key_pair_name" {
  description = "Name to assign to the new EC2 Key Pair"
  type        = string
  default     = "generated-key"
}

# ===========================
# Security Group Configuration
# ===========================

variable "sg_name" {
  description = "Name tag for the security group"
  type        = string
  default     = "allow_ssh_http"
}

variable "sg_description" {
  description = "Description for the security group"
  type        = string
  default     = "Allow SSH and HTTP traffic"
}

variable "ingress_ports" {
  description = "List of ingress ports to allow (e.g., 22 for SSH, 80 for HTTP)"
  type = list(object({
    from_port   = number
    to_port     = number
    protocol    = string
    cidr_blocks = list(string)
    description = string
  }))
  default = [
    {
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
      description = "Allow SSH"
    },
    {
      from_port   = 80
      to_port     = 80
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
      description = "Allow HTTP"
    }
  ]
}
