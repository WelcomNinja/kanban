// Глобальные переменные
let tasks = JSON.parse(localStorage.getItem('kanbanTasks')) || [];
let editingTaskId = null;

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    renderTasks();
    setupEventListeners();
});

// Настройка обработчиков событий
function setupEventListeners() {
    document.getElementById('taskForm').addEventListener('submit', handleTaskSubmit);
    
    // Закрытие модального окна при клике вне его
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('taskModal');
        if (event.target === modal) {
            closeModal();
        }
    });
}



// Генерация уникального ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Открытие модального окна для добавления задачи
function addTask() {
    editingTaskId = null;
    document.getElementById('modalTitle').textContent = 'Добавить новую задачу';
    document.getElementById('taskForm').reset();
    document.getElementById('taskModal').style.display = 'block';
}

// Открытие модального окна для редактирования задачи
function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    editingTaskId = taskId;
    document.getElementById('modalTitle').textContent = 'Редактировать задачу';
    
    // Заполнение формы данными задачи
    document.getElementById('taskTitle').value = task.title;
    document.getElementById('taskDescription').value = task.description;
    document.getElementById('taskPriority').value = task.priority;
    document.getElementById('taskAssignee').value = task.assignee;
    document.getElementById('taskDeadline').value = task.deadline;
    
    document.getElementById('taskModal').style.display = 'block';
}

// Закрытие модального окна
function closeModal() {
    document.getElementById('taskModal').style.display = 'none';
    editingTaskId = null;
}

// Обработка отправки формы
function handleTaskSubmit(event) {
    event.preventDefault();
    
    const formData = {
        title: document.getElementById('taskTitle').value.trim(),
        description: document.getElementById('taskDescription').value.trim(),
        priority: document.getElementById('taskPriority').value,
        assignee: document.getElementById('taskAssignee').value.trim(),
        deadline: document.getElementById('taskDeadline').value,
        status: 'todo'
    };
    
    if (editingTaskId) {
        // Редактирование существующей задачи
        const taskIndex = tasks.findIndex(t => t.id === editingTaskId);
        if (taskIndex !== -1) {
            tasks[taskIndex] = { ...tasks[taskIndex], ...formData };
        }
    } else {
        // Создание новой задачи
        const newTask = {
            ...formData,
            id: generateId(),
            createdAt: new Date().toISOString()
        };
        tasks.push(newTask);
    }
    
    saveTasks();
    renderTasks();
    closeModal();
}

// Удаление задачи
function deleteTask(taskId) {
    if (confirm('Вы уверены, что хотите удалить эту задачу?')) {
        tasks = tasks.filter(t => t.id !== taskId);
        saveTasks();
        renderTasks();
    }
}

// Очистка выполненных задач
function clearCompleted() {
    const completedTasks = tasks.filter(t => t.status === 'done');
    if (completedTasks.length === 0) {
        alert('Нет выполненных задач для очистки');
        return;
    }
    
    if (confirm(`Удалить ${completedTasks.length} выполненных задач?`)) {
        tasks = tasks.filter(t => t.status !== 'done');
        saveTasks();
        renderTasks();
    }
}

// Сохранение задач в localStorage
function saveTasks() {
    localStorage.setItem('kanbanTasks', JSON.stringify(tasks));
}

// Отрисовка всех задач
function renderTasks() {
    const columns = document.querySelectorAll('.column');
    
    columns.forEach(column => {
        const status = column.dataset.status;
        const taskList = column.querySelector('.task-list');
        const taskCount = column.querySelector('.task-count');
        
        const columnTasks = tasks.filter(t => t.status === status);
        taskCount.textContent = columnTasks.length;
        
        taskList.innerHTML = '';
        
        columnTasks.forEach(task => {
            const taskElement = createTaskElement(task);
            taskList.appendChild(taskElement);
        });
    });
}

// Создание элемента задачи
function createTaskElement(task) {
    const taskDiv = document.createElement('div');
    taskDiv.className = 'task';
    taskDiv.draggable = true;
    taskDiv.dataset.taskId = task.id;
    
    const priorityClass = `priority-${task.priority}`;
    const priorityText = {
        'high': 'Высокий',
        'medium': 'Средний',
        'low': 'Низкий'
    }[task.priority];
    
    taskDiv.innerHTML = `
        <div class="task-header">
            <div class="task-title">${escapeHtml(task.title)}</div>
            <div class="task-actions">
                <button onclick="editTask('${task.id}')" title="Редактировать">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteTask('${task.id}')" title="Удалить">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
        <div class="task-meta">
            <span class="task-priority ${priorityClass}">${priorityText}</span>
            ${task.assignee ? `<span class="task-assignee">👤 ${escapeHtml(task.assignee)}</span>` : ''}
            ${task.deadline ? `<span class="task-deadline">📅 ${formatDate(task.deadline)}</span>` : ''}
        </div>
    `;
    
    // Добавление обработчиков drag and drop
    taskDiv.addEventListener('dragstart', handleDragStart);
    taskDiv.addEventListener('dragend', handleDragEnd);
    
    return taskDiv;
}

// Обработчики drag and drop
function handleDragStart(event) {
    event.target.classList.add('dragging');
    event.dataTransfer.setData('text/plain', event.target.dataset.taskId);
}

function handleDragEnd(event) {
    event.target.classList.remove('dragging');
}

function allowDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.add('drag-over');
}

function drop(event) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData('text/plain');
    const newStatus = event.currentTarget.closest('.column').dataset.status;
    
    // Обновление статуса задачи
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
        tasks[taskIndex].status = newStatus;
        saveTasks();
        renderTasks();
    }
    
    // Удаление стилей drag over
    document.querySelectorAll('.task-list').forEach(list => {
        list.classList.remove('drag-over');
    });
}

// Вспомогательные функции
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
}

// Добавление обработчиков для drag over
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.task-list').forEach(list => {
        list.addEventListener('dragover', allowDrop);
        list.addEventListener('dragleave', function(event) {
            if (!event.currentTarget.contains(event.relatedTarget)) {
                event.currentTarget.classList.remove('drag-over');
            }
        });
    });
});

// Экспорт задач в JSON
function exportTasksJSON() {
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'welcomebord-tasks.json';
    link.click();
    
    URL.revokeObjectURL(url);
}

// Экспорт задач в XLSX
function exportTasksXLSX() {
    // Подготовка данных для Excel
    const excelData = tasks.map(task => ({
        'Название': task.title,
        'Описание': task.description || '',
        'Статус': getStatusText(task.status),
        'Приоритет': getPriorityText(task.priority),
        'Исполнитель': task.assignee || '',
        'Дедлайн': task.deadline ? formatDate(task.deadline) : '',
        'Дата создания': formatDate(task.createdAt)
    }));
    
    // Создание рабочей книги
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    // Настройка ширины колонок
    const colWidths = [
        { wch: 30 }, // Название
        { wch: 40 }, // Описание
        { wch: 15 }, // Статус
        { wch: 12 }, // Приоритет
        { wch: 20 }, // Исполнитель
        { wch: 15 }, // Дедлайн
        { wch: 15 }  // Дата создания
    ];
    ws['!cols'] = colWidths;
    
    // Добавление листа в книгу
    XLSX.utils.book_append_sheet(wb, ws, 'Задачи');
    
    // Экспорт файла
    XLSX.writeFile(wb, 'welcomebord-tasks.xlsx');
}

// Экспорт задач в CSV
function exportTasksCSV() {
    // Заголовки CSV
    const headers = ['Название', 'Описание', 'Статус', 'Приоритет', 'Исполнитель', 'Дедлайн', 'Дата создания'];
    
    // Данные для CSV
    const csvData = tasks.map(task => [
        `"${task.title.replace(/"/g, '""')}"`,
        `"${(task.description || '').replace(/"/g, '""')}"`,
        `"${getStatusText(task.status)}"`,
        `"${getPriorityText(task.priority)}"`,
        `"${(task.assignee || '').replace(/"/g, '""')}"`,
        `"${task.deadline ? formatDate(task.deadline) : ''}"`,
        `"${formatDate(task.createdAt)}"`
    ]);
    
    // Объединение заголовков и данных
    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    
    // Создание и скачивание файла
    const dataBlob = new Blob(['\ufeff' + csvContent], {type: 'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'welcomebord-tasks.csv';
    link.click();
    
    URL.revokeObjectURL(url);
}

// Вспомогательные функции для экспорта
function getStatusText(status) {
    const statusMap = {
        'todo': 'К выполнению',
        'in-progress': 'В работе',
        'review': 'На проверке',
        'done': 'Выполнено'
    };
    return statusMap[status] || status;
}

function getPriorityText(priority) {
    const priorityMap = {
        'high': 'Высокий',
        'medium': 'Средний',
        'low': 'Низкий'
    };
    return priorityMap[priority] || priority;
}

// Импорт задач
function importTasks() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const importedTasks = JSON.parse(e.target.result);
                    if (Array.isArray(importedTasks)) {
                        tasks = importedTasks;
                        saveTasks();
                        renderTasks();
                        alert('Задачи успешно импортированы!');
                    } else {
                        alert('Неверный формат файла');
                    }
                } catch (error) {
                    alert('Ошибка при чтении файла');
                }
            };
            reader.readAsText(file);
        }
    };
    
    input.click();
}

// Добавление кнопок экспорта/импорта в интерфейс
document.addEventListener('DOMContentLoaded', function() {
    const controls = document.querySelector('.controls');
    
    // Создаем контейнер для кнопок экспорта
    const exportContainer = document.createElement('div');
    exportContainer.className = 'export-container';
    
    // Кнопка экспорта в JSON
    const exportJSONBtn = document.createElement('button');
    exportJSONBtn.className = 'btn btn-secondary';
    exportJSONBtn.innerHTML = '<i class="fas fa-file-code"></i> JSON';
    exportJSONBtn.onclick = exportTasksJSON;
    
    // Кнопка экспорта в XLSX
    const exportXLSXBtn = document.createElement('button');
    exportXLSXBtn.className = 'btn btn-secondary';
    exportXLSXBtn.innerHTML = '<i class="fas fa-file-excel"></i> Excel';
    exportXLSXBtn.onclick = exportTasksXLSX;
    
    // Кнопка экспорта в CSV
    const exportCSVBtn = document.createElement('button');
    exportCSVBtn.className = 'btn btn-secondary';
    exportCSVBtn.innerHTML = '<i class="fas fa-file-csv"></i> CSV';
    exportCSVBtn.onclick = exportTasksCSV;
    
    // Кнопка импорта
    const importBtn = document.createElement('button');
    importBtn.className = 'btn btn-secondary';
    importBtn.innerHTML = '<i class="fas fa-upload"></i> Импорт';
    importBtn.onclick = importTasks;
    
    // Добавляем кнопки в контейнер
    exportContainer.appendChild(exportJSONBtn);
    exportContainer.appendChild(exportXLSXBtn);
    exportContainer.appendChild(exportCSVBtn);
    
    // Добавляем контейнеры в controls
    controls.appendChild(exportContainer);
    controls.appendChild(importBtn);
});

// Автосохранение каждые 30 секунд
setInterval(saveTasks, 30000);

// Уведомления о приближающихся дедлайнах
function checkDeadlines() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const urgentTasks = tasks.filter(task => {
        if (!task.deadline || task.status === 'done') return false;
        const deadline = new Date(task.deadline);
        return deadline <= tomorrow && deadline >= today;
    });
    
    if (urgentTasks.length > 0) {
        const taskNames = urgentTasks.map(t => t.title).join(', ');
        if (Notification.permission === 'granted') {
            new Notification('WelcomeBord', {
                body: `Срочные задачи: ${taskNames}`,
                icon: '/favicon.ico'
            });
        }
    }
}

// Проверка дедлайнов каждые 10 минут
setInterval(checkDeadlines, 600000);

// Запрос разрешения на уведомления
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}
