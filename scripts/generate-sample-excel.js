import * as XLSX from 'xlsx';
import { writeFileSync } from 'fs';

const nombres = [
  "Juan", "María", "Carlos", "Ana", "Pedro", "Lucía", "Diego", "Sofía", "Martín", "Valentina",
  "Lucas", "Camila", "Nicolás", "Isabella", "Matías", "Florencia", "Tomás", "Julieta", "Agustín", "Catalina",
  "Santiago", "Emilia", "Benjamín", "Victoria", "Joaquín", "Antonella", "Maximiliano", "Milagros", "Francisco", "Rocío"
];

const apellidos = [
  "González", "Rodríguez", "García", "Fernández", "López", "Martínez", "Sánchez", "Pérez", "Gómez", "Díaz",
  "Romero", "Sosa", "Torres", "Álvarez", "Ruiz", "Ramírez", "Flores", "Acosta", "Medina", "Benítez"
];

const servicios = [
  "Consulta profesional", "Servicio mensual", "Reparación", "Asesoría", "Diseño web",
  "Mantenimiento", "Capacitación", "Instalación", "Desarrollo", "Soporte técnico",
  "Limpieza", "Transporte", "Catering", "Fotografía", "Marketing digital"
];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPhone() {
  const prefix = "549375"; // Argentina, Misiones
  const number = Math.floor(Math.random() * 9000000) + 1000000;
  return prefix + number;
}

function randomAmount() {
  const amounts = [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 7500, 10000, 15000, 20000];
  return randomItem(amounts);
}

// Generar 100 registros
const data = [];
for (let i = 0; i < 100; i++) {
  data.push({
    nombre: `${randomItem(nombres)} ${randomItem(apellidos)}`,
    telefono: randomPhone(),
    monto: randomAmount(),
    descripcion: randomItem(servicios)
  });
}

const ws = XLSX.utils.json_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Clientes");

// Escribir a buffer y guardar
const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
writeFileSync('/vercel/share/v0-project/public/clientes-ejemplo-100.xlsx', buffer);

console.log('Archivo generado: public/clientes-ejemplo-100.xlsx con 100 registros');
