/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL?.trim() || "https://crm-backends.onrender.com",
  },
};

export default nextConfig;
