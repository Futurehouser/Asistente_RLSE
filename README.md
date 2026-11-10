# Asistente deploy RLSE Aquaplus

App de escritorio portable (Windows, un único `.exe`) que guía paso a paso el despliegue de una RLSE a producción.

## Descargar

Descarga `Asistente_RLSE.exe` de la [última release](https://github.com/Futurehouser/Asistente_RLSE/releases/latest) y ejecútalo. No requiere instalación.

## Funciones

- Pasos resaltados con navegación **Paso previo / Paso siguiente** (barra fija abajo).
- Generador de descripción de la RLSE a partir de la descripción y la lista de HUs.
- Modo día / noche (botón en la esquina superior derecha).
- **Auto-actualización**: al abrirse, la app comprueba la última release de GitHub; si hay una versión nueva muestra un aviso y, al pulsar *Actualizar ahora*, descarga el nuevo `.exe`, sustituye al actual y se reinicia.

## Publicar una nueva versión

1. Sube el número de `version` en `package.json` (p. ej. `1.0.0` → `1.0.1`).
2. Haz commit y push a `main`.
3. GitHub Actions (`.github/workflows/release.yml`) compila el `.exe` portable y crea la release `v1.0.1` automáticamente. Las apps abiertas por los usuarios la detectarán en el siguiente arranque.

## Desarrollo

```bash
npm install
npm start      # ejecutar en modo desarrollo
npm run dist   # generar dist/Asistente_RLSE.exe
```
