const { withNativeFederation, shareAll } = require('@softarc/native-federation/config');

module.exports = withNativeFederation({
  name: 'devkit',

  exposes: {
    './Component': './src/register.tsx',
  },

  shared: {
    ...shareAll({
      singleton: true,
      strictVersion: true,
      requiredVersion: 'auto',
    }),
  },
});
