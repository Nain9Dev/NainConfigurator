# API Contracts (Superseded)

Status: Superseded on 2026-07-18  
Canonical contract: `04.1-ApiContracts.md`

This file is retained only as historical design context. It is not authoritative and must not be used for implementation. Routes, payloads, validation behavior and error codes are defined exclusively in `04.1-ApiContracts.md`.

---

GET /api/v1/companies/{companySlug}/products/{productCode}

POST /api/v1/configurations/validate

POST /api/v1/configurations

GET /api/v1/configurations/{configurationCode}

POST /api/v1/quote-requests

## 1. Obtener el producto configurable

```
GET /api/v1/companies/naindev-demo/products/DESK-001
```

Devuelve todo lo que necesita Unity:

- Empresa.
- Producto.
- Precio base.
- Moneda.
- Grupos de opciones.
- Opciones.
- Precios adicionales.
- Valores predeterminados.
- Referencias visuales.
- Reglas de compatibilidad.
- Versión del catálogo.

El endpoint anterior:

```
GET /api/v1/catalog/{companySlug}/{productCode}
```

funcionaba, pero este resulta más escalable:

```
GET /api/v1/companies/{companySlug}/products/{productCode}
```

Posteriormente podremos añadir sin romper nada:

```
GET /api/v1/companies/{companySlug}/products
```

## 2. Validar una configuración sin guardarla

```
POST /api/v1/configurations/validate
```

Request simplificado:

```
{
  "companySlug": "naindev-demo",
  "productCode": "DESK-001",
  "catalogVersion": 1,
  "selectedOptionCodes": [
    "SIZE_160_80",
    "FINISH_DARK_WALNUT",
    "LEG_ELECTRIC_STANDING",
    "DRAWER_RIGHT",
    "ACCESSORY_MONITOR_STAND"
  ]
}
```

No enviaremos esto:

```
{
  "optionGroupCode": "DESKTOP_SIZE",
  "optionCodes": [
    "SIZE_160_80"
  ]
}
```

El cliente no debería indicar a qué grupo pertenece una opción. La API ya puede obtener esa relación desde la base de datos.

Así evitamos requests contradictorios como:

```
{
  "optionGroupCode": "LEG_TYPE",
  "optionCodes": [
    "FINISH_WHITE"
  ]
}
```

La API recibe únicamente códigos de opción y determina:

- A qué producto pertenecen.
- A qué grupo pertenecen.
- Si están activas.
- Si cumplen límites de selección.
- Si son compatibles.
- Cuánto cuestan.

La API debe seguir recalculando el precio con los valores persistidos, tal como ya establecen las reglas actuales.

## 3. Guardar una configuración

```
POST /api/v1/configurations
```

Request:

```
{
  "clientRequestId": "7d857780-a87f-44d7-9a72-9d3376941f57",
  "companySlug": "naindev-demo",
  "productCode": "DESK-001",
  "catalogVersion": 1,
  "selectedOptionCodes": [
    "SIZE_160_80",
    "FINISH_DARK_WALNUT",
    "LEG_ELECTRIC_STANDING",
    "DRAWER_RIGHT"
  ],
  "visualState": {
    "schemaVersion": 1,
    "camera": {
      "position": {
        "x": 1.50,
        "y": 2.00,
        "z": -4.50
      },
      "rotation": {
        "x": 15.00,
        "y": 35.00,
        "z": 0.00
      }
    }
  }
}
```

El request no contiene:

```
{
  "estimatedPrice": 1.00
}
```

El precio únicamente lo calcula la API.

`visualState` contiene información visual opcional. No contiene reglas comerciales, precios ni opciones seleccionadas.

## 4. Recuperar una configuración

```
GET /api/v1/configurations/NCF-8A72F1
```

La respuesta devuelve el snapshot histórico:

```
{
  "success": true,
  "data": {
    "configurationCode": "NCF-8A72F1",
    "company": {
      "slug": "naindev-demo",
      "name": "NainDev Demo Furniture"
    },
    "product": {
      "code": "DESK-001",
      "name": "Modular Gaming Desk",
      "catalogVersionAtCreation": 1
    },
    "selectedOptions": [
      {
        "optionGroupCode": "DESKTOP_SIZE",
        "optionGroupName": "Desktop Size",
        "optionCode": "SIZE_160_80",
        "optionName": "160 x 80 cm",
        "priceAdjustment": 80.00,
        "visualAssetKey": "DeskTop_160_80"
      }
    ],
    "estimatedPrice": 819.90,
    "currencyCode": "EUR",
    "createdAtUtc": "2026-07-14T12:00:00Z"
  },
  "errors": [],
  "traceId": "0HN7M9F3S6K2A:00000001"
}
```

No devuelve el catálogo actual. Devuelve exactamente los nombres, precios y assets que existían cuando se creó la configuración.

Esto respeta la regla existente de conservar snapshots para evitar que una modificación futura de precios altere configuraciones históricas.

## 5. Solicitar presupuesto

```
POST /api/v1/quote-requests
```

Request:

```
{
  "clientRequestId": "e0bd8310-7e2c-4cf3-89b6-41f2e68d92dc",
  "configurationCode": "NCF-8A72F1",
  "contact": {
    "name": "John Smith",
    "email": "john.smith@example.com",
    "phone": "+34123456789"
  },
  "message": "I would like to receive a quote for this configuration.",
  "privacyPolicy": {
    "accepted": true,
    "version": "2026-07-14"
  }
}
```

He agrupado los datos personales dentro de:

```
{
  "contact": {}
}
```

Esto permite añadir posteriormente, sin ensuciar el objeto principal:

```
{
  "companyName": "Example Company",
  "preferredContactMethod": "Email",
  "countryCode": "ES"
}
```

## Mejoras de escalabilidad aplicadas

## `visualAssetKey` en lugar de `unityAssetKey`

La API anterior estaba directamente acoplada a Unity:

```
{
  "unityAssetKey": "DeskTop_160_80"
}
```

Ahora usamos:

```
{
  "visualAssetKey": "DeskTop_160_80"
}
```

Así el backend puede funcionar con:

- Unity.
- Three.js.
- WebGL propio.
- Aplicación de escritorio.
- Aplicación móvil.

La lógica comercial no debe depender del motor gráfico.

## `minSelections` y `maxSelections`

En lugar de:

```
{
  "selectionType": "Single",
  "isRequired": true
}
```

utilizamos:

```
{
  "minSelections": 1,
  "maxSelections": 1
}
```

Ejemplos:

```
Required single:
minSelections = 1
maxSelections = 1

Optional single:
minSelections = 0
maxSelections = 1

Optional multiple:
minSelections = 0
maxSelections = null

Required multiple:
minSelections = 1
maxSelections = null
```

Esto permite configurar cualquier tipo de producto sin añadir lógica específica.

## `catalogVersion`

El producto devuelve:

```
{
  "catalogVersion": 1
}
```

El cliente vuelve a enviarla al validar o guardar.

Cuando cambien precios, opciones o reglas, será:

```
{
  "catalogVersion": 2
}
```

Un cliente con la versión anterior recibirá:

```
{
  "success": false,
  "data": {
    "requestedCatalogVersion": 1,
    "currentCatalogVersion": 2
  },
  "errors": [
    {
      "code": "CATALOG_VERSION_OUTDATED",
      "message": "The product catalog has changed. Reload the product before continuing.",
      "target": "catalogVersion"
    }
  ]
}
```

Esto impide guardar configuraciones con precios desactualizados.

## Idempotencia

Cada creación incluye:

```
{
  "clientRequestId": "7d857780-a87f-44d7-9a72-9d3376941f57"
}
```

Si Unity repite accidentalmente el request por un problema de conexión, la API devuelve el registro existente.

Si reutiliza el identificador con datos diferentes:

```
{
  "code": "CLIENT_REQUEST_ID_REUSED"
}
```

Esto evita configuraciones y solicitudes de presupuesto duplicadas.

## Reglas de compatibilidad genéricas

```
{
  "code": "RULE-001",
  "type": "RequiresAny",
  "sourceOptionCodes": [
    "LEG_ELECTRIC_STANDING"
  ],
  "targetOptionCodes": [
    "SIZE_140_70",
    "SIZE_160_80"
  ],
  "message": "Electric standing legs require a desktop size of at least 140 x 70 cm."
}
```

Tipos previstos:

```
RequiresAny
RequiresAll
ExcludesAny
```

Solo implementaremos `RequiresAny` inicialmente. No tiene sentido programar reglas que todavía no usamos.

## Decisión sobre `DRAWER_NONE`

Aunque tener cajonera sea opcional, la selección se enviará siempre explícitamente:

```
{
  "selectedOptionCodes": [
    "DRAWER_NONE"
  ]
}
```

Por eso el grupo tendrá:

```
{
  "minSelections": 1,
  "maxSelections": 1
}
```

Esto simplifica:

- Restaurar configuraciones.
- Calcular selecciones predeterminadas.
- Generar snapshots.
- Saber si el usuario eligió conscientemente no tener cajonera.

Comercialmente la cajonera sigue siendo opcional. Técnicamente el grupo siempre tiene una selección.

## Estado de la documentación

La definición actual ya establece correctamente que el sistema debe utilizar conceptos genéricos como producto, grupo, opción y regla, en lugar de propiedades específicas de escritorios.

Los contratos quedan cerrados con estos cinco endpoints:

```
Get configurable product
Validate configuration
Create configuration
Get saved configuration
Create quote request
```
