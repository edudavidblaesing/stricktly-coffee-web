# Use nginx alpine for a lightweight web server
FROM nginx:alpine

# Copy website files to nginx html directory
COPY web/ /usr/share/nginx/html/web/
COPY store/ /usr/share/nginx/html/store/

# Copy nginx configuration template (use nginx-web.conf for HTTP, nginx-web-ssl.conf for HTTPS)
COPY nginx-web.conf /etc/nginx/templates/default.conf.template
# Uncomment the line below and comment the line above when using SSL:
# COPY nginx-web-ssl.conf /etc/nginx/templates/default.conf.template

# Expose ports 80 (HTTP) and 443 (HTTPS)
EXPOSE 80 443

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
