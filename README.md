# Profile Management Auth0

## 0. 安全申明
本项目几乎完全由 AI 构建，且仅有十分有限的人类代码审查。出现安全问题，概不负责。

## 0.1 License
本项目使用 MIT License，详见 `LICENSE`。

## 1. 项目简要说明
这是一个基于 Next.js + Auth0 的用户资料管理与管理员控制台示例项目，提供：
- 用户基本资料查看与编辑
- 安全信息与 MFA 管理
- 会话管理（查看与撤销）
- 管理员用户列表与指定用户详情页

## 2. 部署方式

### 2.1 可配置环境变量
环境变量示例见 `.sample.env`。主要变量说明如下：

- `PORT`: Next.js 启动端口（默认 3000）
- `APP_BASE_URL`: 应用对外访问地址
- `AUTH0_SECRET`: Auth0 SDK 用于会话加密的密钥
- `AUTH0_DOMAIN`: Auth0 Tenant 域名
- `AUTH0_CLIENT_ID`: Auth0 应用 Client ID
- `AUTH0_CLIENT_SECRET`: Auth0 应用 Client Secret
- `AUTH0_API_AUDIENCE`: API Audience
- `AUTH0_API_SCOPE`: API Scope（默认 `openid profile email`）

Auth0 Management API (M2M)：
- `AUTH0_M2M_CLIENT_ID`
- `AUTH0_M2M_CLIENT_SECRET`
- `AUTH0_MANAGEMENT_AUDIENCE`

可选：
- `AUTH0_PASSWORD_CONNECTION_ID`: 用于 password change ticket 的连接 ID
- `AUTH0_PASSWORD_RESET_REDIRECT_URL`: 密码重置后回跳地址

### 2.2 Docker
构建与运行（本地）：
```bash
docker build -t profile-management-auth0 .
docker run --rm -p 3000:3000 --env-file ./.env profile-management-auth0
```

### 2.3 Docker Compose 示例
```yaml
services:
  profile-management-auth0:
    image: profile-management-auth0:latest
    ports:
      - "3000:3000"
    env_file:
      - ./.env
```

## 3. 使用到的 API 与权限说明
项目使用 Auth0 Management API V2（OpenAPI: https://auth0.com/docs/api/management/openapi.json）。
主要涉及：
- 用户资料读取/更新
- MFA enrollments 获取、创建 ticket、删除
- Passkey / Authentication methods 获取与删除
- Sessions 获取与撤销

建议为 M2M Client 配置最小权限：
- `read:users`
- `update:users`
- `read:current_user`
- `read:authentication_methods`
- `delete:authentication_methods`
- `read:sessions`
- `delete:sessions`
- `delete:refresh_tokens`
- `create:user_tickets`
- `create:guardian_enrollment_tickets`
- `read:guardian_enrollments`
- `delete:guardian_enrollments`

## 4. 本项目定义的权限
详见 `权限定义.md`，包含：
- Profile 相关权限（read/write self 或 admin）
- Security 相关权限（MFA / Passkey / Social Links）
- Sessions 相关权限
- 管理界面访问权限 `admin_ui:access`
