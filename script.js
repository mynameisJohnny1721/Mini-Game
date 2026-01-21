const canvas = document.getElementById("gameCanvas");
const c = canvas.getContext("2d");

// --- 設定値 ---
const CANVAS_WIDTH = 864;
const CANVAS_HEIGHT = 576;
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

const PI = Math.PI;
const TWO_PI = 2 * PI;

const PASS_SPEED = 7.5;
const SHOT_SPEED = 14.0;
const CROSS_SPEED = 11.0;
const DRIBBLE_SPEED = 6.0;

const MIN_PASS_SPEED = 4.0;
const MAX_PASS_SPEED = 12.0;
const MAX_POWER_LEVEL = 5;
const MAX_PASS_ERROR_ANGLE = 0.15;

const PLAYER_RUNNER_RADIUS = 20.0;
const BALL_RADIUS = 12.5;

// 判定距離
const RUNNER_CATCH_DISTANCE = BALL_RADIUS + PLAYER_RUNNER_RADIUS + 15;
const KEEPER_SAVE_DISTANCE = BALL_RADIUS + PLAYER_RUNNER_RADIUS;

const GRAVITY = 0.6;
const KEEPER_REACH_HEIGHT = 40;

// Lv1-4のDFライン位置
const OBSTACLE_X_FIXED = 350;
const startXRange = { min: 145, max: 250 };
const CENTER_LINE_X = 140;

const READY_DURATION = 1000;
const COUNTDOWN_DURATION = 2000;

const GOAL_WIDTH = 40;
const GOAL_HEIGHT = 160;
const GOAL_Y_TOP = (CANVAS_HEIGHT - GOAL_HEIGHT) / 2;
const GOAL_Y_BOTTOM = GOAL_Y_TOP + GOAL_HEIGHT;

// ボタン設定
const BTN_H = 60;
const BTN_Y = CANVAS_HEIGHT / 2 + 80;
const BTN_SIDE_W = 200;
const BTN_GAP = 30;
const BTN_LEFT_X = CANVAS_WIDTH / 2 - BTN_SIDE_W - BTN_GAP / 2;
const BTN_RIGHT_X = CANVAS_WIDTH / 2 + BTN_GAP / 2;

// TIPSボタン設定
const TIPS_BTN_W = 140;
const TIPS_BTN_H = 45;
const TIPS_BTN_X = CANVAS_WIDTH / 2 - TIPS_BTN_W / 2;
const TIPS_BTN_Y = CANVAS_HEIGHT / 2 + 160;

// --- グローバル変数 ---
let runner, passer, striker, keeper, currentPass;
let obstacles = [];
let maxObstacleX = 0;

let gameStartTime = 0;
let isGameStarted = false;
let isPlayActive = false;
let isGameCompleted = false;

let isPrePassDribble = false;
let tacticalTriggered = false;
let tacticalStartTime = 0;
let isAdviceOpen = false;

let game7Phase = 0;
let phase1StartTime = 0;
let phase2StartTime = 0;
let isRunnerBreaking = false;

let showSuccess = false;
let resultText = "";
let initialRunnerSpeed;

let isShooting = false;
let isCrossing = false;

let keeperStrategy = 0;
let isKeeperBeaten = false;

let passPowerLevel = 3;
let currentLevel = 0; // Tutorialからスタート
const MAX_GAME_LEVEL = 7;

// --- HTML要素への参照 ---
const uiTitle = document.getElementById("level-title");
const uiDesc = document.getElementById("level-description");
const uiFactors = document.getElementById("level-factors");
const uiControls = document.getElementById("level-controls");

const SKILL_LIST = [
    "パスコースを選ぶ・決める能力",
    "パススピードを調整する能力",
    "タイミングよく蹴る能力",
    "受け手の位置・動きを把握し予測する能力",
    "敵の位置を把握し動きを予測する能力",
    "スペースを見つける能力"
];

const levelInfoData = {
    0: {
        title: "Tutorial<br>基本操作と練習",
        description: `
            <div style="text-align: left; display: inline-block; font-size: 16px; line-height: 1.6;">
                <strong>プレイ方法</strong>
                <ol style="margin: 5px 0 0 20px; padding: 0;">
                    <li>パススピードを矢印キー(↑↓)で調整<br>もしくは1~5を入力する。</li>
                    <li>パスしたいところをクリックする。</li>
                </ol>
            </div>
        `,
        highlightSkills: [],
        advice: "ボールはクリックした場所に飛んでいきます。\n動いている味方の足元ではなく、進行方向（スペース）\nを狙うのがコツです。\n画面に表示されているターゲットを狙ってみましょう。"
    },
    1: {
        title: "Game 1<br>中央へのスルーパス (基礎)",
        description: "中央の味方の動きに合わせて2人のDFの間を通り、背後のスペースへスルーパスを狙います。<br>なかなか通らない場合はTIPSもしくは下にある成功に必要な技術を確認して意識してみてください。",
        highlightSkills: [0, 1, 2, 3],
        advice: "味方（黄色）が走り出す動きをよく見ましょう。\nちょうどDFラインと重なる瞬間に\nパス(クリック)すると通りやすいです。"
    },
    2: {
        title: "Game 2<br>サイドへのスルーパス (基礎)",
        description: "サイドの味方の動きに合わせて2人のDFの間を通り、背後のスペースへスルーパスを狙います。<br>Game 1に比べて、スルーパスの難易度が上がっています。",
        highlightSkills: [0, 1, 2, 3],
        advice: "味方がDFラインと並んだ瞬間がチャンスです。\nパスコースはちょうど真ん中、そして\nパススピードは弱めの方が通りやすいかもしれません。"
    },
    3: {
        title: "Game 3<br>中央へのスルーパス (応用)",
        description: "Game 1に簡易的なDFの動きを追加した応用版です。パスした後DFがボールに反応する動きをするため、パススピードに注意しつつまたオフサイドにも気をつけましょう。",
        highlightSkills: [0, 1, 2, 3, 4],
        advice: "DFが動いているため、その動きに注意してパスしましょう。\nパススピードが弱いとDFに阻まれるので\n普通もしくは強めにしたほうが良いかもしれません。"
    },
    4: {
        title: "Game 4<br>サイドへのスルーパス (応用)",
        description: "Game 2に簡易的なDFの動きを追加した応用版です。ただパススピードを早くしても味方がパスを受け取れません。パススピードとパスコースが重要になります。",
        highlightSkills: [0, 1, 2, 3, 4],
        advice: "DFが動いているため、その動きに注意してパスしましょう。\nパスコースはDFとDFの間の真ん中、\nパススピードは弱めの方が通りやすいでしょう。"
    },
    5: {
        title: "Game 5<br>実戦シーン再現（スロー）",
        description: "実際の試合の場面を再現したものです。動きは遅めにしてあります。味方の動き出しとどこにスペースがあるかを把握し、タイミングよくスルーパスを出しましょう。",
        highlightSkills: [0, 1, 2, 3, 4, 5],
        advice: "味方のおとりの選手の動きをしっかり見ましょう。\nおとりの選手の動きにより味方(黄色)の前に\nスペースができ、そのタイミングでパスしましょう。"
    },
    6: {
        title: "Game 6<br>実戦シーン再現 (プロ)",
        description: "Game 5をより早いスピード、現実になるべく近づけた上級版です。パススピード、そしてタイミングがよりシビアになっているため意識してみて頑張ってください。",
        highlightSkills: [0, 1, 2, 3, 4, 5],
        advice: "一瞬の判断遅れが命取りになります。\nGame 5に比べてゲームスピードが速いので\nより速い判断が必要となります。\nパススピードは強め推奨です。"
    },
    7: {
        title: "Game 7<br>デ・ブライネ",
        description: "歴代最高のパサーとも呼ばれるデ・ブライネ選手のスルーパスの場面の再現です。最も難易度の高いゲームになっています。世界トップのスルーパスを体験してみましょう。",
        highlightSkills: [0, 1, 2, 3, 4, 5],
        advice: "おとりの選手(青色)の動きをよく見ましょう。\n世界最高峰のスルーパスであるためタイミング、\nパススピード、パスコース全てがかなりシビアです。\nDFの一瞬の隙を見逃さないでください。"
    }
};

function updateLevelInfo() {
    const data = levelInfoData[currentLevel];
    if (data && uiTitle) {
        uiTitle.innerHTML = data.title;
        uiDesc.innerHTML = data.description;

        const factorsHeader = uiFactors ? uiFactors.previousElementSibling : null;
        const controlsHeader = uiControls ? uiControls.previousElementSibling : null;

        if (currentLevel === 0) {
            if (uiFactors) uiFactors.innerHTML = "";
            if (factorsHeader) factorsHeader.style.display = "none";
            if (uiControls) uiControls.innerHTML = "";
            if (controlsHeader) controlsHeader.style.display = "none";
        } else {
            if (factorsHeader) factorsHeader.style.display = "block";
            if (controlsHeader) controlsHeader.style.display = "block";

            if (uiControls) {
                if (uiControls.previousElementSibling) {
                    uiControls.previousElementSibling.textContent = "操作方法";
                }
                uiControls.style.listStyle = "none";
                uiControls.style.paddingLeft = "0";
                uiControls.style.marginTop = "0";
                uiControls.style.fontSize = "inherit";
                uiControls.style.color = "inherit";

                uiControls.innerHTML = `
                    マウスクリック：パスを出す<br>
                    矢印キー(↑↓) / 数字キー(1-5)：パススピード調整<br>
                    Enter：スタート / 次のレベルへ / リトライ
                `;
            }

            if (uiFactors && uiFactors.previousElementSibling) {
                uiFactors.previousElementSibling.textContent = "スルーパス成功における必要な技術";
            }
            uiFactors.innerHTML = "";

            SKILL_LIST.forEach((skillText, index) => {
                const li = document.createElement("li");
                li.innerText = skillText;
                li.style.listStyleType = "none";
                li.style.marginBottom = "5px";
                li.style.fontSize = "14px";
                li.style.transition = "all 0.3s ease";
                if (data.highlightSkills.includes(index)) {
                    li.style.color = "#FFD700";
                    li.style.fontWeight = "bold";
                    li.style.opacity = "1.0";
                    li.innerHTML = "★ " + skillText;
                } else {
                    li.style.color = "#FFFFFF";
                    li.style.opacity = "0.3";
                    li.style.fontWeight = "normal";
                    li.style.paddingLeft = "1.2em";
                }
                uiFactors.appendChild(li);
            });
        }
    }
}

const dist = (x1, y1, x2, y2) => Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
const atan2 = (y, x) => Math.atan2(y, x);
const random = (min, max) => Math.random() * (max - min) + min;

function polygon(x, y, radius, npoints, startAngle) {
    let angle = TWO_PI / npoints;
    c.beginPath();
    for (let i = 0; i < npoints; i++) {
        let a = startAngle + angle * i;
        let sx = x + Math.cos(a) * radius;
        let sy = y + Math.sin(a) * radius;
        if (i === 0) c.moveTo(sx, sy);
        else c.lineTo(sx, sy);
    }
    c.closePath();
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

function drawTutorialTarget(time) {
    const alpha = 0.3 + 0.3 * Math.sin(time * 0.005);
    const radius = 30 + 5 * Math.sin(time * 0.008);

    const targetX = CANVAS_WIDTH - 200;
    const targetY = CANVAS_HEIGHT / 2;

    c.save();
    c.translate(targetX, targetY);
    c.beginPath();
    c.arc(0, 0, radius, 0, TWO_PI);
    c.fillStyle = `rgba(0, 255, 255, ${alpha})`;
    c.fill();
    c.strokeStyle = `rgba(0, 255, 255, 0.8)`;
    c.lineWidth = 2;
    c.stroke();

    c.fillStyle = "white";
    c.font = "bold 14px Arial";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("AIM HERE", 0, -radius - 15);
    c.restore();
}

class Player {
    constructor(position, color) {
        this.position = position;
        this.radius = PLAYER_RUNNER_RADIUS;
        this.color = color;
        this.speed = 0;
        this.destination = null;
        this.baseY = position.y;
        this.state = "IDLE";
        this.isMovingObstacle = false;
        this.moveType = "VERTICAL";
        this.vx = 0;
        this.vy = 0;
        this.minY = 0;
        this.maxY = 0;
        this.minX = 0;
        this.maxX = 0;
        this.headingAngle = null;
    }

    draw() {
        c.fillStyle = this.color;
        c.beginPath();
        c.arc(this.position.x, this.position.y, this.radius, 0, TWO_PI);
        c.fill();
        c.strokeStyle = 'rgba(0,0,0,0.2)';
        c.lineWidth = 1;
        c.stroke();
        this.drawDirectionArrow();
    }

    drawDirectionArrow() {
        if (this.headingAngle !== null) {
            c.save();
            c.translate(this.position.x, this.position.y);
            c.rotate(this.headingAngle);
            c.fillStyle = 'rgba(0, 0, 0, 0.7)';
            c.beginPath();
            const arrowDist = this.radius + 15;
            c.moveTo(arrowDist, 0);
            c.lineTo(arrowDist - 10, -6);
            c.lineTo(arrowDist - 10, 6);
            c.closePath();
            c.fill();
            c.restore();
            this.headingAngle = null;
        }
    }

    updateObstacleMovement(timeScale) {
        if (!this.isMovingObstacle) return;

        if (this.moveType === "VERTICAL") {
            if (Math.abs(this.vy) > 0.1) {
                this.headingAngle = (this.vy > 0) ? Math.PI / 2 : -Math.PI / 2;
            }
            this.position.y += this.vy * timeScale;
            if (this.position.y < this.minY) {
                this.position.y = this.minY;
                this.vy *= -1;
            } else if (this.position.y > this.maxY) {
                this.position.y = this.maxY;
                this.vy *= -1;
            }
        } else if (this.moveType === "HORIZONTAL") {
            if (Math.abs(this.vx) > 0.1) {
                this.headingAngle = (this.vx > 0) ? 0 : Math.PI;
            }
            this.position.x += this.vx * timeScale;
            if (this.position.x < this.minX) {
                this.position.x = this.minX;
                this.vx *= -1;
            } else if (this.position.x > this.maxX) {
                this.position.x = this.maxX;
                this.vx *= -1;
            }
        }
    }

    beginMovement() {
        this.state = "SPRINT";
        this.destination = { x: CANVAS_WIDTH + 100, y: this.position.y };
    }

    interceptPass(targetX, targetY) {
        this.state = "INTERCEPT";
        this.destination = { x: targetX, y: targetY };
    }

    updatePosition(timeScale) {
        if (this.state === "SPRINT" || this.state === "INTERCEPT" || currentPass) {
            if (!this.destination) return;
            const dx = this.destination.x - this.position.x;
            const dy = this.destination.y - this.position.y;

            this.headingAngle = atan2(dy, dx);

            if (Math.sqrt(dx * dx + dy * dy) < this.speed * timeScale) {
                this.position.x = this.destination.x;
                this.position.y = this.destination.y;
                return;
            }
            const angle = this.headingAngle;
            this.position.x += Math.cos(angle) * this.speed * timeScale;
            this.position.y += Math.sin(angle) * this.speed * timeScale;
        }
    }

    moveToTarget(targetX, targetY, timeScale) {
        const dx = targetX - this.position.x;
        const dy = targetY - this.position.y;
        const distToTarget = dist(this.position.x, this.position.y, targetX, targetY);

        if (distToTarget > 2.0) {
            this.headingAngle = atan2(dy, dx);
        }

        if (distToTarget < this.speed * timeScale) {
            this.position.x = targetX;
            this.position.y = targetY;
            return;
        }
        const angle = atan2(dy, dx);
        this.position.x += Math.cos(angle) * this.speed * timeScale;
        this.position.y += Math.sin(angle) * this.speed * timeScale;
    }
}

class Pass {
    constructor(position, vx, vy, timeStart) {
        this.position = { x: position.x, y: position.y };
        this.radius = BALL_RADIUS;
        this.vx = vx;
        this.vy = vy;
        this.timeStart = timeStart;
        this.z = 0;
        this.vz = 0;
        this.isLoop = false;
        this.isDribbling = false;
        this.isHeld = false;
        this.hasShotAfterDribble = false;
    }

    update(timeScale) {
        if (this.isHeld) return;

        this.position.x += this.vx * timeScale;
        this.position.y += this.vy * timeScale;
        if (this.z > 0 || this.vz > 0) {
            this.z += this.vz * timeScale;
            this.vz -= GRAVITY * timeScale;
            if (this.z < 0) {
                this.z = 0;
                this.vz = 0;
            }
        }
    }

    draw() {
        const patternRotationSpeed = Math.sqrt(this.vx ** 2 + this.vy ** 2) * 0.02;
        const shadowScale = 1 - (this.z / 200);
        const shadowAlpha = 0.5 - (this.z / 300);

        if (shadowScale > 0) {
            c.save();
            c.translate(this.position.x, this.position.y);
            c.scale(1, 0.5);
            c.fillStyle = `rgba(0, 0, 0, ${Math.max(0, shadowAlpha)})`;
            c.beginPath();
            c.arc(0, 0, this.radius * shadowScale, 0, TWO_PI);
            c.fill();
            c.restore();
        }

        const ballScale = 1 + (this.z / 200);
        c.save();
        c.translate(this.position.x, this.position.y - this.z);
        c.scale(ballScale, ballScale);
        c.rotate(performance.now() * 0.001 * patternRotationSpeed);
        c.fillStyle = 'rgb(255, 255, 255)';
        c.strokeStyle = 'rgb(0, 0, 0)';
        c.lineWidth = 1;
        c.beginPath();
        c.arc(0, 0, this.radius, 0, TWO_PI);
        c.fill();
        c.stroke();
        c.fillStyle = 'rgb(0, 0, 0)';
        polygon(0, 0, this.radius * 0.4, 5, 0);
        c.fill();

        const offsetRadius = this.radius * 0.7;
        const numSurroundingPentagons = 5;
        for (let i = 0; i < numSurroundingPentagons; i++) {
            const angle = TWO_PI / numSurroundingPentagons * i + PI / 5;
            const px = Math.cos(angle) * offsetRadius;
            const py = Math.sin(angle) * offsetRadius;
            polygon(px, py, this.radius * 0.25, 5, 0);
            c.fill();
        }
        c.restore();
    }
}

// --- ゲームロジック ---

function startGame() {
    if (isGameStarted) return;
    isGameStarted = true;
    gameStartTime = performance.now();
}

function resetGame() {
    updateLevelInfo();
    isGameCompleted = false;
    isAdviceOpen = false;
    currentPass = null;
    showSuccess = false;
    resultText = "";
    isGameStarted = false;
    isPlayActive = false;
    isShooting = false;
    isCrossing = false;
    isPrePassDribble = false;
    tacticalTriggered = false;
    tacticalStartTime = 0;
    game7Phase = 0;
    phase1StartTime = 0;
    phase2StartTime = 0;
    isRunnerBreaking = false;
    keeperStrategy = 0;
    isKeeperBeaten = false;
    passPowerLevel = 3;
    initialRunnerSpeed = random(4.0, 5.5);
    obstacles = [];
    const obsX = OBSTACLE_X_FIXED;
    maxObstacleX = obsX;

    let runnerY;
    let passerY;

    if (currentLevel === 0) {
        striker = null;
        obstacles = [];
        maxObstacleX = 250;

        const runnerX = 200;
        runnerY = CANVAS_HEIGHT / 2;
        runner = new Player({ x: runnerX, y: runnerY }, 'rgb(255, 255, 0)');
        initialRunnerSpeed = 4.0;
        runner.speed = initialRunnerSpeed;

        passerY = CANVAS_HEIGHT / 2 + 150;
        passer = new Player({ x: 100, y: passerY }, 'rgb(0, 150, 255)');

        currentPass = new Pass(
            { x: passer.position.x + 15, y: passer.position.y },
            0, 0, performance.now()
        );
        currentPass.isHeld = true;

    } else if (currentLevel === 1 || currentLevel === 3) {
        striker = null;
        let df1 = new Player({ x: obsX, y: CANVAS_HEIGHT / 2 - 90 }, 'rgb(255, 50, 50)');
        let df2 = new Player({ x: obsX, y: CANVAS_HEIGHT / 2 + 90 }, 'rgb(255, 50, 50)');

        if (currentLevel === 3) {
            df1.isMovingObstacle = true;
            df1.moveType = "HORIZONTAL";
            df1.minX = obsX - 50;
            df1.maxX = obsX + 50;
            df1.vx = 1.0;
            df1.speed = 1.6;

            df2.isMovingObstacle = true;
            df2.moveType = "HORIZONTAL";
            df2.minX = obsX - 50;
            df2.maxX = obsX + 50;
            df2.vx = -1.0;
            df2.speed = 1.6;
        }

        obstacles.push(df1);
        obstacles.push(df2);

        const runnerX = obsX - 150;
        runnerY = CANVAS_HEIGHT / 2;
        runner = new Player({ x: runnerX, y: runnerY }, 'rgb(255, 255, 0)');

        const passerYOffset = 150;
        const isPasserTop = Math.random() < 0.5;
        passerY = isPasserTop ? (CANVAS_HEIGHT / 2 - passerYOffset) : (CANVAS_HEIGHT / 2 + passerYOffset);

    } else if (currentLevel === 2 || currentLevel === 4) {
        const isTopPattern = Math.random() < 0.5;
        const unitH = CANVAS_HEIGHT / 5;
        let strikerY;

        let df1, df2;
        if (isTopPattern) {
            df1 = new Player({ x: obsX, y: unitH * 0.7 }, 'rgb(255, 50, 50)');
            df2 = new Player({ x: obsX, y: unitH * 2 }, 'rgb(255, 50, 50)');
            runnerY = 50;
            strikerY = CANVAS_HEIGHT / 2 + 80;
        } else {
            df1 = new Player({ x: obsX, y: unitH * 3 }, 'rgb(255, 50, 50)');
            df2 = new Player({ x: obsX, y: unitH * 4.3 }, 'rgb(255, 50, 50)');
            runnerY = 526;
            strikerY = CANVAS_HEIGHT / 2 - 80;
        }

        if (currentLevel === 4) {
            df1.isMovingObstacle = true;
            df1.moveType = "HORIZONTAL";
            df1.minX = obsX - 50;
            df1.maxX = obsX + 50;
            df1.vx = 0.8;
            df1.speed = 1.6;

            df2.isMovingObstacle = true;
            df2.moveType = "HORIZONTAL";
            df2.minX = obsX - 50;
            df2.maxX = obsX + 50;
            df2.vx = -0.8;
            df2.speed = 1.6;
        }

        obstacles.push(df1);
        obstacles.push(df2);

        const runnerInitialX = random(startXRange.min, startXRange.max);
        runner = new Player({ x: runnerInitialX, y: runnerY }, 'rgb(255, 255, 0)');

        striker = new Player({ x: obsX, y: strikerY }, 'rgb(0, 150, 255)');
        striker.speed = initialRunnerSpeed * 1.3;

        const passerYOffset = 100;
        if (isTopPattern) {
            passerY = (CANVAS_HEIGHT / 2) - passerYOffset;
        } else {
            passerY = (CANVAS_HEIGHT / 2) + passerYOffset;
        }
        passerY += random(-30, 30);

    } else if (currentLevel === 5 || currentLevel === 6) {
        isPrePassDribble = true;
        const dfLineX = 430;
        maxObstacleX = dfLineX;

        const df1Y = CANVAS_HEIGHT / 2 - 100;
        const df2Y = CANVAS_HEIGHT / 2 + 50;

        let df1 = new Player({ x: dfLineX, y: df1Y }, 'rgb(255, 50, 50)');
        df1.vx = (currentLevel === 6) ? 0.7 : 0.4;
        df1.speed = (currentLevel === 5) ? 0.9 : 4.5;
        df1.headingAngle = 0;
        obstacles.push(df1);

        let df2 = new Player({ x: dfLineX, y: df2Y }, 'rgb(255, 50, 50)');
        df2.vx = (currentLevel === 6) ? 0.7 : 0.4;
        df2.speed = (currentLevel === 5) ? 0.9 : 4.5;
        df2.headingAngle = 0;
        obstacles.push(df2);

        const passerX = (currentLevel === 6) ? 60 : 80;
        const passerYFixed = CANVAS_HEIGHT / 2;
        passer = new Player({ x: passerX, y: passerYFixed }, 'rgb(0, 150, 255)');
        passer.vx = (currentLevel === 6) ? 1.0 : 0.6;
        passer.headingAngle = 0;

        currentPass = new Pass(
            { x: passer.position.x + 15, y: passer.position.y },
            0, 0, performance.now()
        );
        currentPass.isHeld = true;

        const runnerX = dfLineX - 30;
        const runnerYTarget = df1Y + (df2Y - df1Y) * 0.65;
        runner = new Player({ x: runnerX, y: runnerYTarget }, 'rgb(0, 150, 255)');
        runner.speed = 1.0;
        runner.vx = 0.4;
        runner.headingAngle = 0;

        const strikerX = 350;
        const strikerY = CANVAS_HEIGHT / 2 + 80;
        striker = new Player({ x: strikerX, y: strikerY }, 'rgb(255, 255, 0)');
        striker.speed = 1.0;
        striker.vx = 0.7;
        striker.headingAngle = 0;

        let blocker = new Player({ x: 320, y: runnerYTarget }, 'rgb(255, 50, 50)');
        blocker.vx = (currentLevel === 5) ? -0.3 : -0.5;
        obstacles.push(blocker);

    } else if (currentLevel === 7) {
        isPrePassDribble = true;

        const dfBaseX = 240;
        const shiftedBaseX = dfBaseX + 40;

        let df3 = new Player({ x: shiftedBaseX, y: 50 }, 'rgb(255, 50, 50)');
        df3.vx = 0.5;
        df3.vy = 0;
        df3.speed = 3.0;
        obstacles.push(df3);

        let df2 = new Player({ x: shiftedBaseX, y: 190 }, 'rgb(255, 50, 50)');
        df2.vx = 0.5;
        df2.vy = 0;
        df2.speed = 3.0;
        obstacles.push(df2);

        let df1 = new Player({ x: dfBaseX + 100, y: 340 }, 'rgb(255, 50, 50)');
        df1.vx = 0.5;
        df1.vy = 0;
        df1.speed = 3.0;
        obstacles.push(df1);

        maxObstacleX = df1.position.x;

        passer = new Player({ x: 100, y: 450 }, 'rgb(0, 150, 255)');
        passer.vx = 1.0;
        passer.headingAngle = 0;

        currentPass = new Pass(
            { x: passer.position.x + 15, y: passer.position.y },
            0, 0, performance.now()
        );
        currentPass.isHeld = true;

        striker = new Player({ x: shiftedBaseX, y: 240 }, 'rgb(255, 255, 0)');
        striker.vx = 0.2;
        striker.vy = 0;
        striker.headingAngle = 0;

        runner = new Player({ x: shiftedBaseX, y: df1.position.y - 25 }, 'rgb(0, 150, 255)');
        runner.vx = 0;
        runner.vy = 0;
        runner.headingAngle = 0;
    }

    if (currentLevel !== 0 && currentLevel !== 5 && currentLevel !== 6 && currentLevel !== 7) {
        runner.speed = initialRunnerSpeed;
        passer = new Player({ x: 180, y: passerY }, 'rgb(0, 150, 255)');

        currentPass = new Pass(
            { x: passer.position.x + 15, y: passer.position.y },
            0, 0, performance.now()
        );
        currentPass.isHeld = true;
    }

    keeper = new Player(
        { x: CANVAS_WIDTH - 60, y: CANVAS_HEIGHT / 2 },
        'rgb(255, 50, 50)'
    );

    const speedRoll = Math.random();
    let speedMultiplier;
    if (speedRoll < 0.33) speedMultiplier = 0.45;
    else if (speedRoll < 0.66) speedMultiplier = 0.55;
    else speedMultiplier = 0.65;

    if (currentLevel === 6) speedMultiplier = 0.7;
    if (currentLevel === 7) speedMultiplier = 0.65;
    if (currentLevel === 5) speedMultiplier = 0.18;
    if (currentLevel === 0) speedMultiplier = 0.3;

    keeper.speed = initialRunnerSpeed * speedMultiplier;
}

function updateLogic(timeScale) {
    if (obstacles.length > 0) {
        let maxX = 0;
        for (let obs of obstacles) {
            if (obs.position.x > maxX) maxX = obs.position.x;
        }
        maxObstacleX = maxX;
    }

    if (isPrePassDribble && isGameStarted && (currentLevel >= 5)) {
        passer.position.x += passer.vx * timeScale;

        currentPass.position.x = passer.position.x + 15;
        currentPass.position.y = passer.position.y;

        if (currentLevel === 7) {
            const timeSinceStart = performance.now() - gameStartTime;
            const now = performance.now();

            let botDf = obstacles[2];
            let runnerRightX = runner.position.x + PLAYER_RUNNER_RADIUS;
            let df1CenterX = botDf.position.x;

            if (timeSinceStart > 500) {
                runner.vx = 1.2;
                runner.vy = 1.0;
                runner.headingAngle = atan2(runner.vy, runner.vx);

                if (game7Phase === 0 && timeSinceStart > 600) {
                    game7Phase = 1;
                    phase1StartTime = now;
                }
            }
            runner.position.x += runner.vx * timeScale;
            runner.position.y += runner.vy * timeScale;

            if (timeSinceStart > 700) {
                botDf.vx = 1.2;
                botDf.vy = 1.0;
            } else {
                botDf.vx = 0.4;
                botDf.vy = 0;
            }
            botDf.position.x += botDf.vx * timeScale;
            botDf.position.y += botDf.vy * timeScale;
            botDf.headingAngle = atan2(botDf.vy, botDf.vx);

            if (game7Phase === 0) {
                striker.vx = 0.2;
                striker.vy = 0;
            } else if (game7Phase === 1) {
                striker.vx = 0;
                striker.vy = 2.0;
                striker.headingAngle = Math.PI / 2;
                if (striker.position.y > 270) {
                    game7Phase = 2;
                    phase2StartTime = now;
                }
            } else if (game7Phase === 2) {
                striker.vx = 4.5;
                striker.vy = 0;
                striker.headingAngle = 0;
            }
            striker.position.x += striker.vx * timeScale;
            striker.position.y += striker.vy * timeScale;

            let topDf = obstacles[1];
            const REACTION_DELAY = 200;

            if (game7Phase === 0) {
                topDf.vx = 0.4;
                topDf.vy = 0;
            } else if (game7Phase === 1) {
                if (now - phase1StartTime < REACTION_DELAY) {
                    topDf.vx = 0.4;
                    topDf.vy = 0;
                } else {
                    topDf.vx = 0;
                    topDf.vy = 1.8;
                }
            } else if (game7Phase === 2) {
                if (now - phase2StartTime < REACTION_DELAY) {
                    topDf.vx = 0;
                    topDf.vy = 1.8;
                } else {
                    topDf.vx = 2.2;
                    topDf.vy = 0;
                }
            }

            topDf.position.x += topDf.vx * timeScale;
            topDf.position.y += topDf.vy * timeScale;
            topDf.headingAngle = atan2(topDf.vy, topDf.vx);

            obstacles[0].position.x += 0.4 * timeScale;

            for (let obs of obstacles) {
                if (obs.position.y > CANVAS_HEIGHT - 50 || obs.position.y < 50) obs.vy *= -1;
                if (obs.position.x > CANVAS_WIDTH - 150) obs.vx = 0;
            }

        } else {
            if (!tacticalTriggered && currentPass.position.x > CENTER_LINE_X) {
                tacticalTriggered = true;
                tacticalStartTime = performance.now();

                if (currentLevel === 6) {
                    runner.vy = -3.0;
                    runner.vx = 0;
                    obstacles[1].vy = -3.0;
                    obstacles[1].vx = 0;
                    obstacles[0].vx = -2.0;
                    obstacles[0].vy = 1.5;
                    striker.vx = 3.0;
                } else {
                    runner.vy = -1.2;
                    runner.vx = 0;
                    obstacles[1].vy = -1.2;
                    obstacles[1].vx = 0;
                    obstacles[0].vx = -0.5;
                    obstacles[0].vy = 0.5;
                    striker.vx = 1.2;
                }
            }

            runner.position.x += runner.vx * timeScale;
            if (runner.vy) runner.position.y += runner.vy * timeScale;
            runner.headingAngle = atan2(runner.vy || 0, runner.vx);

            striker.position.x += striker.vx * timeScale;
            striker.headingAngle = 0;

            for (let i = 0; i < obstacles.length; i++) {
                let obs = obstacles[i];
                obs.position.x += obs.vx * timeScale;
                if (obs.vy !== 0) obs.position.y += obs.vy * timeScale;
                if (obs.vx < 0) obs.headingAngle = Math.PI;
                else obs.headingAngle = 0;
                if (obs.vy !== 0) obs.headingAngle = atan2(obs.vy, obs.vx);
                if (obs.position.x > CANVAS_WIDTH - 150 && obs.vx > 0) obs.position.x = CANVAS_WIDTH - 150;
            }
            for (let obs of obstacles) {
                const distToPasser = dist(passer.position.x, passer.position.y, obs.position.x, obs.position.y);
                if (distToPasser < PLAYER_RUNNER_RADIUS * 2) {
                    resultText = "CAUGHT!!";
                    currentPass = null;
                    isGameStarted = false;
                    return;
                }
            }
        }
        return;
    }

    for (let obs of obstacles) {
        let isReacting = false;
        if (currentPass && !currentPass.isHeld && (currentLevel >= 3)) {
            const timeSincePass = performance.now() - currentPass.timeStart;
            const reactionTime = 200;

            if (timeSincePass > reactionTime) {
                isReacting = true;
                if (currentLevel >= 5) {
                    if (currentLevel === 7) obs.speed = 2.2;
                    else obs.speed = 1.5;

                    const bx = currentPass.position.x;
                    const by = currentPass.position.y;
                    const bvx = currentPass.vx;
                    const bvy = currentPass.vy;
                    const dx = obs.position.x - bx;
                    const dy = obs.position.y - by;
                    const dot = dx * bvx + dy * bvy;
                    const vecLenSq = bvx * bvx + bvy * bvy;
                    let targetX, targetY;
                    if (vecLenSq > 0) {
                        const t = dot / vecLenSq;
                        if (t < 0) { targetX = bx; targetY = by; }
                        else { targetX = bx + bvx * t; targetY = by + bvy * t; }
                    } else { targetX = bx; targetY = by; }

                    obs.moveToTarget(targetX, targetY, timeScale);

                } else {
                    obs.moveToTarget(currentPass.position.x, currentPass.position.y, timeScale);
                }
            }
        }

        if (!isReacting) {
            if (obs.isMovingObstacle && isGameStarted) {
                obs.updateObstacleMovement(timeScale);
            } else if ((currentLevel >= 5) && isGameStarted) {
                obs.position.x += obs.vx * timeScale;
                if (obs.vy !== 0) obs.position.y += obs.vy * timeScale;
                if (obs.position.x > CANVAS_WIDTH - 150 && obs.vx > 0) obs.position.x = CANVAS_WIDTH - 150;
            }
        }
    }

    if (!isGameStarted) return;
    const time = performance.now();
    const elapsedTime = time - gameStartTime;

    if (currentLevel < 5) {
        if (elapsedTime < READY_DURATION + COUNTDOWN_DURATION) return;
    }

    if (!isPlayActive) {
        isPlayActive = true;
        if (currentLevel < 5) {
            runner.beginMovement();
        }
    }

    if (!isShooting && !isCrossing) {
        runner.updatePosition(timeScale);
        if (striker) striker.updatePosition(timeScale);
    } else {
        if (isCrossing && striker) striker.updatePosition(timeScale);
    }

    if (currentPass) {
        updatePassLogic(timeScale);

        if (currentPass && keeper && !isShooting && !isKeeperBeaten) {
            const goalCenterY = CANVAS_HEIGHT / 2;
            if (keeperStrategy === 0) {
                keeper.moveToTarget(keeper.position.x, goalCenterY, timeScale);
            } else {
                if (isCrossing) {
                    keeper.moveToTarget(striker.position.x, striker.position.y, timeScale);
                } else if (currentPass.isDribbling && (currentLevel === 2 || currentLevel === 4)) {
                    keeper.moveToTarget(runner.position.x, runner.position.y, timeScale);
                } else {
                    if (currentLevel >= 5) {
                        keeper.moveToTarget(striker.position.x, striker.position.y, timeScale);
                    } else {
                        keeper.moveToTarget(runner.position.x, runner.position.y, timeScale);
                    }
                }
            }
        }
    }
}

function handleGoal(text) {
    resultText = text;
    showSuccess = true;
}

function updatePassLogic(timeScale) {
    currentPass.update(timeScale);

    if (currentPass.isDribbling) {
        let dribbler = runner;
        if (currentLevel >= 5) dribbler = striker;

        currentPass.vx = dribbler.speed;
        currentPass.vy = (dribbler.position.y - currentPass.position.y) * 0.1;

        if (currentPass.position.x < dribbler.position.x + 12) {
            currentPass.position.x = dribbler.position.x + 12;
        }

        if ((currentLevel === 2 || currentLevel === 4) && striker) {
            const CROSS_LINE_X = CANVAS_WIDTH - 120;
            if (currentPass.position.x > CROSS_LINE_X) {
                currentPass.isDribbling = false;
                isCrossing = true;
                const targetX = CANVAS_WIDTH - 120;
                const targetY = striker.baseY;
                const dx = targetX - currentPass.position.x;
                const dy = targetY - currentPass.position.y;
                const angle = Math.atan2(dy, dx);
                currentPass.vx = Math.cos(angle) * CROSS_SPEED;
                currentPass.vy = Math.sin(angle) * CROSS_SPEED;
                currentPass.z = 0;
                const distToTarget = Math.sqrt(dx * dx + dy * dy);
                const flightTime = distToTarget / CROSS_SPEED;
                currentPass.vz = 0.5 * GRAVITY * (flightTime * 0.9);
                striker.interceptPass(targetX, targetY);
                return;
            }
        }

        let shouldForceShoot = false;
        if (currentLevel === 2 || currentLevel === 4) {
            if (currentPass.position.x > CANVAS_WIDTH - 20) shouldForceShoot = true;
        } else {
            const safetyMargin = 20;
            const isTooHigh = currentPass.position.y < GOAL_Y_TOP + safetyMargin;
            const isTooLow = currentPass.position.y > GOAL_Y_BOTTOM - safetyMargin;
            const isPastKeeper = currentPass.position.x > keeper.position.x + 20;
            const isNearGoalLine = currentPass.position.x > CANVAS_WIDTH - 50;
            if ((isPastKeeper || isNearGoalLine || isTooHigh || isTooLow) && !currentPass.hasShotAfterDribble) {
                shouldForceShoot = true;
            }
        }

        if (shouldForceShoot && !currentPass.hasShotAfterDribble) {
            currentPass.isDribbling = false;
            currentPass.hasShotAfterDribble = true;
            const targetX = CANVAS_WIDTH;
            const targetY = CANVAS_HEIGHT / 2;
            const dx = targetX - currentPass.position.x;
            const dy = targetY - currentPass.position.y;
            const angleToGoal = Math.atan2(dy, dx);
            currentPass.vx = Math.cos(angleToGoal) * SHOT_SPEED;
            currentPass.vy = Math.sin(angleToGoal) * SHOT_SPEED;

            if (currentLevel >= 5) striker.destination = { x: striker.position.x, y: striker.position.y };
            else runner.destination = { x: runner.position.x, y: runner.position.y };
        }
        return;
    }

    if (!isShooting && !isCrossing) {
        for (let obs of obstacles) {
            const distToObs = dist(currentPass.position.x, currentPass.position.y, obs.position.x, obs.position.y);
            let threshold = (currentLevel === 2 || currentLevel === 4) ? (BALL_RADIUS + PLAYER_RUNNER_RADIUS) : RUNNER_CATCH_DISTANCE;
            if (currentLevel >= 5 && currentPass) {
                threshold = PLAYER_RUNNER_RADIUS + BALL_RADIUS - 5;
            }

            if (distToObs < threshold) {
                resultText = "BLOCKED BY DEFENDER";
                currentPass = null;
                return;
            }
        }
    }

    if (keeper && !isShooting && !isKeeperBeaten) {
        const distToKeeper = dist(currentPass.position.x, currentPass.position.y, keeper.position.x, keeper.position.y);
        if (distToKeeper < KEEPER_SAVE_DISTANCE && currentPass.z < KEEPER_REACH_HEIGHT) {
            resultText = "KEEPER INTERCEPTED";
            currentPass = null;
            return;
        }
    }

    if ((currentLevel >= 5) && !isShooting && !isCrossing) {
        const distStrikerToPass = dist(striker.position.x, striker.position.y, currentPass.position.x, currentPass.position.y);
        const distRunnerToPass = dist(runner.position.x, runner.position.y, currentPass.position.x, currentPass.position.y);

        let receiver = null;
        if (distStrikerToPass < RUNNER_CATCH_DISTANCE) receiver = striker;
        else if (currentLevel === 7 && distRunnerToPass < RUNNER_CATCH_DISTANCE) receiver = runner;

        if (receiver) {
            if (currentLevel === 7 && receiver === runner) {
                resultText = "MISS (Decoy cannot score)";
                currentPass = null;
                return;
            }

            if (currentLevel === 7) {
                if (receiver.position.x < maxObstacleX) {
                    resultText = "MISS (Too Early)";
                    currentPass = null;
                    return;
                }
            } else {
                const receiverRight = receiver.position.x + PLAYER_RUNNER_RADIUS;
                const dfLineRight = maxObstacleX + PLAYER_RUNNER_RADIUS;
                if (receiverRight <= dfLineRight) {
                    resultText = "MISS (Too Early)";
                    currentPass = null;
                    return;
                }
            }

            currentPass.position.x = receiver.position.x;
            currentPass.position.y = receiver.position.y;

            isShooting = true;
            receiver.state = "SHOOT";

            let targetY;
            const goalPadding = 30;
            if (Math.random() < 0.5) targetY = GOAL_Y_TOP + goalPadding;
            else targetY = GOAL_Y_BOTTOM - goalPadding;

            const targetX = CANVAS_WIDTH;
            const dx = targetX - currentPass.position.x;
            const dy = targetY - currentPass.position.y;
            const angle = Math.atan2(dy, dx);
            currentPass.vx = Math.cos(angle) * SHOT_SPEED;
            currentPass.vy = Math.sin(angle) * SHOT_SPEED;
            return;
        }
    }

    if (currentLevel < 5 && !isShooting && !isCrossing) {
        const distRunnerToPass = dist(runner.position.x, runner.position.y, currentPass.position.x, currentPass.position.y);
        if (distRunnerToPass < RUNNER_CATCH_DISTANCE) {
            const receiverRight = runner.position.x + PLAYER_RUNNER_RADIUS;
            const dfLineRight = maxObstacleX + PLAYER_RUNNER_RADIUS;

            if (currentLevel !== 0) {
                if (receiverRight <= dfLineRight) {
                    resultText = "MISS (Too Early)";
                    currentPass = null;
                    return;
                }
            }

            currentPass.position.x = runner.position.x;
            currentPass.position.y = runner.position.y;
            if ((currentLevel === 2 || currentLevel === 4) && striker) {
                currentPass.isDribbling = true;
                const safeMargin = 100;
                let targetRunY = runner.position.y;
                if (targetRunY < safeMargin) targetRunY = safeMargin;
                if (targetRunY > CANVAS_HEIGHT - safeMargin) targetRunY = CANVAS_HEIGHT - safeMargin;
                runner.destination = { x: CANVAS_WIDTH - 20, y: targetRunY };
                runner.speed = DRIBBLE_SPEED;
            } else {
                isShooting = true;
                runner.state = "SHOOT";
                let targetY;
                const goalPadding = 30;
                if (Math.random() < 0.5) targetY = GOAL_Y_TOP + goalPadding;
                else targetY = GOAL_Y_BOTTOM - goalPadding;
                const targetX = CANVAS_WIDTH;
                const dx = targetX - currentPass.position.x;
                const dy = targetY - currentPass.position.y;
                const angle = Math.atan2(dy, dx);
                currentPass.vx = Math.cos(angle) * SHOT_SPEED;
                currentPass.vy = Math.sin(angle) * SHOT_SPEED;
            }
            return;
        }
    }

    if (isCrossing && striker) {
        const distStrikerToPass = dist(striker.position.x, striker.position.y, currentPass.position.x, currentPass.position.y);
        if (distStrikerToPass < RUNNER_CATCH_DISTANCE) {
            isCrossing = false;
            isShooting = true;
            striker.state = "SHOOT";
            currentPass.position.x = striker.position.x;
            currentPass.position.y = striker.position.y;
            currentPass.z = 10;
            let targetY;
            const goalPadding = 30;
            if (Math.random() < 0.5) targetY = GOAL_Y_TOP + goalPadding;
            else targetY = GOAL_Y_BOTTOM - goalPadding;
            const targetX = CANVAS_WIDTH;
            const dx = targetX - currentPass.position.x;
            const dy = targetY - currentPass.position.y;
            const angle = Math.atan2(dy, dx);
            currentPass.vx = Math.cos(angle) * SHOT_SPEED;
            currentPass.vy = Math.sin(angle) * SHOT_SPEED;
            currentPass.vz = 0;
        }
    }

    if (currentPass.position.x > CANVAS_WIDTH) {
        if (isShooting) {
            const CROSSBAR_HEIGHT = 80;
            if (currentPass.position.y > GOAL_Y_TOP && currentPass.position.y < GOAL_Y_BOTTOM) {
                if (currentPass.z < CROSSBAR_HEIGHT) {
                    if (currentLevel === 2 || currentLevel === 4) handleGoal("NICE VOLLEY GOAL!!");
                    else if (currentLevel === 0) handleGoal("SUCCESS! (Next: Game 1)");
                    else handleGoal("GOAL!!");
                } else {
                    resultText = "MISS (Over the bar)";
                }
            } else {
                resultText = "MISS (Off Target)";
            }
        } else {
            resultText = "MISS";
        }
        currentPass = null;
        return;
    }

    if (currentPass.position.x < -30 || currentPass.position.y < -30 || currentPass.position.y > CANVAS_HEIGHT + 30) {
        resultText = "MISS";
        currentPass = null;
    }
}

function drawField() {
    c.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    c.fillStyle = '#4CAF50';
    c.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    c.strokeStyle = '#ffffff';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(CENTER_LINE_X, 0);
    c.lineTo(CENTER_LINE_X, CANVAS_HEIGHT);
    c.stroke();
    c.beginPath();
    c.arc(CENTER_LINE_X, CANVAS_HEIGHT / 2, 80, 0, TWO_PI);
    c.stroke();
    const goalX = CANVAS_WIDTH - GOAL_WIDTH;
    c.fillStyle = 'rgba(255, 255, 255, 0.3)';
    c.fillRect(goalX, GOAL_Y_TOP, GOAL_WIDTH, GOAL_HEIGHT);
    c.strokeStyle = '#ffffff';
    c.lineWidth = 4;
    c.strokeRect(goalX, GOAL_Y_TOP, GOAL_WIDTH, GOAL_HEIGHT);
    c.lineWidth = 1;
    c.beginPath();
    for (let i = 0; i <= GOAL_WIDTH; i += 10) {
        c.moveTo(goalX + i, GOAL_Y_TOP);
        c.lineTo(goalX + i, GOAL_Y_BOTTOM);
    }
    for (let j = 0; j <= GOAL_HEIGHT; j += 10) {
        c.moveTo(goalX, GOAL_Y_TOP + j);
        c.lineTo(goalX + GOAL_WIDTH, GOAL_Y_TOP + j);
    }
    c.stroke();
}

function drawPowerGauge() {
    if (!passer) return;
    const barWidth = 24;
    const barHeight = 10;
    const gap = 3;
    const startX = passer.position.x - barWidth / 2;
    const startY = passer.position.y - 40;
    for (let i = 1; i <= MAX_POWER_LEVEL; i++) {
        c.fillStyle = 'rgba(0, 0, 0, 0.5)';
        if (i <= passPowerLevel) {
            if (i <= 2) c.fillStyle = '#00FF00';
            else if (i === 3) c.fillStyle = '#FFFF00';
            else if (i === 4) c.fillStyle = '#FFA500';
            else c.fillStyle = '#FF0000';
        }
        const currentY = startY - (i - 1) * (barHeight + gap);
        c.fillRect(startX, currentY, barWidth, barHeight);
        c.strokeStyle = 'white';
        c.lineWidth = 1;
        c.strokeRect(startX, currentY, barWidth, barHeight);
    }
    if (!currentPass || currentPass.isHeld) {
        c.fillStyle = 'white';
        c.font = '14px Arial';
        c.textAlign = 'center';
        const topY = startY - (MAX_POWER_LEVEL - 1) * (barHeight + gap);
        c.fillText("↑↓", passer.position.x, topY - 10);
    }
}

function drawButton(text, x, y, w, h, colorType = 'primary', fontSize = '24px') {
    c.fillStyle = 'rgba(0, 0, 0, 0.5)';
    drawRoundedRect(c, x + 4, y + 4, w, h, 10);
    c.fill();

    let strokeColor, textColor;
    if (colorType === 'primary') {
        strokeColor = '#00FF00';
        textColor = '#00FF00';
        c.shadowColor = '#00AA00';
    } else if (colorType === 'debug') {
        strokeColor = '#FF5555';
        textColor = '#FF5555';
        c.shadowColor = '#AA0000';
    } else if (colorType === 'info') {
        strokeColor = '#00FFFF';
        textColor = '#00FFFF';
        c.shadowColor = '#00AAAA';
    } else {
        strokeColor = '#CCCCCC';
        textColor = '#FFFFFF';
        c.shadowColor = 'rgba(255, 255, 255, 0.3)';
    }

    c.fillStyle = 'rgba(0, 0, 0, 0.9)';
    drawRoundedRect(c, x, y, w, h, 10);
    c.fill();
    c.strokeStyle = strokeColor;
    c.lineWidth = 3;
    c.stroke();

    c.fillStyle = textColor;
    c.font = `bold ${fontSize} Arial`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(text, x + w / 2, y + h / 2);

    c.shadowBlur = 0;
    c.shadowColor = 'transparent';
}

function drawOverlay() {
    if (isGameCompleted) {
        c.fillStyle = 'rgba(0, 0, 0, 0.9)';
        c.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        c.textAlign = 'center';
        c.textBaseline = 'middle';

        c.fillStyle = '#FFD700';
        c.font = 'bold 50px Arial';
        c.fillText("Thank You For Playing!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

        c.fillStyle = '#FFFFFF';
        c.font = '20px Arial';
        c.fillText("All Levels Cleared.", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);

        c.fillStyle = '#888888';
        c.font = '16px Arial';
        c.fillText("Click to Return to Title", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
        return;
    }

    if (showSuccess || (resultText !== "" && resultText !== "SUCCESS")) {
        c.fillStyle = 'rgba(255, 255, 255, 0.8)';
        c.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        c.textAlign = 'center';
        c.font = '40px Arial';
        c.textBaseline = 'alphabetic';

        if (showSuccess) {
            c.fillStyle = 'rgb(0, 200, 0)';
            c.fillText(resultText, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

            drawButton("Replay", BTN_LEFT_X, BTN_Y, BTN_SIDE_W, BTN_H, 'secondary');

            let nextText = "Next Game";
            if (currentLevel === 0) nextText = "Start Game 1";

            drawButton(nextText, BTN_RIGHT_X, BTN_Y, BTN_SIDE_W, BTN_H, 'primary');
        } else {
            if (resultText === "OFFSIDE") c.fillStyle = 'rgb(255, 165, 0)';
            else c.fillStyle = 'rgb(255, 0, 0)';
            c.fillText(resultText, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
            c.fillStyle = 'rgb(0, 0, 0)';
            c.font = '16px Arial';
            c.fillText("Click/Enter to Retry", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
        }
        return;
    }

    if (!isGameStarted) {
        if (isAdviceOpen) {
            c.fillStyle = 'rgba(0, 0, 0, 0.9)';
            c.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            const MODAL_W = 500;
            const MODAL_H = 300;
            const MODAL_X = CANVAS_WIDTH / 2 - MODAL_W / 2;
            const MODAL_Y = CANVAS_HEIGHT / 2 - MODAL_H / 2;

            c.strokeStyle = '#00FFFF';
            c.lineWidth = 4;
            c.fillStyle = 'rgba(20, 30, 40, 0.95)';
            drawRoundedRect(c, MODAL_X, MODAL_Y, MODAL_W, MODAL_H, 20);
            c.stroke();
            c.fill();

            c.textAlign = 'center';
            c.textBaseline = 'middle';

            c.fillStyle = '#00FFFF';
            c.font = 'bold 28px Arial';
            c.fillText("TIPS / アドバイス", CANVAS_WIDTH / 2, MODAL_Y + 40);

            c.fillStyle = '#FFFFFF';
            c.font = '18px Arial';
            const adviceText = levelInfoData[currentLevel] ? levelInfoData[currentLevel].advice : "No advice available.";
            const lines = adviceText.split("\n");
            lines.forEach((line, i) => {
                c.fillText(line, CANVAS_WIDTH / 2, MODAL_Y + 100 + (i * 30));
            });

            const CLOSE_BTN_W = 120;
            const CLOSE_BTN_H = 40;
            const CLOSE_BTN_X = CANVAS_WIDTH / 2 - CLOSE_BTN_W / 2;
            const CLOSE_BTN_Y = MODAL_Y + MODAL_H - 70;

            drawButton("Close", CLOSE_BTN_X, CLOSE_BTN_Y, CLOSE_BTN_W, CLOSE_BTN_H, 'secondary', '18px');
            return;
        }

        c.fillStyle = 'rgba(20, 20, 30, 0.85)';
        c.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        c.textAlign = 'center';
        c.textBaseline = 'middle';

        let startMsg = levelInfoData[currentLevel] ? levelInfoData[currentLevel].title : "";
        const lines = startMsg.split("<br>");

        c.shadowColor = '#00FFFF';
        c.shadowBlur = 20;
        c.fillStyle = '#FFFFFF';

        lines.forEach((line, index) => {
            if (index === 0) {
                c.font = 'bold 24px Arial';
                c.fillText(line, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 120);
            } else {
                c.font = 'bold 48px Arial';
                c.fillText(line, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 70);
            }
        });
        c.shadowBlur = 0;

        c.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(CANVAS_WIDTH / 2 - 200, CANVAS_HEIGHT / 2 - 20);
        c.lineTo(CANVAS_WIDTH / 2 + 200, CANVAS_HEIGHT / 2 - 20);
        c.stroke();

        c.fillStyle = '#FFD700';
        c.font = 'bold 20px Arial';
        c.fillText("【クリア条件】", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);

        c.fillStyle = '#EEEEEE';
        c.font = '22px Arial';
        let conditionText = "DFラインを超えられるよう、黄色い味方にパスを通す";
        if (currentLevel === 0) conditionText = "ターゲットを目安に、走る味方の前へパスを出す";
        c.fillText(conditionText, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);

        const alpha = 0.5 + 0.5 * Math.sin(performance.now() / 150);
        c.fillStyle = `rgba(0, 255, 127, ${alpha})`;
        c.font = 'bold 28px Arial';
        let startBtnText = "- Click to Start -";
        if (currentLevel === 0) startBtnText = "- Click to Start Tutorial -";
        c.fillText(startBtnText, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 120);

        drawButton("TIPS", TIPS_BTN_X, TIPS_BTN_Y, TIPS_BTN_W, TIPS_BTN_H, 'info', '20px');

        return;
    }

    const elapsed = performance.now() - gameStartTime;
    if (currentLevel !== 5 && currentLevel !== 6 && currentLevel !== 7) {
        if (isGameStarted && elapsed < READY_DURATION + COUNTDOWN_DURATION) {
            c.textAlign = 'center';
            c.fillStyle = '#FFFFFF';
            c.strokeStyle = '#000000';
            c.lineWidth = 2;
            let displayText = "";
            let fontSize = "60px";
            if (elapsed < READY_DURATION) {
                displayText = "Ready...";
            } else {
                const remaining = (READY_DURATION + COUNTDOWN_DURATION) - elapsed;
                const count = Math.ceil(remaining / 1000);
                displayText = count.toString();
                fontSize = "100px";
            }
            c.font = `${fontSize} Arial`;
            c.strokeText(displayText, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
            c.fillText(displayText, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        }
    }
}

// Delta TimeとTime Scaleの計算
let lastTime = 0;

function animate(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    const timeScale = deltaTime / (1000 / 60);

    c.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawField();

    if (currentLevel === 0 && isGameStarted && !isGameCompleted && !showSuccess && !currentPass) {
        drawTutorialTarget(timestamp);
    }

    for (let obs of obstacles) obs.draw();
    passer.draw();
    runner.draw();
    if (striker) striker.draw();

    updateLogic(timeScale);

    if (keeper) keeper.draw();
    if (currentPass) currentPass.draw();
    drawPowerGauge();
    drawOverlay();
    requestAnimationFrame(animate);
}

// --- 入力処理 ---

function mouseDown(event) {
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    if (isGameCompleted) {
        currentLevel = 0;
        isGameCompleted = false;
        resetGame();
        return;
    }

    if (showSuccess) {
        if (clickX >= BTN_LEFT_X && clickX <= BTN_LEFT_X + BTN_SIDE_W &&
            clickY >= BTN_Y && clickY <= BTN_Y + BTN_H) {
            resetGame();
            return;
        }
        if (clickX >= BTN_RIGHT_X && clickX <= BTN_RIGHT_X + BTN_SIDE_W &&
            clickY >= BTN_Y && clickY <= BTN_Y + BTN_H) {
            if (currentLevel === MAX_GAME_LEVEL) {
                isGameCompleted = true;
                showSuccess = false;
            } else {
                currentLevel++;
                resetGame();
            }
            return;
        }
        return;
    }

    if (resultText !== "" && resultText !== "SUCCESS") {
        resetGame();
        return;
    }

    if (!isGameStarted) {
        if (isAdviceOpen) {
            const MODAL_W = 500;
            const MODAL_H = 300;
            const MODAL_Y = CANVAS_HEIGHT / 2 - MODAL_H / 2;
            const CLOSE_BTN_W = 120;
            const CLOSE_BTN_H = 40;
            const CLOSE_BTN_X = CANVAS_WIDTH / 2 - CLOSE_BTN_W / 2;
            const CLOSE_BTN_Y = MODAL_Y + MODAL_H - 70;

            if (clickX >= CLOSE_BTN_X && clickX <= CLOSE_BTN_X + CLOSE_BTN_W &&
                clickY >= CLOSE_BTN_Y && clickY <= CLOSE_BTN_Y + CLOSE_BTN_H) {
                isAdviceOpen = false;
            }
            return;
        }

        if (clickX >= TIPS_BTN_X && clickX <= TIPS_BTN_X + TIPS_BTN_W &&
            clickY >= TIPS_BTN_Y && clickY <= TIPS_BTN_Y + TIPS_BTN_H) {
            isAdviceOpen = true;
            return;
        }

        startGame();
        return;
    }

    if (currentLevel !== 5 && currentLevel !== 6 && currentLevel !== 7) {
        if (performance.now() - gameStartTime < READY_DURATION + COUNTDOWN_DURATION) {
            return;
        }
    }

    if (isPrePassDribble && (currentLevel >= 5)) {
        if (striker.position.x > maxObstacleX) {
            resultText = "OFFSIDE";
            return;
        }

        isPrePassDribble = false;
        currentPass.isHeld = false;

        const powerRatio = (passPowerLevel - 1) / (MAX_POWER_LEVEL - 1);
        const passSpeed = MIN_PASS_SPEED + (MAX_PASS_SPEED - MIN_PASS_SPEED) * powerRatio;
        const dx = clickX - passer.position.x;
        const dy = clickY - passer.position.y;
        const angle = atan2(dy, dx);
        const deviation = (Math.random() - 0.5) * 2 * (MAX_PASS_ERROR_ANGLE * powerRatio);
        const finalAngle = angle + deviation;

        currentPass.vx = Math.cos(finalAngle) * passSpeed;
        currentPass.vy = Math.sin(finalAngle) * passSpeed;
        currentPass.timeStart = performance.now();

        if (runner) {
            if (currentLevel === 7) {
                runner.speed = 5.0;
            } else {
                const currentSpeed = Math.sqrt(runner.vx ** 2 + runner.vy ** 2);
                runner.speed = (currentSpeed > 0.1) ? currentSpeed : initialRunnerSpeed;
            }
        }

        if (striker) {
            const currentSpeed = Math.sqrt(striker.vx ** 2 + striker.vy ** 2);
            striker.speed = (currentSpeed > 0.1) ? currentSpeed : initialRunnerSpeed;
        }

        let targetPlayer = runner;
        if (striker && (Math.abs(striker.position.y - dy) < Math.abs(runner.position.y - dy))) {
            targetPlayer = striker;
        }

        const meetingX = CANVAS_WIDTH + 50;
        const distToMeet = meetingX - currentPass.position.x;
        const tanAngle = Math.tan(finalAngle);
        let meetY = currentPass.position.y + tanAngle * distToMeet;
        const limitY = 40;
        meetY = Math.max(limitY, Math.min(CANVAS_HEIGHT - limitY, meetY));

        if (currentLevel === 7 && targetPlayer === striker) {
            targetPlayer.state = "INTERCEPT";
            targetPlayer.destination = { x: CANVAS_WIDTH + 200, y: targetPlayer.position.y };
        } else {
            targetPlayer.interceptPass(meetingX, meetY);
        }

        if (targetPlayer === striker) {
            runner.destination = { x: CANVAS_WIDTH, y: runner.position.y };
        } else {
            striker.destination = { x: CANVAS_WIDTH, y: striker.position.y };
        }

        keeperStrategy = Math.random() < 0.5 ? 0 : 1;
        return;
    }

    if (isGameStarted && currentLevel < 5 && (!currentPass || currentPass.isHeld)) {
        if (currentLevel !== 0 && currentLevel < 5 && runner.position.x > maxObstacleX) {
            resultText = "OFFSIDE";
            return;
        }

        const powerRatio = (passPowerLevel - 1) / (MAX_POWER_LEVEL - 1);
        const passSpeed = MIN_PASS_SPEED + (MAX_PASS_SPEED - MIN_PASS_SPEED) * powerRatio;
        const dx = clickX - passer.position.x;
        const dy = clickY - passer.position.y;
        const angle = atan2(dy, dx);
        const deviation = (Math.random() - 0.5) * 2 * (MAX_PASS_ERROR_ANGLE * powerRatio);
        const finalAngle = angle + deviation;

        if (!currentPass) {
            currentPass = new Pass(
                { x: passer.position.x, y: passer.position.y },
                Math.cos(finalAngle) * passSpeed,
                Math.sin(finalAngle) * passSpeed,
                performance.now()
            );
        } else {
            currentPass.isHeld = false;
            currentPass.vx = Math.cos(finalAngle) * passSpeed;
            currentPass.vy = Math.sin(finalAngle) * passSpeed;
            currentPass.timeStart = performance.now();
        }

        let targetPlayer = runner;
        if (currentLevel >= 5) targetPlayer = striker;

        let meetingX;
        if (currentLevel === 2 || currentLevel === 4) {
            meetingX = CANVAS_WIDTH - 100;
        } else {
            meetingX = CANVAS_WIDTH + 50;
        }

        const distToMeet = meetingX - currentPass.position.x;
        const tanAngle = Math.tan(finalAngle);
        let meetY = currentPass.position.y + tanAngle * distToMeet;
        meetY = Math.max(40, Math.min(CANVAS_HEIGHT - 40, meetY));

        targetPlayer.interceptPass(meetingX, meetY);

        const speedRatio = passSpeed / MAX_PASS_SPEED;
        if (currentLevel === 5) {
            targetPlayer.speed = initialRunnerSpeed * 0.28;
        } else {
            const baseMult = (currentLevel === 6) ? 1.2 : 1.0;
            targetPlayer.speed = initialRunnerSpeed * (0.5 + 0.5 * speedRatio) * baseMult;
        }

        if (striker && currentLevel < 5) {
            striker.destination = { x: CANVAS_WIDTH - 80, y: striker.position.y };
            striker.state = "SPRINT";
        }
        keeperStrategy = Math.random() < 0.5 ? 0 : 1;
    }
}

function mouseUp(event) { }

function keyPressed(event) {
    if (event.code === "Enter") {
        event.preventDefault();

        if (isGameCompleted) {
            currentLevel = 0;
            isGameCompleted = false;
            resetGame();
            return;
        }

        if (showSuccess) {
            if (currentLevel === MAX_GAME_LEVEL) {
                isGameCompleted = true;
                showSuccess = false;
            } else {
                currentLevel++;
                resetGame();
            }
            return;
        }
        if (resultText !== "" && resultText !== "SUCCESS") {
            resetGame();
            return;
        }
        if (!isGameStarted) {
            if (isAdviceOpen) {
                isAdviceOpen = false;
                return;
            }
            startGame();
        }
    }

    if (isGameStarted && (!currentPass || currentPass.isHeld)) {
        if (event.code === "ArrowUp" || event.code === "ArrowRight") {
            event.preventDefault();
            if (passPowerLevel < MAX_POWER_LEVEL) passPowerLevel++;
        }
        if (event.code === "ArrowDown" || event.code === "ArrowLeft") {
            event.preventDefault();
            if (passPowerLevel > 1) passPowerLevel--;
        }
        if (/^Digit[1-5]$/.test(event.code)) {
            passPowerLevel = parseInt(event.code.replace("Digit", ""));
        }
        if (/^Numpad[1-5]$/.test(event.code)) {
            passPowerLevel = parseInt(event.code.replace("Numpad", ""));
        }
    }
}

function init() {
    currentLevel = 0;
    resetGame();
    canvas.addEventListener('mousedown', mouseDown);
    document.addEventListener('keydown', keyPressed);
    requestAnimationFrame(animate);
}

window.onload = init;