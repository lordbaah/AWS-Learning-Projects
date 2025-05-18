provider "aws" {
  region = var.region
}

resource "aws_instance" "EC2webServerInstance" {
  ami           = "ami-0c02fb55956c7d316"
  #instance_type = "t2.micro"
  instance_type = var.ec2_instance_type

  tags = {
    #Name = "Web Server Instance"
    Name = var.instance_name
  }
}