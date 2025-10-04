# 音效和特效系统使用说明

## 📁 文件夹结构

```
public/assets/
├── sounds/
│   ├── correct/     # 正确答题音效
│   └── wrong/       # 错误答题音效
├── effects/
│   ├── correct/     # 正确答题特效图片
│   └── wrong/       # 错误答题特效图片
├── audio-manager.js    # 音效管理器
├── effects-manager.js  # 特效管理器
├── effects.css         # 特效样式
└── README.md           # 使用说明
```

## 🎵 音效文件

### 支持格式
- `.mp3` (推荐)
- `.wav`
- `.ogg`
- `.m4a`

### 命名规则
将音效文件放入对应文件夹，支持以下命名：
- `a.mp3`, `b.mp3`, `c.mp3`, `d.mp3`
- `1.mp3`, `2.mp3`, `3.mp3`, `4.mp3`
- `correct.mp3`, `wrong.mp3`
- `success.mp3`, `fail.mp3`

### 示例文件结构
```
sounds/
├── correct/
│   ├── a.mp3
│   ├── b.mp3
│   └── success.mp3
└── wrong/
    ├── a.mp3
    ├── b.mp3
    └── fail.mp3
```

## 🎨 特效图片

### 支持格式
- `.png` (推荐)
- `.jpg`
- `.jpeg`
- `.gif`
- `.svg`

### 命名规则
与音效文件命名相同，确保音效和特效文件名匹配：
- `a.png` 对应 `a.mp3`
- `b.png` 对应 `b.mp3`
- 等等...

### 示例文件结构
```
effects/
├── correct/
│   ├── a.png
│   ├── b.png
│   └── success.png
└── wrong/
    ├── a.png
    ├── b.png
    └── fail.png
```

## 🔄 匹配播放机制

系统会自动匹配音效和特效：
1. 随机选择一个音效文件（如 `a.mp3`）
2. 自动播放对应的特效图片（如 `a.png`）
3. 确保音效和特效文件名完全一致

## 🎯 使用方法

### 在HTML中引入
```html
<link rel="stylesheet" href="/assets/effects.css">
<script src="/assets/audio-manager.js"></script>
<script src="/assets/effects-manager.js"></script>
```

### 在JavaScript中调用
```javascript
// 答题正确时
audioManager.playCorrectSound();
effectsManager.showCorrectEffect();

// 答题错误时
audioManager.playWrongSound();
effectsManager.showWrongEffect();

// 成功完成时
audioManager.playSuccessSound();
effectsManager.showSuccessEffect();
```

## ⚙️ 自定义配置

### 音效音量
```javascript
// 在audio-manager.js中修改
playCorrectSound() {
    return this.playSound('correct', 0.6); // 0.6为音量
}
```

### 特效显示时间
```javascript
// 在effects-manager.js中修改
setTimeout(() => {
    // 2秒后移除特效，可修改为其他时间
}, 2000);
```

## 🐛 故障排除

1. **音效不播放**：检查浏览器是否支持Web Audio API
2. **特效不显示**：检查图片文件路径和格式
3. **音效特效不匹配**：确保文件名完全一致（包括大小写）

## 📝 注意事项

- 文件名区分大小写
- 建议使用较短的音频文件（1-3秒）
- 图片建议使用透明背景的PNG格式
- 系统会自动加载所有支持格式的文件
