# Asistente deploy RLSE Aquaplus

App que guía paso a paso el despliegue de una RLSE a producción. Disponible en dos formatos, con las mismas funciones:

| Formato | Archivo | Requisitos |
|---|---|---|
| Ejecutable portable (Windows) | `Asistente_RLSE.exe` | Ninguno |
| Python | `Asistente_RLSE.py` | Python 3.8+ (solo librería estándar, con Tkinter) |

## Descargar

Descarga el archivo que prefieras de la [última release](https://github.com/Futurehouser/Asistente_RLSE/releases/latest).

- `.exe`: doble clic para abrirlo.
- `.py`: `python Asistente_RLSE.py` (o doble clic si `.py` está asociado a Python).

## Funciones

- 7 pasos resaltados con navegación **Paso previo / Paso siguiente** (barra fija abajo).
- Generador de las descripciones *Description* y *Justification* de la RLSE.
- Generador de las fechas de despliegue (PRE, PRO, Shakedowns y Rollback) con sus indicaciones, y de los textos de *Implementation plan* y *Test plan*.
- Generador del email de conformidad a Blanca.
- Botones **Copiar** en todas las salidas.
- Modo día / noche (botón en la esquina superior derecha).
- **Auto-actualización**: al abrirse, la app comprueba la última release de GitHub; si hay una versión nueva muestra un aviso y, al pulsar *Actualizar ahora*, descarga el nuevo archivo (`.exe` o `.py`), sustituye al actual y se reinicia.

## Publicar una nueva versión

1. Sube el número de `version` en `package.json` (p. ej. `1.10.0` → `1.11.0`).
2. Haz commit y push a `main`.
3. GitHub Actions (`.github/workflows/release.yml`) compila el `.exe`, genera el `.py` de archivo único y crea la release automáticamente.

## Desarrollo

Versión Electron (`main.js`, `src/`):

```bash
npm install
npm start      # ejecutar en modo desarrollo
npm run dist   # generar dist/Asistente_RLSE.exe
```

Versión Python (`python/`):

```bash
python python/app.py            # ejecutar en modo desarrollo (imágenes desde python/img)
python python/build_single.py   # generar dist/Asistente_RLSE.py con las imágenes incrustadas
```

Cualquier cambio en la app debe hacerse en las dos versiones.
