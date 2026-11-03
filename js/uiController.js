// UI交互控制
import { getDisplayName, saveToLocal, loadFromLocal } from './utils.js';
import { setPlaylist, setPlayMode, playSong, getPlaylist, getAudioState } from './audioManager.js';
import { getBgList, changeBg } from './fileManager.js';

// 切换面板折叠/展开
export function togglePanel() {
    const panel = document.getElementById('topPanel');
    panel.classList.toggle('collapsed');
    const arrow = panel.querySelector('.panel-header span');
    arrow.textContent = panel.classList.contains('collapsed') ? '▼' : '▲';
}

// 切换主题
export function switchTheme() {
    const theme = document.getElementById('theme').value;
    document.body.classList.toggle('light-theme', theme === 'light');
    updateGlobalStyle();
    saveToLocal('activeTheme', theme);
}

// 切换播放模式
export function changePlayMode() {
    const mode = document.getElementById('playMode').value;
    setPlayMode(mode);
    saveToLocal('playMode', mode);
}

// 切换渐变色盘
export function changePalette(paletteKey) {
    document.querySelectorAll('.palette-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(paletteKey).classList.add('active');
    
    const palettes = {
        palette1: { c1: '#F9E5AF', c2: '#86C5CA' },
        palette2: { c1: '#B4CFCB', c2: '#5C4444' },
        palette4: { c1: '#F8BCCB', c2: '#A8D8D7' },
        palette6: { c1: '#d797a8', c2: '#2D2E33' },
        palette8: { c1: '#1B4436', c2: '#8BA758' },
        palette9: { c1: '#468EBA', c2: '#FEC254' },
    };
    
    const palette = palettes[paletteKey];
    if (!palette) return;
    
    const c1Input = document.getElementById('c1');
    const c2Input = document.getElementById('c2');
    c1Input.value = palette.c1;
    c2Input.value = palette.c2;
    
    c1Input.dispatchEvent(new Event('input'));
    c2Input.dispatchEvent(new Event('input'));
    
    saveToLocal('activePalette', paletteKey);
}

// 更新全局样式（毛玻璃效果 + 按钮颜色）
export function updateGlobalStyle() {
    console.log('updateGlobalStyle 被调用了！'); 
    const blur = document.getElementById('blur').value;
    const alpha = parseFloat(document.getElementById('alpha').value);
    const theme = document.getElementById('theme').value;
    const isDark = theme === 'dark';
    
    const bg = isDark ? `rgba(20, 20, 20, ${alpha})` : `rgba(255, 255, 255, ${alpha})`;
    const blurStr = `blur(${blur}px)`;
    const btnBlur = `blur(${blur * 0.5}px)`;
    
    // 标题栏和面板
    const titleBar = document.getElementById('titleBar');
    const topPanel = document.getElementById('topPanel');
    if (titleBar) {
        titleBar.style.background = bg;
        titleBar.style.backdropFilter = blurStr;
    }
    if (topPanel) {
        topPanel.style.background = bg;
        topPanel.style.backdropFilter = blurStr;
    }
    
    // 控制按钮
    const controlBtns = document.querySelectorAll('.control-btn');
    controlBtns.forEach(b => {
        b.style.background = bg;
        b.style.backdropFilter = btnBlur;
        b.style.color = isDark ? '#ffffff' : '#000000';
        b.style.borderColor = isDark ? `rgba(255,255,255,${alpha * 0.5})` : `rgba(0,0,0,${alpha * 0.5})`;
    });
    // 保存设置
    saveToLocal('uiSettings', { blur, alpha, theme });
}

// 更新可视化颜色
export function updateStyle() {
    return {
        color1: document.getElementById('c1').value,
        color2: document.getElementById('c2').value,
        size: parseInt(document.getElementById('size').value),
        type: document.getElementById('visualizerType').value
    };
}

// 更新播放列表下拉菜单
export function updatePlaylistDropdown(playlist) {
    const s = document.getElementById('songSelect');
    if (!s) return;
    s.innerHTML = '';
    if (!playlist || playlist.length === 0) {
        const o = document.createElement('option');
        o.value = '';
        o.textContent = '暂无歌曲';
        s.appendChild(o);
        return;
    }
    playlist.forEach((f, i) => {
        const o = document.createElement('option');
        o.value = i;
        o.textContent = getDisplayName(f.name);
        s.appendChild(o);
    });
}

// 更新背景下拉菜单
export function updateBgDropdown(bgList) {
    const s = document.getElementById('bgSelect');
    if (!s) return;
    s.innerHTML = '';
    if (!bgList || bgList.length === 0) {
        const o = document.createElement('option');
        o.value = '';
        o.textContent = '暂无图片';
        s.appendChild(o);
        return;
    }
    bgList.forEach((f, i) => {
        const o = document.createElement('option');
        o.value = i;
        o.textContent = getDisplayName(f.name);
        s.appendChild(o);
    });
}

// 更新标题
export function updateTitle(name) {
    const title = document.getElementById('title');
    if (title) {
        title.textContent = name ? getDisplayName(name) : 'Music';
    }
}

// 更新播放按钮状态
export function updatePlayButton(isPlaying) {
    const btn = document.getElementById('playBtn');
    if (btn) {
        btn.textContent = isPlaying ? '⏸ Pause' : '▶ Play';
    }
}

// 标题滚动动画
export function toggleTitleScroll(isPlay) {
    const t = document.getElementById('title');
    if (!t) return;
    t.classList.toggle('scrolling', isPlay);
    if (!isPlay) t.style.transform = 'translateX(0)';
}

// 加载保存的设置
export function loadSavedSettings() {
    const ui = loadFromLocal('uiSettings');
    if (ui) {
        const blurInput = document.getElementById('blur');
        const alphaInput = document.getElementById('alpha');
        const themeSelect = document.getElementById('theme');
        if (blurInput) blurInput.value = ui.blur ?? 8;
        if (alphaInput) alphaInput.value = ui.alpha ?? 0.4;
        if (themeSelect) {
            themeSelect.value = ui.theme ?? 'dark';
            switchTheme();
        }
    }
    
    const mode = loadFromLocal('playMode');
    if (mode) {
        const modeSelect = document.getElementById('playMode');
        if (modeSelect) {
            modeSelect.value = mode;
            setPlayMode(mode);
        }
    }
    
    const palette = loadFromLocal('activePalette');
    if (palette) {
        changePalette(palette);
    }
}

// 获取当前可视化样式
export function getVisualizerStyle() {
    return {
        color1: document.getElementById('c1')?.value || '#F9E5AF',
        color2: document.getElementById('c2')?.value || '#86C5CA',
        size: parseInt(document.getElementById('size')?.value || 6),
        type: document.getElementById('visualizerType')?.value || 'line'
    };
}