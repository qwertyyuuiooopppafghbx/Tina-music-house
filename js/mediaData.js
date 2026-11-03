//从文件导入壁纸
import { IMAGE_DATA } from '../image_data.js';

// 将 Base64 转换为 File 对象
function base64ToFile(base64Data, filename) {
    const arr = base64Data.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
}

// 获取所有图片文件
export function getEmbeddedImages() {
    return IMAGE_DATA.map(item => base64ToFile(item.data, item.name));
}