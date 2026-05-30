import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDe0AF8qH4mqYjY1oYlkdDduBs0L2pCBXI",
    authDomain: "kors-27aeb.firebaseapp.com",
    projectId: "kors-27aeb",
    storageBucket: "kors-27aeb.firebasestorage.app",
    messagingSenderId: "678840333092",
    appId: "1:678840333092:web:8d53ee70328f6beaaef9b1",
    measurementId: "G-DL1EQDKQHY"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const BUNNY_ENDPOINT = "https://storage.bunnycdn.com/kors/";
const BUNNY_KEY = "8c32cfb1-a6da-43bb-b6afa6d507ea-2500-4c4e";

const loginBtn = document.getElementById('login-submit');
const passwordInput = document.getElementById('login-password');
const loginContainer = document.getElementById('login-container');
const appContainer = document.getElementById('app-container');

loginBtn.addEventListener('click', () => {
    if (passwordInput.value === '0770') {
        loginContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');
        loadVideos();
    }
});

const addVideoBtn = document.getElementById('add-video-btn');
const modalOverlay = document.getElementById('modal-overlay');
const cancelBtn = document.getElementById('cancel-btn');
const saveBtn = document.getElementById('save-btn');

let currentEditId = null;

addVideoBtn.addEventListener('click', () => {
    currentEditId = null;
    document.getElementById('modal-title').innerText = 'إضافة فيديو جديد';
    resetForm();
    modalOverlay.classList.remove('hidden');
});

cancelBtn.addEventListener('click', () => {
    modalOverlay.classList.add('hidden');
});

const imageUpload = document.getElementById('image-upload');
const imagePreview = document.getElementById('image-preview');
const videoUpload = document.getElementById('video-upload');
const videoPreview = document.getElementById('video-preview');

imageUpload.addEventListener('change', (e) => {
    if (e.target.files[0]) {
        const url = URL.createObjectURL(e.target.files[0]);
        imagePreview.src = url;
        imagePreview.classList.remove('hidden');
    }
});

videoUpload.addEventListener('change', (e) => {
    if (e.target.files[0]) {
        const url = URL.createObjectURL(e.target.files[0]);
        videoPreview.src = url;
        videoPreview.classList.remove('hidden');
    }
});

function resetForm() {
    document.getElementById('video-name').value = '';
    imageUpload.value = '';
    videoUpload.value = '';
    imagePreview.classList.add('hidden');
    imagePreview.src = '';
    videoPreview.classList.add('hidden');
    videoPreview.src = '';
    document.getElementById('upload-status').innerText = '';
}

async function uploadToBunny(file, folder) {
    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
    const url = `${BUNNY_ENDPOINT}${folder}/${fileName}`;
    
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'AccessKey': BUNNY_KEY,
            'Content-Type': 'application/octet-stream'
        },
        body: file
    });
    
    if (!response.ok) throw new Error('Upload Error');
    return url; 
}

saveBtn.addEventListener('click', async () => {
    const name = document.getElementById('video-name').value;
    const imgFile = imageUpload.files[0];
    const vidFile = videoUpload.files[0];

    if (!name) return;
    
    const status = document.getElementById('upload-status');
    try {
        saveBtn.disabled = true;
        status.innerText = 'جاري الرفع...';

        let imgUrl = imagePreview.src; 
        let vidUrl = videoPreview.src;

        if (imgFile) {
                status.innerText = 'جاري رفع الصورة...';
                imgUrl = await uploadToBunny(imgFile, 'images');
            } else if (imgUrl && imgUrl.startsWith('blob:')) {
                status.innerText = 'خطأ: الرجاء اختيار صورة مصغرة صالحة.';
                saveBtn.disabled = false;
                return;
            }
            if (vidFile) {
                status.innerText = 'جاري رفع الفيديو...';
                vidUrl = await uploadToBunny(vidFile, 'videos');
            } else if (vidUrl && vidUrl.startsWith('blob:')) {
                status.innerText = 'خطأ: الرجاء اختيار فيديو صالح.';
                saveBtn.disabled = false;
                return;
            }

            status.innerText = 'جاري حفظ البيانات...';

            const videoData = {
                name,
                thumbnail: imgUrl,
                video: vidUrl,
                timestamp: Date.now()
            };

            if (currentEditId) {
                await updateDoc(doc(db, "videos", currentEditId), videoData);
            } else {
                await addDoc(collection(db, "videos"), videoData);
            }

            modalOverlay.classList.add('hidden');
            loadVideos();
        } catch (error) {
            console.error(error);
            status.innerText = 'حدث خطأ في الحفظ!';
        } finally {
            saveBtn.disabled = false;
            if(status.innerText !== 'حدث خطأ في الحفظ!') status.innerText = '';
        }
});

async function loadVideos() {
    const grid = document.getElementById('videos-grid');
    grid.innerHTML = '<p style="text-align:center;">جاري التحميل...</p>';
    
    const querySnapshot = await getDocs(collection(db, "videos"));
    grid.innerHTML = '';
    
    const videosList = [];
    querySnapshot.forEach(docSnap => {
        videosList.push({ id: docSnap.id, ...docSnap.data() });
    });

    videosList.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    
    videosList.forEach((data) => {
        let displayImg = data.thumbnail;
        let displayVid = data.video;

        if (displayImg && displayImg.includes('storage.bunnycdn.com/kors/')) {
            displayImg = displayImg.replace('storage.bunnycdn.com/kors/', 'kores.b-cdn.net/');
        }
        if (displayImg && displayImg.startsWith('blob:')) {
            displayImg = 'https://via.placeholder.com/300x200?text=الصورة+غير+صالحة';
        }

        const card = document.createElement('div');
        card.className = 'video-card';
        card.innerHTML = `
            <img src="${displayImg}" onerror="this.src='https://via.placeholder.com/300x200?text=خطأ'" />
            <div class="card-body">
                <h3 style="font-size:18px;">${data.name}</h3>
            </div>
            <div class="card-actions">
                <button class="edit-btn" data-id="${data.id}" data-name="${data.name}" data-img="${data.thumbnail}" data-vid="${data.video}">تعديل</button>
                <button class="delete-btn" data-id="${data.id}">حذف</button>
            </div>
        `;
        grid.appendChild(card);
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            await deleteDoc(doc(db, "videos", id));
            loadVideos();
        });
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const btnEl = e.target;
            const id = btnEl.getAttribute('data-id');
            currentEditId = id;
            document.getElementById('modal-title').innerText = 'تعديل فيديو';
            resetForm();
            document.getElementById('video-name').value = btnEl.getAttribute('data-name');
            
            const currentImg = btnEl.getAttribute('data-img');
            const currentVid = btnEl.getAttribute('data-vid');
            
            if (currentImg && !currentImg.startsWith('blob:')) {
                imagePreview.src = currentImg;
                imagePreview.classList.remove('hidden');
            }
            if (currentVid && !currentVid.startsWith('blob:')) {
                videoPreview.src = currentVid;
                videoPreview.classList.remove('hidden');
            }
            
            modalOverlay.classList.remove('hidden');
        });
    });
}

// -----------------------------------------------------------------------------
// التنقل بين التبويبات (الكورس / تفعيل المشترك)
const navCourse = document.getElementById('nav-course');
const navUsers = document.getElementById('nav-users');
const courseSection = document.getElementById('course-section');
const usersSection = document.getElementById('users-section');

navCourse.addEventListener('click', () => {
    navCourse.classList.add('active');
    navUsers.classList.remove('active');
    courseSection.classList.remove('hidden');
    usersSection.classList.add('hidden');
});

navUsers.addEventListener('click', () => {
    navUsers.classList.add('active');
    navCourse.classList.remove('active');
    usersSection.classList.remove('hidden');
    courseSection.classList.add('hidden');
    loadUsers(); // جلب المشتركين عند فتح التبويبة
});

// -----------------------------------------------------------------------------
// قسم المشتركين
const addUserBtn = document.getElementById('add-user-btn');
const addUserModal = document.getElementById('add-user-modal');
const cancelUserBtn = document.getElementById('cancel-user-btn');
const saveUserBtn = document.getElementById('save-user-btn');
const newUserId = document.getElementById('new-user-id');
const newUserDate = document.getElementById('new-user-date');

addUserBtn.addEventListener('click', () => {
    newUserId.value = '';
    const now = new Date();
    newUserDate.value = now.toLocaleDateString('ar-EG') + " " + now.toLocaleTimeString('ar-EG');
    addUserModal.classList.remove('hidden');
});

cancelUserBtn.addEventListener('click', () => {
    addUserModal.classList.add('hidden');
});

// إضافة مشترك جديد (تفعيل برو)
saveUserBtn.addEventListener('click', async () => {
    const userIdVal = newUserId.value.trim();
    if(!userIdVal) return;
    
    saveUserBtn.disabled = true;
    try {
        await addDoc(collection(db, "users"), {
            userId: userIdVal,
            timestamp: Date.now(),
            status: 'active'
        });
        addUserModal.classList.add('hidden');
        loadUsers();
    } catch(e) {
        console.error("Error adding user: ", e);
    } finally {
        saveUserBtn.disabled = false;
    }
});

// إدارة وعرض تفاصيل المشتركين
const usersList = document.getElementById('users-list');
const userDetailsModal = document.getElementById('user-details-modal');
const editUserId = document.getElementById('edit-user-id');
const detailUserDate = document.getElementById('detail-user-date');
const detailUserStatus = document.getElementById('detail-user-status');
const closeUserDetailsBtn = document.getElementById('close-user-details-btn');

const updateUserBtn = document.getElementById('update-user-btn');
const freezeUserBtn = document.getElementById('freeze-user-btn');
const deleteUserBtn = document.getElementById('delete-user-btn');

let selectedUserIdDoc = null;
let selectedUserStatus = null;

closeUserDetailsBtn.addEventListener('click', () => userDetailsModal.classList.add('hidden'));

// جلب قائمة المشتركين
async function loadUsers() {
    usersList.innerHTML = '<p style="text-align:center;">جاري تحميل المشتركين...</p>';
    const q = query(collection(db, "users"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    usersList.innerHTML = '';

    snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const card = document.createElement('div');
        card.className = 'user-card';
        const dateStr = new Date(data.timestamp).toLocaleDateString('ar-EG');
        const statusClass = data.status === 'frozen' ? 'status-frozen' : 'status-active';
        const statusText = data.status === 'frozen' ? 'مجمد' : 'نشط';

        card.innerHTML = `
            <div class="user-info">
                <h4>${data.userId}</h4>
                <p>تاريخ الانضمام: ${dateStr}</p>
            </div>
            <div class="status-badge ${statusClass}">${statusText}</div>
        `;
        
        card.addEventListener('click', () => openUserDetails(docSnap.id, data));
        usersList.appendChild(card);
    });
}

// عرض نافذة التفاصيل والأدوات للمستخدم
function openUserDetails(id, data) {
    selectedUserIdDoc = id;
    selectedUserStatus = data.status;
    editUserId.value = data.userId;
    detailUserDate.innerText = new Date(data.timestamp).toLocaleString('ar-EG');
    
    if (data.status === 'frozen') {
        detailUserStatus.innerText = 'حساب مجمد ❄️';
        detailUserStatus.style.color = '#c62828';
        freezeUserBtn.innerText = 'إلغاء التجميد';
        freezeUserBtn.style.background = '#2e7d32'; // لون أخضر للإلغاء
    } else {
        detailUserStatus.innerText = 'حساب نشط ✅';
        detailUserStatus.style.color = '#2e7d32';
        freezeUserBtn.innerText = 'تجميد';
        freezeUserBtn.style.background = '#ff9800'; // لون البرتقالي للتجميد
    }

    userDetailsModal.classList.remove('hidden');
}

// تعديل بيانات المستخدم
updateUserBtn.addEventListener('click', async () => {
    if(!selectedUserIdDoc || !editUserId.value.trim()) return;
    updateUserBtn.disabled = true;
    const oldText = updateUserBtn.innerText;
    updateUserBtn.innerText = 'جاري الحفظ...';
    try {
        await updateDoc(doc(db, "users", selectedUserIdDoc), {
            userId: editUserId.value.trim()
        });
        userDetailsModal.classList.add('hidden');
        loadUsers();
    } catch(e) {
        console.error(e);
    } finally {
        updateUserBtn.disabled = false;
        updateUserBtn.innerText = oldText;
    }
});

// تجميد/إلغاء تجميد المستخدم
freezeUserBtn.addEventListener('click', async () => {
    if(!selectedUserIdDoc) return;
    freezeUserBtn.disabled = true;
    const newStatus = selectedUserStatus === 'frozen' ? 'active' : 'frozen';
    try {
        await updateDoc(doc(db, "users", selectedUserIdDoc), {
            status: newStatus
        });
        userDetailsModal.classList.add('hidden');
        loadUsers();
    } catch(e) {
        console.error(e);
    } finally {
        freezeUserBtn.disabled = false;
    }
});

// حذف المستخدم كليا
let confirmDeleteId = null;
deleteUserBtn.addEventListener('click', async () => {
    if(!selectedUserIdDoc) return;
    
    if (confirmDeleteId !== selectedUserIdDoc) {
        confirmDeleteId = selectedUserIdDoc;
        const ogText = deleteUserBtn.innerText;
        deleteUserBtn.innerText = "تأكيد الحذف؟";
        setTimeout(() => {
            if (confirmDeleteId === selectedUserIdDoc) {
                confirmDeleteId = null;
                deleteUserBtn.innerText = "حذف";
            }
        }, 3000);
        return;
    }
    
    deleteUserBtn.disabled = true;
    try {
        await deleteDoc(doc(db, "users", selectedUserIdDoc));
        userDetailsModal.classList.add('hidden');
        loadUsers();
    } catch(e) {
        console.error(e);
    } finally {
        deleteUserBtn.disabled = false;
        confirmDeleteId = null;
        deleteUserBtn.innerText = "حذف";
    }
});
