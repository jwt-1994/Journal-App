// 抠图微服务请求
// 部署地址：当前用电脑IP，后续可改为云服务器IP

const REMBG_URL = 'http://172.17.246.41:8000/api/remove-bg';

export async function removeBackground(file: Blob | File): Promise<Blob> {
  const formData = new FormData();
  formData.append('file', file);

  const resp = await fetch(REMBG_URL, {
    method: 'POST',
    body: formData,
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => '未知错误');
    throw new Error(`抠图失败: ${errText}`);
  }

  return resp.blob();
}