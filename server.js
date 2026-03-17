const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración CORS para permitir peticiones desde GitHub Pages
const allowedOrigins = ['https://tu-usuario.github.io']; // Reemplaza con tu dominio de GitHub Pages
app.use(cors({
  origin: allowedOrigins
}));
app.use(express.json());

// Pool de conexiones a MySQL
onst pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Ruta de salud
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Obtener todos los ramos
app.get('/api/ramos', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM ramos ORDER BY fecha DESC, id DESC');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Crear múltiples ramos
app.post('/api/ramos/batch', async (req, res) => {
    try {
        const ramos = req.body;
        if (!Array.isArray(ramos)) {
            return res.status(400).json({ success: false, error: 'Se esperaba un array' });
        }
        const values = ramos.map(r => [
            r.codigo, r.fecha, r.proveedor, r.calidad, r.calidadAbr,
            r.variedad, r.empaque, r.ptoCorte, r.longitud, r.tallos
        ]);
        const [result] = await pool.query(
            `INSERT INTO ramos 
            (codigo, fecha, proveedor, calidad, calidadAbr, variedad, empaque, ptoCorte, longitud, tallos) 
            VALUES ?`,
            [values]
        );
        res.status(201).json({ success: true, count: result.affectedRows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Eliminar un ramo por ID
app.delete('/api/ramos/:id', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM ramos WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'No encontrado' });
        }
        res.json({ success: true, message: 'Eliminado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});
