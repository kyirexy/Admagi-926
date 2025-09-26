# 万相营造 AI电商平台

一个基于 Next.js 和 FastAPI 构建的现代化多模态AI电商平台，提供AI图片生成、文案创作、页面制作等创意工具服务。

## 技术栈

### 前端
- **Next.js 14+** - React全栈框架，支持App Router
- **TypeScript** - 类型安全的JavaScript
- **Tailwind CSS** - 原子化CSS框架
- **Shadcn/UI** - 现代化React组件库
- **Zustand** - 轻量级状态管理
- **Framer Motion** - 动画库

### 后端
- **FastAPI** - 高性能Python异步框架
- **SQLModel** - 类型安全的ORM（SQLAlchemy + Pydantic）
- **PostgreSQL** - 主数据库
- **Redis** - 缓存和会话存储
- **OpenAI API** - AI文案生成
- **Replicate API** - AI图片生成

### 开发工具
- **Docker** - 容器化开发环境
- **Docker Compose** - 多服务编排
- **ESLint & Prettier** - 代码质量和格式化

## 快速开始

### 环境要求
- Docker 和 Docker Compose
- Node.js 18+ (如果本地运行前端)
- Python 3.11+ (如果本地运行后端)

### 1. 克隆项目
```bash
git clone <your-repo-url>
cd admagic1
```

### 2. 配置环境变量
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填入你的AI服务API密钥
# OPENAI_API_KEY=your-openai-key
# REPLICATE_API_TOKEN=your-replicate-token
```

### 3. 启动开发环境
```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 4. 访问应用
- **前端应用**: http://localhost:3000
- **后端API文档**: http://localhost:8000/docs
- **数据库管理**: http://localhost:8080 (Adminer)
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## 项目结构

```
admagic1/
├── frontend/                 # Next.js前端应用
│   ├── src/
│   │   ├── app/             # App Router页面
│   │   ├── components/      # React组件
│   │   │   ├── ui/         # 基础UI组件
│   │   │   ├── layout/     # 布局组件
│   │   │   └── ai/         # AI功能组件
│   │   ├── lib/            # 工具库和配置
│   │   └── types/          # TypeScript类型
│   └── package.json
├── backend/                  # FastAPI后端应用
│   ├── app/
│   │   ├── api/            # API路由
│   │   ├── core/           # 核心配置
│   │   ├── models/         # 数据模型
│   │   ├── services/       # 业务逻辑
│   │   └── utils/          # 工具函数
│   └── requirements.txt
├── .specify/                # Spec-Driven Development配置
├── docker-compose.yml       # Docker开发环境
└── README.md
```

## 开发命令

### 前端开发
```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 代码格式化
npm run lint
```

### 后端开发
```bash
cd backend

# 安装依赖
pip install -r requirements.txt

# 启动开发服务器
uvicorn app.main:app --reload

# 运行数据库迁移
alembic upgrade head

# 运行测试
pytest
```

### Docker命令
```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 重新构建服务
docker-compose build

# 查看服务日志
docker-compose logs -f [service_name]

# 进入容器shell
docker-compose exec [service_name] /bin/sh
```

## 主要功能

### AI创意工具
- **AI图片生成**: 基于文字描述生成高质量图片
- **AI文案生成**: 智能营销文案和产品描述生成
- **AI页面制作**: 自动生成响应式营销页面
- **图片处理工具**: 背景移除、尺寸调整、风格迁移

### 电商功能
- **商品管理**: 商品展示、分类管理、库存跟踪
- **购物车**: 商品选择、数量调整、结算功能
- **订单系统**: 订单创建、支付处理、状态跟踪
- **用户系统**: 注册登录、个人资料、积分管理

### 用户体验
- **万相营造风格**: 简洁现代的界面设计
- **响应式设计**: 适配桌面端和移动端
- **实时更新**: WebSocket实时状态更新
- **积分系统**: 使用AI功能消耗积分，充值获取积分

## API文档

启动后端服务后，访问 http://localhost:8000/docs 查看完整的API文档。

### 主要API端点
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/ai/generate/image` - AI图片生成
- `POST /api/ai/generate/text` - AI文案生成
- `GET /api/marketplace/products` - 获取商品列表
- `POST /api/marketplace/orders` - 创建订单

## 部署

### 生产环境部署
1. 构建生产镜像
2. 配置环境变量
3. 使用Kubernetes或Docker Swarm部署
4. 配置负载均衡和SSL证书
5. 设置监控和日志收集

### 环境变量配置
生产环境需要配置的关键环境变量：
- `SECRET_KEY`: 应用密钥
- `DATABASE_URL`: 生产数据库连接
- `REDIS_URL`: Redis连接
- `OPENAI_API_KEY`: OpenAI API密钥
- `REPLICATE_API_TOKEN`: Replicate API令牌

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License

## 联系方式

如有问题或建议，请通过以下方式联系：
- 提交 Issue
- 发送邮件至项目维护者

---

基于Spec-Driven Development构建，使用Claude Code进行智能化开发。