class TodoApp {
    constructor() {
        this.todos = JSON.parse(localStorage.getItem('todos')) || [];
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setDefaultDate();
        this.renderTodos();
        this.updateStats();
        this.addWelcomeMessage();
    }

    setupEventListeners() {
        // 할일 추가 버튼
        document.getElementById('addBtn').addEventListener('click', () => this.addTodo());
        
        // Enter 키로 할일 추가
        document.getElementById('todoInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });

        // 필터 버튼들
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
        });

        // 입력 필드 포커스 효과
        document.getElementById('todoInput').addEventListener('focus', () => {
            this.addPulseEffect();
        });
    }

    addWelcomeMessage() {
        if (this.todos.length === 0) {
            setTimeout(() => {
                this.showNotification('TaskFlow에 오신 것을 환영합니다!', 'success');
            }, 1000);
        }
    }

    addPulseEffect() {
        const input = document.getElementById('todoInput');
        input.style.animation = 'pulse 0.6s ease-in-out';
        setTimeout(() => {
            input.style.animation = '';
        }, 600);
    }

    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('dueDate').value = today;
    }

    addTodo() {
        const input = document.getElementById('todoInput');
        const dueDate = document.getElementById('dueDate').value;
        const priority = document.getElementById('priority').value;
        
        if (!input.value.trim()) {
            this.showNotification('할일을 입력해주세요', 'error');
            return;
        }

        const todo = {
            id: Date.now(),
            text: input.value.trim(),
            completed: false,
            dueDate: dueDate,
            priority: priority,
            important: false,
            createdAt: new Date().toISOString()
        };

        this.todos.unshift(todo);
        this.saveTodos();
        this.renderTodos();
        this.updateStats();
        
        input.value = '';
        this.showNotification('할일이 추가되었습니다', 'success');
        
        // 성공 애니메이션
        this.addSuccessAnimation();
    }

    addSuccessAnimation() {
        const addBtn = document.getElementById('addBtn');
        addBtn.style.transform = 'scale(1.05)';
        setTimeout(() => {
            addBtn.style.transform = '';
        }, 200);
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
            this.renderTodos();
            this.updateStats();
            
            const message = todo.completed ? '할일을 완료했습니다' : '할일을 다시 시작합니다';
            this.showNotification(message, 'success');
        }
    }

    toggleImportance(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.important = !todo.important;
            this.saveTodos();
            this.renderTodos();
            
            const message = todo.important ? '중요한 할일로 표시되었습니다' : '중요 표시가 해제되었습니다';
            this.showNotification(message, 'success');
        }
    }

    editTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;

        const newText = prompt('할일을 수정하세요:', todo.text);
        if (newText !== null && newText.trim() !== '') {
            todo.text = newText.trim();
            this.saveTodos();
            this.renderTodos();
            this.showNotification('할일이 수정되었습니다', 'success');
        }
    }

    deleteTodo(id) {
        if (confirm('정말로 이 할일을 삭제하시겠습니까?')) {
            this.todos = this.todos.filter(t => t.id !== id);
            this.saveTodos();
            this.renderTodos();
            this.updateStats();
            this.showNotification('할일이 삭제되었습니다', 'success');
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // 필터 버튼 활성화 상태 업데이트
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });

        this.renderTodos();
        
        // 필터 변경 알림
        const filterNames = {
            'all': '전체',
            'pending': '진행중',
            'completed': '완료',
            'overdue': '지연',
            'important': '중요'
        };
        this.showNotification(`${filterNames[filter]} 할일을 보여드립니다`, 'info');
    }

    getFilteredTodos() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        switch (this.currentFilter) {
            case 'pending':
                return this.todos.filter(todo => !todo.completed);
            case 'completed':
                return this.todos.filter(todo => todo.completed);
            case 'overdue':
                return this.todos.filter(todo => 
                    !todo.completed && 
                    new Date(todo.dueDate) < today
                );
            case 'important':
                return this.todos.filter(todo => todo.important);
            default:
                return this.todos;
        }
    }

    renderTodos() {
        const todoList = document.getElementById('todoList');
        const emptyState = document.getElementById('emptyState');
        const filteredTodos = this.getFilteredTodos();

        if (filteredTodos.length === 0) {
            todoList.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        todoList.innerHTML = filteredTodos.map(todo => this.createTodoHTML(todo)).join('');
        
        // 새로 추가된 할일에 애니메이션 적용
        this.addStaggerAnimation();
    }

    addStaggerAnimation() {
        const todoItems = document.querySelectorAll('.todo-item');
        todoItems.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(20px)';
            setTimeout(() => {
                item.style.transition = 'all 0.5s ease';
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    createTodoHTML(todo) {
        const isOverdue = !todo.completed && new Date(todo.dueDate) < new Date();
        const dueDate = new Date(todo.dueDate);
        const formattedDate = dueDate.toLocaleDateString('ko-KR', {
            month: 'short',
            day: 'numeric'
        });

        const priorityLabels = {
            low: '낮음',
            medium: '보통',
            high: '높음'
        };

        const statusIcon = todo.completed ? 'fa-check-circle' : isOverdue ? 'fa-exclamation-triangle' : 'fa-clock';

        return `
            <div class="todo-item ${todo.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''} ${todo.priority === 'high' ? 'high-priority' : ''} ${todo.important ? 'important' : ''}">
                <div class="todo-header">
                    <input type="checkbox" 
                           class="todo-checkbox" 
                           ${todo.completed ? 'checked' : ''} 
                           onchange="todoApp.toggleTodo(${todo.id})">
                    <span class="todo-text ${todo.completed ? 'completed' : ''}">
                        <i class="fas ${statusIcon}"></i> ${this.escapeHtml(todo.text)}
                    </span>
                    <button class="importance-toggle ${todo.important ? 'important' : ''}" 
                            onclick="todoApp.toggleImportance(${todo.id})" 
                            title="${todo.important ? '중요 표시 해제' : '중요 표시'}">
                        ${todo.important ? '⭐' : '☆'}
                    </button>
                    <div class="todo-actions">
                        <button class="todo-btn edit-btn" onclick="todoApp.editTodo(${todo.id})" title="수정">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="todo-btn delete-btn" onclick="todoApp.deleteTodo(${todo.id})" title="삭제">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="todo-meta">
                    <span class="todo-priority priority-${todo.priority}">
                        ${priorityLabels[todo.priority]}
                    </span>
                    <div class="todo-due-date">
                        <i class="fas fa-calendar"></i>
                        ${formattedDate}
                        ${isOverdue ? '<span style="color: #ef4444;">(지연)</span>' : ''}
                    </div>
                </div>
            </div>
        `;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    updateStats() {
        const total = this.todos.length;
        const pending = this.todos.filter(t => !t.completed).length;
        const completed = this.todos.filter(t => t.completed).length;

        // 숫자 애니메이션
        this.animateNumber('totalCount', total);
        this.animateNumber('pendingCount', pending);
        this.animateNumber('completedCount', completed);
    }

    animateNumber(elementId, targetValue) {
        const element = document.getElementById(elementId);
        const currentValue = parseInt(element.textContent) || 0;
        const increment = (targetValue - currentValue) / 10;
        let current = currentValue;

        const timer = setInterval(() => {
            current += increment;
            if ((increment > 0 && current >= targetValue) || 
                (increment < 0 && current <= targetValue)) {
                current = targetValue;
                clearInterval(timer);
            }
            element.textContent = Math.round(current);
        }, 50);
    }

    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }

    showNotification(message, type = 'info') {
        // 기존 알림 제거
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => {
            notification.remove();
        });

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span>${message}</span>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 18px 24px;
            border-radius: 16px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            animation: slideIn 0.4s ease;
            background: ${type === 'success' ? 'linear-gradient(135deg, #10b981, #059669)' : 
                        type === 'error' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 
                        'linear-gradient(135deg, #3b82f6, #1d4ed8)'};
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255,255,255,0.2);
            max-width: 400px;
            word-wrap: break-word;
        `;

        document.body.appendChild(notification);

        // 4초 후 자동 제거
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.4s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 400);
        }, 4000);
    }
}

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.02); }
        100% { transform: scale(1); }
    }
    
    .todo-item {
        animation: fadeInUp 0.5s ease forwards;
    }
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);

// 앱 초기화
let todoApp;
document.addEventListener('DOMContentLoaded', () => {
    todoApp = new TodoApp();
});
