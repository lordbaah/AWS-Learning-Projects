#!/bin/bash
    yum update -y
    amazon-linux-extras install -y nginx1
    systemctl start nginx
    systemctl enable nginx

    cat <<EOT > /usr/share/nginx/html/index.html
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Welcome</title>
      <style>
        body {
          background-color: #f0f8ff;
          font-family: Arial, sans-serif;
          text-align: center;
          padding-top: 100px;
        }
        h1 {
          color: #2c3e50;
          font-size: 2.5rem;
        }
        p {
          color: #34495e;
          font-size: 1.2rem;
        }
      </style>
    </head>
    <body>
      <h1>Welcome to My Nginx Server</h1>
      <p>Deployed via Terraform 🚀</p>
    </body>
    </html>