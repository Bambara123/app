// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Exclude project's functions directory (Firebase Cloud Functions) and build files from Metro bundler
// Be specific to avoid blocking node_modules/*/functions directories (like semver/functions)
config.resolver.blockList = [
  new RegExp(`${path.resolve(__dirname, 'functions').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*`),
  /\.ipa$/,
];

// Fix semver resolution issue with react-native-reanimated
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'semver': path.resolve(__dirname, 'node_modules/semver'),
};

// Ensure proper resolution of node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
];

module.exports = config;

