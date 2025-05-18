variable "instance_name" {
  description = "Name tag for the EC2 instance"
  type        = string
  default     = "Web Server Instance"
}

variable "ec2_instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t2.micro"
}

variable "region" {
  type        = string
  description = "AWS region"
  default     = "us-east-1"
}

#You can override the defaults when running terraform apply: 
#terraform apply -var="instance_name=my-app" -var="ec2_instance_type=t3.micro"

##If you can't get more permissions, and you're just testing, you can force Terraform to recreate the EC2 instance instead of modifying it.
#terraform taint aws_instance.EC2webServerInstance ,terraform apply

