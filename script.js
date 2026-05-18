/**
 * ==========================================
 * 알람음 추천 프로그램 핵심 비즈니스 로직 (v1.2)
 * ==========================================
 */

// 1. 상태 및 전역 데이터 객체 관리
const surveyState = {
    currentStage: 'home', // 'home' | 'survey' | 'loading' | 'result'
    currentQuestionIndex: 0,
    accumulatedScore: 0,
    matchedResultKey: '' // 더 알아보기 연동을 위해 현재 매칭된 키 저장
};

// 2. 질문 리스트 구조 정의 데이터
const questions = [
    {
        id: 1,
        eyebrow: "Question 01 / 02",
        text: "어젯밤 수면 시간은 얼마나 되었나요?",
        options: [
            { label: "0 ~ 2시간", score: 1 },
            { label: "2 ~ 4시간", score: 2 },
            { label: "4 ~ 6시간", score: 3 },
            { label: "6 ~ 8시간", score: 4 },
            { label: "8 ~ 10시간", score: 5 },
            { label: "10 ~ 12시간", score: 6 }
        ]
    },
    {
        id: 2,
        eyebrow: "Question 02 / 02",
        text: "현재 피로도는 어느 정도인가요?",
        options: [
            { label: "매우 피곤함", score: 1 },
            { label: "약간 피곤함", score: 2 },
            { label: "보통", score: 3 },
            { label: "약간 상쾌함", score: 4 },
            { label: "매우 상쾌함", score: 5 }
        ]
    }
];

// 3. 결과 대시보드 기본 데이터 매트릭스
const resultMatrix = {
    cascade: {
        name: "Cascade",
        tagline: "극심한 피로를 깨우는 청각적 리프레시",
        emoji: "🌊",
        desc: "수면 시간이 극도로 부족하거나 피로도가 매우 높은 상태입니다. 이 알람음은 알파파 저하를 방지하고, 뇌를 서서히 깨워주는 백색소음 기반의 폭포수 주파수를 제공합니다. 급격한 심박수 상승 없이도 잔여 수면 관성을 깨끗하게 지워내 줄 것입니다."
    },
    homecoming: {
        name: "Homecoming",
        tagline: "가장 보편적이고 효율적인 생체 리듬 맞춤형",
        emoji: "🏡",
        desc: "일반적인 수면 흐름을 유지하셨으나 다소 잔여 피로가 느껴지는 상태입니다. 중간 주파수 대역이 편안하게 레이어드된 멜로디 음원입니다. 기상 스트레스 호르몬인 코르티솔의 분비를 급격히 촉진하지 않으면서 부드러운 하모니를 통해 각성을 돕습니다."
    },
    galaxyBells: {
        name: "Galaxy Bells",
        tagline: "최상의 컨디션을 극대화하는 고주파 맑은 소리",
        emoji: "✨",
        desc: "충분한 수면을 취하셨고 현재 몸 상태가 매우 맑고 상쾌한 최상의 상태입니다. 이에 따라 청각 신경을 기분 좋게 자극하는 고음역대의 맑은 종소리를 추천합니다. 두뇌의 베타파 전환을 신속하게 유도하여 오늘 하루 집중력을 최대치로 끌어올려 줄 것입니다."
    }
};

// ✨ [추가] 모달용 상세 심층 데이터 보관 객체
const detailMatrix = {
    cascade: [
        "중저음이 강조되고 단조롭고 부드러운 리듬으로 이루어진 알람음입니다.",
        "현재 피로도가 높아 세타파가 우세하고 베타파가 낮게 나타나는 뇌 상태를 정밀 고려했습니다.",
        "베타파를 급격히 증가시켜 뇌에 충격을 주지 않으면서 생체 알파파를 안정적으로 유지할 수 있도록 설계되었습니다."
    ],
    homecoming: [
        "저음, 중음, 고음이 어느 한쪽으로 치우치지 않고 균형 있게 포함된 알람음입니다.",
        "모든 인간 청각 대역에 유효한 주파수 대역이 고르게 분포되어 있어 거부감이 적습니다.",
        "기상 시 일시적으로 많은 정보량의 소리를 무리 없이 수용할 수 있는 '중간 피로 상태'의 사용자에게 가장 적합합니다."
    ],
    galaxyBells: [
        "고음 역대의 피크(Peak)가 뚜렷하며 귀를 기분 좋게 자극하는 날카로운 금속성 소리가 세련되게 섞여 있는 알람음입니다.",
        "현재 졸음을 유발하는 뇌파인 세타파 분포량이 매우 적고 신체가 깰 준비가 된 상태를 반영했습니다.",
        "각성을 돕는 하이베타파(High-Beta) 양의 인위적인 활성화 유도를 통해 빠른 두뇌 회전 및 뇌파 정상화에 도움을 줍니다."
    ]
};

// 4. DOM 요소 탐색 및 캐싱
const domElements = {
    stages: {
        home: document.getElementById('stage-home'),
        survey: document.getElementById('stage-survey'),
        loading: document.getElementById('stage-loading'),
        result: document.getElementById('stage-result')
    },
    progressBar: document.getElementById('progress-bar'),
    questionCard: document.getElementById('question-card'),
    questionEyebrow: document.getElementById('question-eyebrow'),
    questionText: document.getElementById('question-text'),
    optionsContainer: document.getElementById('options-container'),
    btnStart: document.getElementById('btn-start'),
    btnRestart: document.getElementById('btn-restart'),
    btnMore: document.getElementById('btn-more'), // [추가] 더 알아보기 버튼
    resultEmoji: document.getElementById('result-emoji'),
    resultName: document.getElementById('result-name'),
    resultTagline: document.getElementById('result-tagline'),
    resultDesc: document.getElementById('result-desc'),
    // 모달 관련 캐싱 엘리먼트
    modalOverlay: document.getElementById('modal-overlay'),
    modalTitle: document.getElementById('modal-title'),
    modalDetailList: document.getElementById('modal-detail-list'),
    btnModalCloseX: document.getElementById('btn-modal-close-x'),
    btnModalClose: document.getElementById('btn-modal-close')
};

/**
 * 5. 화면(Stage) 전환 제어 함수
 */
function navigateToStage(stageId) {
    Object.values(domElements.stages).forEach(stage => {
        stage.classList.remove('active');
    });
    
    const targetStage = domElements.stages[stageId];
    if (targetStage) {
        targetStage.classList.add('active');
        surveyState.currentStage = stageId;
    }
}

/**
 * 6. 설문지 질문 렌더링 함수
 */
function renderQuestion(index) {
    const question = questions[index];
    const progressPercent = ((index) / questions.length) * 100;
    domElements.progressBar.style.width = `${progressPercent}%`;

    domElements.questionCard.classList.remove('fade-in');
    domElements.questionCard.classList.add('fade-out');

    setTimeout(() => {
        domElements.questionEyebrow.textContent = question.eyebrow;
        domElements.questionText.textContent = question.text;
        domElements.optionsContainer.innerHTML = '';

        question.options.forEach(opt => {
            const button = document.createElement('button');
            button.className = 'option-btn';
            button.textContent = opt.label;
            
            button.addEventListener('click', () => {
                handleOptionClick(button, opt.score);
            });
            domElements.optionsContainer.appendChild(button);
        });

        domElements.questionCard.classList.remove('fade-out');
        domElements.questionCard.classList.add('fade-in');
    }, 200);
}

/**
 * 7. 옵션 선택 처리 및 판단 함수
 */
function handleOptionClick(selectedButton, score) {
    const allButtons = domElements.optionsContainer.querySelectorAll('.option-btn');
    allButtons.forEach(btn => {
        btn.classList.remove('selected');
        btn.style.pointerEvents = 'none';
    });
    
    selectedButton.classList.add('selected');
    surveyState.accumulatedScore += score;

    setTimeout(() => {
        surveyState.currentQuestionIndex++;
        if (surveyState.currentQuestionIndex < questions.length) {
            renderQuestion(surveyState.currentQuestionIndex);
        } else {
            runAnalysisFlow();
        }
    }, 350);
}

/**
 * 8. 분석 중 가상 딜레이 파이프라인 함수
 */
function runAnalysisFlow() {
    domElements.progressBar.style.width = '100%';
    navigateToStage('loading');

    setTimeout(() => {
        calculateAndRenderResult();
        navigateToStage('result');
    }, 2000);
}

/**
 * 9. 점수 스펙 계산 매칭 및 결과 데이터 바인딩 함수
 */
function calculateAndRenderResult() {
    const finalScore = surveyState.accumulatedScore;
    let selectedResultKey = 'homecoming';

    if (finalScore >= 0 && finalScore <= 3) {
        selectedResultKey = 'cascade';
    } else if (finalScore >= 4 && finalScore <= 7) {
        selectedResultKey = 'homecoming';
    } else if (finalScore >= 8 && finalScore <= 11) {
        selectedResultKey = 'galaxyBells';
    }

    // 전역 상태에 현재 매칭 결과 저장 (모달창에서 활용하기 위함)
    surveyState.matchedResultKey = selectedResultKey;

    const resultData = resultMatrix[selectedResultKey];
    domElements.resultEmoji.textContent = resultData.emoji;
    domElements.resultName.textContent = resultData.name;
    domElements.resultTagline.textContent = resultData.tagline;
    domElements.resultDesc.textContent = resultData.desc;
}

/**
 * ✨ [추가] 10. 모달 열기(Open) 제어 함수
 */
function openModal() {
    const currentKey = surveyState.matchedResultKey || 'homecoming';
    const detailParagraphs = detailMatrix[currentKey];
    const resultName = resultMatrix[currentKey].name;

    // 모달 타이틀 동적 변경
    domElements.modalTitle.textContent = `${resultName} 심층 분석`;
    
    // 리스트 내 내용 초기화 후 주입
    domElements.modalDetailList.innerHTML = '';
    detailParagraphs.forEach(text => {
        const li = document.createElement('li');
        li.textContent = text;
        domElements.modalDetailList.appendChild(li);
    });

    // 오버레이에 open 클래스 주입하여 활성화
    domElements.modalOverlay.classList.add('open');
}

/**
 * ✨ [추가] 11. 모달 닫기(Close) 제어 함수
 */
function closeModal() {
    domElements.modalOverlay.classList.remove('open');
}

/**
 * 12. 어플리케이션 공장초기화 함수
 */
function resetApplication() {
    surveyState.currentQuestionIndex = 0;
    surveyState.accumulatedScore = 0;
    surveyState.matchedResultKey = '';
    domElements.progressBar.style.width = '0%';
    navigateToStage('home');
}

// 13. 이벤트 엔트리포인트 이벤트 바인딩
domElements.btnStart.addEventListener('click', () => {
    navigateToStage('survey');
    renderQuestion(surveyState.currentQuestionIndex);
});

domElements.btnRestart.addEventListener('click', () => {
    resetApplication();
});

// ✨ [추가] 모달 제어 이벤트 리스너 리스트
domElements.btnMore.addEventListener('click', openModal);      // 더 알아보기 버튼 클릭
domElements.btnModalCloseX.addEventListener('click', closeModal); // 상단 X 버튼 클릭
domElements.btnModalClose.addEventListener('click', closeModal);  // 하단 창 닫기 버튼 클릭

// ✨ [추가] 어두운 반투명 배경(오버레이) 직접 클릭 시 모달창 닫히게 처리
domElements.modalOverlay.addEventListener('click', (event) => {
    // 클릭된 타겟이 카드 내부가 아니라 바깥 오버레이 영역 자체일 때만 닫기 실행
    if (event.target === domElements.modalOverlay) {
        closeModal();
    }
});

// ✨ [추가] 키보드 ESC 단축키 누를 시 모달창 닫히게 처리
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' || event.keyCode === 27) {
        // 모달창이 현재 켜져 있는 상태일 때만 닫기 연산 작동
        if (domElements.modalOverlay.classList.contains('open')) {
            closeModal();
        }
    }
});