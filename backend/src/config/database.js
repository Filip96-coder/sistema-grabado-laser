const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI no está definida en las variables de entorno');
  }

  await mongoose.connect(uri);
  console.log('Conexión a MongoDB Atlas establecida');
};

module.exports = connectDB;
