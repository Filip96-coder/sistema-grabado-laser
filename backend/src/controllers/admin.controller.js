const OrdenTrabajo = require('../models/OrdenTrabajo');

const obtenerResumenAdmin = async (req, res) => {
  try {
    const ordenes = await OrdenTrabajo.find().sort({ createdAt: -1 }).lean();
    const totalOrdenes = ordenes.length;
    const terminadas = ordenes.filter((orden) => orden.estado === 'Terminado').length;
    const pendientes = totalOrdenes - terminadas;
    const valorTotal = ordenes.reduce((acc, orden) => acc + (orden.precio_cop || 0), 0);

    const clientes = new Set(ordenes.map((orden) => orden.cliente).filter(Boolean));
    const materiales = new Set(ordenes.map((orden) => orden.material).filter(Boolean));

    return res.json({
      session: {
        username: req.auth.sub,
        role: 'admin',
      },
      metrics: {
        total_ordenes: totalOrdenes,
        ordenes_terminadas: terminadas,
        ordenes_pendientes: pendientes,
        valor_total_cop: valorTotal,
        clientes_activos: clientes.size,
        materiales_activos: materiales.size,
      },
      latest_orders: ordenes.slice(0, 5).map((orden) => ({
        id: String(orden._id),
        cliente: orden.cliente,
        objeto: orden.objeto,
        material: orden.material,
        estado: orden.estado,
        precio_cop: orden.precio_cop,
      })),
    });
  } catch (error) {
    return res.status(500).json({ error: 'No se pudo cargar el panel administrativo' });
  }
};

module.exports = { obtenerResumenAdmin };
