***Español** · [English](README.en.md)*

# Gincana

App para una gincana de empleados de un hospital: 10 equipos rotando por 10 estaciones de 5
minutos, un juez por estación registrando desde su celular, y un televisor mostrando los
resultados en vivo.

**Demo en vivo: <https://gincana-hegi.web.app>** — cargada con datos de ensayo para que se pueda
recorrer. Entra como juez (estación 1, PIN `6108`), mira el televisor o revisa la premiación
(PIN `2580`).

Se usó en un evento real. Los datos de esa edición (fotos y nombres del personal del hospital)
fueron eliminados después; el repositorio es solo el código y la demo usa equipos inventados.

## Por qué está hecha así

El evento era en un pueblo donde el internet se cae. Eso mandó sobre casi todas las decisiones:

- **Offline primero.** Firestore con caché persistente: el juez guarda sin señal, los datos
  quedan en su celular y suben solos al reconectar. La app es una PWA, así que abre aunque no
  haya red ni para cargar la página.
- **Nadie administra nada el día del evento.** La organizadora estaba en otro país. Se prepara
  todo antes y los jueces solo abren su estación y registran.
- **Tres redes de seguridad al guardar**: botón explícito, guardado automático al cambiar de
  equipo, y guardado automático si el celular se bloquea a mitad de captura.
- **Una sola casilla por estación.** Se empezó con tres o cuatro campos por prueba y se
  recortaron: menos cosas que vigilar con las manos llenas de lodo, menos errores.
- **La rotación se calcula sola.** Cada juez ve los equipos en el orden en que le van a llegar,
  no del 1 al 10 (`src/lib/rotacion.ts`).
- **Papel como último recurso.** Una planilla imprimible por estación, por si un celular falla.

El motor de puntaje (`src/lib/puntaje.ts`), el de rotación y la configuración de las pruebas
están cubiertos con 32 pruebas automáticas: ranking con empates, desempate por tiempo, huecos de
captura y casos límite como "una prueba que nadie alcanzó a registrar".

**Stack:** React + TypeScript + Vite · Firebase (Firestore + Hosting + auth anónima) · Vitest.

---

Tres pantallas:

| Pantalla | Quién la usa | Para qué |
| --- | --- | --- |
| `#/juez` | Los 10 jueces, desde su celular | Registrar el desempeño de su estación |
| `#/tv` | El televisor de la zona central | Presentación de equipos, desempeño en vivo y podio final |
| `#/admin` | La organización, antes del evento | Crear los equipos con foto e integrantes, respaldos |
| `#/imprimir` | La organización, antes del evento | Hoja con link, PIN y planilla de papel por estación. Se entra desde Organización y pide el mismo PIN, porque contiene los PIN de las 10 estaciones |

---

## 1. Probarlo ya, sin configurar nada

```bash
cd gincana-app && npm install && npm run dev
```

Abre <http://localhost:5173>. Arranca en **modo local**: todo se guarda en el propio navegador,
así que sirve para ensayar pero el televisor no ve lo que registran los jueces. Para eso hay que
conectar Firebase (paso 2).

Para llenar la gincana con datos de mentiras y ver cómo queda todo:
**Organización → Respaldo → Cargar datos de ensayo**.

---

## 2. Conectar Firebase

Es gratis y no pide tarjeta de crédito. Se hace una sola vez.

1. Entra a <https://console.firebase.google.com> **con una cuenta Gmail personal** y crea un
   proyecto. Puedes desactivar Google Analytics, no hace falta.

   > Usa una cuenta personal, no una institucional (`@universidad.edu`, `@empresa.com`). Con una
   > cuenta de organización, Google obliga a colgar el proyecto de una carpeta de la organización:
   > los administradores de allá pueden verlo o borrarlo, y sus políticas pueden bloquear cosas
   > como la autenticación anónima.

2. En el menú de la izquierda, **Bases de datos y almacenamiento → Firestore Database → Crear
   base de datos**. Elige la ubicación más cercana (por ejemplo `southamerica-east1`) y el
   **modo de producción** (las reglas correctas las subimos en el paso 6).
3. **Seguridad → Authentication → Comenzar → Anónimo → Habilitar.**
   Esto es lo que permite que la app entre sin usuario ni contraseña.

   > El menú de la consola de Firebase cambia cada tanto. Si no encuentras algo, usa el buscador
   > de productos que está arriba del menú. El plan **Spark (sin costo)** es suficiente para todo
   > esto; no hace falta darle a "Actualizar".
4. Arriba a la izquierda, ⚙ **Configuración del proyecto → Tus apps → `</>` (Web)**. Registra la
   app con cualquier nombre. Al final te muestra un bloque `firebaseConfig` con seis valores.
5. Copia `gincana-app/.env.example` como `gincana-app/.env.local` y pega ahí esos seis valores.
6. Sube las reglas de seguridad:

   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add
   firebase deploy --only firestore:rules
   ```

Vuelve a arrancar `npm run dev`: en la pantalla de inicio ya no debe aparecer el aviso de
"modo local".

---

## 3. Publicar la app

```bash
cd gincana-app && npm run build && cd ..
firebase deploy --only hosting
```

Te devuelve una dirección tipo `https://tu-proyecto.web.app`. **Esa es la que va en la hoja de
los jueces.** Si cambias algo después, repite estos dos comandos.

---

## 4. Antes del evento

1. Entra a `#/admin` con el PIN de organización y crea los equipos: nombre, color, los 5
   integrantes y la foto. La foto se comprime sola, no importa que venga pesada del celular.
2. En **Organización → Hojas para los jueces**, revisa que la dirección de la app sea la definitiva
   y **imprime**.
   Sale una hoja por estación con el QR, el PIN, qué vigilar y una planilla de papel de respaldo.
3. Pídele a cada juez que **abra el link con señal el día anterior** y le dé a "Agregar a
   pantalla de inicio". Así la app queda instalada en el celular y funciona aunque el día del
   evento no haya nada de internet.
4. Baja un respaldo desde **Organización → Respaldo → Respaldo completo (JSON)**.
5. Si hiciste el ensayo con datos de mentiras, dale a **Borrar todo** antes del día real.

## 5. El día del evento

Los jueces solo abren la app, escogen su estación, escriben su PIN y registran. Nadie tiene que
administrar nada.

- Cada juez navega entre equipos con las flechas `‹ Equipo ›`. Las fichas numeradas de abajo se
  ponen verdes a medida que va registrando, para que vea de un vistazo cuáles le faltan.
- El indicador de arriba dice **Todo sincronizado**, **Subiendo…** o **Sin señal · guardado aquí**.
  Mientras diga cualquiera de los tres, los datos están a salvo: si no hay señal quedan en el
  celular y suben solos apenas vuelva la conexión. La parada de hidratación de mitad de evento es
  el momento natural para que todos sincronicen.
- En el televisor se cambia de pantalla con los tres botones de abajo a la derecha o con las
  teclas `1`, `2` y `3`. En la presentación de equipos, `←` y `→` pasan de equipo.
- La pantalla de resultados finales pide un PIN, para que nadie la abra por accidente y arruine la
  sorpresa. Adentro es una premiación paso a paso: se anuncia el tercer puesto con la foto tapada,
  se destapa, y así hasta el primero; al final aparece el podio con la tabla de puntos. Se avanza
  con clic en la pantalla, `→`, la barra espaciadora o Enter, y `←` devuelve.

## 6. PINs

| Para qué | PIN |
| --- | --- |
| Organización (`#/admin`) | `1379` |
| Resultados finales en el televisor | `2580` |
| Cada estación | Ver `gincana-app/src/config/pruebas.ts`, campo `pin` |

Todos están en `gincana-app/src/config/pruebas.ts`. Cámbialos si quieres, y vuelve a imprimir la
hoja de jueces después.

---

## 7. Cómo se calculan los puntos

Todas las pruebas valen igual. En cada estación se ordenan los equipos por su desempeño y se
reparten puntos: **primer puesto 10, segundo 9, tercero 8**, y así sucesivamente.

Con empates se usa ranking estándar: si tres equipos empatan en el segundo puesto, los tres se
llevan 9 puntos y el siguiente queda de quinto, con 6.

**Desempate de la tabla general:** si dos equipos terminan con los mismos puntos totales, queda por
delante el que hizo **menor tiempo en el transporte en camilla**. Se escogió esa prueba por ser la
más ligada al oficio del personal del hospital y, al medirse en tiempo, la que menos probabilidades
tiene de volver a empatar. Si aun así empatan también en la camilla, el empate se mantiene. Quien no
tenga registro de camilla pierde el desempate. La prueba que desempata se cambia en
`ID_PRUEBA_DESEMPATE`, dentro de `gincana-app/src/config/pruebas.ts`.

Detalles que vale la pena saber:

- En la prueba de la camilla gana el **menor** tiempo. En todas las demás gana el mayor número.
- Un **0 registrado** es un resultado legítimo y queda por encima de un equipo **sin registro**.
- Un equipo **sin ningún dato** en una prueba se lleva **0 puntos**, no los puntos del último
  puesto. Si fuera de otra forma, una prueba que nadie alcanzó a registrar le repartiría 10 puntos
  a todo el mundo por empate. Esos huecos salen marcados en rojo en
  **Organización → Datos capturados**.
- Cada estación pide **un solo dato** (el que define el puesto) más observaciones. Todo lo demás
  se dejó fuera a propósito: menos cosas que vigilar, menos errores.
- Si un equipo no llega a terminar una prueba, el juez deja el registro sin guardar y lo explica
  en observaciones. Ese equipo se lleva 0 puntos en esa estación.

La lógica vive en `gincana-app/src/lib/puntaje.ts` y está cubierta con pruebas automáticas:

```bash
cd gincana-app && npm test
```

---

## 8. Si algo sale mal

- **Un juez perdió el celular o lo cerró todo.** Los datos que ya había sincronizado están en la
  nube; los que no, se recuperan de la planilla de papel. Otro juez puede volver a registrarlos
  desde cualquier dispositivo con el PIN de esa estación.
- **Se cayó el internet todo el día.** Los jueces siguen registrando sin problema. El televisor no
  se actualiza, pero apenas alguien recupere señal todo sube y el podio queda correcto.
- **Quedaron datos mal.** Se corrigen desde la misma vista del juez: se navega hasta el equipo y
  se vuelve a guardar. El botón dice "Actualizar" cuando ya hay un dato registrado.
- **Hay que reconstruir todo.** **Organización → Respaldo → Restaurar** carga un archivo JSON
  descargado antes.

---

## Estructura

```
gincana-app/src/
  config/pruebas.ts    ← las 10 estaciones: campos, criterio de puntaje y PIN
  lib/puntaje.ts       ← ranking y puntos (con pruebas automáticas)
  lib/almacen.ts       ← datos: Firestore con caché offline, o localStorage si no hay Firebase
  vistas/Juez.tsx      ← captura en el celular
  vistas/Admin.tsx     ← equipos, revisión de datos y respaldos
  vistas/TV.tsx        ← las tres pantallas del televisor
  vistas/Imprimir.tsx  ← hojas para los jueces
firestore.rules        ← seguridad de la base de datos
```
