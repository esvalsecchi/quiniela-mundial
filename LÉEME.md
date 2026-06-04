# 🏆 Quiniela Mundial 2026 — Grupo Hogar

Guía para **publicarla en línea** y (opcional) activar el **modo compartido** con tabla de ganadores automática.

---

## 📁 ¿Qué archivos son?

```
index.html                 ← la página (ábrela y ya funciona)
quiniela/
  data.js                  ← equipos, grupos, partidos, jugadores
  styles.css               ← diseño
  components.jsx            ← tarjetas de grupos, marcadores, bracket
  leaderboard.jsx          ← tabla de ganadores
  admin.jsx                ← panel para capturar resultados
  scoring.js               ← motor de puntos
  cloud.js                 ← sincronización (nube o este dispositivo)
  firebase-config.js       ← AQUÍ pegas tus claves de Firebase
```

> Tal cual, la quiniela **ya funciona**: cada quien la llena y se guarda **en su propio dispositivo**.
> Para que TODOS compartan datos y la tabla se actualice sola, activa Firebase (Parte 2).

---

## 🌐 PARTE 1 — Publicarla en línea (GitHub Pages, gratis)

1. Crea una cuenta en **github.com** (si no tienes).
2. Arriba a la derecha: **+ ▸ New repository**.
   - Nombre: `quiniela-mundial`
   - Marca **Public** ▸ **Create repository**.
3. En la página del repo, haz clic en **uploading an existing file** (o **Add file ▸ Upload files**).
4. **Arrastra** el archivo `index.html` **y** la carpeta `quiniela/` completa.
   Espera a que suban y pulsa **Commit changes**.
5. Ve a **Settings ▸ Pages** (menú izquierdo).
   - En **Source** elige **Deploy from a branch**.
   - Branch: **main** · carpeta **/ (root)** ▸ **Save**.
6. Espera 1–2 minutos y recarga. Aparecerá tu liga, algo como:

   ```
   https://TU-USUARIO.github.io/quiniela-mundial/
   ```

7. **Comparte esa liga** con la familia. ¡Listo! 🎉

> ⚠️ Sin la Parte 2, cada persona llena su quiniela en su celular y los datos **no se comparten**.
> Para la porra real con tabla común, sigue la Parte 2.

---

## ☁️ PARTE 2 — Modo compartido + tabla automática (Firebase, gratis)

Esto hace que todos jueguen sobre **la misma base de datos** y que la **tabla de ganadores** se calcule sola con los resultados.

### A) Crear el proyecto

1. Entra a **https://console.firebase.google.com** con tu cuenta de Google.
2. **Agregar proyecto** ▸ ponle nombre (`quiniela-hogar`) ▸ continúa (puedes desactivar Analytics).
3. En el menú izquierdo: **Compilación ▸ Firestore Database** ▸ **Crear base de datos**.
   - Ubicación: la más cercana ▸ **Siguiente**.
   - Empieza en **modo de producción** ▸ **Habilitar**.

### B) Obtener tus claves

4. Arriba, ⚙️ **Configuración del proyecto**.
5. Baja a **Tus apps** ▸ ícono **Web** `</>`.
6. Registra la app (cualquier apodo) ▸ verás un bloque `const firebaseConfig = { ... }`.
7. Copia **solo** el objeto (apiKey, authDomain, projectId, etc.).

### C) Pegar las claves en la quiniela

8. Abre `quiniela/firebase-config.js` y:
   - Cambia `ENABLED: false` ➜ `ENABLED: true`
   - Reemplaza el bloque `config: { ... }` con **tus** claves.
   - Cambia `ADMIN_PIN` por una clave secreta (la usarás para capturar resultados).
9. Sube de nuevo el archivo a GitHub (**Add file ▸ Upload files**, lo reemplaza).

### D) Permisos de la base de datos

10. En Firestore ▸ pestaña **Reglas**, pega esto y **Publicar**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /quiniela/{doc} {
      allow read, write: if request.time < timestamp.date(2026, 8, 1);
    }
  }
}
```

> Esto deja abierta la quiniela hasta el **1 de agosto de 2026** (termina el Mundial el 19 jul).
> Es lo más simple para una porra familiar privada: cualquiera con tu liga puede jugar, pero no
> queda abierta para siempre. Cambia la fecha si quieres.

Cuando recargues la página, arriba a la derecha el indicador dirá **“En la nube”** ✅.

---

## ⚙️ Capturar resultados (modo admin)

1. En la quiniela, pulsa **🔐 Admin** (arriba) e ingresa tu **PIN**.
2. Aparece la pestaña **⚙️ Admin** con tres apartados:
   - **Grupos reales** — quién terminó 1.º y 2.º de verdad.
   - **Marcadores reales** — el marcador final de los partidos estelares.
   - **Eliminatoria real** — semifinalistas, finalistas, campeón y 3.er lugar.
3. La **Tabla de Ganadores** se recalcula sola con cada captura.
4. Control de **bloqueo** de pronósticos:
   - **Automático** — se cierran solos el 11 jun (arranque).
   - **Abierto / Cerrado** — fuerza el estado cuando quieras.

---

## 🧮 Puntos

| Puntos | Por |
|---|---|
| +3 | Cada equipo clasificado acertado |
| +2 | Acertar al ganador del grupo (1.º) |
| +5 | Marcador exacto de partido estelar |
| +2 | Acertar el resultado (gana / empate) |
| +5 | Cada semifinalista correcto |
| +8 | Cada finalista correcto |
| +12 | Acertar al Campeón |
| +4 | Acertar el 3.er lugar |

---

¿Dudas? Escríbeme y te ayudo a dejarla en línea. ⚽
*Grupo Hogar · Quiniela Mundial 2026*
