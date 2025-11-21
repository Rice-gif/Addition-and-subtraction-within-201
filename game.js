// 游戏状态和变量
const gameState = {
    difficulty: 'easy', // 默认为简单模式
    currentQuestion: 0,
    totalQuestions: 20,
    appleCount: 0,
    timeoutCount: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    currentMathQuestion: null,
    correctAnswer: 0,
    timeLimit: 10, // 默认10秒
    timer: null,
    remainingTime: 10,
    isPaused: false,
    gameOver: false,
    applePositions: [], // 存储苹果位置，避免重叠
    caterpillarPosition: { x: 0, y: 0 } // 毛毛虫位置
};

// DOM元素引用
const elements = {
    startScreen: document.getElementById('start-screen'),
    gameScreen: document.getElementById('game-screen'),
    endScreen: document.getElementById('end-screen'),
    pauseScreen: document.getElementById('pause-screen'),
    gameTitle: document.querySelector('.game-title'),
    questionElement: document.getElementById('question'),
    questionArea: document.querySelector('.question-area'),
    answerInput: document.getElementById('answer'),
    submitButton: document.getElementById('submit-answer'),
    messageElement: document.getElementById('message'),
    appleCountElement: document.getElementById('apple-count'),
    timeLeftElement: document.getElementById('time-left'),
    currentQuestionElement: document.getElementById('current-question'),
    timeoutCountElement: document.getElementById('timeout-count'),
    applesContainer: document.getElementById('apples-container'),
    caterpillarContainer: document.getElementById('caterpillar-container'),
    easyModeButton: document.getElementById('easy-mode'),
    hardModeButton: document.getElementById('hard-mode'),
    pauseButton: document.getElementById('pause-game'),
    restartButton: document.getElementById('restart-game'),
    resumeButton: document.getElementById('resume-game'),
    quitButton: document.getElementById('quit-game'),
    playAgainButton: document.getElementById('play-again'),
    gameResultElement: document.getElementById('game-result'),
    correctAnswersElement: document.getElementById('correct-answers'),
    wrongAnswersElement: document.getElementById('wrong-answers'),
    totalTimeoutsElement: document.getElementById('total-timeouts'),
    finalApplesElement: document.getElementById('final-apples')
};

// 生成20以内的加减法题目
function generateQuestion() {
    // 随机选择加法或减法
    const operation = Math.random() < 0.5 ? '+' : '-';
    let num1, num2, answer;
    
    if (operation === '+') {
        // 加法：确保结果不超过20
        num1 = Math.floor(Math.random() * 15) + 1; // 1-15
        num2 = Math.floor(Math.random() * (21 - num1)) + 1; // 确保 num1 + num2 <= 20
        answer = num1 + num2;
    } else {
        // 减法：确保结果非负
        num1 = Math.floor(Math.random() * 15) + 5; // 5-20
        num2 = Math.floor(Math.random() * num1) + 1; // 1-num1
        answer = num1 - num2;
    }
    
    return {
        question: `${num1} ${operation} ${num2} = ?`,
        answer: answer
    };
}

// 显示新题目
function displayNewQuestion() {
    const { question, answer } = generateQuestion();
    gameState.currentMathQuestion = question;
    gameState.correctAnswer = answer;
    gameState.currentQuestion++;
    
    elements.questionElement.textContent = question;
    elements.currentQuestionElement.textContent = gameState.currentQuestion;
    elements.answerInput.value = '';
    elements.answerInput.focus();
    
    // 重置消息区域
    elements.messageElement.textContent = '';
    elements.messageElement.className = 'message-area';
    
    // 重置计时器
    resetTimer();
}

// 重置计时器
function resetTimer() {
    clearInterval(gameState.timer);
    gameState.remainingTime = gameState.timeLimit;
    elements.timeLeftElement.textContent = gameState.remainingTime;
    
    // 根据剩余时间改变颜色，增加视觉提示
    if (gameState.remainingTime <= 3) {
        elements.timeLeftElement.style.color = '#ff3b30';
    } else {
        elements.timeLeftElement.style.color = '#ff6b6b';
    }
    
    // 启动计时器
    startTimer();
}

// 启动计时器
function startTimer() {
    if (gameState.isPaused || gameState.gameOver) return;
    
    gameState.timer = setInterval(() => {
        if (gameState.isPaused) return;
        
        gameState.remainingTime--;
        elements.timeLeftElement.textContent = gameState.remainingTime;
        
        // 根据剩余时间改变颜色，增加视觉提示
        if (gameState.remainingTime <= 3) {
            elements.timeLeftElement.style.color = '#ff3b30';
            // 最后3秒闪烁效果
            elements.timeLeftElement.style.animation = 'none';
            elements.timeLeftElement.offsetHeight; // 触发重排
            elements.timeLeftElement.style.animation = 'blink 0.5s infinite';
        }
        
        // 超时处理
        if (gameState.remainingTime <= 0) {
            handleTimeout();
        }
    }, 1000);
}

// 处理超时
function handleTimeout() {
    clearInterval(gameState.timer);
    gameState.timeoutCount++;
    elements.timeoutCountElement.textContent = gameState.timeoutCount;
    
    // 显示超时消息
    elements.messageElement.textContent = '抱歉，超时了。';
    elements.messageElement.className = 'message-area message-timeout';
    
    // 添加超时闪烁效果
    elements.timeLeftElement.style.animation = 'pulse 0.5s ease-in-out 3';
    
    // 播放超时音效（如果支持）
    playSound('timeout');

    
    // 检查是否达到5次超时
    if (gameState.timeoutCount == 5) {
        endGame('timeout');
        return;
    }
    
    // 延迟显示下一题
    setTimeout(() => {
        if (gameState.currentQuestion < gameState.totalQuestions) {
            displayNewQuestion();
        } else {
            endGame('completed');
        }
    }, 2000);
}

// 处理答案提交
function handleAnswerSubmit() {
    const userAnswer = parseInt(elements.answerInput.value);
    
    // 验证输入
    if (isNaN(userAnswer)) {
        elements.messageElement.textContent = '请输入有效数字！';
        elements.messageElement.className = 'message-area message-wrong';
        elements.answerInput.value = '';
        elements.answerInput.focus();
        return;
    }
    
    // 停止计时器
    clearInterval(gameState.timer);
    
    if (userAnswer == gameState.correctAnswer) {
        handleCorrectAnswer();
    } else {
        handleWrongAnswer();
    }
}

// 处理正确答案
function handleCorrectAnswer() {
    gameState.appleCount++;
    gameState.correctAnswers++;
    elements.appleCountElement.textContent = gameState.appleCount;
    
    // 显示正确消息
    elements.messageElement.textContent = '小树结出了一个苹果！';
    elements.messageElement.className = 'message-area message-correct';
    
    // 添加苹果出现的动画效果
    elements.questionArea.style.animation = 'celebrate 0.5s ease-in-out';
    setTimeout(() => {
        elements.questionArea.style.animation = 'none';
    }, 500);
    
    // 添加苹果到树上
    addApple();
    
    // 播放成功音效（如果支持）
    playSound('success');

    
    // 延迟显示下一题
    setTimeout(() => {
        if (gameState.currentQuestion < gameState.totalQuestions) {
            displayNewQuestion();
        } else {
            endGame('completed');
        }
    }, 2000);
}

// 处理错误答案
function handleWrongAnswer() {
    gameState.wrongAnswers++;
    
    // 显示错误消息
    elements.messageElement.textContent = '抱歉，毛毛虫吃掉了一个苹果！';
    elements.messageElement.className = 'message-area message-wrong';
    
    // 添加错误抖动效果
    elements.questionArea.style.animation = 'shake 0.5s ease-in-out';
    setTimeout(() => {
        elements.questionArea.style.animation = 'none';
    }, 500);
    
    // 播放错误音效（如果支持）
    playSound('error');

    
    // 如果有苹果，移除一个苹果
    if (gameState.appleCount > 0) {
        gameState.appleCount--;
        elements.appleCountElement.textContent = gameState.appleCount;
        removeApple();
        
        // 显示毛毛虫吃苹果的动画
        showCaterpillar();
    }
    
    // 检查游戏是否失败（苹果被吃光）
    if (gameState.appleCount == 0) {
        endGame('caterpillar');
        return;
    }
    
    // 延迟显示下一题
    setTimeout(() => {
        if (gameState.currentQuestion < gameState.totalQuestions) {
            displayNewQuestion();
        } else {
            endGame('completed');
        }
    }, 2000);
}

// 添加苹果到树上
function addApple() {
    const apple = document.createElement('div');
    apple.className = 'apple';
    
    // 生成不重叠的随机位置
    let x, y, isOverlapping;
    do {
        isOverlapping = false;
        x = Math.floor(Math.random() * 220) + 40; // 避免超出树冠边界
        y = Math.floor(Math.random() * 220) + 40;
        
        // 检查是否与现有苹果重叠
        for (const pos of gameState.applePositions) {
            const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
            if (distance < 50) { // 50px的最小距离
                isOverlapping = true;
                break;
            }
        }
    } while (isOverlapping);
    
    gameState.applePositions.push({ x, y });
    
    // 随机苹果大小，增加趣味性
    const size = Math.floor(Math.random() * 8) + 36; // 36-44px
    apple.style.width = `${size}px`;
    apple.style.height = `${size}px`;
    
    // 随机苹果颜色变化
    const redness = Math.floor(Math.random() * 30) + 225; // 225-255
    apple.style.backgroundColor = `rgb(${redness}, 59, 48)`;
    
    apple.style.left = `${x}px`;
    apple.style.top = `${y}px`;
    
    // 添加轻微的摇摆动画
    apple.style.animation = 'appleGrow 0.5s ease-out, appleWiggle 3s ease-in-out infinite';
    
    elements.applesContainer.appendChild(apple);
}

// 移除一个苹果（被毛毛虫吃掉的动画）
function removeApple() {
    const apples = elements.applesContainer.querySelectorAll('.apple');
    if (apples.length > 0) {
        // 移除最后添加的苹果
        const appleToRemove = apples[apples.length - 1];
        
        // 被吃掉的动画 - 先缩小然后旋转
        appleToRemove.style.transition = 'all 0.7s ease';
        appleToRemove.style.transform = 'scale(0) rotate(180deg)';
        appleToRemove.style.opacity = '0';
        
        setTimeout(() => {
            elements.applesContainer.removeChild(appleToRemove);
            gameState.applePositions.pop();
        }, 700);
    }
}

// 显示毛毛虫
function showCaterpillar() {
    // 清除现有的毛毛虫
    elements.caterpillarContainer.innerHTML = '';
    
    const caterpillar = document.createElement('div');
    caterpillar.className = 'caterpillar';
    
    // 创建头部
    const head = document.createElement('div');
    head.className = 'caterpillar-head';
    caterpillar.appendChild(head);
    
    // 创建身体段 - 修复循环问题
    for (let i = 0; i < 3; i++) {
        const body = document.createElement('div');
        body.className = 'caterpillar-body';
        // 给每个身体段不同的颜色变化
        body.style.backgroundColor = `rgb(139, ${195 + i*20}, 74)`;
        caterpillar.appendChild(body);
    }
    
    // 放置在最近移除的苹果位置
    if (gameState.applePositions.length > 0) {
        const lastPos = gameState.applePositions[gameState.applePositions.length - 1];
        caterpillar.style.left = `${lastPos.x - 30}px`;
        caterpillar.style.top = `${lastPos.y - 10}px`;
    } else {
        // 默认位置
        caterpillar.style.left = '120px';
        caterpillar.style.top = '150px';
    }
    
    elements.caterpillarContainer.appendChild(caterpillar);
    
    // 3秒后移除毛毛虫
    setTimeout(() => {
        caterpillar.style.transition = 'opacity 0.5s';
        caterpillar.style.opacity = '0';
        setTimeout(() => {
            elements.caterpillarContainer.innerHTML = '';
        }, 500);
    }, 3000);
}

// 开始游戏
function startGame(difficulty) {
    // 重置游戏状态
    resetGame();
    gameState.difficulty = difficulty;
    gameState.timeLimit = difficulty == 'easy' ? 10 : 5;
    
    // 切换屏幕
    elements.startScreen.classList.add('hidden');
    elements.gameScreen.classList.remove('hidden');
    
    // 显示第一题
    displayNewQuestion();
}

// 暂停游戏
function pauseGame() {
    gameState.isPaused = true;
    clearInterval(gameState.timer);
    elements.pauseScreen.classList.remove('hidden');
}

// 恢复游戏
function resumeGame() {
    // 确保先清除任何可能存在的计时器
    clearInterval(gameState.timer);
    
    // 设置游戏状态为非暂停
    gameState.isPaused = false;
    
    // 隐藏暂停屏幕
    elements.pauseScreen.classList.add('hidden');
    
    // 重新启动计时器
    startTimer();
    
    // 添加视觉反馈，表示游戏已恢复
    elements.messageElement.textContent = '游戏继续！';
    elements.messageElement.className = 'message-area message-info';
    setTimeout(() => {
        elements.messageElement.textContent = '';
        elements.messageElement.className = 'message-area';
    }, 1500);
}

// 结束游戏
function endGame(reason) {
    gameState.gameOver = true;
    clearInterval(gameState.timer);
    
    // 显示结束屏幕
    elements.gameScreen.classList.add('hidden');
    elements.endScreen.classList.remove('hidden');
    
    // 根据结束原因显示不同的结果消息
    let resultMessage;
    switch (reason) {
        case 'caterpillar':
            resultMessage = '游戏失败！毛毛虫吃光了所有苹果！';
            break;
        case 'timeout':
            resultMessage = '游戏失败！超时次数过多！';
            break;
        case 'completed':
            resultMessage = '恭喜你完成了所有题目！';
            break;
        default:
            resultMessage = '游戏结束！';
    }
    
    // 更新统计信息
    elements.gameResultElement.textContent = resultMessage;
    elements.correctAnswersElement.textContent = gameState.correctAnswers;
    elements.wrongAnswersElement.textContent = gameState.wrongAnswers;
    elements.totalTimeoutsElement.textContent = gameState.timeoutCount;
    elements.finalApplesElement.textContent = gameState.appleCount;
}

// 重置游戏
function resetGame() {
    gameState.currentQuestion = 0;
    gameState.appleCount = 0;
    gameState.timeoutCount = 0;
    gameState.correctAnswers = 0;
    gameState.wrongAnswers = 0;
    gameState.currentMathQuestion = null;
    gameState.correctAnswer = 0;
    gameState.remainingTime = gameState.timeLimit;
    gameState.isPaused = false;
    gameState.gameOver = false;
    gameState.applePositions = [];
    
    // 清空DOM
    elements.applesContainer.innerHTML = '';
    elements.caterpillarContainer.innerHTML = '';
    elements.messageElement.textContent = '';
    elements.messageElement.className = 'message-area';
    
    // 重置UI元素
    elements.appleCountElement.textContent = '0';
    elements.timeLeftElement.textContent = gameState.timeLimit;
    elements.currentQuestionElement.textContent = '0';
    elements.timeoutCountElement.textContent = '0';
    elements.timeLeftElement.style.color = '#ff6b6b';
    elements.timeLeftElement.style.animation = 'none';
}

// 返回主菜单
function returnToMainMenu() {
    elements.gameScreen.classList.add('hidden');
    elements.endScreen.classList.add('hidden');
    elements.pauseScreen.classList.add('hidden');
    elements.startScreen.classList.remove('hidden');
    resetGame();
}

// 事件监听器
function setupEventListeners() {
    // 难度选择
    elements.easyModeButton.addEventListener('click', () => startGame('easy'));
    elements.hardModeButton.addEventListener('click', () => startGame('hard'));
    
    // 提交答案
    elements.submitButton.addEventListener('click', handleAnswerSubmit);
    elements.answerInput.addEventListener('keypress', (e) => {
        if (e.key == 'Enter') {
            handleAnswerSubmit();
        }
    });
    
    // 游戏控制
    elements.pauseButton.addEventListener('click', pauseGame);
    elements.restartButton.addEventListener('click', () => {
        if (confirm('确定要重新开始游戏吗？')) {
            startGame(gameState.difficulty);
        }
    });
    
    // 暂停屏幕控制
    elements.resumeButton.addEventListener('click', resumeGame);
    elements.quitButton.addEventListener('click', returnToMainMenu);
    
    // 再玩一次
    elements.playAgainButton.addEventListener('click', returnToMainMenu);
}

// 播放音效（简单的音效模拟）
function playSound(type) {
    try {
        // 使用Web Audio API创建简单音效
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // 根据类型设置不同的音效参数
        switch (type) {
            case 'success':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.3);
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.3);
                break;
            case 'error':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(500, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.2);
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.2);
                break;
            case 'timeout':
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.5);
                break;
        }
    } catch (e) {
        // 忽略音效错误，不影响游戏功能
    }
}

// 初始化游戏
function initGame() {
    setupEventListeners();
    
    // 确保所有屏幕有正确的初始状态
    elements.startScreen.classList.remove('hidden');
    elements.gameScreen.classList.add('hidden');
    elements.endScreen.classList.add('hidden');
    elements.pauseScreen.classList.add('hidden');
    
    // 添加动画样式
    const style = document.createElement('style');
    style.textContent = `
        @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
        }
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }
        @keyframes celebrate {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.7; }
        }
        @keyframes appleWiggle {
            0%, 100% { transform: rotate(-2deg); }
            50% { transform: rotate(2deg); }
        }
        @keyframes appleGrow {
            0% { transform: scale(0); }
            100% { transform: scale(1); }
        }
        /* 响应式触摸样式 */
        @media (hover: none) and (pointer: coarse) {
            button {
                padding: 15px 28px;
                font-size: 1.3rem;
            }
            #answer {
                width: 180px;
                padding: 20px;
                font-size: 1.8rem;
            }
        }
    `;
    document.head.appendChild(style);
    
    // 预加载效果 - 轻微放大标题
    setTimeout(() => {
        elements.gameTitle.style.transition = 'transform 0.5s ease';
        elements.gameTitle.style.transform = 'scale(1.05)';
        setTimeout(() => {
            elements.gameTitle.style.transform = 'scale(1)';
        }, 500);
    }, 500);
}

// 当页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', initGame);