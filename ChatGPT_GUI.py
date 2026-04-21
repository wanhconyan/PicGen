import tkinter as tk
from tkinter import scrolledtext, messagebox, ttk
import requests
import json
import uuid
import re
import threading
from datetime import datetime

# ===================== 你的抓包鉴权 无需修改 =====================
HEADERS = {
    "Authorization": "Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjE5MzQ0ZTY1LWJiYzktNDRkMS1hOWQwLWY5NTdiMDc5YmQwZSIsInR5cCI6IkpXVCJ9.eyJhdWQiOlsiaHR0cHM6Ly9hcGkub3BlbmFpLmNvbS92MSJdLCJjbGllbnRfaWQiOiJhcHBfWDh6WTZ2VzJwUTl0UjNkRTduSzFqTDVnSCIsImV4cCI6MTc3NzM1MzcxNiwiaHR0cHM6Ly9hcGkub3BlbmFpLmNvbS9hdXRoIjp7ImNoYXRncHRfYWNjb3VudF9pZCI6IjQ5ZTUxNWU1LTRhNWYtNGE1NS05OWEyLTUyY2UwYTc0MWRjOCIsImNoYXRncHRfYWNjb3VudF91c2VyX2lkIjoidXNlci1zMVlwa0pYbUhpVTAzMG5pOUV6VGNYVG9fXzQ5ZTUxNWU1LTRhNWYtNGE1NS05OWEyLTUyY2UwYTc0MWRjOCIsImNoYXRncHRfY29tcHV0ZV9yZXNpZGVuY3kiOiJub19jb25zdHJhaW50IiwiY2hhdGdwdF9wbGFuX3R5cGUiOiJwbHVzIiwiY2hhdGdwdF91c2VyX2lkIjoidXNlci1zMVlwa0pYbUhpVTAzMG5pOUV6VGNYVG8iLCJ1c2VyX2lkIjoidXNlci1zMVlwa0pYbUhpVTAzMG5pOUV6VGNYVG8ifSwiaHR0cHM6Ly9hcGkub3BlbmFpLmNvbS9wcm9maWxlIjp7ImVtYWlsIjoid2N5OTIxNUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZX0sImlhdCI6MTc3NjQ4OTcxNSwiaXNzIjoiaHR0cHM6Ly9hdXRoLm9wZW5haS5jb20iLCJqdGkiOiIwMmZmMmY2NS05Yzc2LTQyZmItOTI3NC0yYmM1MTBhNGM3YzQiLCJuYmYiOjE3NzY0ODk3MTUsInB3ZF9hdXRoX3RpbWUiOjE3NzY0ODk3MTQ1NzMsInNjcCI6WyJvcGVuaWQiLCJlbWFpbCIsInByb2ZpbGUiLCJvZmZsaW5lX2FjY2VzcyIsIm1vZGVsLnJlcXVlc3QiLCJtb2RlbC5yZWFkIiwib3JnYW5pemF0aW9uLnJlYWQiLCJvcmdhbml6YXRpb24ud3JpdGUiXSwic2Vzc2lvbl9pZCI6ImF1dGhzZXNzX2NZeEhvam5la09DUjhWVVJXVVhaa3l3USIsInNsIjp0cnVlLCJzdWIiOiJnb29nbGUtb2F1dGgyfDExNTQxOTYxMDA0MjI1ODc4OTA5NSJ9.xQzG5IO2lPxCxr_xZyFn7Hj1lgi9cRYjrKFV-nCG9MXjiQSTr0EKxewF23VW5MGkIk-0IieuReLoIdMoMZFlHgLrTiIX_vg_9xKlKMBUpIA0nLQ6kxGMS7HIVqGV8SZwTeJpEidKPJSREj5gl3Xi2a2avplSB66Bv0FdCAfkE28NNlA4G24lRD83hgdA83EFuRYF17yyDKW75GUm2U0akOcxG2QwrfvoGXvT4IYYoLwgtq6mxDPGQ5tFisKe5Bt1MVdqM-Msu7zqc_RpMRiMw69LReIpz3lEUrSDTbsD6OhahrLAqMmmLMCuMt6XaJxeLpE5WdKQQUkmcH6mjJM1lH5YkyoAVtEESdx2GrcCWS2iEYJZ8Tb9ZOfJ-VtWnYv0z6_x8XMMIdLeL2eS2huw8qPAt9YNmA8Ra92j0ZsL_Ks7lAWcUHj2AdLBMZbjxXiUSWkf1V0OMJUYVRjR2dp77cOn_1eSTOeNq9xTkMFb0IFdRSENAlxP8C3N3CAyimhdrxUo906ykf-cUkSVOsnCMls-EBBhcbJFSJfJksUN9xp0R3dOgAIue3AKCU8FpQKJSfGcHvXdXXCsu6hQRzGJWCrJqoH6z7fnlvqSo-UF78fGw8Pp0c0cY7C7-UdFJUFkpyOigsr08bAIBy1lBHvXrf7hjCizveWklw8dBt1xbJI",
    "Content-Type": "application/json",
    "Accept": "text/event-stream",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
    "Origin": "https://chatgpt.com",
    "Referer": "https://chatgpt.com/"
}

API_URL = "https://chatgpt.com/backend-api/f/conversation"
# 网页后端真实生效模型
REAL_MODEL = "gpt-4o"

class ChatGPT_GUI:
    def __init__(self, root):
        self.root = root
        self.root.title("ChatGPT网页流式GUI | GPT-4o 图文+画图 带进度状态")
        self.root.geometry("950x750")

        self.conversation_id = None
        self.parent_msg_id = None
        self.packet_count = 0

        # 聊天窗口
        self.chat_box = scrolledtext.ScrolledText(root, wrap=tk.WORD, font=("微软雅黑", 10))
        self.chat_box.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)
        self.chat_box.config(state=tk.DISABLED)

        # 状态+进度条
        self.status_label = tk.Label(root, text="状态：空闲 | 等待发送请求", fg="#333")
        self.status_label.pack(fill=tk.X, padx=10)

        self.progress = ttk.Progressbar(root, mode="indeterminate")
        self.progress.pack(fill=tk.X, padx=10, pady=2)

        # 输入框
        self.input_box = tk.Entry(root, font=("微软雅黑", 11))
        self.input_box.pack(fill=tk.X, padx=10, pady=3)
        self.input_box.bind("<Return>", self.send_chat)

        # 按钮
        btn_frame = tk.Frame(root)
        btn_frame.pack(fill=tk.X, padx=10, pady=5)

        tk.Button(btn_frame, text="发送对话/画图", width=18, command=self.send_chat).grid(row=0, column=0, padx=5)
        tk.Button(btn_frame, text="新建空白对话", width=18, command=self.clear_chat).grid(row=0, column=1, padx=5)
        tk.Button(btn_frame, text="一键高清壁纸", width=18, command=self.fast_draw).grid(row=0, column=2, padx=5)

    # 更新底部状态
    def update_status(self, txt):
        self.root.after(0, lambda: self.status_label.config(text=f"状态：{txt}"))

    # 图片保存
    def save_img(self, url):
        try:
            self.update_status("正在下载图片...")
            res = requests.get(url, stream=True, timeout=15)
            name = f"GPT图片_{datetime.now().strftime('%Y%m%d%H%M%S')}.png"
            with open(name, 'wb') as f:
                f.write(res.content)
            self.append_msg(f"\n✅ 图片已保存：{name}")
            self.update_status("图片保存完成")
        except:
            self.append_msg("\n❌ 图片下载失败")
            self.update_status("图片下载异常")

    # 追加聊天内容
    def append_msg(self, text):
        self.chat_box.config(state=tk.NORMAL)
        self.chat_box.insert(tk.END, text + "\n")
        self.chat_box.yview(tk.END)
        self.chat_box.config(state=tk.DISABLED)

    # 清空上下文
    def clear_chat(self):
        self.conversation_id = None
        self.parent_msg_id = None
        self.packet_count = 0
        self.append_msg("=== 已清空上下文，开启全新对话 ===")
        self.update_status("空闲 | 已重置对话上下文")

    # 快捷画图
    def fast_draw(self):
        self.input_box.delete(0, tk.END)
        self.input_box.insert(0, "8K超清唯美星空动漫壁纸，DALL·E3高清细腻")

    # 发送入口
    def send_chat(self, event=None):
        prompt = self.input_box.get().strip()
        if not prompt:
            messagebox.showwarning("提示", "请输入对话或画图指令")
            return
        self.input_box.delete(0, tk.END)
        self.append_msg(f"👤 你：{prompt}")
        self.append_msg("🤖 AI 正在流式回复：")

        self.progress.start(10)
        self.update_status("正在连接OpenAI服务器...")
        threading.Thread(target=self.request_chat, args=(prompt,), daemon=True).start()

    # 核心SSE流式请求
    def request_chat(self, prompt):
        try:
            self.packet_count = 0
            msg_id = str(uuid.uuid4())
            parent_id = self.parent_msg_id or str(uuid.uuid4())

            data = {
                "action": "next",
                "messages": [
                    {
                        "id": msg_id,
                        "author": {"role": "user"},
                        "content": {"content_type": "text", "parts": [prompt]}
                    }
                ],
                "model": REAL_MODEL,
                "parent_message_id": parent_id,
                "conversation_id": self.conversation_id
            }

            self.update_status("已连接，接收SSE流式数据流...")
            resp = requests.post(API_URL, headers=HEADERS, json=data, stream=True, timeout=60)

            full = ""
            for line in resp.iter_lines():
                if not line:
                    continue

                line = line.decode('utf-8')
                if not line.startswith("data:"):
                    continue
                if line.endswith("[DONE]"):
                    break

                self.packet_count += 1
                self.update_status(f"接收数据流中 | 已包数：{self.packet_count}")

                try:
                    obj = json.loads(line[5:])
                    if not obj.get("message"):
                        continue

                    msg = obj["message"]
                    part = msg["content"]["parts"][0]
                    full += part

                    # 实时逐字刷新UI
                    self.root.after(0, self.chat_box.config, {"state": tk.NORMAL})
                    self.root.after(0, self.chat_box.insert, tk.END, part)
                    self.root.after(0, self.chat_box.yview, tk.END)
                    self.root.after(0, self.chat_box.config, {"state": tk.DISABLED})

                    self.conversation_id = obj["conversation_id"]
                    self.parent_msg_id = msg["id"]

                    # 检测图片链接
                    urls = re.findall(r'https?://[^\s"\)]+\.png', full)
                    for u in urls:
                        self.save_img(u)

                except Exception:
                    continue

            self.update_status(f"回复完成 | 总计数据包：{self.packet_count}")

        except Exception as e:
            self.update_status(f"请求错误：{str(e)}")
            self.root.after(0, messagebox.showerror, "网络/Token异常", str(e))
        finally:
            self.root.after(0, self.progress.stop)

if __name__ == "__main__":
    root = tk.Tk()
    app = ChatGPT_GUI(root)
    root.mainloop()