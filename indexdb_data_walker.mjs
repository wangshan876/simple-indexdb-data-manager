async function getDatabases() {
    if (indexedDB.databases) {
        const databases = await indexedDB.databases();
        return databases.map(db => db.name);
    } else {
        console.log("您的浏览器不支持 indexedDB.databases() 方法。");
        return [];
    }
}

async function getObjectStores(dbName) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName);
        request.onsuccess = function(event) {
            const db = event.target.result;
            const storeNames = Array.from(db.objectStoreNames);
            resolve(storeNames);
        };
        request.onerror = function(event) {
            reject(event.target.errorCode);
        };
    });
}

async function getAllData(dbName, storeName) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName);
        request.onsuccess = function(event) {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(storeName)) {
                reject(`Object store ${storeName} not found in database ${dbName}`);
                return;
            }
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const getAllRequest = store.getAll();

            getAllRequest.onsuccess = function() {
                resolve(getAllRequest.result);
            };
            getAllRequest.onerror = function(event) {
                reject(event.target.errorCode);
            };
        };
        request.onerror = function(event) {
            reject(event.target.errorCode);
        };
    });
}

export async function updateIndexedDBData(dbname, storename, newData) {
    return new Promise((resolve, reject) => {
        // 打开数据库
        const request = indexedDB.open(dbname, 1);

        request.onerror = (event) => {
            reject(`Failed to open database: ${event.target.error}`);
        };

        request.onsuccess = (event) => {
            const db = event.target.result;

            // 检查对象存储是否存在
            if (!db.objectStoreNames.contains(storename)) {
                reject(`Object store ${storename} not found in database ${dbname}`);
                return;
            }

            // 开始一个事务
            const transaction = db.transaction([storename], 'readwrite');
            const objectStore = transaction.objectStore(storename);

            // 遍历 newData 并更新数据
            Object.entries(newData).forEach(([key, value]) => {
                const request = objectStore.put(value); // 不传递键参数

                request.onerror = (event) => {
                    reject(`Failed to update data: ${event.target.error}`);
                };
            });

            transaction.oncomplete = () => {
                resolve(`Data updated successfully in ${dbname} -> ${storename}`);
            };

            transaction.onerror = (event) => {
                reject(`Transaction error: ${event.target.error}`);
            };
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(storename)) {
                db.createObjectStore(storename);
            }
        };
    });
}

export async function getAllIndexedDBData() {
    let allDatas = {};
    const databases = await getDatabases();
    for (const dbName of databases) {
        const storeNames = await getObjectStores(dbName);
        allDatas[dbName] = {};
        for (const storeName of storeNames) {
            const data = await getAllData(dbName, storeName);
            allDatas[dbName][storeName] = data;
        }
    }
    return allDatas;
}