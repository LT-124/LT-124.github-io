// Функция для безопасного экранирования HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
const EQUATIONS_SET = [
    {
        text: "3x - 7 = 14",
        correct: 7,
        solutionInfo: "3x = 21 → x = 7"
    },
    {
        text: "x² − 5x + 6 = 0",
        correct: "2,3",
        correctArray: [2, 3],
        solutionInfo: "Дискриминант: 25-24=1, корни: (5±1)/2 = 3 и 2"
    },
    {
        text: "x/2 + x/3 = 10",
        correct: 12,
        solutionInfo: "Приводим к общему знаменателю: 3x+2x=60 → 5x=60 → x=12"
    },
    {
        text: "x² − 9 = 0",
        correct: "-3,3",
        correctArray: [-3, 3],
        solutionInfo: "x² = 9 → x = ±3"
    },
    {
        text: "5(x - 3) = 2x + 9",
        correct: 8,
        solutionInfo: "5x-15=2x+9 → 3x=24 → x=8"
    }
];

// === СОСТОЯНИЕ ПРИЛОЖЕНИЯ ===
let currentIndex = 0;
let userAnswers = [];
let completed = false;

// === ДОМ ЭЛЕМЕНТЫ ===
const questionSection = document.getElementById('questionSection');
const resultsSection = document.getElementById('resultsSection');
const equationDisplay = document.getElementById('equationDisplay');
const answerInput = document.getElementById('answerInput');
const nextButton = document.getElementById('nextButton');
const progressText = document.getElementById('progressText');
const resultsListDiv = document.getElementById('resultsList');
const inputWarning = document.getElementById('inputWarning');
const restartBtn = document.getElementById('restartButton');

// === ПРОВЕРКА СУЩЕСТВОВАНИЯ ЭЛЕМЕНТОВ ===
if (!questionSection || !resultsSection || !equationDisplay || !answerInput || 
    !nextButton || !progressText || !resultsListDiv || !restartBtn) {
    console.error('Ошибка: не найдены необходимые элементы DOM');
}

/**
 * Преобразует строку ответа пользователя в массив чисел
 */
function parseUserAnswer(answerStr) {
    // Проверка на пустую строку
    if (!answerStr || answerStr.trim() === "") {
        return { valid: false, values: [] };
    }
    
    // Убираем лишние пробелы и нормализуем
    let cleaned = answerStr.trim().replace(/\s+/g, ' ');
    
    // Заменяем различные разделители на пробелы
    cleaned = cleaned.replace(/[;,]/g, ' ');
    cleaned = cleaned.replace(/[и,]/g, ' ');
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    // Заменяем запятые на пробелы
    cleaned = cleaned.replace(/,/g, ' ');
    
    // Разбиваем на части
    const parts = cleaned.split(' ').filter(p => p !== "");
    const numbers = [];
    
    for (let part of parts) {
        let num = parseFloat(part);
        
        // Если не число - проверяем дробь
        if (isNaN(num)) {
            if (part.includes('/')) {
                const fraction = part.split('/');
                if (fraction.length === 2) {
                    const numerator = parseFloat(fraction[0]);
                    const denominator = parseFloat(fraction[1]);
                    if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
                        num = numerator / denominator;
                    } else {
                        return { valid: false, values: [] };
                    }
                } else {
                    return { valid: false, values: [] };
                }
            } else {
                return { valid: false, values: [] };
            }
        }
        numbers.push(num);
    }
    
    if (numbers.length === 0) {
        return { valid: false, values: [] };
    }
    
    // Сортируем для сравнения
    numbers.sort((a, b) => a - b);
    return { valid: true, values: numbers };
}

/**
 * Возвращает правильные ответы для вопроса
 */
function getCorrectValuesForIndex(idx) {
    if (idx < 0 || idx >= EQUATIONS_SET.length) {
        return [];
    }
    
    const eq = EQUATIONS_SET[idx];
    if (eq.correctArray && Array.isArray(eq.correctArray)) {
        return [...eq.correctArray].sort((a, b) => a - b);
    } else if (eq.correct !== undefined) {
        let correctVal = (typeof eq.correct === 'number') ? eq.correct : parseFloat(eq.correct);
        return [correctVal];
    }
    return [];
}

/**
 * Проверяет правильность ответа
 */
function isAnswerCorrect(userRaw, idx) {
    const parsed = parseUserAnswer(userRaw);
    if (!parsed.valid) return false;
    
    const userVals = parsed.values;
    const correctVals = getCorrectValuesForIndex(idx);
    
    if (userVals.length !== correctVals.length) return false;
    
    for (let i = 0; i < userVals.length; i++) {
        if (Math.abs(userVals[i] - correctVals[i]) > 0.0001) return false;
    }
    return true;
}

/**
 * Возвращает строку правильного ответа
 */
function getCorrectAnswerString(idx) {
    if (idx < 0 || idx >= EQUATIONS_SET.length) {
        return "ошибка";
    }
    
    const eq = EQUATIONS_SET[idx];
    if (eq.correctArray) {
        return eq.correctArray.join(', ');
    } else if (eq.correct !== undefined) {
        return eq.correct.toString();
    }
    return "неизвестно";
}

/**
 * Отображает текущий вопрос
 */
function renderCurrentQuestion() {
    if (completed) return;
    
    if (currentIndex >= EQUATIONS_SET.length) {
        finishTest();
        return;
    }
    
    const eq = EQUATIONS_SET[currentIndex];
    if (eq && equationDisplay) {
        equationDisplay.innerText = eq.text;
    }
    
    if (answerInput) {
        answerInput.value = '';
    }
    
    if (inputWarning) {
        inputWarning.innerText = '';
    }
    
    if (progressText) {
        progressText.innerText = `Вопрос ${currentIndex + 1} из ${EQUATIONS_SET.length}`;
    }
    
    if (answerInput) {
        answerInput.focus();
    }
}

/**
 * Обработчик кнопки "Продолжить"
 */
function onNext() {
    if (completed) return;
    
    if (currentIndex >= EQUATIONS_SET.length) {
        finishTest();
        return;
    }
    
    if (!answerInput) return;
    
    const userRaw = answerInput.value.trim();
    
    if (userRaw === "") {
        if (inputWarning) {
            inputWarning.innerText = "Введите ответ перед продолжением!";
        }
        return;
    }
    
    userAnswers.push(userRaw);
    currentIndex++;
    
    if (currentIndex === EQUATIONS_SET.length) {
        finishTest();
    } else {
        renderCurrentQuestion();
    }
}

/**
 * Завершает тест и показывает результаты
 */
function finishTest() {
    completed = true;
    
    if (questionSection && resultsSection) {
        questionSection.classList.add('hidden');
        resultsSection.classList.remove('hidden');
    }
    
    if (!resultsListDiv) return;
    
    // Очищаем контейнер результатов
    resultsListDiv.innerHTML = '';
    
    // Все вопросы
    for (let i = 0; i < EQUATIONS_SET.length; i++) {
        const eq = EQUATIONS_SET[i];
        const userAnsRaw = userAnswers[i] || '(нет ответа)';
        const isCorrect = isAnswerCorrect(userAnsRaw, i);
        const correctAnsStr = getCorrectAnswerString(i);
        
        // Элемент результата
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        
        // Уравнение
        const eqSpan = document.createElement('div');
        eqSpan.className = 'result-equation';
        eqSpan.innerText = eq.text;
        
        // Создаем строку с ответами
        const answerRow = document.createElement('div');
        answerRow.className = 'answer-row';
        
        // Ответ пользователя
        const userSpan = document.createElement('div');
        userSpan.className = 'user-answer';
        userSpan.innerHTML = `Ваш ответ: <strong>${escapeHtml(userAnsRaw)}</strong>`;
        
        // Правильный ответ
        const correctSpan = document.createElement('div');
        correctSpan.className = 'correct-answer';
        correctSpan.innerHTML = `Правильный ответ: <strong>${escapeHtml(correctAnsStr)}</strong>`;
        
        answerRow.appendChild(userSpan);
        answerRow.appendChild(correctSpan);
        
        // Подсветка ответа пользователя
        if (isCorrect) {
            userSpan.classList.add('highlight-green');
        } else {
            userSpan.classList.add('highlight-red');
        }
        
        resultItem.appendChild(eqSpan);
        resultItem.appendChild(answerRow);
        
        // Подсказка с решением
        if (eq.solutionInfo) {
            const hintDiv = document.createElement('div');
            hintDiv.style.fontSize = '0.75rem';
            hintDiv.style.marginTop = '10px';
            hintDiv.style.color = '#4a627a';
            hintDiv.innerText = `Решение: ${eq.solutionInfo}`;
            resultItem.appendChild(hintDiv);
        }
        
        // Добавление элемента в контейнер результатов
        resultsListDiv.appendChild(resultItem);
    }
    
    // Подсчитываем количество правильных ответов
    const totalCorrect = userAnswers.reduce((count, ans, idx) => {
        return count + (isAnswerCorrect(ans, idx) ? 1 : 0);
    }, 0);
    
    // Добавляем статистику
    const statsDiv = document.createElement('div');
    statsDiv.style.marginTop = '24px';
    statsDiv.style.padding = '16px 20px';
    statsDiv.style.background = '#eef2fa';
    statsDiv.style.borderRadius = '40px';
    statsDiv.style.textAlign = 'center';
    statsDiv.style.fontWeight = 'bold';
    statsDiv.innerHTML = `Правильных ответов: ${totalCorrect} из ${EQUATIONS_SET.length} (${Math.round((totalCorrect / EQUATIONS_SET.length) * 100)}%)`;
    resultsListDiv.appendChild(statsDiv);
}

/**
 * Перезапуск теста
 */
function restartTest() {
    currentIndex = 0;
    userAnswers = [];
    completed = false;
    
    if (questionSection && resultsSection) {
        questionSection.classList.remove('hidden');
        resultsSection.classList.add('hidden');
    }
    
    if (inputWarning) {
        inputWarning.innerText = '';
    }
    
    if (answerInput) {
        answerInput.value = '';
    }
    
    renderCurrentQuestion();
}

// === ОБРАБОТЧИКИ ===
if (nextButton) {
    nextButton.addEventListener('click', onNext);
}

if (restartBtn) {
    restartBtn.addEventListener('click', restartTest);
}

if (answerInput) {
    answerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            onNext();
        }
    });
}

// === ЗАПУСК ТЕСТА ===
renderCurrentQuestion();