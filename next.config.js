/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
    };

    config.externals.push(
      "pino-pretty",
      "lokijs",
      "encoding",
      {
        "node-gyp-build": "commonjs node-gyp-build",
      },
      "hardhat"
    );
    return config;
  },
};

module.exports = nextConfig;
