import { getProducts, saveProducts } from '../modules/api.js';
import { compressImage } from '../modules/utils.js';

let products = [];
const tableBody = document.getElementById('admin-table-body');
const form = document.getElementById('product-form');

export async function initProducts() {
    products = await getProducts();
    
    window.deleteProduct = deleteProduct;
    
    if (form) {
        form.addEventListener('submit', handleProductSubmit);
    }
    
    renderTable();
}

function renderTable() {
    try {
        if (!tableBody) return;
        tableBody.innerHTML = '';
        if (!Array.isArray(products)) products = [];
        const displayProducts = [...products].reverse();
        displayProducts.forEach(product => {
            const tr = document.createElement('tr');
            const priceNum = Number(product.price) || 0;
            tr.innerHTML = `
                <td><img src="${product.image || ''}" class="admin-thumbnail" alt="${product.name || 'No Name'}" style="max-width:50px; border-radius:4px;"></td>
                <td>${product.name || '이름 없음'}</td>
                <td>${product.category || '카테고리 없음'}</td>
                <td>₩${priceNum.toLocaleString()}</td>
                <td>
                    <button class="btn btn-danger" onclick="deleteProduct('${product.id}')">삭제</button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    } catch(e) {
        console.error("테이블 렌더링 오류:", e);
    }
}

async function deleteProduct(id) {
    if(confirm('정말로 이 상품을 삭제하시겠습니까?')) {
        products = products.filter(p => String(p.id) !== String(id));
        await saveProducts(products);
        renderTable();
    }
}

async function handleProductSubmit(e) {
    e.preventDefault();
    
    const imageFile = document.getElementById('product-image').files[0];
    const subImageFiles = document.getElementById('product-sub-images') ? document.getElementById('product-sub-images').files : [];
    const videoFile = document.getElementById('product-video').files[0];
    
    if (!imageFile) {
        alert('메인 이미지를 선택해주세요.');
        return;
    }

    if (subImageFiles.length > 12) {
        alert('서브 이미지는 최대 12장까지만 등록 가능합니다.');
        return;
    }

    const compressImageAsync = (file) => {
        return new Promise(resolve => {
            compressImage(file, resolve);
        });
    };

    try {
        const mainImgData = await compressImageAsync(imageFile);
        
        const subImagesData = [];
        for (let i = 0; i < subImageFiles.length; i++) {
            const subImgData = await compressImageAsync(subImageFiles[i]);
            subImagesData.push(subImgData);
        }

        let vidData = null;
        if (videoFile) {
            vidData = await new Promise(resolve => {
                const videoReader = new FileReader();
                videoReader.onload = vEvent => resolve(vEvent.target.result);
                videoReader.readAsDataURL(videoFile);
            });
        }

        const newProduct = {
            id: Date.now(),
            name: document.getElementById('product-name').value,
            price: parseFloat(document.getElementById('product-price').value),
            color: document.getElementById('product-color') ? document.getElementById('product-color').value || '#ffffff' : '#ffffff',
            sizes: document.getElementById('product-sizes') ? document.getElementById('product-sizes').value : '',
            description: document.getElementById('editor-product') ? document.getElementById('editor-product').innerHTML : '',
            image: mainImgData,
            subImages: subImagesData,
            video: vidData,
            category: document.getElementById('product-category').value,
            relatedProducts: document.getElementById('product-related') ? document.getElementById('product-related').value : ''
        };

        products.push(newProduct);
        await saveProducts(products);
        renderTable();
        form.reset();
        alert('상품이 성공적으로 추가되었습니다!');
    } catch (error) {
        console.error(error);
        alert('저장 오류가 발생했습니다.');
        if (products.length > 0) {
            products.pop();
        }
    }
}
