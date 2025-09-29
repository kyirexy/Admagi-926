// AI功能客户端服务

export interface TextToVideoRequest {
  prompt: string;
  duration: number;
  resolution: string;
}

export interface ImageToVideoRequest {
  prompt: string;
  duration: number;
  resolution: string;
}

export interface TaskStatus {
  task_id: string;
  status: string;
  progress: number;
  video_url?: string;
  error?: string;
}

export interface Task {
  task_id: string;
  type: string;
  status: string;
  progress: number;
  video_url?: string;
  created_at: string;
  request: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class AIClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  private getAuthHeadersForFormData(): HeadersInit {
    const token = localStorage.getItem('auth_token');
    return {
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  /**
   * 文生视频
   */
  async textToVideo(request: TextToVideoRequest): Promise<ApiResponse<{ task_id: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/text-to-video`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.detail || result.message || '请求失败');
      }

      return {
        success: true,
        data: { task_id: result.task_id },
        message: result.message
      };
    } catch (error) {
      console.error('文生视频请求失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 图生视频 - 文件上传
   */
  async imageToVideo(imageFile: File, request: ImageToVideoRequest): Promise<ApiResponse<{ task_id: string }>> {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('prompt', request.prompt);
      formData.append('duration', request.duration.toString());
      formData.append('resolution', request.resolution);

      const response = await fetch(`${this.baseUrl}/api/ai/image-to-video`, {
        method: 'POST',
        headers: this.getAuthHeadersForFormData(),
        body: formData
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.detail || result.message || '请求失败');
      }

      return {
        success: true,
        data: { task_id: result.task_id },
        message: result.message
      };
    } catch (error) {
      console.error('图生视频请求失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 图生视频 - URL方式
   */
  async imageToVideoByUrl(imageUrl: string, request: ImageToVideoRequest): Promise<ApiResponse<{ task_id: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/image-to-video-url`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          image_url: imageUrl,
          ...request
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.detail || result.message || '请求失败');
      }

      return {
        success: true,
        data: { task_id: result.task_id },
        message: result.message
      };
    } catch (error) {
      console.error('图生视频(URL)请求失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 查询任务状态
   */
  async getTaskStatus(taskId: string): Promise<ApiResponse<TaskStatus>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/task/${taskId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.detail || result.message || '请求失败');
      }

      return {
        success: true,
        data: result,
        message: '查询成功'
      };
    } catch (error) {
      console.error('查询任务状态失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 获取用户任务列表
   */
  async getTasks(): Promise<ApiResponse<{ tasks: Task[] }>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/tasks`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.detail || result.message || '请求失败');
      }

      return {
        success: true,
        data: { tasks: result.tasks || [] },
        message: '获取成功'
      };
    } catch (error) {
      console.error('获取任务列表失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 获取提示词模板
   */
  async getPromptTemplates(): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/prompts/templates`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.detail || result.message || '请求失败');
      }

      return {
        success: true,
        data: result,
        message: '获取成功'
      };
    } catch (error) {
      console.error('获取提示词模板失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 轮询任务状态直到完成
   */
  async pollTaskStatus(taskId: string, onProgress?: (status: TaskStatus) => void): Promise<TaskStatus> {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const result = await this.getTaskStatus(taskId);
          
          if (!result.success || !result.data) {
            reject(new Error(result.error || '查询任务状态失败'));
            return;
          }

          const status = result.data;
          
          if (onProgress) {
            onProgress(status);
          }

          if (status.status === 'completed' || status.status === 'failed') {
            resolve(status);
          } else {
            // 继续轮询，间隔3秒
            setTimeout(poll, 3000);
          }
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }
}

export const aiClient = new AIClient();