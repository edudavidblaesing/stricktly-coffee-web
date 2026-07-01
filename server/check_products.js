import pg from 'pg';
const { Client } = pg;
const client = new Client({ connectionString: 'postgresql://sc_admin:sc_admin@localhost:5432/stricktlycoffee' });
client.connect().then(async () => {
  const res = await client.query('SELECT id, title, brand_id FROM products');
  console.log(res.rows);
  client.end();
});
