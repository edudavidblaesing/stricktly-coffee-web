# Use nginx alpine for a lightweight web server
FROM nginx:alpine

# Copy website files to nginx html directory
COPY web/ /usr/share/nginx/html/web/
COPY pesado/ /usr/share/nginx/html/pesado/

# Copy nginx configuration (use nginx.conf for HTTP, nginx-ssl.conf for HTTPS)
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Uncomment the line below and comment the line above when using SSL:
# COPY nginx-ssl.conf /etc/nginx/conf.d/default.conf

# Expose ports 80 (HTTP) and 443 (HTTPS)
EXPOSE 80 443

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
