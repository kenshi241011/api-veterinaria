const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json()); 

const pool = new Pool({
  user: 'postgres.lgbwztsxapodtzlpfmhe',
  host: 'aws-0-us-east-2.pooler.supabase.com',
  database: 'postgres',
  password: 'Video123', 
  port: 6543,
});


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

// --- ENDPOINT NUEVO PARA ELIMINAR UN PROPIETARIO POR SU ID ---
app.delete('/api/propietarios/:id', async (req, res) => {
    // Obtenemos el ID del propietario desde la URL (ej: /api/propietarios/5)
    const { id } = req.params;

    try {
        // Creamos y ejecutamos la consulta SQL para eliminar
        const query = 'DELETE FROM "Propietarios" WHERE propietario_id = $1';
        const result = await pool.query(query, [id]);

        // Si no se eliminó ninguna fila, significa que no se encontró el ID
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Propietario no encontrado' });
        }
        
        // Enviamos una respuesta exitosa sin contenido
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});
// --- ENDPOINT PARA OBTENER TODOS LOS PROPIETARIOS ---
app.get('/api/propietarios', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM "Propietarios" ORDER BY propietario_id DESC'); 
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

app.listen(port, () => {
    console.log(`API de la veterinaria escuchando en el puerto ${port}`);
});