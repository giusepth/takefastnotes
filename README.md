# TakeFastNotes

Cuaderno de notas rápidas que funciona por completo dentro del navegador. Capturás una idea, una
funcionalidad, una corrección o una decisión en una tecla, y la clasificás después — sin cuenta,
sin servidor y sin que nadie más pueda ver lo que escribís.

El producto, la arquitectura y la política de datos están especificados en [`spec.md`](spec.md).
La verdad del producto está en [`PRODUCT.md`](PRODUCT.md) y el sistema de diseño en
[`DESIGN.md`](DESIGN.md).

**Está en producción:** https://takefastnotes.vercel.app

## Cómo correrlo

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 101 tests
npm run build      # build estático en dist/
npm run preview    # sirve el build de producción
```

## Stack

React 19 + Vite 8 + JavaScript plano (sin TypeScript), CSS con custom properties, IndexedDB para
persistir. **Cero dependencias de runtime** más allá de React: las tipografías van self-hosted
(woff2 en `src/styles/fonts/`), los iconos son SVG autorales y no hay ninguna llamada de red
después de cargar la app.

## Desplegar en Vercel (plan gratuito)

1. `git push` a GitHub.
2. En Vercel: **Import Project** → apuntá al repo → Framework Preset **Vite** → Deploy.
3. `vercel.json` ya define el build (`npm run build`), el output (`dist`) y las cabeceras de
   seguridad.

> **El dominio es la clave de la base de datos.** IndexedDB pertenece al origen: `notes.vercel.app`
> y `notes.tuempresa.com` son dos bases distintas, y las notas no se mudan solas. Elegí el nombre
> del proyecto de Vercel como si fuera permanente, y usá **Exportar copia de seguridad** (en
> *Acerca de*) antes de cambiar cualquier cosa.

## Cómo se organiza el código

```
src/domain/    entidades, políticas y use cases. JS puro: sin React, sin IndexedDB.
src/infra/     el adapter de IndexedDB y el backup en archivo. Implementa los ports del dominio.
src/ui/        componentes, vistas, estilos y el store. Habla con el dominio, nunca con la base.
```

La regla de dependencia es `ui → domain ← infra`. El dominio se puede testear sin navegador y la
base se puede cambiar sin tocar una sola regla de negocio.

## Herramientas de diseño

La interfaz se diseñó con el skill **Impeccable** (instalado localmente, no versionado):

```bash
npx impeccable install --providers=opencode --scope=project
```

Sus decisiones de diseño están en `DESIGN.md`, y `.impeccable/` guarda el contrato de dirección.
