// 이미지 유틸리티 모듈

/**
 * 이미지 압축 기능
 * @param {File} file 압축할 이미지 파일
 * @param {Function} callback 압축 완료 후 호출될 콜백 함수 (DataURL 반환)
 */
export function compressImage(file, callback) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = event => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const MAX_WIDTH = 1200;
            const MAX_HEIGHT = 1200;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // WebP 포맷으로 압축하여 품질 0.8로 내보내기
            const dataUrl = canvas.toDataURL('image/webp', 0.8);
            callback(dataUrl);
        };
    };
}
