import { getProducts, saveProduct, deleteProductApi } from '../modules/api.js';
import { compressImage } from '../modules/utils.js';

let products = [];
const tableBody = document.getElementById('admin-table-body');
const form = document.getElementById('product-form');

export async function initProducts() {
    products = await getProducts();
    if (!Array.isArray(products)) products = [];
    
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
        // sort by newest
        const displayProducts = [...products];
        displayProducts.forEach(product => {
            const tr = document.createElement('tr');
            const priceNum = Number(product.price) || 0;
            const stockStatus = product.stock_status === 'SOLD_OUT' ? '<span style="color:red">품절</span>' : (product.stock_status === 'PRE_ORDER' ? '<span style="color:orange">예약</span>' : '<span style="color:green">판매중</span>');
            tr.innerHTML = `
                <td><img src="${product.img_main || ''}" class="admin-thumbnail" alt="${product.name || 'No Name'}" style="max-width:50px; border-radius:4px;"></td>
                <td><small style="color:#888">${product.sku}</small><br>${product.name || '이름 없음'}</td>
                <td>${product.category || '카테고리 없음'}</td>
                <td>₩${priceNum.toLocaleString()}</td>
                <td>${stockStatus}</td>
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
    if(confirm('정말로 이 상품을 삭제하시겠습니까? (이 작업은 복구할 수 없습니다)')) {
        const res = await deleteProductApi(id);
        if (res.success) {
            products = products.filter(p => String(p.id) !== String(id));
            renderTable();
        } else {
            alert('삭제 실패: ' + res.error);
        }
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
        
        // V2 Schema payload
        const newProduct = {
            name: document.getElementById('product-name').value,
            price: parseFloat(document.getElementById('product-price').value),
            category: document.getElementById('product-category').value,
            sku: document.getElementById('product-sku') ? document.getElementById('product-sku').value : '',
            weight_grams: document.getElementById('product-weight') ? parseInt(document.getElementById('product-weight').value) : 0,
            stock_status: document.getElementById('product-stock-status') ? document.getElementById('product-stock-status').value : 'IN_STOCK',
            description: document.getElementById('editor-product') ? document.getElementById('editor-product').innerHTML : '',
            img: mainImgData, // Map to img_main in backend
            hoverImg: subImagesData[0] || null, // Map to img_hover in backend
            style_tags: document.getElementById('product-style-tags') ? document.getElementById('product-style-tags').value.split(',').map(s=>s.trim()) : []
        };

        const res = await saveProduct(newProduct);
        if (res.success && res.data) {
            products.unshift(res.data);
            renderTable();
            form.reset();
            if (document.getElementById('editor-product')) {
                document.getElementById('editor-product').innerHTML = '';
            }
            alert('상품이 성공적으로 추가되었습니다!');
        } else {
            alert('저장 오류가 발생했습니다: ' + (res.error || '알 수 없는 오류'));
        }
    } catch (error) {
        console.error(error);
        alert('저장 오류가 발생했습니다.');
    }
}
