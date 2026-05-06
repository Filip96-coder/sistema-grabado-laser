const xml2js = require('xml2js');
const OrdenTrabajo = require('../models/OrdenTrabajo');

const generarInformeOperacion = async (req, res) => {
  try {
    const ordenes = await OrdenTrabajo.find().lean();

    // --- Cálculos financieros y operativos ---
    const totalOrdenes = ordenes.length;
    const ordenesTerminadas = ordenes.filter((o) => o.estado === 'Terminado').length;
    const ordenesPendientes = totalOrdenes - ordenesTerminadas;
    const valorTotal = ordenes.reduce((acc, o) => acc + (o.precio_cop || 0), 0);

    // Evita división por cero cuando no hay órdenes
    const porcentajeEjecutado =
      totalOrdenes > 0
        ? parseFloat(((ordenesTerminadas / totalOrdenes) * 100).toFixed(2))
        : 0;

    // --- Agrupación por material ---
    const agrupado = ordenes.reduce((acc, orden) => {
      const mat = orden.material;
      if (!acc[mat]) acc[mat] = [];
      acc[mat].push(orden);
      return acc;
    }, {});

    // Estructura compatible con xml2js Builder
    // Los atributos XML se declaran en la clave especial '$'
    const gruposMaterial = Object.entries(agrupado).map(([nombreMaterial, trabajos]) => ({
      $: { nombre: nombreMaterial, cantidad: trabajos.length },
      trabajo: trabajos.map((t) => ({
        $: { id: String(t._id) },
        cliente: t.cliente,
        objeto: t.objeto,
        estado: t.estado,
        precio_cop: t.precio_cop,
        potencia_w: t.parametros_laser?.potencia ?? 'N/A',
        velocidad_mm_s: t.parametros_laser?.velocidad ?? 'N/A',
      })),
    }));

    // Objeto JSON que será convertido a XML
    const informeJSON = {
      resumen: {
        total_ordenes: totalOrdenes,
        ordenes_terminadas: ordenesTerminadas,
        ordenes_pendientes: ordenesPendientes,
        valor_total_cop: valorTotal,
        porcentaje_ejecutado: `${porcentajeEjecutado}%`,
      },
      materiales: {
        material: gruposMaterial,
      },
    };

    // --- Parseo JSON → XML ---
    const builder = new xml2js.Builder({
      rootName: 'informe_operacion',
      xmldec: { version: '1.0', encoding: 'UTF-8' },
      renderOpts: { pretty: true, indent: '  ', newline: '\n' },
    });

    const xmlString = builder.buildObject(informeJSON);

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.send(xmlString);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { generarInformeOperacion };
