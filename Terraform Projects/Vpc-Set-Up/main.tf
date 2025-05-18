provider "aws" {
  region = var.region
}

# Generate a new RSA key pair
resource "tls_private_key" "ssh_key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

# Create AWS Key Pair using generated public key
resource "aws_key_pair" "generated" {
  key_name   = var.key_pair_name
  public_key = tls_private_key.ssh_key.public_key_openssh
}

# Save the private key to a local file for SSH access
resource "local_file" "private_key_pem" {
  content          = tls_private_key.ssh_key.private_key_pem
  filename         = "${path.module}/private_key.pem"
  file_permission  = "0600"
}

# Create VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true

  tags = {
    Name = var.vpc_name
  }
}

# Create Internet Gateway
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = var.igw_name
  }
}

# Create subnet
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidr
  availability_zone       = var.availability_zone
  map_public_ip_on_launch = true

  tags = {
    Name = var.subnet_name
  }
}

# Create route table
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
}

# Associate subnet with route table
resource "aws_route_table_association" "public_assoc" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public_rt.id
}

# ===========================
# Security Group
# ===========================

resource "aws_security_group" "allow_ssh_http" {
  name        = var.sg_name
  description = var.sg_description
  vpc_id      = aws_vpc.main.id

  dynamic "ingress" {
    for_each = var.ingress_ports
    content {
      from_port   = ingress.value.from_port
      to_port     = ingress.value.to_port
      protocol    = ingress.value.protocol
      cidr_blocks = ingress.value.cidr_blocks
      description = ingress.value.description
    }
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = var.sg_name
  }
}



# Launch EC2 instance

resource "aws_instance" "web" {
  ami                         = var.ami_id
  instance_type               = var.instance_type
  subnet_id                   = aws_subnet.public.id
  vpc_security_group_ids      = [aws_security_group.allow_ssh_http.id]
  associate_public_ip_address = true
  key_name                    = aws_key_pair.generated.key_name

  user_data = <<-EOF
              #!/bin/bash
              yum update -y
              amazon-linux-extras install -y nginx1
              systemctl start nginx
              systemctl enable nginx
              echo "<h1>Welcome to My Nginx Server deployed via Terraform</h1>" > /usr/share/nginx/html/index.html
              EOF

  tags = {
    Name = var.instance_name
  }
}

