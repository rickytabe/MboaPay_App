require('dotenv').config();
const appJson = require('./app.json');

module.exports = () => {
  return {
    ...appJson,
    expo: {
      ...appJson.expo,
      extra: {
        ...(appJson.expo && appJson.expo.extra ? appJson.expo.extra : {}),
        PAWAPAY_API_KEY: process.env.PAWAPAY_API_TOKEN || '',
      },
      projectId: process.env.EXPO_PROJECT_ID || appJson.expo?.projectId || undefined,
    },
  };
};
