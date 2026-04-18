import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Parent folders may contain other lockfiles; pin Turbopack root to this app.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
