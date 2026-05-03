# VModa iOS

Wrapper iOS standalone con Capacitor 8 que carga la web ASP.NET Core publicada en Azure mediante `WKWebView` remoto y agrega funcionalidad nativa real para App Store Review.

## Configuracion obligatoria antes de publicar

1. Reemplazar `tu-dominio.azurecontainerapps.io` por el dominio real en:
   - `capacitor.config.ts`
   - `ios/App/App/Info.plist`, clave `WKAppBoundDomains`
2. Agregar `ios/App/App/GoogleService-Info.plist` descargado desde Firebase.
3. En Apple Developer y Firebase:
   - habilitar Push Notifications para el bundle `com.vmoda.app`
   - cargar APNs Auth Key o certificado en Firebase
   - verificar que el entitlement `aps-environment` quede en `production` para Release
4. En el backend, aplicar la migracion `20260430030000_AddNativePushSubscriptionMetadata` antes de probar tokens nativos.

## Comandos

```bash
npm install
npm run make:assets
npm run sync:cap-assets
npx cap sync ios
npx cap open ios
```

`npm run sync:cap-assets` copia los assets nativos del wrapper hacia `../TuClosetVirtual/wwwroot/cap/`, que es desde donde la web Azure sirve los scripts al detectar Capacitor.

## Funcionalidades nativas incluidas

- Camara nativa para inputs de imagen del probador virtual, exponiendo `window.VModa.abrirCamara()`.
- Push notifications FCM/APNs con registro en `/api/notificaciones/registrar-token-nativo`.
- Banner in-app para notificaciones en foreground.
- Haptic feedback para carrito, favoritos, probador y elementos con `data-haptic`.
- Share nativo en paginas de producto.
- Tab bar inferior iOS con Inicio, Explorar, Probador, Carrito y Perfil.
- Safe areas, estilos touch, animacion de pagina, pull-to-refresh y doble tap arriba para volver al inicio.

## Nota sugerida para App Store Review

La camara nativa mediante Capacitor Camera es funcionalidad central de VModa: permite al usuario fotografiarse para el Probador Virtual IA que aplica prendas del catalogo sobre su imagen. Las push notifications APNs notifican estados de pedidos y envios en tiempo real. Sin estos features nativos, la propuesta de valor principal de la app no funciona.

## Validacion manual post-build

- `is-native-app` aparece en `<html>` al correr en simulador o dispositivo.
- La tab bar inferior aparece, respeta safe areas y navega correctamente.
- El input del Closet Virtual abre Camera/Photos en dispositivo real.
- El token FCM se guarda como `endpoint = fcm:{token}` en `PushSubscriptions`.
- Una notificacion enviada desde Firebase Console muestra banner in-app en foreground.
- El tap en una notificacion navega a `notification.data.url` si viene informado.
- No aparecen errores en Xcode console al navegar entre paginas.
