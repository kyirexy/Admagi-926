# 万相营造 AI电商平台 - 技术实现计划

## 技术栈概览

### 前端技术栈
- **框架**: Next.js 14+ (App Router) + TypeScript
- **UI库**: Shadcn/UI + Tailwind CSS 
- **状态管理**: Zustand
- **HTTP客户端**: openapi-fetch (类型安全的API客户端)
- **图标**: Lucide React
- **动画**: Framer Motion
- **表单**: React Hook Form + Zod验证
- **文件上传**: react-dropzone

### 后端技术栈
- **框架**: FastAPI + Python 3.11+
- **数据库ORM**: SQLModel (基于SQLAlchemy + Pydantic)
- **数据库**: PostgreSQL 15+
- **缓存**: Redis 7+
- **任务队列**: Celery + Redis
- **认证**: FastAPI-Users + JWT
- **文件存储**: 本地存储 + 后期可扩展为对象存储
- **AI集成**: OpenAI API、Replicate API

### 开发工具与部署
- **容器化**: Docker + Docker Compose
- **代码质量**: ESLint, Prettier, Black, isort
- **测试**: Vitest (前端) + pytest (后端)
- **API文档**: 自动生成的OpenAPI规范

## 系统架构设计

### 整体架构
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js       │    │    FastAPI      │    │   PostgreSQL    │
│   前端应用      │◄──►│    后端API      │◄──►│   主数据库      │
│   (Port 3000)   │    │   (Port 8000)   │    │   (Port 5432)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         │              │     Redis       │              │
         └──────────────│   缓存&会话     │──────────────┘
                        │   (Port 6379)   │
                        └─────────────────┘
```

### 前端架构 (Next.js)
```
frontend/
├── app/                    # App Router页面
│   ├── (auth)/            # 认证相关页面组
│   ├── dashboard/         # 仪表板页面
│   ├── ai-tools/         # AI工具页面
│   ├── marketplace/       # 商城页面
│   └── layout.tsx         # 根布局
├── components/            # 可复用组件
│   ├── ui/               # Shadcn/UI基础组件
│   ├── layout/           # 布局组件
│   ├── ai/               # AI功能组件
│   └── marketplace/      # 电商组件
├── lib/                  # 工具库
│   ├── api/              # API客户端
│   ├── store/            # Zustand stores
│   ├── utils/            # 通用工具
│   └── validations/      # Zod验证schemas
└── types/                # TypeScript类型定义
```

### 后端架构 (FastAPI)
```
backend/
├── app/
│   ├── api/              # API路由
│   │   ├── auth/         # 认证路由
│   │   ├── ai/           # AI功能路由
│   │   ├── marketplace/  # 电商路由
│   │   └── users/        # 用户管理路由
│   ├── core/             # 核心配置
│   │   ├── config.py     # 应用配置
│   │   ├── security.py   # 安全相关
│   │   └── database.py   # 数据库配置
│   ├── models/           # SQLModel数据模型
│   ├── services/         # 业务逻辑服务
│   ├── schemas/          # Pydantic响应模型
│   └── utils/            # 工具函数
├── alembic/              # 数据库迁移
└── tests/                # 测试文件
```

## 数据库设计

### 核心数据模型
- **User**: 用户基础信息、积分、会员等级
- **AIGeneration**: AI生成记录（图片、文案、页面）
- **Product**: 商品信息、价格、库存
- **Order**: 订单管理、支付状态
- **Category**: 商品分类和AI工具分类

### Redis缓存策略
- 会话存储: 用户登录状态和JWT token
- API缓存: 频繁访问的商品信息、用户配置
- AI任务状态: 生成任务的实时状态更新
- 限流计数: API调用频率限制

## 开发环境配置

### Docker开发环境
使用Docker Compose管理多服务开发环境：
- Frontend: Next.js开发服务器
- Backend: FastAPI热重载服务器  
- Database: PostgreSQL数据库
- Cache: Redis缓存服务

### 项目结构
```
admagic1/
├── frontend/              # Next.js前端项目
├── backend/               # FastAPI后端项目
├── docker-compose.yml     # 开发环境配置
├── .env.example          # 环境变量模板
└── README.md             # 项目说明
```

## 实现阶段规划

### 第一阶段：基础架构搭建
1. 前端Next.js项目初始化和UI组件库配置
2. 后端FastAPI项目结构和数据库配置  
3. Docker开发环境搭建
4. 基础的用户认证系统

### 第二阶段：核心功能实现
1. AI图片生成功能
2. AI文案生成功能
3. 用户积分系统
4. 基础的商品展示

### 第三阶段：完善和优化
1. 电商购物流程
2. 用户作品管理
3. 性能优化和缓存
4. 测试和部署准备

这个计划将指导我们逐步构建一个完整的AI电商平台。