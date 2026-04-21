import requests
import browser_cookie3

class ChatGPTAuth:
    def __init__(self):
        self.mode = "browser"  # browser / api
        self.bearer_token = ""
        self.cookie = ""
        self.openai_api_key = ""
        self.user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36"

    # ===================== 自动抓取Chrome ChatGPT完整会话 =====================
    def auto_fetch_chrome_session(self):
        try:
            # 读取chatgpt.com所有Cookie
            cj = browser_cookie3.chrome(domain_name="chatgpt.com")
            cookie_str = "; ".join([f"{c.name}={c.value}" for c in cj])

            # 请求session接口拿到Bearer Token
            headers = {
                "User-Agent": self.user_agent,
                "Cookie": cookie_str
            }

            resp = requests.get("https://chatgpt.com/api/auth/session", headers=headers, timeout=15)
            session_data = resp.json()

            self.bearer_token = session_data.get("accessToken", "")
            self.cookie = cookie_str
            return True
        except Exception as e:
            print(f"抓取会话失败: {e}")
            return False

    # ===================== 获取对话接口完整Headers =====================
    def get_chat_headers(self):
        if self.mode == "browser":
            return {
                "Authorization": f"Bearer {self.bearer_token}",
                "Cookie": self.cookie,
                "Content-Type": "application/json",
                "Accept": "text/event-stream",
                "User-Agent": self.user_agent,
                "Origin": "https://chatgpt.com",
                "Referer": "https://chatgpt.com/",
                "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8"
            }
        else:
            # OpenAI官方API模式
            return {
                "Authorization": f"Bearer {self.openai_api_key}",
                "Content-Type": "application/json"
            }

    # ===================== 获取画图接口完整Headers =====================
    def get_image_headers(self):
        if self.mode == "browser":
            return {
                "Authorization": f"Bearer {self.bearer_token}",
                "Cookie": self.cookie,
                "Content-Type": "application/json",
                "Accept": "application/json",
                "User-Agent": self.user_agent,
                "Origin": "https://chatgpt.com",
                "Referer": "https://chatgpt.com/"
            }
        else:
            return {
                "Authorization": f"Bearer {self.openai_api_key}",
                "Content-Type": "application/json"
            }

    # 切换鉴权模式
    def set_mode(self, mode):
        self.mode = mode