class EffectsManager {
    constructor() {
        this.images = {
            correct: {},
            wrong: {}
        };
        this.currentSelectedName = null;
        this.init();
    }

    async init() {
        await this.loadImages();
        this.setupEventListeners();
    }

    async loadImages() {
        try {
            await this.loadImageCategory('correct', '/assets/effects/correct/');
            await this.loadImageCategory('wrong', '/assets/effects/wrong/');
            console.log('特效图片加载完成:', this.images);
        } catch (error) {
            console.error('特效图片加载失败:', error);
        }
    }

    async loadImageCategory(category, basePath) {
        const commonNames = ['a', 'b', 'c', 'd', '1', '2', '3', '4', 'correct', 'wrong', 'success', 'fail'];
        const extensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg'];
        
        for (const name of commonNames) {
            for (const ext of extensions) {
                try {
                    const url = `${basePath}${name}${ext}`;
                    const response = await fetch(url);
                    if (response.ok) {
                        const blob = await response.blob();
                        const img = new Image();
                        img.src = URL.createObjectURL(blob);
                        this.images[category][name] = img;
                        console.log(`加载特效图片: ${category}/${name}${ext}`);
                        break; // 找到第一个有效文件就停止
                    }
                } catch (error) {
                    // 文件不存在或加载失败，继续尝试下一个
                }
            }
        }
    }

    setupEventListeners() {
        // 监听音效播放事件，获取选中的文件名
        window.addEventListener('soundPlayed', (event) => {
            this.currentSelectedName = event.detail.selectedName;
        });
    }

    showCenterEffect(type) {
        const category = type === 'correct' || type === 'success' ? 'correct' : 'wrong';
        const images = this.images[category];
        const imageNames = Object.keys(images);
        
        if (imageNames.length === 0) {
            console.warn(`没有找到${category}类别的特效图片，使用默认特效`);
            this.createDefaultCenterEffect(type);
            return;
        }

        // 优先使用与音效匹配的图片
        let selectedName = null;
        if (this.currentSelectedName && images[this.currentSelectedName]) {
            selectedName = this.currentSelectedName;
        } else {
            // 如果没有匹配的图片，随机选择
            selectedName = imageNames[Math.floor(Math.random() * imageNames.length)];
        }

        const img = images[selectedName];
        if (img) {
            this.createCenterImageEffect(img, type, selectedName);
        } else {
            console.warn(`特效图片${selectedName}未加载，使用默认特效`);
            this.createDefaultCenterEffect(type);
        }
    }

    createCenterImageEffect(img, type, selectedName) {
        // 创建特效容器
        const effectContainer = document.createElement('div');
        effectContainer.className = 'center-effect';
        effectContainer.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10000;
            pointer-events: none;
            animation: centerEffect 2s ease-out forwards;
        `;

        // 创建图片元素
        const imgElement = document.createElement('img');
        imgElement.src = img.src;
        imgElement.style.cssText = `
            max-width: 200px;
            max-height: 200px;
            width: auto;
            height: auto;
            display: block;
        `;

        effectContainer.appendChild(imgElement);
        document.body.appendChild(effectContainer);

        // 2秒后移除特效
        setTimeout(() => {
            if (effectContainer.parentNode) {
                effectContainer.parentNode.removeChild(effectContainer);
            }
        }, 2000);

        console.log(`显示特效: ${type}/${selectedName}`);
    }

    createDefaultCenterEffect(type) {
        const effectContainer = document.createElement('div');
        effectContainer.className = 'center-effect';
        effectContainer.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10000;
            pointer-events: none;
            animation: centerEffect 2s ease-out forwards;
        `;

        const symbol = type === 'correct' || type === 'success' ? '✓' : '✗';
        const color = type === 'correct' || type === 'success' ? '#4CAF50' : '#F44336';
        
        effectContainer.innerHTML = `
            <div style="
                font-size: 80px;
                color: ${color};
                text-align: center;
                font-weight: bold;
                text-shadow: 0 0 20px ${color};
            ">${symbol}</div>
        `;

        document.body.appendChild(effectContainer);

        setTimeout(() => {
            if (effectContainer.parentNode) {
                effectContainer.parentNode.removeChild(effectContainer);
            }
        }, 2000);
    }

    showCorrectEffect() {
        this.showCenterEffect('correct');
    }

    showWrongEffect() {
        this.showCenterEffect('wrong');
    }

}

// 创建全局实例
window.effectsManager = new EffectsManager();
