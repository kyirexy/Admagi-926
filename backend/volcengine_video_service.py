"""
即梦AI-视频生成3.0 Pro服务
支持文生视频和图生视频功能
"""

import os
import json
import time
import base64
import hashlib
import hmac
import requests
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from enum import Enum
from datetime import datetime

class VideoTaskStatus(Enum):
    IN_QUEUE = "in_queue"      # 任务已提交
    GENERATING = "generating"   # 任务已被消费，处理中
    DONE = "done"              # 处理完成
    NOT_FOUND = "not_found"    # 任务未找到
    EXPIRED = "expired"        # 任务已过期

@dataclass
class VideoGenerationRequest:
    """视频生成请求参数"""
    prompt: str  # 文本提示词
    image_urls: Optional[List[str]] = None  # 图片URL列表（图生视频）
    binary_data_base64: Optional[List[str]] = None  # 图片base64编码（图生视频）
    seed: int = -1  # 随机种子
    frames: int = 121  # 生成的总帧数（121=5s, 241=10s）
    aspect_ratio: str = "16:9"  # 长宽比

@dataclass
class VideoTaskResult:
    """视频任务结果"""
    task_id: str
    status: VideoTaskStatus
    video_url: Optional[str] = None
    error_message: Optional[str] = None
    created_at: Optional[int] = None
    updated_at: Optional[int] = None

class VolcengineVideoService:
    """火山引擎视频生成服务类"""
    
    def __init__(self):
        # 从环境变量获取API配置
        self.access_key = os.getenv("VOLCENGINE_ACCESS_KEY", "")
        self.secret_key = os.getenv("VOLCENGINE_SECRET_KEY", "")
        self.endpoint = "https://visual.volcengineapi.com"
        self.region = "cn-north-1"
        self.service = "cv"
        
        if not self.access_key or not self.secret_key:
            print("⚠️ 警告: 未设置VOLCENGINE_ACCESS_KEY和VOLCENGINE_SECRET_KEY环境变量")
    
    def _sign_request(self, method: str, query_params: Dict[str, str], body: str) -> Dict[str, str]:
        """生成火山引擎API签名"""
        import datetime
        
        # 时间戳
        t = datetime.datetime.utcnow()
        current_date = t.strftime('%Y%m%dT%H%M%SZ')
        datestamp = t.strftime('%Y%m%d')
        
        # 构建查询字符串
        canonical_querystring = '&'.join([f"{k}={v}" for k, v in sorted(query_params.items())])
        
        # 构建请求头
        payload_hash = hashlib.sha256(body.encode('utf-8')).hexdigest()
        content_type = 'application/json'
        
        canonical_headers = f"content-type:{content_type}\nhost:visual.volcengineapi.com\nx-content-sha256:{payload_hash}\nx-date:{current_date}\n"
        
        # 构建规范请求
        canonical_request = f"{method}\n/\n{canonical_querystring}\n{canonical_headers}\ncontent-type;host;x-content-sha256;x-date\n{payload_hash}"
        
        # 构建签名字符串
        algorithm = 'HMAC-SHA256'
        credential_scope = f"{datestamp}/{self.region}/{self.service}/request"
        string_to_sign = f"{algorithm}\n{current_date}\n{credential_scope}\n{hashlib.sha256(canonical_request.encode('utf-8')).hexdigest()}"
        
        # 生成签名密钥
        def sign(key, msg):
            return hmac.new(key, msg.encode('utf-8'), hashlib.sha256).digest()
        
        def get_signature_key(key, date_stamp, region_name, service_name):
            k_date = sign(key.encode('utf-8'), date_stamp)
            k_region = sign(k_date, region_name)
            k_service = sign(k_region, service_name)
            k_signing = sign(k_service, 'request')
            return k_signing
        
        signing_key = get_signature_key(self.secret_key, datestamp, self.region, self.service)
        signature = hmac.new(signing_key, string_to_sign.encode('utf-8'), hashlib.sha256).hexdigest()
        
        # 构建授权头
        authorization_header = f"{algorithm} Credential={self.access_key}/{credential_scope}, SignedHeaders=content-type;host;x-content-sha256;x-date, Signature={signature}"
        
        return {
            'X-Date': current_date,
            'Authorization': authorization_header,
            'X-Content-Sha256': payload_hash,
            'Content-Type': content_type
        }
    
    def submit_video_task(self, request: VideoGenerationRequest) -> str:
        """
        提交视频生成任务
        返回任务ID
        """
        # 构建请求参数 - 按照官方文档格式
        query_params = {
            'Action': 'CVSync2AsyncSubmitTask',
            'Version': '2022-08-31'
        }
        
        # 构建请求体 - 按照官方文档格式
        body_data = {
            "req_key": "jimeng_ti2v_v30_pro",
            "prompt": request.prompt,
            "seed": request.seed,
            "frames": request.frames,
            "aspect_ratio": request.aspect_ratio
        }

        # 添加图片数据（图生视频）
        if request.image_urls:
            body_data["image_urls"] = request.image_urls
            print(f"🖼️ 使用远程图片生成视频，数量: {len(request.image_urls)}")
        elif request.binary_data_base64:
            body_data["binary_data_base64"] = request.binary_data_base64
            print(
                "🧩 使用Base64图片生成视频，首张长度: "
                f"{len(request.binary_data_base64[0]) if request.binary_data_base64 else 0}"
            )

        print(
            "📦 视频任务请求参数:",
            {
                "prompt_length": len(request.prompt or ""),
                "frames": request.frames,
                "aspect_ratio": request.aspect_ratio,
                "has_binary": bool(request.binary_data_base64),
                "has_urls": bool(request.image_urls)
            }
        )

        body_json = json.dumps(body_data, ensure_ascii=False)

        # 生成签名
        headers = self._sign_request("POST", query_params, body_json)
        
        # 发送请求 - 按照官方文档格式
        url = f"{self.endpoint}?Action={query_params['Action']}&Version={query_params['Version']}"
        
        try:
            # 配置请求会话，禁用代理
            session = requests.Session()
            session.proxies = {}
            
            response = session.post(
                url, 
                headers=headers, 
                data=body_json.encode('utf-8'), 
                timeout=30,
                verify=True
            )
            
            print(f"请求URL: {url}")
            print(f"请求头: {headers}")
            print(f"请求体: {body_json}")
            print(f"响应状态: {response.status_code}")
            print(f"响应内容: {response.text}")
            
            if response.status_code == 200:
                result = response.json()

                if result.get('code') == 10000:
                    task_id = result['data']['task_id']
                    print(f"✅ 视频生成任务提交成功: {task_id}")
                    return task_id
                else:
                    print(f"❌ API返回错误详情: {result}")
                    raise Exception(
                        f"API返回错误: {result.get('message', '未知错误')}"
                    )
            else:
                print(f"❌ HTTP错误: {response.status_code} - {response.text}")
                raise Exception(f"HTTP错误: {response.status_code} - {response.text}")

        except requests.exceptions.RequestException as e:
            print(f"网络请求错误详情: {e}")
            raise Exception(f"提交视频生成任务失败: {str(e)}")
    
    def get_video_task_status(self, task_id: str) -> VideoTaskResult:
        """
        查询视频生成任务状态
        """
        # 构建请求参数
        query_params = {
            'Action': 'CVSync2AsyncGetResult',
            'Version': '2022-08-31'
        }
        
        # 构建请求体
        body_data = {
            "req_key": "jimeng_ti2v_v30_pro",
            "task_id": task_id
        }
        
        body_json = json.dumps(body_data)
        
        # 生成签名
        headers = self._sign_request("POST", query_params, body_json)
        
        # 发送请求
        url = f"{self.endpoint}?Action={query_params['Action']}&Version={query_params['Version']}"
        
        try:
            response = requests.post(url, headers=headers, data=body_json, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            
            if result.get('code') == 10000:
                data = result['data']
                status_map = {
                    "in_queue": VideoTaskStatus.IN_QUEUE,
                    "generating": VideoTaskStatus.GENERATING,
                    "done": VideoTaskStatus.DONE,
                    "not_found": VideoTaskStatus.NOT_FOUND,
                    "expired": VideoTaskStatus.EXPIRED
                }

                status = status_map.get(data.get('status', 'not_found'), VideoTaskStatus.NOT_FOUND)

                return VideoTaskResult(
                    task_id=task_id,
                    status=status,
                    video_url=data.get('video_url'),
                    created_at=int(time.time()),
                    updated_at=int(time.time())
                )
            else:
                print(f"❌ 查询任务状态 API 错误: {result}")
                return VideoTaskResult(
                    task_id=task_id,
                    status=VideoTaskStatus.NOT_FOUND,
                    error_message=result.get('message', '查询失败')
                )

        except requests.exceptions.RequestException as e:
            print(f"❌ 查询任务状态网络异常: {e}")
            return VideoTaskResult(
                task_id=task_id,
                status=VideoTaskStatus.NOT_FOUND,
                error_message=f"查询任务状态失败: {str(e)}"
            )
    
    def text_to_video(self, prompt: str, frames: int = 121, aspect_ratio: str = "16:9") -> str:
        """
        文生视频 - 简化接口
        """
        request = VideoGenerationRequest(
            prompt=prompt,
            frames=frames,
            aspect_ratio=aspect_ratio
        )
        return self.submit_video_task(request)
    
    def image_to_video(
        self,
        image_url: str,
        prompt: str = "",
        frames: int = 121,
        aspect_ratio: str = "16:9"
    ) -> str:
        """
        图生视频 - 简化接口
        """
        request = VideoGenerationRequest(
            prompt=prompt,
            image_urls=[image_url],
            frames=frames,
            aspect_ratio=aspect_ratio
        )
        return self.submit_video_task(request)

    def image_to_video_base64(
        self,
        image_base64: str,
        prompt: str = "",
        frames: int = 121,
        aspect_ratio: str = "16:9"
    ) -> str:
        """
        图生视频 - 使用base64图片
        """
        request = VideoGenerationRequest(
            prompt=prompt,
            binary_data_base64=[image_base64],
            frames=frames,
            aspect_ratio=aspect_ratio
        )
        return self.submit_video_task(request)

# 全局服务实例
volcengine_video_service = VolcengineVideoService()
