# =====================================================================
#  GastroDigest · Backend PHP — imagen para Railway
#  Base: php:8.2-apache  ·  Extensiones: pdo_mysql, mysqli, mbstring
# =====================================================================
FROM php:8.2-apache
# build-marker: rebuild limpio fix MPM (deploy v3)

# --- Extensiones PHP requeridas ---
# mbstring necesita libonig-dev; pdo_mysql + mysqli para la capa de datos.
RUN apt-get update \
    && apt-get install -y --no-install-recommends libonig-dev \
    && docker-php-ext-install pdo_mysql mysqli mbstring \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# --- Apache: garantizar un ÚNICO MPM (prefork, requerido por mod_php) ---
# Borra CUALQUIER MPM activo y deja solo prefork → imposible "More than one MPM loaded".
RUN rm -f /etc/apache2/mods-enabled/mpm_*.load /etc/apache2/mods-enabled/mpm_*.conf \
    && a2enmod mpm_prefork rewrite headers \
    && sed -ri 's!AllowOverride None!AllowOverride All!g' /etc/apache2/apache2.conf

# --- Configuración PHP de producción ---
RUN { \
        echo 'display_errors=Off'; \
        echo 'log_errors=On'; \
        echo 'error_reporting=E_ALL'; \
        echo 'expose_php=Off'; \
        echo 'session.cookie_httponly=On'; \
        echo 'session.use_strict_mode=On'; \
    } > /usr/local/etc/php/conf.d/gastrodigest.ini

# --- Código fuente (contexto de build = carpeta backend/) ---
COPY . /var/www/html/
RUN chown -R www-data:www-data /var/www/html

# Arranque: limpiamos los MPM AQUÍ (en runtime, no en build) para que el fix sea
# inmune a la caché de capas de Docker de Railway. Luego ajustamos el puerto y arrancamos.
CMD a2dismod mpm_event mpm_worker > /dev/null 2>&1 || true; \
    a2enmod mpm_prefork > /dev/null 2>&1 || true; \
    sed -i "s/Listen 80/Listen ${PORT:-80}/" /etc/apache2/ports.conf; \
    sed -i "s/<VirtualHost \*:80>/<VirtualHost *:${PORT:-80}>/" /etc/apache2/sites-available/000-default.conf; \
    apache2-foreground
