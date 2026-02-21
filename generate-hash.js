const bcrypt = require('bcryptjs');

const password = '123456';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error generando hash:', err);
    return;
  }
  
  console.log('Hash bcrypt para contraseña "123456":');
  console.log(hash);
  
  // También mostrar el SQL actualizado
  console.log('\nSQL para actualizar usuarios:');
  console.log(`UPDATE "User" SET password = '${hash}' WHERE email = 'sistemas@kram.mx';`);
  console.log(`-- Para supervisor@kram.mx y promotor@kram.mx usar el mismo hash`);
});