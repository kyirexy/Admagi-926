#!/usr/bin/env python3
"""
简化版 Specify CLI - 用于 Spec-Driven Development

这是一个简化版本，不依赖外部包，可以直接运行。
"""

import os
import sys
import json
import shutil
import subprocess
from pathlib import Path

def print_help():
    """显示帮助信息"""
    help_text = """
Specify CLI - Spec-Driven Development 工具

用法:
    python specify.py init <项目名称>     # 初始化新项目
    python specify.py init --here        # 在当前目录初始化
    python specify.py check              # 检查工具安装状态
    python specify.py --help             # 显示此帮助信息

Spec-Driven Development 工作流程:
1. /constitution - 创建项目原则和开发指导
2. /specify - 描述要构建的内容（专注于什么和为什么）
3. /plan - 提供技术栈和架构选择
4. /tasks - 从实现计划创建可执行任务列表
5. /implement - 执行所有任务并构建功能

示例:
    python specify.py init my-photo-app
    python specify.py init --here
    python specify.py check
"""
    print(help_text)

def check_tools():
    """检查必要工具的安装状态"""
    tools = {
        'git': 'git --version',
        'python': 'python --version',
        'node': 'node --version',
        'npm': 'npm --version'
    }
    
    print("🔧 检查工具安装状态:")
    print("-" * 40)
    
    for tool, command in tools.items():
        try:
            result = subprocess.run(command.split(), capture_output=True, text=True)
            if result.returncode == 0:
                version = result.stdout.strip().split('\n')[0]
                print(f"✅ {tool}: {version}")
            else:
                print(f"❌ {tool}: 未安装或不可用")
        except FileNotFoundError:
            print(f"❌ {tool}: 未安装")
    
    print("\n🤖 支持的 AI 代理:")
    ai_agents = [
        "Claude Code", "GitHub Copilot", "Gemini CLI", "Cursor", 
        "Qwen Code", "Windsurf", "Kilo Code", "Auggie CLI", "Roo Code"
    ]
    for agent in ai_agents:
        print(f"  • {agent}")

def create_project_structure(project_path):
    """创建项目基础结构"""
    # 创建基础目录
    directories = [
        'src',
        'docs',
        'tests',
        '.specify'
    ]
    
    for dir_name in directories:
        dir_path = project_path / dir_name
        dir_path.mkdir(exist_ok=True)
    
    # 创建基础文件
    files = {
        'README.md': f"""# {project_path.name}

这是一个使用 Spec-Driven Development 创建的项目。

## 开发工作流程

1. **定义项目原则** (`/constitution`)
   ```
   /constitution 创建专注于代码质量、测试标准、用户体验一致性和性能要求的原则
   ```

2. **创建规格说明** (`/specify`)
   ```
   /specify 构建一个应用程序...
   ```

3. **制定技术计划** (`/plan`)
   ```
   /plan 应用程序使用 Vite，尽量减少库的数量...
   ```

4. **分解任务** (`/tasks`)
   ```
   /tasks
   ```

5. **执行实现** (`/implement`)
   ```
   /implement
   ```

## 项目结构

- `src/` - 源代码
- `docs/` - 文档
- `tests/` - 测试文件
- `.specify/` - Specify 配置和模板

## 开始开发

1. 使用 AI 代理（如 Claude Code、Cursor 等）
2. 按照上述工作流程进行开发
3. 专注于规格说明，让 AI 处理实现细节
""",
        '.specify/constitution.md': """# 项目宪法

## 核心原则

### 代码质量
- 编写清晰、可读的代码
- 遵循一致的代码风格
- 进行适当的代码注释

### 测试标准
- 为关键功能编写测试
- 保持高测试覆盖率
- 使用自动化测试

### 用户体验
- 优先考虑用户需求
- 保持界面一致性
- 确保响应式设计

### 性能要求
- 优化加载时间
- 最小化资源使用
- 确保跨平台兼容性

## 开发指导

1. 始终从用户需求出发
2. 保持代码简洁和模块化
3. 定期重构和优化
4. 持续集成和部署
""",
        '.specify/spec-template.md': """# 项目规格说明模板

## 项目概述
描述项目的目标和愿景

## 功能需求
- 功能1: 描述
- 功能2: 描述
- 功能3: 描述

## 用户故事
- 作为[用户类型]，我想要[功能]，以便[目标]

## 技术约束
- 性能要求
- 兼容性要求
- 安全要求

## 成功标准
定义项目成功的衡量标准
""",
        '.specify/plan-template.md': """# 技术实现计划模板

## 技术栈
- 前端: 
- 后端: 
- 数据库: 
- 部署: 

## 架构设计
描述系统架构和组件关系

## 开发环境
- 开发工具
- 依赖管理
- 构建工具

## 部署策略
- 环境配置
- CI/CD 流程
- 监控和日志
""",
        '.specify/tasks-template.md': """# 任务列表模板

## 开发任务

### 阶段1: 基础设置
- [ ] 项目初始化
- [ ] 依赖安装
- [ ] 基础配置

### 阶段2: 核心功能
- [ ] 功能1实现
- [ ] 功能2实现
- [ ] 功能3实现

### 阶段3: 测试和优化
- [ ] 单元测试
- [ ] 集成测试
- [ ] 性能优化

### 阶段4: 部署
- [ ] 生产环境配置
- [ ] 部署脚本
- [ ] 监控设置
""",
        '.gitignore': """# 依赖
node_modules/
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
env/
venv/
.venv/

# IDE
.vscode/
.idea/
*.swp
*.swo

# 系统文件
.DS_Store
Thumbs.db

# 日志
*.log
logs/

# 构建输出
dist/
build/
*.egg-info/

# 环境变量
.env
.env.local
.env.production
"""
    }
    
    for file_name, content in files.items():
        file_path = project_path / file_name
        file_path.parent.mkdir(parents=True, exist_ok=True)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)

def init_project(project_name=None, here=False):
    """初始化项目"""
    if here:
        project_path = Path.cwd()
        project_name = project_path.name
        print(f"🌱 在当前目录初始化 Specify 项目: {project_name}")
    else:
        if not project_name:
            print("❌ 错误: 请提供项目名称")
            return False
        
        project_path = Path.cwd() / project_name
        if project_path.exists():
            print(f"❌ 错误: 目录 '{project_name}' 已存在")
            return False
        
        project_path.mkdir()
        print(f"🌱 创建新的 Specify 项目: {project_name}")
    
    # 创建项目结构
    create_project_structure(project_path)
    
    # 初始化 git 仓库
    try:
        subprocess.run(['git', 'init'], cwd=project_path, check=True, capture_output=True)
        print("✅ Git 仓库初始化完成")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("⚠️  Git 初始化失败，请手动初始化")
    
    print(f"""
✅ 项目初始化完成！

📁 项目结构:
  {project_name}/
  ├── src/                 # 源代码
  ├── docs/                # 文档
  ├── tests/               # 测试
  ├── .specify/            # Specify 配置
  │   ├── constitution.md  # 项目原则
  │   ├── spec-template.md # 规格模板
  │   ├── plan-template.md # 计划模板
  │   └── tasks-template.md# 任务模板
  ├── README.md            # 项目说明
  └── .gitignore          # Git 忽略文件

🚀 下一步:
1. 进入项目目录: cd {project_name if not here else '.'}
2. 使用 AI 代理（Claude Code、Cursor 等）
3. 开始 Spec-Driven Development 工作流程:
   • /constitution - 定义项目原则
   • /specify - 创建规格说明
   • /plan - 制定技术计划
   • /tasks - 分解任务
   • /implement - 执行实现

💡 提示: 查看 README.md 了解详细的开发工作流程
""")
    
    return True

def main():
    """主函数"""
    if len(sys.argv) < 2:
        print_help()
        return
    
    command = sys.argv[1]
    
    if command == '--help' or command == '-h':
        print_help()
    elif command == 'check':
        check_tools()
    elif command == 'init':
        if len(sys.argv) >= 3:
            if sys.argv[2] == '--here':
                init_project(here=True)
            else:
                project_name = sys.argv[2]
                init_project(project_name)
        else:
            print("❌ 错误: 请提供项目名称或使用 --here 选项")
            print("用法: python specify.py init <项目名称> 或 python specify.py init --here")
    else:
        print(f"❌ 未知命令: {command}")
        print_help()

if __name__ == '__main__':
    main()