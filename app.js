// English Words App - Main JavaScript File

class EnglishWordsApp {
    constructor() {
        this.currentSection = 'about';
        this.currentLevel = null;
        this.learningWords = [];
        this.customWords = [];
        this.audioPlayer = document.getElementById('audioPlayer');
        this.currentAudioUrl = null;
        
        this.init();
    }

    init() {
        this.loadData();
        this.migrateExistingWords(); // Migrate existing words to new format
        this.setupEventListeners();
        this.updateUI();
        this.setupTheme();
    }

    // Data Management
    loadData() {
        try {
            const savedLearning = localStorage.getItem('learningWords');
            const savedCustom = localStorage.getItem('customWords');
            
            if (savedLearning) {
                this.learningWords = JSON.parse(savedLearning);
            }
            
            if (savedCustom) {
                this.customWords = JSON.parse(savedCustom);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    saveData() {
        try {
            const dataToSave = {
                learningWords: this.learningWords,
                customWords: this.customWords,
                lastSaved: new Date().toISOString(),
                version: '1.0'
            };
            
            localStorage.setItem('englishWordsApp', JSON.stringify(dataToSave));
            localStorage.setItem('learningWords', JSON.stringify(this.learningWords));
            localStorage.setItem('customWords', JSON.stringify(this.customWords));
            
            // Save statistics
            this.saveStatistics();
        } catch (error) {
            console.error('Error saving data:', error);
            this.showNotification('Ошибка сохранения данных', 'error');
        }
    }

    saveStatistics() {
        const stats = {
            totalWordsLearned: this.learningWords.filter(w => w.isLearned).length,
            totalWordsLearning: this.learningWords.length,
            customWordsAdded: this.customWords.length,
            lastActivity: new Date().toISOString(),
            dailyProgress: this.getDailyProgress()
        };
        
        localStorage.setItem('appStatistics', JSON.stringify(stats));
    }

    getDailyProgress() {
        const today = new Date().toDateString();
        const todayWords = this.learningWords.filter(w => 
            w.dateLearned && new Date(w.dateLearned).toDateString() === today
        );
        return todayWords.length;
    }

    exportData() {
        try {
            const exportData = {
                learningWords: this.learningWords,
                customWords: this.customWords,
                exportDate: new Date().toISOString(),
                appVersion: '1.0'
            };
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `english-words-backup-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            this.showNotification('Данные экспортированы', 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.showNotification('Ошибка экспорта данных', 'error');
        }
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);
                
                if (importData.learningWords && importData.customWords) {
                    // Merge with existing data
                    const existingLearning = new Set(this.learningWords.map(w => w.word));
                    const existingCustom = new Set(this.customWords.map(w => w.word));
                    
                    let newLearningCount = 0;
                    let newCustomCount = 0;
                    
                    importData.learningWords.forEach(word => {
                        if (!existingLearning.has(word.word)) {
                            this.learningWords.push(word);
                            newLearningCount++;
                        }
                    });
                    
                    importData.customWords.forEach(word => {
                        if (!existingCustom.has(word.word)) {
                            this.customWords.push(word);
                            newCustomCount++;
                        }
                    });
                    
                    this.saveData();
                    this.updateUI();
                    this.showNotification(`Импортировано: ${newLearningCount} изучаемых слов, ${newCustomCount} пользовательских слов`, 'success');
                } else {
                    this.showNotification('Неверный формат файла', 'error');
                }
            } catch (error) {
                console.error('Import error:', error);
                this.showNotification('Ошибка импорта данных', 'error');
            }
        };
        reader.readAsText(file);
    }

    clearAllData() {
        if (confirm('Вы уверены, что хотите удалить все данные? Это действие нельзя отменить.')) {
            localStorage.removeItem('englishWordsApp');
            localStorage.removeItem('learningWords');
            localStorage.removeItem('customWords');
            localStorage.removeItem('appStatistics');
            
            this.learningWords = [];
            this.customWords = [];
            this.updateUI();
            this.renderLearningWords();
            this.renderCustomWords();
            
            this.showNotification('Все данные удалены', 'info');
        }
    }

    // Theme Management
    setupTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeIcon(newTheme);
    }

    updateThemeIcon(theme) {
        const themeIcon = document.querySelector('#themeToggle i');
        themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    // Event Listeners
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.switchSection(section);
            });
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Level cards
        document.querySelectorAll('.level-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const level = e.currentTarget.dataset.level;
                this.showLevelWords(level);
            });
        });

        // Back to levels button
        document.getElementById('backToLevels').addEventListener('click', () => {
            this.hideLevelWords();
        });

        // Add word form
        document.getElementById('addWordBtn').addEventListener('click', () => {
            this.addCustomWord();
        });

        // Enter key for add word form
        document.getElementById('newWord').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('newTranslation').focus();
            }
        });

        document.getElementById('newTranslation').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addCustomWord();
            }
        });
    }

    // Navigation
    switchSection(sectionName) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionName).classList.add('active');

        this.currentSection = sectionName;

	        // Update section-specific content
	        if (sectionName === 'learning') {
	            this.renderLearningWords();
	        } else if (sectionName === 'new-words') {
	            this.renderCustomWords();
	        } else if (sectionName === 'progress') {
	            this.renderProgressPage();
	        }
	    }

    // Level Words Management
    showLevelWords(level) {
        this.currentLevel = level;
        const wordsContainer = document.getElementById('wordsContainer');
        const levelsGrid = document.querySelector('.levels-grid');
        const currentLevelTitle = document.getElementById('currentLevelTitle');
        
        // Hide levels grid and show words container
        levelsGrid.style.display = 'none';
        wordsContainer.classList.remove('hidden');
        
        // Update title
        currentLevelTitle.innerHTML = `
            Слова уровня ${level}
            <div class="level-actions">
                <button class="btn btn-sm btn-success" onclick="app.addAllWordsFromLevel('${level}')">
                    <i class="fas fa-plus-circle"></i> Добавить все
                </button>
                <button class="btn btn-sm btn-danger" onclick="app.deleteAllWordsFromLevel('${level}')">
                    <i class="fas fa-trash"></i> Удалить все
                </button>
            </div>
        `;
        
        // Render words
        this.renderLevelWords(level);
    }

    hideLevelWords() {
        const wordsContainer = document.getElementById('wordsContainer');
        const levelsGrid = document.querySelector('.levels-grid');
        
        // Show levels grid and hide words container
        levelsGrid.style.display = 'grid';
        wordsContainer.classList.add('hidden');
        
        this.currentLevel = null;
    }

    renderLevelWords(level) {
        const wordsList = document.getElementById('wordsList');
        const words = oxfordWordsDatabase[level] || [];
        
        if (words.length === 0) {
            wordsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-book"></i>
                    <h3>Нет слов для этого уровня</h3>
                    <p>Слова для уровня ${level} пока не добавлены</p>
                </div>
            `;
            return;
        }

        wordsList.innerHTML = words.map(wordData => {
            const isLearning = this.learningWords.some(w => w.word === wordData.word);
            
            return `
                <div class="word-card">
                    <div class="word-header">
                        <span class="word-text">${wordData.word}</span>
                        <div class="word-actions">
                            <button class="action-btn play-btn" onclick="app.playAudio('${wordData.word}')" title="Прослушать произношение">
                                <i class="fas fa-play"></i>
                            </button>
                            ${!isLearning ? `
                                <button class="action-btn add-btn" onclick="app.addToLearning('${wordData.word}', '${wordData.translation}', '${level}')" title="Добавить в изучение">
                                    <i class="fas fa-plus"></i>
                                </button>
                            ` : `
                                <button class="action-btn remove-btn" onclick="app.removeFromLearning('${wordData.word}')" title="Убрать из изучения">
                                    <i class="fas fa-minus"></i>
                                </button>
                            `}
                        </div>
                    </div>
                    <div class="word-translation">${wordData.translation}</div>
                    <div class="word-level">${level} • ${wordData.category}</div>
                </div>
            `;
        }).join('');
    }

    // Learning Words Management
    addToLearning(word, translation, level) {
        const existingWord = this.learningWords.find(w => w.word === word);
        if (existingWord) {
            this.showNotification('Слово уже добавлено в изучение', 'warning');
            return;
        }

        const newWord = {
            id: Date.now().toString(),
            word: word,
            translation: translation,
            level: level,
            dateAdded: new Date().toISOString(),
            isLearned: false,
            // Spaced repetition data
            repetitionData: {
                easeFactor: 2.5,
                interval: 1,
                repetitions: 0,
                nextReview: new Date().toISOString(),
                lastReview: null,
                correctAnswers: 0,
                totalAnswers: 0,
                difficulty: 0 // 0 = easy, 1 = medium, 2 = hard
            },
            imageUrl: '' // Placeholder for image URL
        }
        };

        this.learningWords.push(newWord);
        this.saveData();
        this.updateUI();
        this.showNotification('Слово добавлено в изучение', 'success');

        // Update current view if showing level words
        if (this.currentLevel) {
            this.renderLevelWords(this.currentLevel);
        }
    }

    removeFromLearning(word) {
        this.learningWords = this.learningWords.filter(w => w.word !== word);
        this.saveData();
        this.updateUI();
        this.showNotification('Слово убрано из изучения', 'info');

        // Update current view
        if (this.currentSection === 'learning') {
            this.renderLearningWords();
        } else if (this.currentLevel) {
            this.renderLevelWords(this.currentLevel);
        }
    }

    markAsLearned(word) {
        const wordObj = this.learningWords.find(w => w.word === word);
        if (wordObj) {
            wordObj.isLearned = true;
            wordObj.dateLearned = new Date().toISOString();
            this.saveData();
            this.updateUI();
            this.showNotification('Слово отмечено как изученное', 'success');
            this.renderLearningWords();
        }
    }

    renderLearningWords() {
        const learningWordsList = document.getElementById('learningWordsList');
        const learningCount = document.getElementById('learningCount');
        
        // Get words that need review
        const wordsForReview = this.getWordsForReview();
        learningCount.textContent = `${this.learningWords.length} слов (${wordsForReview.length} для повторения)`;

        if (this.learningWords.length === 0) {
            learningWordsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-book-open"></i>
                    <h3>Пока нет слов для изучения</h3>
                    <p>Добавьте слова из списка по уровням или создайте новые</p>
                </div>
            `;
            return;
        }

        // If there are no words for review, offer the option to review all words.
        if (wordsForReview.length === 0) {
            learningWordsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clock"></i>
                    <h3>Все слова изучены на сегодня!</h3>
                    <p>Вы можете повторить изученные слова или вернуться позже.</p>
                    <button class="btn btn-primary" onclick="app.startReview('flashcard', true)">
                        <i class="fas fa-redo"></i>
                        Повторить все слова (Флешкарточки)
                    </button>
                    <button class="btn btn-secondary" onclick="app.showAllLearningWords()">
                        <i class="fas fa-list"></i>
                        Показать все слова
                    </button>
                </div>
            `;
            return;
        }

        // Show mode selection and start review for words that need it
        this.showReviewModeSelection(wordsForReview.length);
    }

    showReviewModeSelection(wordsCount) {
        const learningWordsList = document.getElementById('learningWordsList');
        learningWordsList.innerHTML = `
            <div class="review-mode-selection">
                <h2>Повторение слов</h2>
                <p>У вас ${wordsCount} слов, готовых к повторению.</p>
                <div class="mode-options">
                    <button class="btn btn-lg btn-primary" onclick="app.startReview('flashcard')">
                        <i class="fas fa-clone"></i>
                        Флешкарточки
                    </button>
                    <button class="btn btn-lg btn-success" onclick="app.startReview('quiz')">
                        <i class="fas fa-question-circle"></i>
                        Квиз (Тест)
                    </button>
                </div>
            </div>
        `;
    }

    startReview(mode, reviewAll = false) {
        this.currentReviewMode = mode;
        this.currentReviewWords = reviewAll ? this.learningWords.filter(w => !w.isLearned) : this.getWordsForReview();
        
        if (this.currentReviewWords.length === 0) {
            this.showNotification('Нет слов для повторения в выбранном режиме.', 'info');
            this.renderLearningWords();
            return;
        }

        // Sort words for review (harder words first)
        this.currentReviewWords.sort((a, b) => {
            if (a.repetitionData.difficulty !== b.repetitionData.difficulty) {
                return b.repetitionData.difficulty - a.repetitionData.difficulty;
            }
            return new Date(a.repetitionData.nextReview) - new Date(b.repetitionData.nextReview);
        });

        this.currentReviewIndex = 0;
        this.currentReviewTotal = this.currentReviewWords.length;
        this.currentReviewCompleted = 0;
        
        if (mode === 'flashcard') {
            this.showFlashcard();
        } else if (mode === 'quiz') {
            this.showQuiz();
        }
    }

    // Renaming showReviewCard to showFlashcard
    showFlashcard() {
        const learningWordsList = document.getElementById('learningWordsList');
        const currentWord = this.currentReviewWords[this.currentReviewIndex];
        
        if (!currentWord) {
            this.showReviewComplete();
            return;
        }

        const progress = this.currentReviewCompleted + 1;
        const total = this.currentReviewTotal;
        const accuracy = currentWord.repetitionData.totalAnswers > 0 
            ? Math.round((currentWord.repetitionData.correctAnswers / currentWord.repetitionData.totalAnswers) * 100)
            : 0;

        learningWordsList.innerHTML = `
            <div class="review-container">
                <div class="review-header">
                    <span class="review-mode-badge">Флешкарточки</span>
                    <div class="review-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${(progress / total) * 100}%"></div>
                        </div>
                        <span class="progress-text">${progress} из ${total}</span>
                    </div>
                </div>
                
                <div class="review-card" id="reviewCard">
                    <div class="card-front">
                        ${currentWord.imageUrl ? `<div class="word-image-container"><img src="${currentWord.imageUrl}" alt="${currentWord.word}" class="word-image"></div>` : ''}
                        <div class="word-display">
                            <h2 class="review-word">${currentWord.word}</h2>
                            <div class="word-level">${currentWord.level}</div>
                            <div class="word-stats">
                                <span class="accuracy">Точность: ${accuracy}%</span>
                                <span class="difficulty difficulty-${currentWord.repetitionData.difficulty}">
                                    ${this.getDifficultyText(currentWord.repetitionData.difficulty)}
                                </span>
                            </div>
                        </div>
                        
                        <div class="card-actions">
                            <button class="action-btn image-btn" onclick="app.findImageForWord('${currentWord.word}')" title="Добавить изображение">
                                <i class="fas fa-image"></i>
                            </button>
                            <button class="action-btn play-btn" onclick="app.playAudio('${currentWord.word}')" title="Прослушать произношение">
                                <i class="fas fa-play"></i>
                            </button>
                            <button class="btn btn-primary" onclick="app.showTranslation()">
                                Показать перевод
                            </button>
                        </div>
                    </div>
                    
                    <div class="card-back hidden">
                        ${currentWord.imageUrl ? `<div class="word-image-container"><img src="${currentWord.imageUrl}" alt="${currentWord.word}" class="word-image"></div>` : ''}
                        <h2 class="review-word">${currentWord.word}</h2>
                        <h3 class="review-translation">${currentWord.translation}</h3>
                        <div class="word-level">${currentWord.level}</div>
                        
                        <div class="answer-buttons">
                            <button class="btn btn-danger" onclick="app.answerReview(false)">
                                <i class="fas fa-times"></i>
                                Не знаю
                            </button>
                            <button class="btn btn-warning" onclick="app.answerReview('partial')">
                                <i class="fas fa-question"></i>
                                Частично
                            </button>
                            <button class="btn btn-success" onclick="app.answerReview(true)">
                                <i class="fas fa-check"></i>
                                Знаю
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="review-controls">
                    <button class="btn btn-secondary" onclick="app.renderLearningWords()">
                        Завершить повторение
                    </button>
                    <button class="btn btn-secondary" onclick="app.skipWord()">
                        Пропустить
                    </button>
                </div>
            </div>
        `;
    }

    // Renaming showReviewCard to showFlashcard
    showReviewCard() {
        this.showFlashcard();
    }

    // Renaming answerReview to answerFlashcard
    answerFlashcard(isCorrect) {
        const currentWord = this.currentReviewWords[this.currentReviewIndex];
        this.updateSpacedRepetition(currentWord, isCorrect);
        
        this.currentReviewCompleted++;
        this.currentReviewIndex++;
        
        if (this.currentReviewIndex >= this.currentReviewWords.length) {
            this.showReviewComplete();
        } else {
            this.showFlashcard();
        }
    }

    // Renaming skipWord to skipReview
    skipReview() {
        this.currentReviewIndex++;
        
        if (this.currentReviewIndex >= this.currentReviewWords.length) {
            this.showReviewComplete();
        } else if (this.currentReviewMode === 'flashcard') {
            this.showFlashcard();
        } else if (this.currentReviewMode === 'quiz') {
            this.showQuiz();
        }
    }

    // Update showReviewComplete to reflect the new flow
    showReviewComplete() {
        const learningWordsList = document.getElementById('learningWordsList');
        const completedCount = this.currentReviewCompleted;
        
        learningWordsList.innerHTML = `
            <div class="review-complete">
                <div class="completion-icon">
                    <i class="fas fa-trophy"></i>
                </div>
                <h2>Отличная работа!</h2>
                <p>Вы завершили повторение ${completedCount} слов в режиме "${this.currentReviewMode === 'flashcard' ? 'Флешкарточки' : 'Квиз'}"</p>
                <div class="completion-actions">
                    <button class="btn btn-primary" onclick="app.renderLearningWords()">
                        Продолжить изучение
                    </button>
                    <button class="btn btn-secondary" onclick="app.showAllLearningWords()">
                        Показать все слова
                    </button>
                </div>
            </div>
        `;
    }

    // Quiz Mode Implementation
    showQuiz() {
        const learningWordsList = document.getElementById('learningWordsList');
        const currentWord = this.currentReviewWords[this.currentReviewIndex];
        
        if (!currentWord) {
            this.showReviewComplete();
            return;
        }

        const progress = this.currentReviewCompleted + 1;
        const total = this.currentReviewTotal;
        
        // Randomly choose quiz type: 0 = English to Russian, 1 = Russian to English
        const quizType = Math.floor(Math.random() * 2);
        
        const question = quizType === 0 ? currentWord.word : currentWord.translation;
        const correctAnswer = quizType === 0 ? currentWord.translation : currentWord.word;
        
        const options = this.getQuizOptions(currentWord, quizType);

        learningWordsList.innerHTML = `
            <div class="review-container">
                <div class="review-header">
                    <span class="review-mode-badge">Квиз (Тест)</span>
                    <div class="review-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${((progress - 1) / total) * 100}%"></div>
                        </div>
                        <span class="progress-text">${progress} из ${total}</span>
                    </div>
                </div>
                
                <div class="quiz-card">
                    <div class="quiz-question">
                        <h2 class="review-word">${question}</h2>
                        ${quizType === 0 ? `
                            <button class="action-btn play-btn" onclick="app.playAudio('${currentWord.word}')" title="Прослушать произношение">
                                <i class="fas fa-volume-up"></i>
                            </button>
                        ` : ''}
                        <div class="word-level">${currentWord.level}</div>
                    </div>
                    
                    <div class="quiz-options" id="quizOptions">
                        ${options.map((option, index) => `
                            <button class="btn btn-option" onclick="app.checkQuizAnswer(this, '${option.replace(/'/g, "\\'")}', '${correctAnswer.replace(/'/g, "\\'")}')">
                                ${option}
                            </button>
                        `).join('')}
                    </div>
                    
                    <div class="quiz-feedback hidden" id="quizFeedback">
                        <h3 id="feedbackText"></h3>
                        <p id="correctAnswerText"></p>
                        <button class="btn btn-primary" onclick="app.nextQuizWord()">
                            Далее <i class="fas fa-arrow-right"></i>
                        </button>
                    </div>
                </div>
                
                <div class="review-controls">
                    <button class="btn btn-secondary" onclick="app.renderLearningWords()">
                        Завершить повторение
                    </button>
                    <button class="btn btn-secondary" onclick="app.skipReview()">
                        Пропустить
                    </button>
                </div>
            </div>
        `;
    }

    getQuizOptions(currentWord, quizType) {
        const allWords = this.getAllDatabaseWords();
        
        // Combine all words and custom words
        const wordPool = [...allWords, ...this.customWords];
        
        const correctAnswer = quizType === 0 ? currentWord.translation : currentWord.word;
        const correctWord = quizType === 0 ? currentWord.word : currentWord.translation;

        // Filter out the correct answer and the word itself
        let incorrectOptions = wordPool.filter(wordData => {
            const option = quizType === 0 ? wordData.translation : wordData.word;
            // Ensure the option is not the correct answer and is not empty
            return option && option !== correctAnswer;
        });

        // Get unique options
        const uniqueOptions = Array.from(new Set(incorrectOptions.map(wordData => quizType === 0 ? wordData.translation : wordData.word)));

        // Shuffle and select 3 incorrect options
        const shuffledOptions = uniqueOptions.sort(() => 0.5 - Math.random());
        const selectedIncorrect = shuffledOptions.slice(0, 3);

        // Combine with correct answer and shuffle
        let options = [...selectedIncorrect, correctAnswer];
        options = options.sort(() => 0.5 - Math.random());
        
        return options;
    }

    checkQuizAnswer(button, selectedAnswer, correctAnswer) {
        const isCorrect = selectedAnswer === correctAnswer;
        const feedbackDiv = document.getElementById('quizFeedback');
        const feedbackText = document.getElementById('feedbackText');
        const correctAnswerText = document.getElementById('correctAnswerText');
        const optionsDiv = document.getElementById('quizOptions');
        
        // Disable all buttons
        optionsDiv.querySelectorAll('button').forEach(btn => {
            btn.disabled = true;
            if (btn.textContent.trim() === correctAnswer) {
                btn.classList.add('btn-success');
            } else if (btn === button) {
                btn.classList.add('btn-danger');
            }
        });

        if (isCorrect) {
            feedbackText.textContent = 'Правильно!';
            feedbackDiv.style.backgroundColor = 'var(--success-color-light)';
            this.showNotification('Правильно!', 'success');
        } else {
            feedbackText.textContent = 'Неправильно.';
            correctAnswerText.textContent = `Правильный ответ: ${correctAnswer}`;
            feedbackDiv.style.backgroundColor = 'var(--error-color-light)';
            this.showNotification('Неправильно.', 'error');
        }
        
        feedbackDiv.classList.remove('hidden');
        
        // Update spaced repetition logic
        this.answerQuiz(isCorrect);
    }

    answerQuiz(isCorrect) {
        const currentWord = this.currentReviewWords[this.currentReviewIndex];
        // Use true for correct, false for incorrect in SM-2 logic
        this.updateSpacedRepetition(currentWord, isCorrect);
    }

    nextQuizWord() {
        this.currentReviewCompleted++;
        this.currentReviewIndex++;
        
        if (this.currentReviewIndex >= this.currentReviewWords.length) {
            this.showReviewComplete();
        } else {
            this.showQuiz();
        }
    }

    // Update getWordsForReview to allow reviewing all words if explicitly requested (not needed now, but good for future)
    getWordsForReview(reviewAll = false) {
        const now = new Date();
        const words = this.learningWords.filter(word => {
            if (word.isLearned) return false;
            if (reviewAll) return true; // If reviewAll is true, include all non-learned words
            const nextReview = new Date(word.repetitionData.nextReview);
            return nextReview <= now;
        }).sort((a, b) => {
            // Sort by difficulty (harder words first) and then by next review date
            if (a.repetitionData.difficulty !== b.repetitionData.difficulty) {
                return b.repetitionData.difficulty - a.repetitionData.difficulty;
            }
            return new Date(a.repetitionData.nextReview) - new Date(b.repetitionData.nextReview);
        });
        
        return words;
    }

    // Update updateSpacedRepetition to use the correct rating scale for SM-2 (0-5)
    // The current implementation uses boolean/string ('partial') which maps to 3 ratings.
    // We will keep the 3-rating system for simplicity but adjust the SM-2 logic to be more robust.
    updateSpacedRepetition(word, rating) {
        const data = word.repetitionData;
        data.totalAnswers++;
        
        let quality;
        if (rating === true) { // Знаю (Know)
            quality = 5;
        } else if (rating === 'partial') { // Частично (Partial)
            quality = 3;
        } else { // Не знаю (Don't Know)
            quality = 0;
        }

        // 1. Update repetitions and interval
        if (quality >= 3) {
            data.correctAnswers++;
            data.repetitions++;
            
            if (data.repetitions === 1) {
                data.interval = 1;
            } else if (data.repetitions === 2) {
                data.interval = 6;
            } else {
                data.interval = Math.round(data.interval * data.easeFactor);
            }
        } else {
            data.repetitions = 0;
            data.interval = 1;
        }

        // 2. Update Ease Factor (EF)
        // EF' = EF + (0.1 - (5 - Q) * (0.08 + (5 - Q) * 0.02))
        const newEaseFactor = data.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        data.easeFactor = Math.max(1.3, newEaseFactor); // EF cannot be less than 1.3

        // 3. Update next review date
        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + data.interval);
        data.nextReview = nextReview.toISOString();
        data.lastReview = new Date().toISOString();
        
        // 4. Update difficulty for sorting (0=easy, 1=medium, 2=hard)
        if (data.totalAnswers >= 3) {
            const accuracy = data.correctAnswers / data.totalAnswers;
            if (accuracy >= 0.8) {
                data.difficulty = 0; // Easy
            } else if (accuracy >= 0.6) {
                data.difficulty = 1; // Medium
            } else {
                data.difficulty = 2; // Hard
            }
        } else {
            // Initial difficulty based on first answer
            if (quality === 5) {
                data.difficulty = 0;
            } else if (quality === 3) {
                data.difficulty = 1;
            } else {
                data.difficulty = 2;
            }
        }
        
        this.saveData();
        this.updateUI();
    }
            learningWordsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clock"></i>
                    <h3>Все слова изучены на сегодня!</h3>
                    <p>Вы можете повторить изученные слова или вернуться позже.</p>
                    <button class="btn btn-primary" onclick="app.startReview('flashcard', true)">
                        <i class="fas fa-redo"></i>
                        Повторить все слова (Флешкарточки)
                    </button>
                    <button class="btn btn-secondary" onclick="app.showAllLearningWords()">
                        <i class="fas fa-list"></i>
                        Показать все слова
                    </button>
                </div>
            `;
            return;
        }

        // Show mode selection and start review for words that need it
        this.showReviewModeSelection(wordsForReview.length);
    }

    getWordsForReview() {
        const now = new Date();
        return this.learningWords.filter(word => {
            if (word.isLearned) return false;
            const nextReview = new Date(word.repetitionData.nextReview);
            return nextReview <= now;
        }).sort((a, b) => {
            // Sort by difficulty (harder words first) and then by next review date
            if (a.repetitionData.difficulty !== b.repetitionData.difficulty) {
                return b.repetitionData.difficulty - a.repetitionData.difficulty;
            }
            return new Date(a.repetitionData.nextReview) - new Date(b.repetitionData.nextReview);
        });
    }

    showReviewCard() {
        const learningWordsList = document.getElementById('learningWordsList');
        const currentWord = this.currentReviewWords[this.currentReviewIndex];
        
        if (!currentWord) {
            this.renderLearningWords();
            return;
        }

        const progress = this.currentReviewIndex + 1;
        const total = this.currentReviewWords.length;
        const accuracy = currentWord.repetitionData.totalAnswers > 0 
            ? Math.round((currentWord.repetitionData.correctAnswers / currentWord.repetitionData.totalAnswers) * 100)
            : 0;

        learningWordsList.innerHTML = `
            <div class="review-container">
                <div class="review-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(progress / total) * 100}%"></div>
                    </div>
                    <span class="progress-text">${progress} из ${total}</span>
                </div>
                
                <div class="review-card" id="reviewCard">
                    <div class="card-front">
                        ${currentWord.imageUrl ? `<div class="word-image-container"><img src="${currentWord.imageUrl}" alt="${currentWord.word}" class="word-image"></div>` : ''}
                        <div class="word-display">
                            <h2 class="review-word">${currentWord.word}</h2>
                            <div class="word-level">${currentWord.level}</div>
                            <div class="word-stats">
                                <span class="accuracy">Точность: ${accuracy}%</span>
                                <span class="difficulty difficulty-${currentWord.repetitionData.difficulty}">
                                    ${this.getDifficultyText(currentWord.repetitionData.difficulty)}
                                </span>
                            </div>
                        </div>
                        
                        <div class="card-actions">
                            <button class="action-btn image-btn" onclick="app.findImageForWord('${currentWord.word}')" title="Добавить изображение">
                                <i class="fas fa-image"></i>
                            </button>
                            <button class="action-btn play-btn" onclick="app.playAudio('${currentWord.word}')" title="Прослушать произношение">
                                <i class="fas fa-play"></i>
                            </button>
                            <button class="btn btn-primary" onclick="app.showTranslation()">
                                Показать перевод
                            </button>
                        </div>
                    </div>
                    
                    <div class="card-back hidden">
                        ${currentWord.imageUrl ? `<div class="word-image-container"><img src="${currentWord.imageUrl}" alt="${currentWord.word}" class="word-image"></div>` : ''}
                        <div class="translation-display">
                            <h2 class="review-word">${currentWord.word}</h2>
                            <h3 class="review-translation">${currentWord.translation}</h3>
                            <div class="word-level">${currentWord.level}</div>
                        </div>
                        
                        <div class="answer-buttons">
                            <button class="btn btn-danger" onclick="app.answerReview(false)">
                                <i class="fas fa-times"></i>
                                Не знаю
                            </button>
                            <button class="btn btn-warning" onclick="app.answerReview('partial')">
                                <i class="fas fa-question"></i>
                                Частично
                            </button>
                            <button class="btn btn-success" onclick="app.answerReview(true)">
                                <i class="fas fa-check"></i>
                                Знаю
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="review-controls">
                    <button class="btn btn-secondary" onclick="app.showAllLearningWords()">
                        Показать все слова
                    </button>
                    <button class="btn btn-secondary" onclick="app.skipWord()">
                        Пропустить
                    </button>
                </div>
            </div>
        `;
    }

    showTranslation() {
        const cardFront = document.querySelector('.card-front');
        const cardBack = document.querySelector('.card-back');
        
        cardFront.classList.add('hidden');
        cardBack.classList.remove('hidden');
    }

    // Renaming answerReview to answerFlashcard
    answerFlashcard(isCorrect) {
        const currentWord = this.currentReviewWords[this.currentReviewIndex];
        this.updateSpacedRepetition(currentWord, isCorrect);
        
        this.currentReviewCompleted++;
        this.currentReviewIndex++;
        
        if (this.currentReviewIndex >= this.currentReviewWords.length) {
            this.showReviewComplete();
        } else {
            this.showFlashcard();
        }
    }

    // New answerReview method to dispatch to the correct mode
    answerReview(isCorrect) {
        if (this.currentReviewMode === 'flashcard') {
            this.answerFlashcard(isCorrect);
        } else if (this.currentReviewMode === 'quiz') {
            this.answerQuiz(isCorrect);
        }
    }

    // Renaming skipWord to skipReview
    skipReview() {
        this.currentReviewIndex++;
        
        if (this.currentReviewIndex >= this.currentReviewWords.length) {
            this.showReviewComplete();
        } else if (this.currentReviewMode === 'flashcard') {
            this.showFlashcard();
        } else if (this.currentReviewMode === 'quiz') {
            this.showQuiz();
        }
    }

    // Keep skipWord for backward compatibility
    skipWord() {
        this.skipReview();
    }

    // Helper function to get all words from the database
    getAllDatabaseWords() {
        return Object.values(oxfordWordsDatabase).flat();
    }

    // Progress Management
    renderProgressPage() {
        const progressContent = document.getElementById('progressContent');
        const totalWords = this.getAllDatabaseWords().length + this.customWords.length;
        const learningWords = this.learningWords.length;
        const learnedWords = this.learningWords.filter(w => w.isLearned).length;
        const wordsForReview = this.getWordsForReview().length;
        
        // Calculate progress by level
        const levelStats = {};
        const allLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
        
        allLevels.forEach(level => {
            const totalInLevel = (oxfordWordsDatabase[level] || []).length + this.customWords.filter(w => w.level === level).length;
            const learnedInLevel = this.learningWords.filter(w => w.level === level && w.isLearned).length;
            const learningInLevel = this.learningWords.filter(w => w.level === level && !w.isLearned).length;
            
            levelStats[level] = {
                total: totalInLevel,
                learned: learnedInLevel,
                learning: learningInLevel,
                progress: totalInLevel > 0 ? Math.round((learnedInLevel / totalInLevel) * 100) : 0
            };
        });

        // Find current level (simplistic: the highest level with words being learned)
        const currentLevel = allLevels.reverse().find(level => levelStats[level].learning > 0) || 'A1';
        
        progressContent.innerHTML = `
            <div class="progress-summary">
                <div class="summary-card">
                    <i class="fas fa-book-reader"></i>
                    <h3>${learningWords}</h3>
                    <p>Слов в изучении</p>
                </div>
                <div class="summary-card">
                    <i class="fas fa-check-circle"></i>
                    <h3>${learnedWords}</h3>
                    <p>Изучено слов</p>
                </div>
                <div class="summary-card">
                    <i class="fas fa-redo-alt"></i>
                    <h3>${wordsForReview}</h3>
                    <p>Слов для повторения</p>
                </div>
                <div class="summary-card">
                    <i class="fas fa-layer-group"></i>
                    <h3>${currentLevel}</h3>
                    <p>Текущий уровень</p>
                </div>
            </div>

            <div class="progress-levels">
                <h3>Прогресс по уровням</h3>
                ${allLevels.reverse().map(level => `
                    <div class="level-progress-bar">
                        <div class="level-info">
                            <span class="level-name">${level}</span>
                            <span class="level-stats">${levelStats[level].learned} / ${levelStats[level].total}</span>
                        </div>
                        <div class="progress-bar-container">
                            <div class="progress-bar-fill" style="width: ${levelStats[level].progress}%"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="progress-details">
                <h3>Детали</h3>
                <p><strong>Всего слов в базе:</strong> ${totalWords}</p>
                <p><strong>Слов, добавленных пользователем:</strong> ${this.customWords.length}</p>
                <p><strong>Коэффициент легкости (EF) последнего слова:</strong> ${this.learningWords.length > 0 ? this.learningWords[this.learningWords.length - 1].repetitionData.easeFactor.toFixed(2) : 'N/A'}</p>
            </div>
        `;
    }

    // Image Management
    async findImageForWord(word) {
        this.showNotification(`Поиск изображения для слова "${word}"...`, 'info');
        
        // Use the search tool to find an image
        const searchResults = await search.image({
            brief: `Find a relevant image for the English word "${word}"`,
            queries: [word, `${word} image`, `${word} meaning picture`]
        });

        if (searchResults && searchResults.length > 0) {
            // For simplicity, take the first result
            const imageUrl = searchResults[0].url;
            
            // Update the word data
            const wordObj = this.learningWords.find(w => w.word === word);
            if (wordObj) {
                wordObj.imageUrl = imageUrl;
                this.saveData();
                this.showNotification(`Изображение для слова "${word}" найдено и добавлено.`, 'success');
                
                // Re-render the current card to show the image
                if (this.currentReviewMode === 'flashcard') {
                    this.showFlashcard();
                }
            } else {
                this.showNotification(`Ошибка: Слово "${word}" не найдено в списке изучения.`, 'error');
            }
        } else {
            this.showNotification(`Не удалось найти изображение для слова "${word}".`, 'warning');
        }
    }





    showReviewComplete() {
        const learningWordsList = document.getElementById('learningWordsList');
        const completedCount = this.currentReviewCompleted;
        
        learningWordsList.innerHTML = `
            <div class="review-complete">
                <div class="completion-icon">
                    <i class="fas fa-trophy"></i>
                </div>
                <h2>Отличная работа!</h2>
                <p>Вы завершили повторение ${completedCount} слов в режиме "${this.currentReviewMode === 'flashcard' ? 'Флешкарточки' : 'Квиз'}"</p>
                <div class="completion-actions">
                    <button class="btn btn-primary" onclick="app.renderLearningWords()">
                        Продолжить изучение
                    </button>
                    <button class="btn btn-secondary" onclick="app.showAllLearningWords()">
                        Показать все слова
                    </button>
                </div>
            </div>
        `;
    }

    showAllLearningWords() {
        const learningWordsList = document.getElementById('learningWordsList');
        
        if (this.learningWords.length === 0) {
            learningWordsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-book-open"></i>
                    <h3>Пока нет слов для изучения</h3>
                    <p>Добавьте слова из списка по уровням или создайте новые</p>
                </div>
            `;
            return;
        }

        const learnedWords = this.learningWords.filter(w => w.isLearned);
        const learningWords = this.learningWords.filter(w => !w.isLearned);

        learningWordsList.innerHTML = `
            <div class="all-words-container">
                <div class="all-words-header">
                    <h3 class="all-words-title">Все слова (${this.learningWords.length})</h3>
                    <div class="words-filter">
                        <button class="filter-btn active" data-filter="all">Все</button>
                        <button class="filter-btn" data-filter="learning">Изучаю (${learningWords.length})</button>
                        <button class="filter-btn" data-filter="learned">Изучено (${learnedWords.length})</button>
                    </div>
                </div>
                
                <div class="learning-words-grid" id="wordsGrid">
                    ${this.renderAllWordsGrid(this.learningWords)}
                </div>
                
                <div class="completion-actions" style="margin-top: 2rem;">
                    <button class="completion-btn primary" onclick="app.renderLearningWords()">
                        <i class="fas fa-arrow-left"></i>
                        Вернуться к изучению
                    </button>
                </div>
            </div>
        `;

        // Add filter functionality
        const filterButtons = learningWordsList.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Update active button
                filterButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                // Filter words
                const filter = e.target.dataset.filter;
                let filteredWords = this.learningWords;
                
                if (filter === 'learning') {
                    filteredWords = learningWords;
                } else if (filter === 'learned') {
                    filteredWords = learnedWords;
                }
                
                document.getElementById('wordsGrid').innerHTML = this.renderAllWordsGrid(filteredWords);
            });
        });
    }

    renderAllWordsGrid(words) {
        if (words.length === 0) {
            return `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>Нет слов в этой категории</h3>
                    <p>Попробуйте другой фильтр</p>
                </div>
            `;
        }

        return words.map(word => {
            const accuracy = word.repetitionData.totalAnswers > 0 
                ? Math.round((word.repetitionData.correctAnswers / word.repetitionData.totalAnswers) * 100)
                : 0;
            
            const progressWidth = Math.min(accuracy, 100);
            const difficultyText = this.getDifficultyText(word.repetitionData.difficulty);
            
            return `
                <div class="learning-word-card ${word.isLearned ? 'learned' : ''}">
                    <div class="learning-word-header">
                        <div>
                            <div class="learning-word-text">${word.word}</div>
                            <div class="learning-word-translation">${word.translation}</div>
                        </div>
                        <div class="word-actions">
                            <button class="action-btn play-btn" onclick="app.playAudio('${word.word}')" title="Прослушать произношение">
                                <i class="fas fa-play"></i>
                            </button>
                            ${!word.isLearned ? `
                                <button class="action-btn remove-btn" onclick="app.removeFromLearning('${word.word}')" title="Убрать из изучения">
                                    <i class="fas fa-minus"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="learning-word-meta">
                        <div class="word-progress">
                            <span>Точность: ${accuracy}%</span>
                            <div class="progress-indicator">
                                <div class="progress-fill-mini" style="width: ${progressWidth}%"></div>
                            </div>
                        </div>
                        <div class="word-level-info">
                            <span class="word-level">${word.level}</span>
                            <span class="difficulty-display ${difficultyText.toLowerCase()}">${difficultyText}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    getDifficultyText(difficulty) {
        switch(difficulty) {
            case 0: return 'Легко';
            case 1: return 'Средне';
            case 2: return 'Сложно';
            default: return 'Новое';
        }
    }

    // Level Management Actions
    addAllWordsFromLevel(level) {
        const wordsToAdd = (oxfordWordsDatabase[level] || []).concat(this.customWords.filter(w => w.level === level));
        let addedCount = 0;

        wordsToAdd.forEach(wordData => {
            const existingWord = this.learningWords.find(w => w.word === wordData.word);
            if (!existingWord) {
                this.addToLearning(wordData.word, wordData.translation, level);
                addedCount++;
            }
        });

        this.saveData();
        this.updateUI();
        this.renderLevelWords(level);
        this.showNotification(`Добавлено ${addedCount} слов уровня ${level} в изучение.`, 'success');
    }

    deleteAllWordsFromLevel(level) {
        if (confirm(`Вы уверены, что хотите удалить ВСЕ слова уровня ${level} из списка изучения?`)) {
            const wordsToRemove = (oxfordWordsDatabase[level] || []).map(w => w.word)
                .concat(this.customWords.filter(w => w.level === level).map(w => w.word));
            
            const initialCount = this.learningWords.length;
            this.learningWords = this.learningWords.filter(w => w.level !== level);
            const removedCount = initialCount - this.learningWords.length;

            this.saveData();
            this.updateUI();
            this.renderLevelWords(level);
            this.showNotification(`Удалено ${removedCount} слов уровня ${level} из изучения.`, 'info');
        }
    }

    // Custom Words Management
    addCustomWord() {
        const wordInput = document.getElementById('newWord');
        const translationInput = document.getElementById('newTranslation');
        const levelSelect = document.getElementById('newLevel');

        const word = wordInput.value.trim().toLowerCase();
        const translation = translationInput.value.trim();
        const level = levelSelect.value;

        if (!word || !translation) {
            this.showNotification('Заполните все поля', 'error');
            return;
        }

        // Check if word already exists
        const existsInDatabase = Object.values(oxfordWordsDatabase).flat().some(w => w.word === word);
        const existsInCustom = this.customWords.some(w => w.word === word);

        if (existsInDatabase || existsInCustom) {
            this.showNotification('Это слово уже существует', 'warning');
            return;
        }

        const newWord = {
            id: Date.now().toString(),
            word: word,
            translation: translation,
            level: level,
            dateAdded: new Date().toISOString(),
            isCustom: true
        };

        this.customWords.push(newWord);
        this.saveData();
        this.renderCustomWords();
        this.showNotification('Слово добавлено', 'success');

        // Clear form
        wordInput.value = '';
        translationInput.value = '';
        levelSelect.value = 'A1';
    }

    removeCustomWord(wordId) {
        this.customWords = this.customWords.filter(w => w.id !== wordId);
        this.saveData();
        this.renderCustomWords();
        this.showNotification('Слово удалено', 'info');
    }

    renderCustomWords() {
        const customWordsContainer = document.getElementById('customWords');

        if (this.customWords.length === 0) {
            customWordsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-plus-circle"></i>
                    <h3>Нет добавленных слов</h3>
                    <p>Используйте форму выше для добавления новых слов</p>
                </div>
            `;
            return;
        }

        customWordsContainer.innerHTML = this.customWords.map(wordData => {
            const isLearning = this.learningWords.some(w => w.word === wordData.word);
            
            return `
                <div class="word-card">
                    <div class="word-header">
                        <span class="word-text">${wordData.word}</span>
                        <div class="word-actions">
                            <button class="action-btn play-btn" onclick="app.playAudio('${wordData.word}')" title="Прослушать произношение">
                                <i class="fas fa-play"></i>
                            </button>
                            ${!isLearning ? `
                                <button class="action-btn add-btn" onclick="app.addToLearning('${wordData.word}', '${wordData.translation}', '${wordData.level}')" title="Добавить в изучение">
                                    <i class="fas fa-plus"></i>
                                </button>
                            ` : `
                                <button class="action-btn remove-btn" onclick="app.removeFromLearning('${wordData.word}')" title="Убрать из изучения">
                                    <i class="fas fa-minus"></i>
                                </button>
                            `}
                            <button class="action-btn remove-btn" onclick="app.removeCustomWord('${wordData.id}')" title="Удалить слово">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="word-translation">${wordData.translation}</div>
                    <div class="word-level">${wordData.level} • Пользовательское</div>
                </div>
            `;
        }).join('');
    }

    // Audio Management
    async playAudio(word, accent = 'uk') {
        const processedWord = word.toLowerCase().replace(/[^a-z]/g, '');
        
        // Show loading state
        const playButtons = document.querySelectorAll(`[onclick*="playAudio('${word}')"]`);
        playButtons.forEach(btn => {
            const originalContent = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            btn.disabled = true;
            btn.dataset.originalContent = originalContent;
        });

        // Direct URLs to wooordhunt audio files
        const ukUrl = `https://wooordhunt.ru/data/sound/sow/uk/${processedWord}.mp3`;
        const usUrl = `https://wooordhunt.ru/data/sound/sow/us/${processedWord}.mp3`;

        try {
            // Try preferred accent first
            const primaryUrl = accent === 'uk' ? ukUrl : usUrl;
            const fallbackUrl = accent === 'uk' ? usUrl : ukUrl;
            
            let audioPlayed = false;
            
            try {
                await this.tryPlayAudio(primaryUrl);
                audioPlayed = true;
                this.showNotification(`Воспроизведение (${accent === 'uk' ? 'британский' : 'американский'} акцент)`, 'info');
            } catch (error) {
                console.log(`Failed to play ${accent} accent, trying fallback...`);
                try {
                    await this.tryPlayAudio(fallbackUrl);
                    audioPlayed = true;
                    this.showNotification(`Воспроизведение (${accent === 'uk' ? 'американский' : 'британский'} акцент)`, 'info');
                } catch (fallbackError) {
                    console.log('Both audio sources failed');
                }
            }
            
            if (!audioPlayed) {
                this.showNotification('Аудио для этого слова недоступно', 'warning');
            }
            
        } catch (error) {
            console.error('Audio playback error:', error);
            this.showNotification('Ошибка воспроизведения аудио', 'error');
        } finally {
            // Restore button state
            setTimeout(() => {
                playButtons.forEach(btn => {
                    const originalContent = btn.dataset.originalContent || '<i class="fas fa-play"></i>';
                    btn.innerHTML = originalContent;
                    btn.disabled = false;
                    delete btn.dataset.originalContent;
                });
            }, 1000);
        }
    }

    tryPlayAudio(url) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            
            audio.oncanplaythrough = () => {
                audio.play()
                    .then(() => {
                        resolve();
                    })
                    .catch(reject);
            };
            
            audio.onerror = () => {
                reject(new Error(`Failed to load audio: ${url}`));
            };
            
            audio.onloadstart = () => {
                console.log(`Loading audio: ${url}`);
            };
            
            // Set timeout for loading
            const timeout = setTimeout(() => {
                reject(new Error('Audio load timeout'));
            }, 8000);
            
            audio.oncanplaythrough = () => {
                clearTimeout(timeout);
                audio.play()
                    .then(resolve)
                    .catch(reject);
            };
            
            // Start loading
            audio.src = url;
            audio.load();
        });
    }

    // Add accent selection
    showAccentSelector(word) {
        const modal = document.createElement('div');
        modal.className = 'accent-modal';
        modal.innerHTML = `
            <div class="accent-modal-content">
                <h3>Выберите произношение</h3>
                <div class="accent-buttons">
                    <button class="accent-btn" onclick="app.playAudio('${word}', 'us'); app.closeAccentModal()">
                        <i class="fas fa-flag-usa"></i>
                        Американский
                    </button>
                    <button class="accent-btn" onclick="app.playAudio('${word}', 'uk'); app.closeAccentModal()">
                        <i class="fas fa-flag"></i>
                        Британский
                    </button>
                </div>
                <button class="close-modal" onclick="app.closeAccentModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        // Add modal styles
        Object.assign(modal.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '1000'
        });

        document.body.appendChild(modal);
        this.currentModal = modal;
    }

    closeAccentModal() {
        if (this.currentModal) {
            this.currentModal.remove();
            this.currentModal = null;
        }
    }

    // UI Updates
    updateUI() {
        // Update learning count
        const learningCount = document.getElementById('learningCount');
        if (learningCount) {
            learningCount.textContent = `${this.learningWords.length} слов`;
        }

        // Update word counts in level cards
        document.querySelectorAll('.level-card').forEach(card => {
            const level = card.dataset.level;
            const wordCount = card.querySelector('.word-count');
            const dbWords = oxfordWordsDatabase[level] ? oxfordWordsDatabase[level].length : 0;
            const customWords = this.customWords.filter(w => w.level === level).length;
            const total = dbWords + customWords;
            wordCount.textContent = `${total} слов`;
        });
    }

    // Notifications
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
        `;

        // Add styles
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: this.getNotificationColor(type),
            color: 'white',
            padding: '12px 16px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: '1000',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease'
        });

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after delay
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    getNotificationColor(type) {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        return colors[type] || '#3b82f6';
    }

    // Spaced Repetition Algorithm (based on SuperMemo 2)
    // The rating is mapped to SM-2 quality (0-5): true=5, 'partial'=3, false=0
    updateSpacedRepetition(word, rating) {
        const data = word.repetitionData;
        data.totalAnswers++;
        
        let quality;
        if (rating === true) { // Знаю (Know)
            quality = 5;
        } else if (rating === 'partial') { // Частично (Partial)
            quality = 3;
        } else { // Не знаю (Don't Know)
            quality = 0;
        }

        // 1. Update repetitions and interval
        if (quality >= 3) {
            data.correctAnswers++;
            data.repetitions++;
            
            if (data.repetitions === 1) {
                data.interval = 1;
            } else if (data.repetitions === 2) {
                data.interval = 6;
            } else {
                data.interval = Math.round(data.interval * data.easeFactor);
            }
        } else {
            data.repetitions = 0;
            data.interval = 1;
        }

        // 2. Update Ease Factor (EF)
        // EF' = EF + (0.1 - (5 - Q) * (0.08 + (5 - Q) * 0.02))
        const newEaseFactor = data.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        data.easeFactor = Math.max(1.3, newEaseFactor); // EF cannot be less than 1.3

        // 3. Update next review date
        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + data.interval);
        data.nextReview = nextReview.toISOString();
        data.lastReview = new Date().toISOString();
        
        // 4. Update difficulty for sorting (0=easy, 1=medium, 2=hard)
        if (data.totalAnswers >= 3) {
            const accuracy = data.correctAnswers / data.totalAnswers;
            if (accuracy >= 0.8) {
                data.difficulty = 0; // Easy
            } else if (accuracy >= 0.6) {
                data.difficulty = 1; // Medium
            } else {
                data.difficulty = 2; // Hard
            }
        } else {
            // Initial difficulty based on first answer
            if (quality === 5) {
                data.difficulty = 0;
            } else if (quality === 3) {
                data.difficulty = 1;
            } else {
                data.difficulty = 2;
            }
        }
        
        this.saveData();
        this.updateUI();
    }

    // Migration function for existing words without repetition data
    migrateExistingWords() {
        let migrated = false;
        
        this.learningWords.forEach(word => {
            if (!word.repetitionData) {
                word.repetitionData = {
                    easeFactor: 2.5,
                    interval: 1,
                    repetitions: 0,
                    nextReview: new Date().toISOString(),
                    lastReview: null,
                    correctAnswers: 0,
                    totalAnswers: 0,
                    difficulty: 0,
                    imageUrl: '';
                migrated = true;
            }
        });
        
        if (migrated) {
            this.saveData();
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new EnglishWordsApp();
});

// Add some additional CSS for learned words
const additionalStyles = `
    .word-card.learned {
        opacity: 0.7;
        background: var(--bg-tertiary);
    }
    
    .learned-badge {
        background: var(--accent-color);
        color: white;
        padding: 0.25rem 0.5rem;
        border-radius: var(--radius-sm);
        font-size: 0.75rem;
        margin-top: 0.5rem;
        display: inline-block;
    }
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Initialize the application
let app;
document.addEventListener('DOMContentLoaded', function() {
    app = new EnglishWordsApp();
});

