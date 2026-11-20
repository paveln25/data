CREATE TABLE IF NOT EXISTS pedidos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  telefono TEXT NOT NULL,
  detalle TEXT,
  ip TEXT,
  pais TEXT,
  ciudad TEXT,
  lat REAL,
  lng REAL,
  fecha TEXT NOT NULL
);
