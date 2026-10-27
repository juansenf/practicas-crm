// Variables de entorno mínimas para los tests unitarios.
// Vitest ya define NODE_ENV=test; aquí solo se completan los secretos.
process.env.AUTH_SECRET = "secreto-de-pruebas-con-mas-de-32-caracteres";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.SESSION_TTL_SECONDS = "3600";
