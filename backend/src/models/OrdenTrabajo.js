const mongoose = require('mongoose');

const OrdenTrabajoSchema = new mongoose.Schema(
  {
    cliente: {
      type: String,
      required: [true, 'El nombre del cliente es requerido'],
      trim: true,
    },
    objeto: {
      type: String,
      required: [true, 'El objeto a grabar es requerido'],
      trim: true,
    },
    material: {
      type: String,
      required: [true, 'El material es requerido'],
      trim: true,
    },
    parametros_laser: {
      potencia: {
        type: Number,
        min: [0, 'La potencia no puede ser negativa'],
      },
      velocidad: {
        type: Number,
        min: [0, 'La velocidad no puede ser negativa'],
      },
    },
    estado: {
      type: String,
      enum: {
        values: ['Pendiente', 'Terminado'],
        message: 'El estado debe ser "Pendiente" o "Terminado"',
      },
      default: 'Pendiente',
    },
    precio_cop: {
      type: Number,
      required: [true, 'El precio en COP es requerido'],
      min: [0, 'El precio no puede ser negativo'],
    },
  },
  {
    timestamps: true, // agrega createdAt y updatedAt automáticamente
    versionKey: false,
  }
);

module.exports = mongoose.model('OrdenTrabajo', OrdenTrabajoSchema);
