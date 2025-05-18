#The outputs.tf file in Terraform defines output values — these are the values Terraform will display after running terraform apply. They are useful for:
#Showing important information (like EC2 public IPs, VPC IDs)
#Sharing values with other Terraform modules or scripts
#Debugging or manual validation
# Show the EC2 instance ID after deployment
output "instance_id" {
  description = "The ID of the EC2 instance"
  value       = aws_instance.EC2webServerInstance.id
}

# Show the public IP so we can SSH into the instance
output "instance_public_ip" {
  description = "The public IP address of the EC2 instance"
  value       = aws_instance.EC2webServerInstance.public_ip
}

#run terraform output to see outputs
