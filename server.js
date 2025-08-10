const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json()); // <-- LÍNEA NUEVA: Permite que tu API entienda los datos JSON que le envía el formulario.

const pool = new Pool({
  user: 'postgres.lgbwztsxapodtzlpfmhe',
  host: 'aws-0-us-east-2.pooler.supabase.com',
  database: 'postgres',
  password: 'Video123', // ¡Recuerda poner tu contraseña aquí!
  port: 6543,
});

// --- ENDPOINT PARA OBTENER MASCOTAS (el que ya tenías) ---
app.get('/api/mascotas', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM "Mascotas"'); 
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

// --- ENDPOINT NUEVO PARA CREAR PROPIETARIOS ---
app.post('/api/propietarios', async (req, res) => {
    // Obtenemos los datos del nuevo propietario que vienen del formulario
    const { nombre, apellido, email, telefono, direccion } = req.body;

    try {
        // Creamos la consulta SQL para insertar los datos de forma segura
        const query = 'INSERT INTO "Propietarios" (nombre, apellido, email, telefono, direccion) VALUES ($1, $2, $3, $4, $5) RETURNING *';
        const values = [nombre, apellido, email, telefono, direccion];
        
        // Ejecutamos la consulta
        const result = await pool.query(query, values);
        
        // Devolvemos el nuevo propietario que se creó (con su ID)
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});


app.listen(port, () => {
    console.log(`API de la veterinaria escuchando en el puerto ${port}`);
});