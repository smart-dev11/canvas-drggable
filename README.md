# moss-canvas-app

## Setup

1. clone the repo
1. `yarn install`
1. Make sure your editor is setup to pay attention to .prettierrc

## Run Locally

There are 4 ways to run the app locally (note that you need to have run the installer prior to running locally so that the file sync daemon is on your local machine):

- `yarn start` || `yarn start:staging`
- `yarn start:prod`
- `yarn start:build`
- `yarn start:custom`

`start` and `start:staging` use the `.env-staging` file and set the file sync daemon to point to the staging database.

`start:prod` uses the `.env-live` file and sets the file link daemon to point to the production database.

`start:build` uses the same settings as `start:prod` but then makes a production build of the app and serves that locally on port 3003. This can be useful if you want to see how the app runs in production mode with all of the optimizations that come with that (minification, etc)

`start:custom` just runs the `react-scripts` start command and allows you to pass whatever custom config options to that command you'd like.

## Deploy to firebase hosting

Good reference: https://www.robinwieruch.de/firebase-deploy-react-js

### Install firebase CLI

```
npm install -g firebase-tools
firebase login
```

### Update Moss.pkg

Make sure to have the most recent Moss.pkg copied into the `public` directory, for example:

```
cp ~/projects/moss/moss-canvas-daemon/Installer/Moss/build/Moss.pkg ~/projects/moss/moss-canvas-app/public
```

### Deploy to staging

```
cp .env-staging .env
yarn build
firebase use staging
firebase deploy
```

You can also run the `deploy:staging` command at this step assuming you have followed the previous instructions.

### Deploy to production (aka live / prototype)

```
cp .env-live .env
yarn build
firebase use default
firebase deploy
```

You can also run the `deploy:prod` command at this step assuming you have followed the previous instructions.
