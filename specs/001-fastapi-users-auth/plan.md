---
description: "FastAPI-Users认证系统重构实现计划"
scripts:
  sh: spec-kit/scripts/bash/update-agent-context.sh cursor
  ps: spec-kit/scripts/powershell/update-agent-context.ps1 -AgentType cursor
---

# Implementation Plan: FastAPI-Users认证系统重构

**Branch**: `001-fastapi-users-auth` | **Date**: 2024-12-20 | **Spec**: [specs/001-fastapi-users-auth/spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-fastapi-users-auth/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path ✅
2. Fill Technical Context ✅
   → Project Type: web (frontend+backend)
   → Structure Decision: Option 2
3. Fill Constitution Check section ✅
4. Evaluate Constitution Check ✅
   → No violations - proceed
5. Execute Phase 0 → research.md ✅
6. Execute Phase 1 → contracts, data-model.md, quickstart.md
7. Re-evaluate Constitution Check
8. Plan Phase 2 → Task generation approach
9. STOP - Ready for /tasks command
```

## Summary
将万相营造AI电商平台的自定义FastAPI认证系统重构为基于FastAPI-Users的标准化认证框架，提供完整的用户注册、登录、邮箱验证、密码重置功能，同时确保数据平滑迁移和API向后兼容性。

## Technical Context
**Language/Version**: Python 3.8+  
**Primary Dependencies**: FastAPI-Users 12.1.3, SQLAlchemy 2.0+, asyncpg, aiosmtplib  
**Storage**: PostgreSQL 12+ (existing database with user data)  
**Testing**: pytest, httpx, pytest-asyncio  
**Target Platform**: Linux server, Docker containers  
**Project Type**: web - React frontend + FastAPI backend  
**Performance Goals**: 支持1000+ 并发用户，<200ms认证响应时间  
**Constraints**: 零停机迁移，完全向后兼容现有API，保持所有用户数据  
**Scale/Scope**: ~10k现有用户，预计增长到100k用户

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

基于简单性原则的设计检查：

✅ **使用成熟框架**: 采用FastAPI-Users而非继续自维护认证系统  
✅ **标准化模式**: 遵循FastAPI-Users约定而非发明自定义模式  
✅ **最小化变更**: 保持现有API兼容性，减少前端改动  
✅ **渐进迁移**: 分阶段迁移，降低风险  
✅ **测试覆盖**: 完整的自动化测试确保系统可靠性

无宪法违规 - 方案符合简单性和可维护性原则

## Project Structure

### Documentation (this feature)
```
specs/001-fastapi-users-auth/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Current structure (web application)
backend/
├── models.py              # FastAPI-Users模型
├── schemas.py             # Pydantic架构
├── user_manager.py        # 用户生命周期管理
├── auth_config.py         # 认证后端配置
├── email_service.py       # 异步邮件服务
├── main_fastapi_users.py  # 主应用文件
├── migrate_to_fastapi_users.py  # 数据迁移脚本
├── test_fastapi_users_system.py  # 完整系统测试
├── requirements-fastapi-users.txt  # 依赖清单
└── .env.fastapi-users     # 环境配置模板

frontend/
├── lib/
│   └── fastapi-users-client.ts  # 适配的认证客户端
├── src/
│   ├── components/auth/   # 认证组件
│   └── app/auth/         # 认证页面
└── tests/
    └── auth/             # 前端认证测试

tests/
├── contract/             # API合约测试
├── integration/          # 集成测试
└── unit/                # 单元测试
```

**Structure Decision**: Option 2 (Web application) - 已有frontend/backend分离结构

## Phase 0: Outline & Research

### 研究任务清单
1. **FastAPI-Users最佳实践研究**:
   - 分析官方文档和示例
   - 研究生产环境部署模式
   - 评估性能和安全性考量

2. **数据库迁移策略研究**:
   - 零停机迁移方案
   - UUID vs 整型ID迁移
   - 数据完整性保证

3. **邮件服务集成研究**:
   - aiosmtplib vs 其他异步邮件库
   - 邮件模板最佳实践
   - 邮件发送可靠性保证

4. **API兼容性研究**:
   - Better Auth响应格式兼容
   - 前端客户端适配方案
   - 向后兼容策略

**输出**: research.md包含所有技术决策和依据

## Phase 1: Design & Contracts

### 1. 数据模型设计 (data-model.md)
基于FastAPI-Users标准扩展：
- 用户模型：继承SQLAlchemyBaseUserTableUUID
- 会话模型：支持JWT和数据库策略
- 业务字段：积分、会员状态、角色等
- 迁移映射：旧数据到新模型的字段对应

### 2. API合约生成 (contracts/)
- OpenAPI 3.0规范文件
- 认证端点合约：注册、登录、登出、重置密码
- 用户管理端点：获取用户信息、更新资料
- Better Auth兼容端点合约
- 错误响应标准化

### 3. 合约测试生成
- 每个端点的schema验证测试
- 认证流程集成测试
- 数据迁移验证测试
- 邮件服务mock测试

### 4. 快速启动指南 (quickstart.md)
- 环境配置步骤
- 数据库迁移执行
- 服务启动验证
- 基本功能测试

### 5. Agent上下文更新
运行脚本更新Cursor IDE配置：
```bash
spec-kit/scripts/bash/update-agent-context.sh cursor
```

**输出**: 完整的设计文档、API合约、失败测试和快速启动指南

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- 基于Phase 1的设计文档生成具体任务
- 遵循TDD原则：测试先行，实现跟随
- 按依赖关系排序：数据层 → 服务层 → API层
- 支持并行执行的独立任务标记[P]

**任务分类**:
1. **基础设施任务** [P]: 环境配置、依赖安装、数据库设置
2. **数据层任务**: 模型定义、迁移脚本、数据验证
3. **服务层任务**: 用户管理器、邮件服务、认证配置  
4. **API层任务**: 端点实现、中间件配置、错误处理
5. **测试任务** [P]: 单元测试、集成测试、端到端测试
6. **前端适配任务** [P]: 客户端库、组件更新、状态管理
7. **部署任务**: Docker配置、CI/CD、监控

**Ordering Strategy**:
- 测试驱动：每个功能先写测试，再写实现
- 依赖优先：底层服务先于上层API
- 风险控制：关键路径优先，边缘功能后置
- 并行友好：独立模块可并行开发

**Estimated Output**: 35-40个具体任务，包含明确的验收标准

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (tasks.md创建和执行)  
**Phase 4**: Implementation (按照任务清单执行开发)  
**Phase 5**: Validation (测试验证、性能测试、用户验收)

## Complexity Tracking
*无复杂性违规需要记录*

该方案采用成熟的FastAPI-Users框架，遵循标准模式，无需记录复杂性偏差。

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [ ] Phase 1: Design complete (/plan command)
- [ ] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [ ] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (None)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
