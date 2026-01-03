// src/data/stamps.js
export const stampsData = [
  {
    id: 1,
    title: "落日熔金",
    imageUrl: "https://images.unsplash.com/photo-1495616811223-4d98c6e9d869?q=80&w=600&auto=format&fit=crop",
    isCollected: true,
    acquiredDate: "2023-10-01",
    // 这里的 HTML 标签会让文字像 Word 一样排版
    desc: `
      <b>时间：</b>2023年那个秋天的傍晚<br>
      <b>坐标：</b>北纬30度，海边的灯塔旁<br>
      <br>
      那天的晚霞像<span class="text-orange-600 font-bold">烧化了的金子</span>，流淌在天际线。<br>
      我们坐在海堤上，看着太阳一点点沉入海平面。<br>
      <br>
      <i>“有些美景，一生只能遇见一次。”</i><br>
      那一刻，时间仿佛静止了。
    `
  },
  {
    id: 2,
    title: "雨后森林",
    imageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=600&auto=format&fit=crop",
    isCollected: true,
    acquiredDate: "2023-11-15",
    desc: "空气中都是<b>苔藓</b>和<b>泥土</b>混合的味道。<br>清新的氧气冲进肺叶。<br><br>这枚邮票是为了纪念那次徒步，虽然鞋子湿透了，但心情无比透亮。"
  },
  {
    id: 3,
    title: "未知的秘境",
    imageUrl: "", 
    isCollected: false, 
    acquiredDate: null,
    desc: "这是一个传说中的地点，据说只有在极光出现的夜晚才能找到入口。<br>目前还未有人真正抵达。"
  },
  {
    id: 4,
    title: "赛博朋克",
    imageUrl: "https://images.unsplash.com/photo-1515630278258-407f66498911?q=80&w=600&auto=format&fit=crop",
    isCollected: true,
    acquiredDate: "2023-09-20",
    desc: "霓虹灯下的雨夜，<br>机械与肉体的交织。"
  },
   {
    id: 5,
    title: "云端漫步",
    imageUrl: "https://images.unsplash.com/photo-1501630834273-4b5604d2ee31?q=80&w=600&auto=format&fit=crop", 
    isCollected: true,
    acquiredDate: "2024-01-01",
    desc: "飞机穿过云层的瞬间，<br>阳光洒在机翼上。"
  }
]