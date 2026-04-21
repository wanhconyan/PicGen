from chatgpt_auth import ChatGPTAuth
import requests

# 初始化鉴权
auth = ChatGPTAuth()

# 方式1：一键自动抓取浏览器登录会话（推荐）
auth.auto_fetch_chrome_session()

# 方式2：手动切换API Key模式
# auth.set_mode("api")
# auth.openai_api_key = "sk-xxxxxxxxxxxx"

# 调用网页原生画图接口
def generate_image(prompt, size="1024x1024"):
    url = "https://chatgpt.com/backend-api/generate_image"
    data = {
        "prompt": prompt,
        "size": size,
        "generation_mode": "dall_e_3"
    }
    resp = requests.post(url, headers=auth.get_image_headers(), json=data)
    return resp.json()

# 测试
if __name__ == "__main__":
    res = generate_image("唯美星空动漫壁纸")
    print(res)