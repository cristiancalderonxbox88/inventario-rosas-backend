const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Obtener la URL de conexión desde las variables de entorno
// Railway inyecta automáticamente MySQL.MYSQL_URL cuando tienes un servicio MySQL vinculado
const dbUrl = process.env.MYSQL_URL || process.env.JAWSDB_URL || process.env.CLEARDB_DATABASE_URL;

if (!dbUrl) {
  console.error('❌ No se encontró ninguna variable de conexión a la base de datos.');
  process.exit(1);
}

// Crear el pool de conexiones usando la URL
const pool = mysql.createPool(dbUrl);

// Ruta de prueba
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Obtener todos los ramos
app.get('/api/ramos', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM ramos ORDER BY fecha DESC, id DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error en GET /api/ramos:', error);
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
    console.error('Error en POST /api/ramos/batch:', error);
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
    console.error('Error en DELETE /api/ramos/:id', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
