export const appConfig = {
  name: import.meta.env.VITE_APP_NAME || 'QMS Quick Mining Solana',
  env: import.meta.env.VITE_ENV || 'development',
  isProd: import.meta.env.VITE_ENV === 'production'
};
