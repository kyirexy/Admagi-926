# Phase 1: Data Model Design - FastAPI-Users认证系统

## 核心实体设计

### 1. User（用户实体）
**继承**: SQLAlchemyBaseUserTableUUID（FastAPI-Users基类）

**基础字段**（来自FastAPI-Users）:
```python
id: UUID                    # 主键，自动生成UUID
email: str                  # 邮箱地址，唯一索引
hashed_password: str        # bcrypt哈希密码
is_active: bool = True      # 用户是否激活
is_superuser: bool = False  # 是否超级管理员
is_verified: bool = False   # 邮箱是否验证
```

**业务扩展字段**:
```python
# 基本信息
name: Optional[str]         # 用户姓名
username: Optional[str]     # 用户名（唯一）
image: Optional[str]        # 头像URL
avatar: Optional[str]       # 备用头像URL

# 业务属性
credits: int = 100          # 用户积分
is_premium: bool = False    # 是否高级会员
role: str = 'USER'         # 用户角色 (USER, ADMIN, DESIGNER)
plan: str = 'FREE'         # 用户计划 (FREE, PRO, ENTERPRISE)
org_id: Optional[str]      # 组织ID

# 时间戳
created_at: datetime       # 创建时间
updated_at: datetime       # 更新时间
```

**索引策略**:
```sql
CREATE INDEX idx_user_email ON "user"(email);
CREATE INDEX idx_user_username ON "user"(username);
CREATE INDEX idx_user_role ON "user"(role);
CREATE INDEX idx_user_created_at ON "user"(created_at);
```

### 2. AccessToken（访问令牌）
**继承**: SQLAlchemyBaseAccessTokenTableUUID

**字段**:
```python
token: str                  # JWT令牌哈希
created_at: datetime       # 创建时间
user_id: UUID             # 关联用户ID（外键）
```

### 3. OAuthAccount（OAuth账户，预留）
**用途**: 社交登录集成（Google, GitHub等）

**字段**:
```python
id: UUID                   # 主键
user_id: UUID             # 关联用户ID（外键）
oauth_name: str           # OAuth提供商 (google, github, etc.)
access_token: str         # OAuth访问令牌
expires_at: Optional[int] # 令牌过期时间
refresh_token: Optional[str] # 刷新令牌
account_id: str           # OAuth提供商的用户ID
account_email: str        # OAuth账户邮箱
created_at: datetime      # 创建时间
updated_at: datetime      # 更新时间
```

### 4. AIGeneration（AI生成记录）
**用途**: 业务数据，与用户认证集成

**字段**:
```python
id: UUID                   # 主键
user_id: UUID             # 关联用户ID（外键）
type: str                 # 生成类型 (image, text, video)
prompt: str               # 生成提示词
parameters: Optional[dict] # 生成参数（JSON）
status: str = 'pending'   # 状态 (pending, processing, completed, failed)
cost_credits: int         # 消耗积分
result_data: Optional[dict] # 生成结果（JSON）
error_message: Optional[str] # 错误信息
created_at: datetime      # 创建时间
updated_at: datetime      # 更新时间
completed_at: Optional[datetime] # 完成时间
```

## 数据迁移映射

### 旧表 → 新表映射关系

**user表迁移**:
```sql
-- 旧结构 → 新结构
id (SERIAL) → id (UUID) + migration_mapping表
email → email (保持不变)
name → name (保持不变)
username → username (保持不变)
email_verified → is_verified (布尔值映射)
image → image (保持不变)
password_hash → hashed_password (字段重命名)
credits → credits (保持不变)
is_premium → is_premium (保持不变)
created_at → created_at (保持不变)
updated_at → updated_at (保持不变)
```

**migration_mapping表**（临时表）:
```python
class MigrationMapping:
    old_id: int              # 旧的SERIAL ID
    new_id: UUID            # 新的UUID ID
    table_name: str         # 表名
    migrated_at: datetime   # 迁移时间
```

### 数据验证规则

**用户数据验证**:
- 邮箱：有效的email格式，长度≤320字符
- 密码：最小6位，最大128位，bcrypt哈希
- 姓名：长度1-255字符，允许unicode
- 用户名：长度3-50字符，字母数字下划线
- 积分：非负整数，默认100
- 角色：枚举值 (USER, ADMIN, DESIGNER)
- 计划：枚举值 (FREE, PRO, ENTERPRISE)

**状态转换规则**:
```python
# 用户状态转换
is_active: True/False (管理员可切换)
is_verified: False → True (仅通过邮箱验证)
is_superuser: False → True (仅管理员可设置)

# 业务状态转换
plan: FREE → PRO → ENTERPRISE (可升级，降级需审批)
credits: 只能增加或消费，不能直接设置负值
```

## 关系和约束

### 外键关系
```python
# AccessToken → User (多对一)
AccessToken.user_id → User.id

# OAuthAccount → User (多对一) 
OAuthAccount.user_id → User.id

# AIGeneration → User (多对一)
AIGeneration.user_id → User.id
```

### 唯一性约束
```sql
-- 用户表
UNIQUE(email)                    # 邮箱唯一
UNIQUE(username) WHERE username IS NOT NULL  # 用户名唯一（可空）

-- OAuth表
UNIQUE(oauth_name, account_id)   # 同一平台的账户ID唯一
```

### 检查约束
```sql
-- 积分不能为负数
CHECK (credits >= 0)

-- 角色必须是有效值
CHECK (role IN ('USER', 'ADMIN', 'DESIGNER'))

-- 计划必须是有效值  
CHECK (plan IN ('FREE', 'PRO', 'ENTERPRISE'))
```

## 性能优化

### 查询优化索引
```sql
-- 高频查询索引
CREATE INDEX idx_user_email_active ON "user"(email) WHERE is_active = true;
CREATE INDEX idx_user_role_active ON "user"(role) WHERE is_active = true;
CREATE INDEX idx_ai_generation_user_status ON ai_generation(user_id, status);
CREATE INDEX idx_ai_generation_created_at ON ai_generation(created_at DESC);

-- 复合索引
CREATE INDEX idx_user_plan_credits ON "user"(plan, credits DESC);
CREATE INDEX idx_oauth_provider_account ON oauth_account(oauth_name, account_id);
```

### 分区策略（未来考虑）
```sql
-- AI生成记录按时间分区（数据量大时）
PARTITION BY RANGE (created_at);
```

## 数据完整性保证

### 事务策略
```python
# 用户注册事务
async with session.begin():
    # 1. 创建用户
    # 2. 发送欢迎邮件
    # 3. 初始化用户配置
    # 全部成功或全部回滚
```

### 数据一致性检查
```python
# 定期数据一致性验证
1. 验证所有用户都有有效邮箱
2. 检查积分余额不为负
3. 确认OAuth账户关联的用户存在
4. 验证AI生成记录的成本计算正确
```

### 软删除策略
```python
# 对于重要数据使用软删除
is_deleted: bool = False
deleted_at: Optional[datetime] = None

# 查询时自动过滤已删除记录
WHERE is_deleted = false
```

## 扩展性考虑

### 水平扩展准备
- UUID主键便于分布式环境
- 避免自增ID的依赖
- 时间戳支持分片策略

### 版本化支持
```python
# 为重要实体添加版本字段
version: int = 1           # 乐观锁版本控制
schema_version: str = "1.0" # 数据结构版本
```

### 元数据扩展
```python
# JSON字段存储扩展属性
metadata: Optional[dict] = None  # 灵活的元数据存储
preferences: Optional[dict] = None # 用户偏好设置
```

## 迁移执行计划

### 阶段1：结构准备
1. 创建新表结构（与现有表并行）
2. 创建迁移映射表
3. 设置索引和约束

### 阶段2：数据迁移
1. 批量迁移用户数据（1000条/批次）
2. 验证数据完整性
3. 建立新旧ID映射关系

### 阶段3：应用切换
1. 更新应用配置使用新表
2. 验证所有功能正常
3. 监控性能指标

### 阶段4：清理
1. 确认系统稳定运行1周
2. 删除旧表结构
3. 清理迁移临时数据

这个数据模型设计平衡了FastAPI-Users的标准化要求和万相营造平台的业务需求，为后续的API设计和实现奠定了坚实的基础。
