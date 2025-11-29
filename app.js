// 데이터 관리
class ReflectionApp {
    constructor() {
        this.reflections = this.loadReflections();
        this.init();
    }

    // localStorage에서 데이터 로드
    loadReflections() {
        const stored = localStorage.getItem('reflections');
        return stored ? JSON.parse(stored) : [];
    }

    // localStorage에 데이터 저장
    saveReflections() {
        localStorage.setItem('reflections', JSON.stringify(this.reflections));
    }

    // 새 회고 추가
    addReflection(date, content) {
        const reflection = {
            id: Date.now(),
            date: date,
            content: content,
            actionplans: []
        };
        this.reflections.push(reflection);
        this.saveReflections();
        return reflection;
    }

    // 회고 업데이트
    updateReflection(id, content) {
        const reflection = this.reflections.find(r => r.id === id);
        if (reflection) {
            reflection.content = content;
            this.saveReflections();
            return true;
        }
        return false;
    }

    // 회고 삭제
    deleteReflection(id) {
        this.reflections = this.reflections.filter(r => r.id !== id);
        this.saveReflections();
    }

    // actionplan 추가
    addActionPlan(reflectionId, text) {
        const reflection = this.reflections.find(r => r.id === reflectionId);
        if (reflection && reflection.actionplans.length < 3) {
            const actionplan = {
                id: Date.now(),
                text: text,
                completed: false
            };
            reflection.actionplans.push(actionplan);
            this.saveReflections();
            return actionplan;
        }
        return null;
    }

    // actionplan 업데이트
    updateActionPlan(reflectionId, actionplanId, text) {
        const reflection = this.reflections.find(r => r.id === reflectionId);
        if (reflection) {
            const actionplan = reflection.actionplans.find(a => a.id === actionplanId);
            if (actionplan) {
                actionplan.text = text;
                this.saveReflections();
                return true;
            }
        }
        return false;
    }

    // actionplan 완료 상태 토글
    toggleActionPlan(reflectionId, actionplanId) {
        const reflection = this.reflections.find(r => r.id === reflectionId);
        if (reflection) {
            const actionplan = reflection.actionplans.find(a => a.id === actionplanId);
            if (actionplan) {
                actionplan.completed = !actionplan.completed;
                this.saveReflections();
                return true;
            }
        }
        return false;
    }

    // actionplan 삭제
    deleteActionPlan(reflectionId, actionplanId) {
        const reflection = this.reflections.find(r => r.id === reflectionId);
        if (reflection) {
            reflection.actionplans = reflection.actionplans.filter(a => a.id !== actionplanId);
            this.saveReflections();
            return true;
        }
        return false;
    }

    // 날짜별로 정렬 (최신순)
    getSortedReflections() {
        return [...this.reflections].sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // 초기화
    init() {
        this.renderReflections();
        this.setupEventListeners();
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        const form = document.getElementById('reflectionForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const date = document.getElementById('reflectionDate').value;
            const content = document.getElementById('reflectionContent').value;
            
            if (date && content) {
                this.addReflection(date, content);
                form.reset();
                this.renderReflections();
            }
        });

        // 오늘 날짜를 기본값으로 설정
        const dateInput = document.getElementById('reflectionDate');
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }

    // 회고 목록 렌더링
    renderReflections() {
        const container = document.getElementById('reflectionsContainer');
        const sortedReflections = this.getSortedReflections();

        if (sortedReflections.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>아직 작성된 회고가 없습니다.</p></div>';
            return;
        }

        container.innerHTML = sortedReflections.map(reflection => {
            const dateFormatted = new Date(reflection.date).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const actionplansHTML = this.renderActionPlans(reflection);

            return `
                <div class="reflection-item" data-id="${reflection.id}">
                    <div class="reflection-header">
                        <div class="reflection-date">${dateFormatted}</div>
                        <div class="reflection-actions">
                            <button class="btn btn-secondary btn-small edit-btn">편집</button>
                            <button class="btn btn-danger btn-small delete-btn">삭제</button>
                        </div>
                    </div>
                    <div class="reflection-content">${this.escapeHtml(reflection.content)}</div>
                    <textarea class="reflection-content-edit">${this.escapeHtml(reflection.content)}</textarea>
                    ${actionplansHTML}
                </div>
            `;
        }).join('');

        // 이벤트 리스너 추가
        this.attachReflectionEventListeners();
    }

    // actionplan 렌더링
    renderActionPlans(reflection) {
        const actionplansHTML = reflection.actionplans.map(actionplan => `
            <div class="actionplan-item ${actionplan.completed ? 'completed' : ''}" data-actionplan-id="${actionplan.id}">
                <input type="checkbox" ${actionplan.completed ? 'checked' : ''}>
                <input type="text" value="${this.escapeHtml(actionplan.text)}" readonly>
                <button class="btn btn-danger btn-small btn-remove">삭제</button>
            </div>
        `).join('');

        const canAddMore = reflection.actionplans.length < 3;
        const addButtonHTML = canAddMore ? 
            `<button class="btn btn-secondary btn-small add-actionplan-btn">Action Plan 추가</button>` : 
            `<p style="color: #999; font-size: 0.9rem; margin-top: 10px;">Action Plan은 최대 3개까지 추가할 수 있습니다.</p>`;

        return `
            <div class="actionplans-section">
                <h3>Action Plans</h3>
                <div class="actionplans-list">
                    ${actionplansHTML}
                </div>
                ${addButtonHTML}
            </div>
        `;
    }

    // 회고 관련 이벤트 리스너
    attachReflectionEventListeners() {
        // 삭제 버튼
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const reflectionItem = e.target.closest('.reflection-item');
                const id = parseInt(reflectionItem.dataset.id);
                if (confirm('정말 이 회고를 삭제하시겠습니까?')) {
                    this.deleteReflection(id);
                    this.renderReflections();
                }
            });
        });

        // 편집 버튼
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const reflectionItem = e.target.closest('.reflection-item');
                const id = parseInt(reflectionItem.dataset.id);
                const contentDiv = reflectionItem.querySelector('.reflection-content');
                const contentEdit = reflectionItem.querySelector('.reflection-content-edit');
                const editBtn = reflectionItem.querySelector('.edit-btn');

                if (contentEdit.classList.contains('active')) {
                    // 저장
                    const newContent = contentEdit.value.trim();
                    if (newContent) {
                        this.updateReflection(id, newContent);
                        this.renderReflections();
                    }
                } else {
                    // 편집 모드로 전환
                    contentDiv.classList.add('editing');
                    contentEdit.classList.add('active');
                    editBtn.textContent = '저장';
                }
            });
        });

        // actionplan 관련 이벤트
        this.attachActionPlanEventListeners();
    }

    // actionplan 관련 이벤트 리스너
    attachActionPlanEventListeners() {
        // 체크박스 토글
        document.querySelectorAll('.actionplan-item input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const actionplanItem = e.target.closest('.actionplan-item');
                const reflectionItem = actionplanItem.closest('.reflection-item');
                const reflectionId = parseInt(reflectionItem.dataset.id);
                const actionplanId = parseInt(actionplanItem.dataset.actionplanId);
                
                this.toggleActionPlan(reflectionId, actionplanId);
                this.renderReflections();
            });
        });

        // actionplan 텍스트 편집
        document.querySelectorAll('.actionplan-item input[type="text"]').forEach(input => {
            input.addEventListener('dblclick', (e) => {
                e.target.removeAttribute('readonly');
                e.target.focus();
            });

            input.addEventListener('blur', (e) => {
                const actionplanItem = e.target.closest('.actionplan-item');
                const reflectionItem = actionplanItem.closest('.reflection-item');
                const reflectionId = parseInt(reflectionItem.dataset.id);
                const actionplanId = parseInt(actionplanItem.dataset.actionplanId);
                const newText = e.target.value.trim();

                if (newText) {
                    this.updateActionPlan(reflectionId, actionplanId, newText);
                    e.target.setAttribute('readonly', '');
                } else {
                    this.renderReflections();
                }
            });

            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.target.blur();
                }
            });
        });

        // actionplan 삭제
        document.querySelectorAll('.actionplan-item .btn-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const actionplanItem = e.target.closest('.actionplan-item');
                const reflectionItem = actionplanItem.closest('.reflection-item');
                const reflectionId = parseInt(reflectionItem.dataset.id);
                const actionplanId = parseInt(actionplanItem.dataset.actionplanId);
                
                this.deleteActionPlan(reflectionId, actionplanId);
                this.renderReflections();
            });
        });

        // actionplan 추가 버튼
        document.querySelectorAll('.add-actionplan-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const reflectionItem = e.target.closest('.reflection-item');
                const reflectionId = parseInt(reflectionItem.dataset.id);
                const text = prompt('Action Plan을 입력하세요:');
                
                if (text && text.trim()) {
                    this.addActionPlan(reflectionId, text.trim());
                    this.renderReflections();
                }
            });
        });
    }

    // HTML 이스케이프
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    new ReflectionApp();
});

