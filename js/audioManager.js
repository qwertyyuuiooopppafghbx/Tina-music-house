// ============================================
// 音频播放管理（无翻译功能）
// ============================================

let audio = new Audio();
let audioCtx = null;
let analyser = null;
let dataArray = null;
let playlist = [];
let currentIndex = 0;
let playMode = 'sequence';

// 初始化音频上下文
export async function initAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
    }
    return audioCtx;
}

// 获取音频上下文
export function getAudioContext() {
    return audioCtx;
}

// 获取音频元素
export function getAudioElement() {
    return audio;
}

// 初始化音频分析器
export function initAnalyser() {
    if (!audioCtx) return null;
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    const source = audioCtx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    return { analyser, dataArray };
}

// 播放指定索引的歌曲
export async function playSong(idx) {
    if (!playlist[idx]) return false;
    
    audio.pause();
    audio.currentTime = 0;
    
    const file = playlist[idx];
    audio.src = URL.createObjectURL(file);
    
    await initAudioContext();
    if (!analyser) {
        initAnalyser();
    }
    
    await audio.play();
    currentIndex = idx;
    return true;
}

// 播放/暂停切换
export function togglePlay() {
    if (audio.paused) {
        return audio.play();
    } else {
        return audio.pause();
    }
}

// 下一首
export function nextSong() {
    if (playMode === 'random') {
        currentIndex = Math.floor(Math.random() * playlist.length);
    } else if (playMode === 'loop') {
        // 单曲循环：不切换
    } else {
        currentIndex = (currentIndex + 1) % playlist.length;
    }
    return playSong(currentIndex);
}

// 上一首
export function prevSong() {
    if (playMode === 'loop') {
        return playSong(currentIndex);
    }
    currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    return playSong(currentIndex);
}

// 获取播放状态
export function getAudioState() {
    return {
        isPlaying: !audio.paused,
        currentIndex,
        playlistLength: playlist.length,
        currentTime: audio.currentTime,
        duration: audio.duration
    };
}

// 设置播放列表
export function setPlaylist(files) {
    playlist = files;
}

// 获取播放列表
export function getPlaylist() {
    return playlist;
}

// 设置播放模式
export function setPlayMode(mode) {
    playMode = mode;
}

// 获取播放模式
export function getPlayMode() {
    return playMode;
}

// 获取音频分析数据
export function getFrequencyData() {
    if (analyser && dataArray) {
        analyser.getByteFrequencyData(dataArray);
        return dataArray;
    }
    return null;
}

// 音频结束事件
audio.onended = () => {
    document.dispatchEvent(new CustomEvent('audioEnded'));
};
// 获取当前播放索引
export function getCurrentIndex() {
    return currentIndex;
}