// 抠图微服务请求
// 部署地址：当前用电脑IP，后续可改为云服务器IP

const REMBG_URL = 'http://172.17.246.41:8000/api/remove-bg';
const TIMEOUT_MS = 15000;

export async function removeBackground(file: Blob | File): Promise<Blob> {
  const formData = new FormData();
  formData.append('file', file);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const resp = await fetch(REMBG_URL, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '未知错误');
      throw new Error(`抠图服务返回错误: ${errText}`);
    }

    return resp.blob();
  } catch (e: any) {
    if (e.name === 'AbortError') {
      throw new Error('抠图服务超时（15秒），请确保电脑后端已启动并与手机在同一网络');
    }
    if (e.message?.includes('Failed to fetch') || e.message?.includes('NetworkError') || e.name === 'TypeError') {
      throw new Error(`无法连接抠图服务 (${REMBG_URL})，请确保电脑后端已启动并与手机在同一WiFi`);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}