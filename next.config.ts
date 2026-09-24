import type { NextConfig } from "next";

const config: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // Use the supported TS 6 compiler API; CLI-output parsing was intermittent in build workers.
  // Type checking stays enabled here and is also an explicit verification step.
  experimental: { useTypeScriptCli: false },
};
export default config;
