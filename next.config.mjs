import withSerwistInit from "@serwist/next";

/** @type {import('next').NextConfig} */
const nextConfig = {};

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
});

export default withSerwist(nextConfig);
