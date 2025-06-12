export default () => ({
  app: {
    port: parseInt(process.env.PORT ?? '3000', 10),
    environment: process.env.NODE_ENV ?? 'development',
  },
  database: {
    type: process.env.DB_TYPE ?? 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USER ?? 'username',
    password: process.env.DB_PASS ?? 'password',
    database: process.env.DB_NAME ?? 'mydatabase',
    synchronize: process.env.DB_SYNC === 'true', // ⚠️ KHÔNG nên true ở production
    autoLoadEntities: true,
    env: process.env.NODE_ENV ?? 'development',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'mysecretkey',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
  },
});
