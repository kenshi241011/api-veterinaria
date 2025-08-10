const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI("AIzaSyB1xjT_S_pPECCQZ50VDDb3vRbQBa_EHpk");
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

app.post('/api/historial/:id/resumir', protegerRuta, async (req, res) => {
    const { id } = req.params;

    try {
        // 1. Buscamos el historial médico en nuestra base de datos
        const historialQuery = 'SELECT diagnostico, tratamiento, notas_seguimiento FROM "HistorialMedico" WHERE historial_id = $1';
        const historialResult = await pool.query(historialQuery, [id]);

        if (historialResult.rows.length === 0) {
            return res.status(404).json({ message: 'Historial médico no encontrado' });
        }

        const historial = historialResult.rows[0];
        const textoCompleto = `Diagnóstico: ${historial.diagnostico}. Tratamiento: ${historial.tratamiento}. Notas: ${historial.notas_seguimiento}.`;

        // 2. Le pedimos a la IA que lo resuma
        const model = genAI.getGenerativeModel({ model: "gemini-pro"});
        const prompt = `Actúa como un asistente veterinario amigable. Resume las siguientes notas médicas de una consulta para que el dueño de la mascota pueda entenderlas fácilmente. Usa un lenguaje claro, positivo y menciona los pasos a seguir. Las notas son: "${textoCompleto}"`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const resumen = response.text();

        // 3. Devolvemos el resumen generado por la IA
        res.json({ resumen });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error al generar el resumen con IA.");
    }
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
// --- ENDPOINT NUEVO PARA MODIFICAR UN PROPIETARIO POR SU ID ---
app.put('/api/propietarios/:id', async (req, res) => {
    const { id } = req.params;
    // Obtenemos los nuevos datos desde el cuerpo de la petición
    const { nombre, apellido, email } = req.body;

    try {
       
        const query = 'UPDATE "Propietarios" SET nombre = $1, apellido = $2, email = $3 WHERE propietario_id = $4 RETURNING *';
        const values = [nombre, apellido, email, id];

        
        const result = await pool.query(query, values);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Propietario no encontrado' });
        }

        
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});
app.get('/api/mascotas/:id', protegerRuta, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM "Mascotas" WHERE mascota_id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Mascota no encontrada' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

// --- ENDPOINT PARA OBTENER EL HISTORIAL MÉDICO DE UNA MASCOTA ---
app.get('/api/mascotas/:id/historial', protegerRuta, async (req, res) => {
    const { id } = req.params; // Este es el ID de la mascota
    try {
        const query = `
            SELECT hm.* FROM "HistorialMedico" hm
            JOIN "Citas" c ON hm.cita_id = c.cita_id
            WHERE c.mascota_id = $1
            ORDER BY hm.historial_id DESC
        `;
        const result = await pool.query(query, [id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});
app.listen(port, () => {
    console.log(`API de la veterinaria escuchando en el puerto ${port}`);
});