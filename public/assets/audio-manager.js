class AudioManager {
    constructor() {
        this.audioContext = null;
        this.sounds = {
            correct: [],
            wrong: []
        };
        this.loadedSounds = {
            correct: {},
            wrong: {}
        };
        this.init();
    }

    async init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            await this.loadSounds();
        } catch (error) {
            console.error('AudioManager初始化失败:', error);
        }
    }

    async loadSounds() {
        try {
            await this.loadSoundCategory('correct', '/assets/sounds/correct/');
            await this.loadSoundCategory('wrong', '/assets/sounds/wrong/');
            console.log('音效加载完成:', this.loadedSounds);
        } catch (error) {
            console.error('音效加载失败:', error);
        }
    }

    async loadSoundCategory(category, basePath) {
        const commonNames = ['a', 'b', 'c', 'd', '1', '2', '3', '4', 'correct', 'wrong', 'success', 'fail'];
        const extensions = ['.mp3', '.wav', '.ogg', '.m4a'];
        
        for (const name of commonNames) {
            for (const ext of extensions) {
                try {
                    const url = `${basePath}${name}${ext}`;
                    const response = await fetch(url);
                    if (response.ok) {
                        const arrayBuffer = await response.arrayBuffer();
                        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                        this.loadedSounds[category][name] = audioBuffer;
                        console.log(`加载音效: ${category}/${name}${ext}`);
                        break; // 找到第一个有效文件就停止
                    }
                } catch (error) {
                    // 文件不存在或加载失败，继续尝试下一个
                }
            }
        }
    }

    playSound(category, volume = 0.5) {
        if (!this.audioContext) {
            console.warn('AudioContext未初始化');
            return null;
        }

        const sounds = this.loadedSounds[category];
        const soundNames = Object.keys(sounds);
        
        if (soundNames.length === 0) {
            console.warn(`没有找到${category}类别的音效，使用默认音效`);
            return this.playDefaultSound(category, volume);
        }

        // 随机选择一个音效
        const randomName = soundNames[Math.floor(Math.random() * soundNames.length)];
        const audioBuffer = sounds[randomName];
        
        if (!audioBuffer) {
            console.warn(`音效${randomName}未加载，使用默认音效`);
            return this.playDefaultSound(category, volume);
        }

        try {
            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();
            
            source.buffer = audioBuffer;
            gainNode.gain.value = volume;
            
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            source.start();
            
            // 触发自定义事件，通知特效管理器
            window.dispatchEvent(new CustomEvent('soundPlayed', {
                detail: { category, selectedName: randomName }
            }));
            
            console.log(`播放音效: ${category}/${randomName}`);
            return randomName;
        } catch (error) {
            console.error('播放音效失败:', error);
            return this.playDefaultSound(category, volume);
        }
    }

    playDefaultSound(category, volume = 0.5) {
        try {
            const frequency = category === 'correct' ? 800 : 400; // 正确音调高，错误音调低
            const duration = 0.3;
            const sampleRate = this.audioContext.sampleRate;
            const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
            const data = buffer.getChannelData(0);
            
            for (let i = 0; i < data.length; i++) {
                const t = i / sampleRate;
                data[i] = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 3) * volume;
            }
            
            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(this.audioContext.destination);
            source.start();
            
            // 触发自定义事件，通知特效管理器
            window.dispatchEvent(new CustomEvent('soundPlayed', {
                detail: { category, selectedName: 'default' }
            }));
            
            console.log(`播放默认音效: ${category}`);
            return 'default';
        } catch (error) {
            console.error('播放默认音效失败:', error);
            return null;
        }
    }

    playCorrectSound() {
        return this.playSound('correct', 0.6);
    }

    playWrongSound() {
        return this.playSound('wrong', 0.6);
    }


    playClickSound() {
        return this.playSound('correct', 0.3);
    }
}

// 创建全局实例
window.audioManager = new AudioManager();
