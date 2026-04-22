FROM node:20-alpine AS build 
WORKDIR /app 
COPY package*.json ./ 
RUN npm install 
RUN npm install jspdf-autotable exceljs file-saver @types/file-saver 
COPY . . 
RUN npm run build 
 
FROM nginx:alpine 
COPY --from=build /app/dist /usr/share/nginx/html 
EXPOSE 80
