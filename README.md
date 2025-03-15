# Synkro - API de Mensajería en Tiempo Real 🚀

Bienvenido a **Synkro**, un sistema de mensajería en tiempo real construido con **NestJS** y **Supabase**.  
Esta API proporciona servicios para manejar **usuarios, chats, mensajes y almacenamiento de imágenes**.  

🔗 **Frontend:** [Synkro Realtime](https://synkro-realtime.firebaseapp.com/login)  
Repositorio: [Synkro Front Repo](https://github.com/ArturoJesusHuari/Synkro-Front)

## 📌 Tecnologías Utilizadas

- **NestJS** - Framework para la API.
- **Supabase** - Autenticación, base de datos PostgreSQL y almacenamiento.
- **PostgreSQL** - Base de datos relacional.
- **Docker** - Para despliegue y desarrollo.
- **Render.com** - Para el hosting del backend.
- **Multer** - Manejo de subida de imágenes.
- **TypeScript** - Tipado y seguridad en el código.

---

## 📎 Supabase
![image](https://github.com/user-attachments/assets/a60b72ef-a155-478f-b9c5-fe9b4d83c2f8)

## 🚀 Despliegue
![image](https://github.com/user-attachments/assets/1e318c18-ad8d-43a3-9bd2-1c5e1e0624a2)

## 📌 Cronjob
![image](https://github.com/user-attachments/assets/9e81dd13-2cdc-4173-92ee-fa2af3833f50)



## 🔥 Endpoints Principales

### 📜 **Usuarios**
| Método | Endpoint              | Descripción                     |
|--------|------------------------|---------------------------------|
| `GET`  | `/users/profile`       | Obtener el perfil del usuario. |
| `POST` | `/users/upload-avatar` | Subir imagen de perfil. |

### 💬 **Chats y Mensajes**
| Método  | Endpoint                   | Descripción                         |
|---------|----------------------------|-------------------------------------|
| `GET`   | `/chat/chats`              | Listar chats del usuario.           |
| `GET`   | `/chat/messages/:chatId`   | Obtener mensajes de un chat.        |
| `POST`  | `/chat/send`               | Enviar mensaje en un chat.          |
| `POST`  | `/chat/send-image/:chatId` | Enviar imagen en un chat.           |

---
### 📂 Estructura del Proyecto
├── 📂 src

│   ├── 📂 chat 

│   │   ├── chat.controller.ts

│   │   ├── chat.module.ts

│   │   ├── chat.service.ts

│   ├── 📂 database     

│   │   ├── database.module.ts

│   │   ├── database.service.ts

│   ├── 📂 storage        

│   │   ├── storage.module.ts

│   │   ├── storage.service.ts

│   ├── 📂 users    

│   │   ├── users.controller.ts

│   │   ├── users.module.ts

│   │   ├── users.service.ts

│   ├── app.module.ts     # Módulo principal

│   ├── main.ts           # Punto de entrada

├── 🐳 Dockerfile         # Configuración de Docker

├── 🔧 eslint.config.mjs  # Reglas de linting

├── 📦 package.json       # Dependencias

├── 📝 README.md          # Documentación

├── 📝 .gitignore         # Archivos ignorados por Git

├── 📝 .prettierrc        # Configuración de formato de código

## 🛠️ **Decisiones Técnicas**

### 1️⃣ 🔹 Uso de Supabase para autenticación y almacenamiento  
- Se utiliza **Supabase Auth** en lugar de gestionar sesiones en el backend.  
- La tabla `profiles` almacena solo `username` y `avatar`, ya que `auth.users` maneja los correos.  

### 2️⃣ 🔹 Chats con estructura flexible  
- Se usa la tabla `user_chats` para gestionar **usuarios en cada chat**.  
- Permite que un usuario **elimine su copia** sin afectar al otro.  

### 3️⃣ 🔹 Paginación de mensajes  
- Se implementa paginación con `limit=20` en la API.  
- Se filtran mensajes eliminados con `deleted_at`.  

### 4️⃣ 🔹 WebSockets en tiempo real con Supabase  
- Se suscriben los clientes a la tabla `messages` en Supabase.  
- Los nuevos mensajes aparecen sin necesidad de recargar la página.  

### 5️⃣ 🔹 Subida de imágenes a Supabase Storage  
- Las imágenes se guardan en un **bucket de Supabase** (`chat-images`).  
- Los mensajes con imágenes almacenan la **URL pública** en `content`.  
