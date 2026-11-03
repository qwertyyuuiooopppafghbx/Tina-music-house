// ============================================
// 文件管理（无翻译功能）
// ============================================

import { loadFilesFromLocal, saveFilesToLocal, getDisplayName } from './utils.js';

let bgList = [];
let bgUrlCache = {};
let currentBgIndex = 0;

// 支持的音频格式
const AUDIO_EXTS = ['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac', '.mp4'];

// 支持的图片格式
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.avif', '.tiff'];

// 加载音乐文件夹
export function loadMusicFolder(files) {
    const audioFiles = Array.from(files).filter(f => {
        const ext = f.name.toLowerCase().slice(f.name.lastIndexOf('.'));
        return AUDIO_EXTS.includes(ext);
    });
    return audioFiles;
}

// 加载图片文件夹
export function loadImageFolder(files) {
    const imageFiles = Array.from(files).filter(f => {
        const ext = f.name.toLowerCase().slice(f.name.lastIndexOf('.'));
        return IMAGE_EXTS.includes(ext) && f.size > 0 && f.size < 50 * 1024 * 1024;
    });
    return imageFiles;
}

// 设置背景图列表
export function setBgList(files) {
    bgList = files;
    bgUrlCache = {};
    currentBgIndex = 0;
}

// 获取背景图列表
export function getBgList() {
    return bgList;
}

// 切换背景图
export function changeBg(idx) {
    if (bgList.length === 0) return null;
    
    currentBgIndex = idx % bgList.length;
    const targetFile = bgList[currentBgIndex];
    
    if (!bgUrlCache[currentBgIndex]) {
        bgUrlCache[currentBgIndex] = URL.createObjectURL(targetFile);
    }
    
    return {
        url: bgUrlCache[currentBgIndex],
        index: currentBgIndex,
        name: getDisplayName(targetFile.name)
    };
}

// 获取当前背景索引
export function getCurrentBgIndex() {
    return currentBgIndex;
}

// 自动加载上次的文件夹
export async function autoLoadLastFolders() {
    const savedMusic = loadFilesFromLocal('savedMusicFiles');
    const savedBg = loadFilesFromLocal('savedBgFiles');
    return { savedMusic, savedBg };
}

// 清理缓存的URL
export function revokeBgUrls() {
    Object.values(bgUrlCache).forEach(url => {
        URL.revokeObjectURL(url);
    });
    bgUrlCache = {};
}

// 获取支持的音乐格式列表
export function getSupportedAudioFormats() {
    return AUDIO_EXTS;
}

// 获取支持的图片格式列表
export function getSupportedImageFormats() {
    return IMAGE_EXTS;
}