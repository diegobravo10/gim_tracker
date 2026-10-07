# Gym Tracker

Aplicación PWA personal para registrar entrenamientos. La instalación de producción usa PostgreSQL, una API Node/Express y nginx para servir la web y hacer proxy de `/api` hacia la API.

## Despliegue con Docker Compose

Requisitos: Docker Engine con Compose v2 y un servidor Linux donde `cloudflared` pueda alcanzar `127.0.0.1:8080`.

```bash
cp .env.prod.example .env.prod
# Edita .env.prod y establece una contraseña larga, aleatoria y URL-safe
# (letras, números, guiones y guiones bajos), porque forma parte de DATABASE_URL.
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
docker compose --env-file .env.prod -f docker-compose.prod.yml ps
```

Solo nginx se publica en el host, por defecto en `127.0.0.1:8080`. PostgreSQL y la API permanecen dentro de la red de Compose. Al arrancar, la API espera a que PostgreSQL esté saludable, ejecuta `prisma migrate deploy` y luego inicia Express.

Para consultar los logs:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f api web
```

## Backups

El servicio `backup` ejecuta un `pg_dump` en formato custom al arrancar y luego cada 24 horas. Los archivos se guardan en el volumen `postgres_backups`; se eliminan automáticamente los que tengan más de 14 días.

Listar los backups:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml exec backup ls -lh /backups
```

Copiar uno al host y restaurarlo:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml cp backup:/backups/gym-AAAAMMDDTHHMMSSZ.dump ./gym.dump
docker compose --env-file .env.prod -f docker-compose.prod.yml exec -T postgres \
  sh -c 'pg_restore --clean --if-exists --no-owner -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < gym.dump
```

Prueba periódicamente la restauración en una base separada. Un backup que nunca se ha restaurado todavía no está verificado.

## Cloudflare Tunnel: `gym.bravoserver.fun`

Con la aplicación levantada, confirma primero que responde localmente:

```bash
curl http://127.0.0.1:8080/health
```

En el panel de Cloudflare:

1. Ve a **Networking > Tunnels** y selecciona el túnel conectado al servidor (o crea uno e instala `cloudflared` con el comando que muestra Cloudflare).
2. En **Routes**, selecciona **Add route > Published application**.
3. Configura el hostname `gym.bravoserver.fun` y como Service URL usa `http://localhost:8080`.
4. Guarda la ruta. Cloudflare crea el registro DNS asociado al túnel automáticamente.

Si `cloudflared` corre en otro contenedor, `localhost` apuntará a ese contenedor y no al host. En ese caso conéctalo a la misma red de Compose y usa `http://web:80`, o cambia el bind de `WEB_PORT` conscientemente. Consulta la [guía oficial de Cloudflare Tunnel](https://developers.cloudflare.com/tunnel/get-started/).

## Protegerlo con Cloudflare Access

No hay autenticación dentro de Gym Tracker; esta política es obligatoria antes de compartir el hostname.

1. Ve a **Zero Trust > Access controls > Applications**.
2. Selecciona **Create new application > Self-hosted and private**.
3. Añade como public hostname `gym.bravoserver.fun`.
4. Crea una política llamada, por ejemplo, `Solo propietario`, con acción **Allow**.
5. En **Include**, selecciona **Emails** (dirección exacta, no dominio) y escribe únicamente tu correo completo.
6. Selecciona el proveedor de identidad que usarás. Para una instalación personal puedes habilitar el código de un solo uso por email.
7. Guarda la aplicación y comprueba en una ventana privada que Cloudflare solicita autenticación y que otra dirección queda bloqueada.

Access deniega por defecto a quien no coincida con una política Allow. No añadas reglas `Bypass`, `Everyone` ni `Emails ending in`, porque ampliarían el acceso más allá de tu dirección. Consulta la documentación oficial de [aplicaciones self-hosted](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/self-hosted-public-app/) y [políticas de Access](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/).

