// Forzando el cambio para el deploy final
const express = require('express');
const { Pool } = require('pg'); // Asegúrate de que usa 'pg'

const app = express();
// Render te dará un puerto, así que es mejor usar esta línea
const port = process.env.PORT || 3000; 

// ¡CONFIGURACIÓN NUEVA!
// Reemplaza los datos con los que copiaste de Supabase
const pool = new Pool({
  user: 'postgres.lgbwztsxapodtzlpfmhe',
  host: 'aws-0-us-east-2.pooler.supabase.com',
  database: 'postgres',
  password: 'Video123', // La que guardaste al crear el proyecto
  port: 6543,
});
// La ruta de la API
app.get('/api/mascotas', async (req, res) => {
    try {
        // En PostgreSQL, es común usar comillas dobles para los nombres de tablas
        const result = await pool.query('SELECT * FROM "Mascotas"'); 
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

app.listen(port, () => {
    console.log(`API de la veterinaria escuchando en el puerto ${port}`);
});