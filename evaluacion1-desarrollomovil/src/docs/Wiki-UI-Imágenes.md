# Documentación: UI, flujo de imágenes y notas de implementación

**Resumen**
- **Propósito:** Describir los cambios implementados en la interfaz (home, listar, agregar, detalle, login, register), cómo se gestionan las imágenes (captura con cámara / fallback), y cómo probar / depurar el flujo para que las portadas se muestren correctamente en la lista.
- **Stack:** Angular 20, Ionic 8 (Ionic Angular), Capacitor 7, TypeScript, SCSS.
- **Alcance:** UI/UX, persistencia en `localStorage` (prototipo), flujo de fotos con `@capacitor/camera` y FileReader (DataURL).

---

## Qué incluye este cambio

- Bienvenida (`home`) con CTA centrado.
- Formulario `Agregar` con:
  - Entrada para `cover` (URL) y botón para tomar foto con la cámara.
  - Al tomar la foto, la DataURL se guarda en el control `cover` del formulario (garantiza que la imagen se persista al guardar).
- `Listar`: muestra la colección de juegos con portada (`img[src]=g.cover`) y fallback si no hay portada o la imagen falla.
- `Detalle`: flujo de edición/ver con preview de imagen.
- `UserService` (registro/login) guardando usuarios en `localStorage` (registro y login prototipo).
- Utilidades globales responsive en `src/global.scss`.

## Archivos modificados / añadidos (resumen)

- `src/app/pages/home/*` — interfaz de bienvenida.
- `src/app/pages/listar/listar.page.*` — plantilla y estilos para la lista.
- `src/app/pages/agregar/agregar.page.*` — formulario, lógica de cámara, patchValue de `cover`.
- `src/app/pages/detalle/detalle.page.*` — carga/preview y conversión a DataURL.
- `src/app/services/game.service.ts` — persistencia de juegos en `localStorage` (`STORAGE_KEY = 'app_games_v1'`).
- `src/app/services/user.service.ts` — (nuevo) persistencia de usuarios en `localStorage`.
- `src/global.scss` — utilidades y breakpoints globales.

> Nota: revisar los archivos concretos en el repositorio para ver implementaciones completas.

## Cómo funciona el flujo de imágenes (técnico)

- **Captura cámara:**
  - Se usa `@capacitor/camera` con `resultType: CameraResultType.DataUrl` cuando la plataforma lo soporta.
  - El resultado es una DataURL (cadena base64) que se asigna a la variable `imagenCapturada`.
  - Se parchea el control del formulario: `this.form.patchValue({ cover: this.imagenCapturada })`.
- **Guardado:**
  - `GameService.add()` crea un objeto `Game` con la propiedad `cover` igual a la DataURL (o a la URL ingresada por el usuario).
  - La lista completa se guarda en `localStorage` como JSON bajo la clave `app_games_v1`.
- **Visualización:**
  - En `listar.page.html` el `img` usa `[src]="g.cover"`. Si `g.cover` contiene una DataURL válida, la imagen aparece.
  - Si la URL es inválida (404 o formato incorrecto), el `onImgError` en el componente ejecuta `g.cover = ''` para forzar el fallback visual (icono).

## Comandos para ejecutar localmente (Windows PowerShell)

- Instalar dependencias (si falta):
```powershell
npm install
```

- Levantar servidor de desarrollo (Angular / Ionic):
```powershell
npm start
# o
ng serve --open
```

- Revisar la app en el navegador:
  - Abrir: `http://localhost:4200`

## Probar el flujo de captura y lista (paso a paso)

1. Abrir la app en el navegador (o en dispositivo real con Capacitor).
2. Ir a `Agregar`.
3. Rellenar `Título`, `Plataforma`, `Precio` (campos obligatorios).
4. Pulsar `Tomar foto con cámara`.
   - En navegador desktop normalmente se abre el selector de archivos (fallback).
   - En dispositivo Android/iOS con Capacitor configurado, se abrirá la cámara.
5. Verás el preview debajo (imagen generada desde DataURL).
6. Pulsar `Agregar`.
7. Volver a `Listar` y verificar que la portada aparece junto al juego.

## Depuración: por qué no aparece la imagen en `Listar`

- **Verificaciones rápidas:**
  - **LocalStorage:** abrir Consola del navegador y ejecutar:
    ```javascript
    JSON.parse(localStorage.getItem('app_games_v1') || '[]')
    ```
    - Revisa que el objeto `Game` creado tiene `cover` y que el valor es una DataURL (`data:image/jpeg;base64,...`) o una URL válida.
  - **Binding en template:** revisar que en `src/app/pages/listar/listar.page.html` la línea es:
    ```html
    <img *ngIf="g.cover" [src]="g.cover" (error)="onImgError($event, g)" alt="cover" />
    ```
  - **onImgError:** si la imagen falla al cargar, el handler asigna `g.cover = ''` para mostrar icono fallback; revisa la consola para ver errores (CORS, 404).
  - **Formato:** si `g.cover` es un objeto Blob URL (`blob:`) que no se serializó antes de guardar en `localStorage`, al recargar la app ese `blob:` ya no existirá. Solución aplicada: convertir a DataURL antes de persistir (FileReader / Camera DataUrl).

- **Mensajes/errores comunes:**
  - `Not allowed to load local resource` → url inválida o acceso local no permitido.
  - `The source list is not proper image data` → `g.cover` no contiene una URL/DataURL válida.

Si `cover` es `null`, `undefined` o una cadena vacía, revisa donde se guarda el juego (`agregar.page.ts`) para asegurarte que se usa `payload.cover || this.imagenCapturada`.

## Ejemplo rápido (código relevante)

- Parchear el control `cover` al tomar foto:
```ts
// después de recibir foto.dataUrl
this.imagenCapturada = foto.dataUrl;
this.form.patchValue({ cover: this.imagenCapturada });
```

- Uso al guardar:
```ts
const payload = this.form.value;
const created = this.gameSvc.add({
  title: payload.title,
  platform: payload.platform,
  year: payload.year,
  price: Number(payload.price),
  cover: (payload.cover && payload.cover.length) ? payload.cover : this.imagenCapturada
});
```

## Migración recomendada a almacenamiento nativo (producción)

- **Motivo:** `localStorage` y DataURLs son útiles para prototipo, pero grandes imágenes ocupan mucho espacio y no es óptimo para producción.
- **Opciones:**
  - Usar `@capacitor/filesystem` para guardar archivos localmente y almacenar la ruta (URI) en `Game.cover`.
  - Subir la imagen a un servidor (S3, Firebase Storage, backend propio) y guardar la URL remota en `Game.cover`.

- **Pasos básicos para `@capacitor/filesystem`:**
  1. Instalar plugin:
     ```powershell
     npm install @capacitor/filesystem
     npx cap sync
     ```
  2. Guardar archivo binario desde DataURL:
     - Convertir DataURL a base64 y usar `Filesystem.writeFile()` para guardarlo.
  3. Guardar en `Game.cover` la ruta devuelta (`file://...`) o una URL pública si subes a un servidor.

> Nota: manejar permisos en Android y testear en dispositivos.

## Dependencias importantes

- `@capacitor/camera` — captura de fotos y retorno en DataURL.
- `@capacitor/filesystem` (opcional, para migración).
- `@capacitor/preferences` (si usas para settings; se instaló en el repo).

## Problemas conocidos y soluciones rápidas

- Problema: imagen tomada en navegador no aparece en la lista al recargar.
  - Causa probable: usaste un `blob:` object URL y lo guardaste en `localStorage` sin convertirlo a DataURL. Los `blob:` son temporales.
  - Solución: convertir a DataURL con FileReader antes de persistir. (Ya está aplicado en `detalle` y en `agregar` toma DataUrl desde Capacitor).
- Problema: imagen válida pero no visible en `Listar` (solo icono).
  - Revisa consola para errores (CORS o 404).
  - Ejecuta el `JSON.parse(localStorage.getItem('app_games_v1'))` y verifica el contenido de `cover`.
  - Verifica que la plantilla muestra `g.cover` con `[src]`.

## Checklist / Buenas prácticas

- Evitar guardar blobs (`URL.createObjectURL`) en `localStorage`.
- Convertir siempre imágenes a DataURL o almacenar en Filesystem / servidor.
- Añadir validaciones de tamaño y compresión de imagen antes de persistir.
- Agregar pruebas manuales y automatizadas que validen que `cover` persiste y se muestra en `Listar`.

---

**Autor:** Equipo de desarrollo
**Fecha:** 23 de noviembre de 2025
