import { getAllIndexedDBData,updateIndexedDBData } from './indexdb_data_walker.mjs';
let indexedDBData ;
let indexdbObject,dataDisplay;
const html = `
    <button id='indexdb-save'>修改</button>
    <div class="tabs">
        <div class="tab">
            <label for="databaseSelect">Select Database:</label>
            <select name="database" id="databaseSelect"></select>
        </div>
        <div class="tab">
            <label for="storenameSelect">Select Storename:</label>
            <select name="storename" id="storenameSelect"></select> 
        </div>  
    </div>
    <pre class="dataDisplay"></pre>
`


// 初始化数据库选择框
function initDatabaseSelect() {
    const databaseSelect = indexdbObject.querySelector('select[name="database"]');
    for (const dbName in indexedDBData) {
        const option = document.createElement('option');
        option.value = dbName;
        option.textContent = dbName;
        databaseSelect.appendChild(option);
    }
}

// 更新对象存储选择框
function updateStoreNames(dbName) {
    const storenameSelect = indexdbObject.querySelector('select[name="storename"]');
    storenameSelect.innerHTML = ''; // 清空之前的选项

    if (dbName && indexedDBData[dbName]) {
        for (const storeName in indexedDBData[dbName]) {
            const option = document.createElement('option');
            option.value = storeName;
            option.textContent = storeName;
            storenameSelect.appendChild(option);
        }
        storenameSelect.firstChild && storenameSelect.firstChild.setAttribute('selected', 'selected');
    
        displayData(storenameSelect.firstChild.value)
    }
}

// 显示数据
function displayData(storeName) {
    const databaseSelect = indexdbObject.querySelector('select[name="database"]');
    const dbName = databaseSelect.value;
    if (dbName && storeName && indexedDBData[dbName] && indexedDBData[dbName][storeName]) {
        const data = indexedDBData[dbName][storeName]
        const keys = Object.keys(data);
        dataDisplay.innerHTML = ''
        keys.forEach(key => {
            if(data[key] instanceof Array){
                dataDisplay.innerHTML += `<div class="item"><label for="${key}">${key}:</label> <textarea id='${key}' >${data[key].join(', ')}</textarea></div>`;
            } else if(typeof data[key] === 'object'){
                let _html = `<div class="item" id="${key}">`;
                const _keys = Object.keys(data[key]);
                for(const _key of _keys){
                    _html += `<div class="subItem"><label for="${_key}">${_key}:</label> <input id='${_key}' value='${data[key][_key]}'></input></div>`;
                }
                _html += '</div>';
                dataDisplay.innerHTML += _html
            } else {
                dataDisplay.innerHTML += `<div  class="item"><label for="${key}">${key}:</label> <input id='${key}' value='${data[key]}'></input></div>`;
            }
        })
        
        
    } else {
        dataDisplay.innerHTML = '';
    }
}

function buildHTML(){

    const indexdbObject = document.querySelector('#indexdb-data-manager');
    indexdbObject.innerHTML = html;
    const database_tab = indexdbObject.querySelector('select[name="database"]')
    const storename_tab = indexdbObject.querySelector('select[name="storename"]')
    database_tab.addEventListener('change', (event) => {
        updateStoreNames(event.target.value);
    })
    storename_tab.addEventListener('change', (event) => {
        displayData(event.target.value);
    })
    return indexdbObject
}

function parsedDatas(){
    const allItems = dataDisplay.querySelectorAll('.item');
    let data = {};
    for (const item of allItems) {
        if(item.querySelector('.subItem')){
            data[item.id] = {}
            item.querySelectorAll('.subItem').forEach(subItem => {
                const key = subItem.querySelector('input').id;
                const value = subItem.querySelector('input').value;
                data[item.id][key] = value;
            })
        } else {
            const key = item.querySelector('input').id;
            const value = item.querySelector('input').value;
            data[key] = value;
        }
    }
    return data
}

function attachEvents() {
    const saveBtn = indexdbObject.querySelector('#indexdb-save')

    
    saveBtn.addEventListener('click', async () => {
        const dbname = indexdbObject.querySelector('select[name="database"]').value;
        const storename = indexdbObject.querySelector('select[name="storename"]').value;
        const newData = parsedDatas();
        console.log("@"+dbname,"@2"+storename,"@3"+newData)
        await updateIndexedDBData(dbname, storename, newData);
    })
}

// 初始化页面


async function app(){
    indexdbObject = buildHTML();
    dataDisplay = document.querySelector('.dataDisplay');
    indexedDBData = await getAllIndexedDBData()
    initDatabaseSelect();
    attachEvents()
    updateStoreNames( indexdbObject.querySelector('select[name="database"]').value);
    displayData(indexdbObject.querySelector('select[name="storename"]').value);
}

app()