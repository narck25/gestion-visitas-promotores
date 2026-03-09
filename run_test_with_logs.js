const { spawn } = require('child_process');
const path = require('path');

console.log('=== Iniciando servidor y prueba de subida de archivos ===\n');

// Iniciar servidor
const server = spawn('node', ['src/index.js'], {
  stdio: 'pipe',
  shell: true
});

server.stdout.on('data', (data) => {
  console.log(`[Servidor] ${data.toString()}`);
});

server.stderr.on('data', (data) => {
  console.error(`[Servidor ERROR] ${data.toString()}`);
});

// Esperar a que el servidor se inicie
setTimeout(() => {
  console.log('\n=== Ejecutando prueba de subida de archivos ===\n');
  
  // Ejecutar prueba
  const test = spawn('node', ['test_upload.js'], {
    stdio: 'inherit',
    shell: true
  });
  
  test.on('close', (code) => {
    console.log(`\n=== Prueba finalizada con código ${code} ===`);
    
    // Detener servidor
    server.kill();
    console.log('Servidor detenido');
    process.exit(code);
  });
  
}, 5000); // Esperar 5 segundos para que el servidor se inicie

// Manejar salida del proceso
process.on('SIGINT', () => {
  server.kill();
  process.exit(0);
});