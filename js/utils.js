// 获取文件名（去除扩展名）
export function getDisplayName(name) {
    return name.replace(/\.[^/.]+$/, '').trim();
}

// 本地存储
export function saveToLocal(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        // Local-file previews may have browser storage disabled.
    }
}

export function loadFromLocal(key) {
    try {
        return JSON.parse(localStorage.getItem(key));
    } catch(e) {
        return null;
    }
}

// 保存文件列表到本地
export function saveFilesToLocal(key, files) {
    const fileList = [];
    let completed = 0;
    
    return new Promise((resolve) => {
        if (files.length === 0) {
            saveToLocal(key, []);
            resolve();
            return;
        }
        
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = function(e) {
                fileList.push({
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: e.target.result
                });
                completed++;
                if (completed === files.length) {
                    saveToLocal(key, fileList);
                    resolve();
                }
            };
            reader.readAsDataURL(file);
        });
    });
}

// 从本地加载文件列表
export function loadFilesFromLocal(key) {
    const fileList = loadFromLocal(key);
    if (!fileList || fileList.length === 0) return [];
    
    return fileList.map(item => {
        const arr = item.data.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], item.name, { type: mime });
    });
}
