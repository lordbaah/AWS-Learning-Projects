#!/bin/bash

# System Update & Apache Installation
# Updates the instance packages and installs the Apache web server.
# Starts and enables Apache to run on every reboot.

sudo yum update -y
sudo yum install httpd -y
sudo systemctl start httpd
sudo systemctl enable httpd
chkconfig httpd on 


# Set Directory Permissions
# Adds the ec2-user to the Apache group.
# Sets ownership and permissions for /var/www so the ec2-user and Apache can both manage files securely.

usermod -a -G apache ec2-user
chown -R ec2-user:apache /var/www
chmod 2775 /var/www
find /var/www -type d -exec chmod 2775 {} \;
find /var/www -type f -exec chmod 0664 {} \;


# Get the Instance Availability Zone (AZ)
# Uses IMDSv2 to securely fetch the EC2 Availability Zone., This dynamic AZ is later displayed on the web page.

TOKEN=`curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600"`
INSTANCE_AZ=`curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/placement/availability-zone`

# Create index.html for Website

cat > /var/www/html/index.html <<EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AWS Auto Scaling Demo</title>
  <style>
    body {
      background: linear-gradient(135deg, #ffa200, #ff6a00);
      color: white;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      text-align: center;
    }
    h1 {
      font-size: 2.5rem;
      margin-bottom: 10px;
    }
    p {
      font-size: 1.2rem;
      opacity: 0.8;
    }
    .box {
      background: rgba(0, 0, 0, 0.2);
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
    }
  </style>
</head>
<body>
  <div class="box">
    <h1>🚀 Welcome to AWS Auto Scaling!</h1>
    <p>This EC2 instance is running in:</p>
    <h2>✨ Availability Zone: <strong>$INSTANCE_AZ</strong></h2>
  </div>
</body>
</html>
EOF

# Create a Health Check File, This file is used by the Load Balancer for health checks.

echo "This is the health check file" > /var/www/html/health.html
