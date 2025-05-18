output "instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.web.id
}

output "public_ip" {
  description = "Public IP of the EC2 instance"
  value       = aws_instance.web.public_ip
}

output "private_key_path" {
  description = "Path to the saved private key"
  value       = local_file.private_key_pem.filename
}

output "web_url" {
  description = "Nginx web server URL"
  value       = "http://${aws_instance.web.public_ip}"
}