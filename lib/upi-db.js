import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.UPI_DATABASE_URL,
  ssl: false, // ✅ IMPORTANT
});

export const upiDb = {
  query: (text, params) => pool.query(text, params),
};
