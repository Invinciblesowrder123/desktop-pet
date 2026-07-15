const clickResponses: Record<string, string[]> = {
  head: [
    '诶嘿~不要摸头啦',
    '头发都被你弄乱了~',
    '嘻嘻，好痒哦',
    '再摸我就要生气了！>_<',
    '你喜欢摸头杀吗？',
    '嗯~好舒服',
    '轻一点啦~',
  ],
  body: [
    '嗯？怎么了？',
    '有什么需要帮忙的吗？',
    '今天天气真好呢~',
    '我在听哦~',
    '嘿嘿，被你发现了',
  ],
  arm: [
    '要牵手吗？',
    '手臂好酸哦~',
    '诶？想带我去哪里？',
  ],
  default: [
    '啊！吓我一跳',
    '诶？什么事？',
    '喵~',
    '一直盯着我看会害羞的啦',
  ],
}

const rapidClickResponses: string[] = [
  '不要再点啦！>_<',
  '呜呜，生气了！',
  '你坏！不理你了！',
  '啊啊啊住手！',
  '再这样我要躲起来了！',
  '哼！五分钟内不理你！',
]

const idleDialogs: string[] = [
  '好无聊呀...你在做什么呢？',
  '今天也要元气满满哦！✨',
  '想喝奶茶了...',
  '你看我今天可爱吗？',
  '要不要一起追番？',
  '窗外天气好好哦~',
  '记得按时吃饭呀！',
  '工作累了吗？休息一下吧~',
  '我刚刚打了个盹儿...',
  '你回来啦！我好想你~',
]

const timeGreetings: Record<string, string[]> = {
  morning: [
    '早上好！新的一天开始啦~',
    '早安！今天也要加油哦！',
    '起床啦！太阳晒屁股了！',
  ],
  afternoon: [
    '下午好呀~有点困了呢',
    '午后阳光好舒服~',
    '要不要来杯下午茶？',
  ],
  evening: [
    '晚上好！今天过得怎么样？',
    '该休息一下啦，别太累哦~',
    '天黑了，要早点睡哦！',
  ],
  night: [
    '夜深了...你还不睡吗？',
    '晚安啦~明天见！',
    '做个好梦哦~',
  ],
}

export class DialogEngine {
  private lastIdleTime = 0
  private idleInterval = 30000 // 30 seconds minimum between idle chat
  private lastClickTime = 0
  private clickCooldown = 1500

  getResponse(area: string, clickCount: number, isRapid: boolean): string {
    const now = Date.now()

    // Cooldown check
    if (now - this.lastClickTime < this.clickCooldown) {
      return this.pickRandom(clickResponses.default)
    }
    this.lastClickTime = now

    if (isRapid) {
      return this.pickRandom(rapidClickResponses)
    }

    const responses = clickResponses[area.toLowerCase()] || clickResponses.default
    return this.pickRandom(responses)
  }

  getIdleDialog(): string | null {
    const now = Date.now()
    if (now - this.lastIdleTime < this.idleInterval) {
      return null
    }
    this.lastIdleTime = now

    // Mix in time-based greetings occasionally (30% chance)
    if (Math.random() < 0.3) {
      const timeKey = this.getTimeKey()
      const greetings = timeGreetings[timeKey]
      if (greetings) return this.pickRandom(greetings)
    }

    return this.pickRandom(idleDialogs)
  }

  private getTimeKey(): string {
    const hour = new Date().getHours()
    if (hour >= 6 && hour < 12) return 'morning'
    if (hour >= 12 && hour < 17) return 'afternoon'
    if (hour >= 17 && hour < 22) return 'evening'
    return 'night'
  }

  private pickRandom(arr: string[]): string {
    return arr[Math.floor(Math.random() * arr.length)]
  }

  setCooldown(ms: number) {
    this.clickCooldown = ms
  }
}
