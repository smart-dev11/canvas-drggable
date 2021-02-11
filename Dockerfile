FROM node:14.7
RUN apt-get update -qq
RUN mkdir /workspace
WORKDIR /workspace
COPY . /workspace
RUN yarn install

EXPOSE 3000

CMD ["yarn", "start"]
