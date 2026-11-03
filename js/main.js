// 主入口 - 整合所有模块

import * as utils from './utils.js';
import * as audioManager from './audioManager.js';
import * as fileManager from './fileManager.js';
import * as visualizer from './visualizer.js';
import * as particleSystem from './particleSystem.js';
import * as ui from './uiController.js';
import { getEmbeddedImages } from './mediaData.js';
import { updateGlobalStyle } from './uiController.js'; 

// 初始化

let visualizerStyle = {
    color1: '#F9E5AF',
    color2: '#86C5CA',
    size: 6,
    type: 'line'
};

let isInitialized = false;

// 初始化所有功能
export async function init() {
    if (isInitialized) return;
    
    // 1. 初始化可视化
    const canvas = document.getElementById('visualizerCanvas');
    visualizer.initVisualizer(canvas);
    
       // 默认亮色主题
    const savedTheme = utils.loadFromLocal('activeTheme');
    if (!savedTheme) {
        // 如果没有保存的主题，默认为 light
        document.getElementById('theme').value = 'light';
        document.body.classList.add('light-theme');
    }

    // 2. 加载设置
    ui.loadSavedSettings();
    
    // 3. 加载嵌入的壁纸
    const embeddedImages = getEmbeddedImages();
    if (embeddedImages.length > 0) {
        fileManager.setBgList(embeddedImages);
        const bgData = fileManager.changeBg(0);
        ui.updateBgDropdown(embeddedImages);
        if (bgData) {
            document.getElementById('bgPoster').style.backgroundImage = `url(${bgData.url})`;
        }
        console.log(`Wallpaper loaded`);
    }
    
    // 4. 音乐不自动加载，等待用户选择
    const title = document.getElementById('title');
    if (title) {
        title.textContent = '"She walks in beauty, like the night of cloudless climes and starry skies"';
        title.classList.add('scrolling');
    }
    
    // 5. 绑定事件
    bindEvents();
    
    // 6. 启动绘制循环
    startRenderLoop();
    
    isInitialized = true;
}

// 事件绑定
function bindEvents() {
    // ===== 获取元素 =====
    const panel = document.getElementById('topPanel');
    const panelHeader = document.querySelector('.panel-header');
    
    // ===== 文件加载 =====
    document.getElementById('folderInput').addEventListener('change', handleMusicFolderLoad);
    document.getElementById('imgFolderInput').addEventListener('change', handleImageFolderLoad);
    
    // ===== 播放控制 =====
    document.getElementById('playBtn').addEventListener('click', handlePlayToggle);
    document.getElementById('prevBtn').addEventListener('click', handlePrev);
    document.getElementById('nextBtn').addEventListener('click', handleNext);
    document.getElementById('songSelect').addEventListener('change', handleSongSelect);
    document.getElementById('bgSelect').addEventListener('change', handleBgSelect);
    
    // ===== UI控制 =====
    
    // 1. 面板折叠/展开（点击标题）
    panelHeader.addEventListener('click', function() {
        panel.classList.toggle('collapsed');
        const arrow = panel.querySelector('.panel-header span');
        arrow.textContent = panel.classList.contains('collapsed') ? '▼' : '▲';
    });
    
    // 2. 主题切换
    document.getElementById('theme').addEventListener('change', function() {
        const theme = this.value;
        document.body.classList.toggle('light-theme', theme === 'light');
        document.getElementById('blur').dispatchEvent(new Event('input'));
    });
    
    // 3. 播放模式
    document.getElementById('playMode').addEventListener('change', function() {
        audioManager.setPlayMode(this.value);
    });
    
    // 4. 色盘按钮
    document.querySelectorAll('.palette-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.palette-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const palettes = {
                palette1: { c1: '#F9E5AF', c2: '#86C5CA' },
                palette2: { c1: '#B4CFCB', c2: '#5C4444' },
                palette4: { c1: '#F8BCCB', c2: '#A8D8D7' },
                palette6: { c1: '#D797a8', c2: '#2D2E33' },
                palette8: { c1: '#1B4436', c2: '#8BA758' },
                palette9: { c1: '#468EBA', c2: '#FEC254' },
            };
            
            const palette = palettes[this.id];
            if (palette) {
                document.getElementById('c1').value = palette.c1;
                document.getElementById('c2').value = palette.c2;
                visualizerStyle.color1 = palette.c1;
                visualizerStyle.color2 = palette.c2;
            }
        });
    });
    
    // 5. Blur 滑块
    document.getElementById('blur').addEventListener('input', function() {
            console.log('blur 滑块被拖动');
        updateGlobalStyle();
    });
    
    // 6. Alpha 滑块
    document.getElementById('alpha').addEventListener('input', function() {
        updateGlobalStyle();
    });
    
    // 7. Size 滑块
    document.getElementById('size').addEventListener('input', function() {
        visualizerStyle.size = parseInt(this.value);
    });
    
    // 8. 颜色选择器
    document.getElementById('c1').addEventListener('input', function() {
        visualizerStyle.color1 = this.value;
    });
    document.getElementById('c2').addEventListener('input', function() {
        visualizerStyle.color2 = this.value;
    });
    
    // 9. 可视化类型
    document.getElementById('visualizerType').addEventListener('change', function() {
        visualizerStyle.type = this.value;
    });
    
    // 10. 点击canvas产生粒子特效
    document.getElementById('visualizerCanvas').addEventListener('click', handleCanvasClick);
    
    // 11. 音频结束事件
    document.addEventListener('audioEnded', handleAudioEnded);
    
    // 12. 窗口大小变化
    window.addEventListener('resize', visualizer.resizeCanvas);
    
    // 13. 页面关闭前清理资源
    window.addEventListener('beforeunload', () => {
        fileManager.revokeBgUrls();
    });
    
    // ===== 14. 顶部面板自动收起（鼠标离开3秒后） =====
    let panelTimer = null;
    panel.addEventListener('mouseleave', function() {
        panelTimer = setTimeout(() => {
            if (!panel.classList.contains('collapsed')) {
                panel.classList.add('collapsed');
                const arrow = panel.querySelector('.panel-header span');
                if (arrow) arrow.textContent = '▼';
            }
        }, 3000);
    });
    panel.addEventListener('mouseenter', function() {
        if (panelTimer) {
            clearTimeout(panelTimer);
            panelTimer = null;
        }
    });
    
    // ===== 15. 点击面板外部自动收回 =====
    document.addEventListener('click', function(e) {
        if (panel.classList.contains('collapsed')) return;
        if (!panel.contains(e.target)) {
            panel.classList.add('collapsed');
            const arrow = panel.querySelector('.panel-header span');
            if (arrow) arrow.textContent = '▼';
        }
    });

    // 全屏按钮
document.getElementById('fullscreenBtn').addEventListener('click', function() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        this.textContent = '<—';
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
            this.textContent = '⛶';
        }
    }
});

// 监听全屏变化事件，更新按钮文字
document.addEventListener('fullscreenchange', function() {
    const btn = document.getElementById('fullscreenBtn');
    if (document.fullscreenElement) {
        btn.textContent = '<—';
    } else {
        btn.textContent = '⛶';
    }
});
}
// 事件处理函数
function handleMusicFolderLoad(e) {
    const files = fileManager.loadMusicFolder(e.target.files);
    if (files.length === 0) {
        alert('没有找到音频文件！支持的格式: MP3, WAV, OGG, FLAC, M4A, AAC, MP4');
        return;
    }
    audioManager.setPlaylist(files);
    ui.updatePlaylistDropdown(files);
    utils.saveFilesToLocal('savedMusicFiles', files);
    // 更新标题
    const title = document.getElementById('title');
    if (title) {
        title.textContent = `🎵${files.length} pieces of music have been loaded`;
        title.classList.remove('scrolling');
        setTimeout(() => {
            title.classList.add('scrolling');
        }, 1000);
    }
    alert(`${files.length} pieces of music have been loaded`);
}

function handleImageFolderLoad(e) {
    const files = fileManager.loadImageFolder(e.target.files);
    if (files.length === 0) {
        alert('没有找到图片文件！支持的格式: JPG, PNG, GIF, WEBP, AVIF, TIFF');
        return;
    }
    fileManager.setBgList(files);
    const bgData = fileManager.changeBg(0);
    ui.updateBgDropdown(files);
    if (bgData) {
        document.getElementById('bgPoster').style.backgroundImage = `url(${bgData.url})`;
    }
    utils.saveFilesToLocal('savedBgFiles', files);
    alert(`Wallpaper loaded`);
}

// 背景下拉菜单选择
function handleBgSelect(e) {
    const idx = parseInt(e.target.value);
    if (isNaN(idx) || idx < 0) return;
    const bgData = fileManager.changeBg(idx);
    if (bgData) {
        document.getElementById('bgPoster').style.backgroundImage = `url(${bgData.url})`;
    }
}
async function handlePlayToggle() {
    await audioManager.initAudioContext();
    const state = audioManager.getAudioState();
    
    if (state.playlistLength === 0) {
        alert('请先点击 "Music Folder" 选择音乐文件夹！');
        return;
    }
    
    if (!audioManager.getAudioElement().src) {
        await audioManager.playSong(0);
        const playlist = audioManager.getPlaylist();
        ui.updateTitle(playlist[0].name);
        ui.updatePlayButton(true);
        ui.toggleTitleScroll(true);
        return;
    }
    
    await audioManager.togglePlay();
    const newState = audioManager.getAudioState();
    ui.updatePlayButton(newState.isPlaying);
    ui.toggleTitleScroll(newState.isPlaying);
}

async function handlePrev() {
    await audioManager.initAudioContext();
    const state = audioManager.getAudioState();
    if (state.playlistLength === 0) return;
    
    // ===== 1. 切换歌曲 =====
    const playMode = audioManager.getPlayMode();
    let songIndex;
    
    if (playMode === 'random') {
        const currentIdx = audioManager.getCurrentIndex();
        const total = state.playlistLength;
        do {
            songIndex = Math.floor(Math.random() * total);
        } while (songIndex === currentIdx && total > 1);
    } else if (playMode === 'loop') {
        return;
    } else {
        songIndex = (state.currentIndex - 1 + state.playlistLength) % state.playlistLength;
    }
    
    await audioManager.playSong(songIndex);
    const playlist = audioManager.getPlaylist();
    
    ui.updateTitle(playlist[songIndex]?.name || 'Music');
    ui.updatePlayButton(true);
    ui.toggleTitleScroll(true);

    // ⭐ 新增：同步更新下拉菜单的选中状态
    document.getElementById('songSelect').value = songIndex;
    
    // ===== 2. 切换背景=====
    const bgList = fileManager.getBgList();
    if (bgList && bgList.length > 0) {
        const bgIndex = Math.floor(Math.random() * bgList.length);
        const bgData = fileManager.changeBg(bgIndex);
        if (bgData) {
            document.getElementById('bgPoster').style.backgroundImage = `url(${bgData.url})`;
            document.getElementById('bgSelect').value = bgData.index;
        }
    }
}

async function handleNext() {
    await audioManager.initAudioContext();
    const state = audioManager.getAudioState();
    if (state.playlistLength === 0) return;
    
    // ===== 1. 切换歌曲 =====
    const playMode = audioManager.getPlayMode();
    let songIndex;
    
    if (playMode === 'random') {
        const currentIdx = audioManager.getCurrentIndex();
        const total = state.playlistLength;
        do {
            songIndex = Math.floor(Math.random() * total);
        } while (songIndex === currentIdx && total > 1);
    } else if (playMode === 'loop') {
        return;
    } else {
        songIndex = (state.currentIndex + 1) % state.playlistLength;
    }
    
    await audioManager.playSong(songIndex);
    const playlist = audioManager.getPlaylist();
    
    ui.updateTitle(playlist[songIndex]?.name || 'Music');
    ui.updatePlayButton(true);
    ui.toggleTitleScroll(true);

        // ⭐ 新增：同步更新下拉菜单的选中状态
    document.getElementById('songSelect').value = songIndex;
    
    // ===== 2. 切换背景（独立随机） =====
    const bgList = fileManager.getBgList();
    if (bgList && bgList.length > 0) {
        const bgIndex = Math.floor(Math.random() * bgList.length);
        const bgData = fileManager.changeBg(bgIndex);
        if (bgData) {
            document.getElementById('bgPoster').style.backgroundImage = `url(${bgData.url})`;
            document.getElementById('bgSelect').value = bgData.index;
        }
    }
}

// 选择歌曲（从下拉菜单）
async function handleSongSelect(e) {
    const idx = parseInt(e.target.value);
    await audioManager.initAudioContext();
    await audioManager.playSong(idx);
    const playlist = audioManager.getPlaylist();
    ui.updateTitle(playlist[idx]?.name || 'Music');
    ui.updatePlayButton(true);
    ui.toggleTitleScroll(true);
    
    // 选歌时背景随机切换
    const bgList = fileManager.getBgList();
    if (bgList && bgList.length > 0) {
        const bgIndex = Math.floor(Math.random() * bgList.length);
        const bgData = fileManager.changeBg(bgIndex);
        if (bgData) {
            document.getElementById('bgPoster').style.backgroundImage = `url(${bgData.url})`;
            document.getElementById('bgSelect').value = bgData.index;
        }
    }
}

function handleCanvasClick(e) {
    const canvas = document.getElementById('visualizerCanvas');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvas.getContext('2d');
    particleSystem.createParticleSplash(ctx, x, y, visualizerStyle);
    particleSystem.createRipple(x, y);
}

function handleAudioEnded() {
    const playMode = audioManager.getPlayMode();
    
    if (playMode === 'loop') {
        // 单曲循环：重新播放当前歌曲
        const currentIndex = audioManager.getCurrentIndex();
        audioManager.playSong(currentIndex);
    } else {
        // 其他模式：下一首
        handleNext();
    }
}

// 渲染循环
function startRenderLoop() {
    function render() {
        // 更新粒子
        particleSystem.updateParticles();
        
        // 绘制可视化
        const canvas = document.getElementById('visualizerCanvas');
        const ctx = canvas.getContext('2d');
        
        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 绘制粒子
        particleSystem.drawParticles(ctx);
        
        // 绘制可视化效果
        visualizer.drawFrame(ctx, visualizerStyle);
        
        requestAnimationFrame(render);
    }
    render();
}

// ============================================
// 启动
// ============================================

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', init);

// 点击页面时恢复音频上下文
document.addEventListener('click', async () => {
    if (audioManager.getAudioContext()?.state === 'suspended') {
        await audioManager.getAudioContext().resume();
    }
});
