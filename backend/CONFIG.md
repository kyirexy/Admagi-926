# 后端配置说明

## 📁 目录结构

```
backend/
├── app.py                    # 主应用入口
├── ai_routes.py             # AI图片生成路由
├── video_routes.py          # AI视频生成路由
├── ai_types.py              # 统一类型定义
├── auth_service.py          # 认证服务
├── database.py              # 数据库配置
├── email_service.py         # 邮件服务
├── models_adapted.py        # 数据模型
├── schemas_fastapi_users.py # 用户模式
├── verification_tokens.py   # 验证令牌
├── volcengine_service.py    # 极梦3.0图片生成服务
├── volcengine_video_service.py # 即梦AI-视频生成3.0 Pro服务
├── env.example              # 环境配置模板
├── requirements.txt         # Python依赖
└── README.md               # 说明文档
```

## 🔑 API密钥配置

### 步骤1：创建配置文件
```bash
cp env.example .env
```

### 步骤2：编辑 .env 文件
**必填配置（即梦AI-视频生成3.0 Pro）：**
```env
VOLCENGINE_ACCESS_KEY=您的实际Access Key
VOLCENGINE_SECRET_KEY=您的实际Secret Key
```

**可选配置（极梦3.0图片生成）：**
```env
VOLCENGINE_API_KEY=您的实际API Key
VOLCENGINE_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
```

## 🚀 启动服务

```bash
python app.py
```

服务将在 http://localhost:8000 启动

## 📚 API文档

启动服务后访问：http://localhost:8000/docs
