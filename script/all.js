const board = document.getElementById("board");
const width = 8;
const colors = ["../img/fruits/תמונה1.png", "../img/fruits/תמונה2.png", "../img/fruits/תמונה3.png", "../img/fruits/תמונה4.png", "../img/fruits/תמונה5.png", "../img/fruits/תמונה6.png",
    "../img/bombs/תמונה1.png", "../img/bombs/תמונה2.png", "../img/bombs/תמונה3.png", "../img/bombs/תמונה4.png", "../img/bombs/תמונה5.png", "../img/bombs/תמונה6.png", "../img/white.png"];
const special = ["../img/special/תמונה1.png", "../img/special/תמונה2.png", "../img/special/תמונה3.png", "../img/special/תמונה4.png", "../img/special/תמונה5.png", "../img/special/תמונה6.png"];
const squares = [];

const WHITE_INDEX = 12;
let score = 0;
let moves = 20;
let level = 1;
let targetScore = 100;
let inMiddle = false; //בדיקה האם באמצע למצוא התאמה
let flagLevel = level2(); //זיהוי הרמה
let flagMusic = true;

//דגלים לבדיקה איך הוא הפסיד
let flagTimeOut = false;
let flagMovesOut = false;
let flagBomb = false;

const scoreDisplay = document.getElementById("scoreValue");
const moveDisplay = document.getElementById("moveCount");
const finalScoreDisplay = document.getElementById("finalScore");
const levelDisplay = document.getElementById("levelValue");
const gameOverScreen = document.getElementById("gameOver");
const resetBtn = document.getElementById("resetBtn");
const highScoreDisplay = document.getElementById("highScoreValue");
const matchSound = document.getElementById("matchSound");


let colorDrag, colorReplace;
let squareIdDrag, squareIdRE;
let squareINdexDrag, squareINdexRE;
let specialIndexDrag, specialIndexRE;
let gameActive = true;

//storage
function saveUsername(event) {
    event.preventDefault();
    const name = document.getElementById("inputEnter").value;
    localStorage.setItem("username", name);
    console.log("נשמר:", name);
    window.location.href = "newHtml/enter.html";
}

function getHighScore() {
    return parseInt(localStorage.getItem("candyHighScore")) || 0;
}

function setHighScore(newScore) {
    if (newScore > getHighScore()) {
        localStorage.setItem("candyHighScore", newScore);
    }
    highScoreDisplay.textContent = getHighScore();
}
function getColor(square) {
    return square.firstChild?.src || "";
}

function level2() {
    const level2 = localStorage.getItem("level");
    if (level2) {
        if (level2 == "קל") {
            return false;
        }
        else {
            return true;
        }
    }
    return false;
}

//בניית הלוח
function createBoard() {
    let bombCounter = 0;
    for (let i = 0; i < width * width; i++) {
        const square = document.createElement("div");
        square.id = i;
        square.draggable = true;
        square.className = "square";
        square.specialIndex = null;
        const img = document.createElement("img");
        let x = Math.floor(Math.random() * colors.length);
        if (!flagLevel) {
            x = Math.floor(Math.random() * 6);
        }
        else {
            bombCounter++;
            x = Math.floor(Math.random() * 6);

            if (bombCounter == 10) {
                bombCounter = 0;
                x = Math.floor(Math.random() * 6) + 6;
            }
        }
        square.indexColor = x;
        img.src = colors[x];
        img.classList.add("candy-img");
        square.appendChild(img);
        square.addEventListener("dragstart", dragStart);
        square.addEventListener("dragover", e => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
        });
        square.addEventListener("drop", dragDrop);
        square.addEventListener("dragend", dragEnd);

        board.appendChild(square);
        squares.push(square);
    }
}
function setSquareColor(square, src, indexColor, specialIndex) {

    square.innerHTML = "";
    const img = document.createElement("img");
    img.src = src;
    img.classList.add("candy-img");
    square.indexColor = indexColor;
    square.specialIndex = specialIndex;
    square.appendChild(img);
}
function dropWhite() {
    for (let i = 0; i < width * width; i++) {
        const sq = squares[i];
        setTimeout(() => { setSquareColor(sq, "../img/white.png", WHITE_INDEX, null); }, i * 30);
    }
    stop();

}

//פעולות החלפה
function dragStart() {
    if (flagLevel) {
        if (this.indexColor > 5) {
            score = 0;
            scoreDisplay.textContent = score;
            flagBomb = true;
            dropWhite();
        }
    }
    colorDrag = getColor(this);
    squareIdDrag = parseInt(this.id);
    squareINdexDrag = this.indexColor;
    specialIndexDrag = this.specialIndex;
}

function dragDrop() {
    colorReplace = getColor(this);
    squareIdRE = parseInt(this.id);
    squareINdexRE = this.indexColor;
    specialIndexRE = this.specialIndex;
    setSquareColor(squares[squareIdDrag], colorReplace, squareINdexRE, specialIndexRE);
    setSquareColor(squares[squareIdRE], colorDrag, squareINdexDrag, specialIndexDrag);
}

function dragEnd() {
    const neighborIds = [
        squareIdDrag - 1,
        squareIdDrag + 1,
        squareIdDrag - width,
        squareIdDrag + width,
    ];
    const isNeighbor = neighborIds.includes(squareIdRE);

    if (squareIdRE != null && isNeighbor && gameActive) {
        const matched = checkMatches();
        if (!matched) {
            revertSwap();
            squareIdDrag = squareIdRE = null;
            return;
        }

        moves--;
        moveDisplay.textContent = moves;
        if (moves <= 0) {
            flagMovesOut = true;
            dropWhite();
        }
    } else {
        revertSwap();
    }
    squareIdDrag = squareIdRE = null;
}

function revertSwap() {
    setSquareColor(squares[squareIdDrag], colorDrag, squareINdexDrag, specialIndexDrag);
    setSquareColor(squares[squareIdRE], colorReplace, squareINdexRE, specialIndexRE);
}
function sameImage(src1, src2) {
    if (!src1 || !src2) return false;
    return src1.split("/").pop() === src2.split("/").pop();
}
function getIndexColor(sq) {
    return sq.indexColor;
}
let arrCnt = [0, 0, 0, 0, 0, 0];
function markMatch(indices, callback) {
    let flag = false;
    console.log("the length :" + indices.length);
    let index;
    indices.forEach(idx => {
        const sq = squares[idx];
        index = sq.indexColor;
        sq.classList.add("matching");
    });
    let newIndexColor;
    setTimeout(() => {
        indices.forEach((idx, i) => {
            const sq = squares[idx];
            const col = getColor(sq);
            
            //הסרה של צבע
            if (col == "" || col.includes("white.png")) { flag = true; return; }
            newIndexColor = getIndexColor(sq);
            console.log("newindexcolor = ", newIndexColor);

            sq.classList.remove(col);
            setSquareColor(sq, "../img/white.png", WHITE_INDEX, null);
            score++;
            if (i == indices.length - 1) {

                //הוספת סוכריה מיוחדת
                if (indices.length >= 4) {
                    function createBombHandler(indexColor) {
                        return function () {
                            bomb(indexColor);
                        };
                    }

                    const handler = createBombHandler(newIndexColor);
                    sq.isBomb = handler;
                    console.log("isbomb:" + sq.isBomb)
                    sq.addEventListener("dblclick", handler);
                    sq.specialIndex = idx;
                    setSquareColor(sq, special[newIndexColor], newIndexColor, sq.specialIndex);
                    setTimeout(() => {
                        sq.classList.add("matching");
                    }, 150);
                }
            }
            sq.classList.remove("matching");

        });
        if (!flag) {
            arrCnt[index]++;
            console.log(index);
            boardCandies();
        }
        scoreDisplay.textContent = score;
        document.getElementById("totalScore").innerHTML = score;
        if (callback) callback();

    }, 200);
}

function bomb(index) {
    const size = width * width;
    for (let i = 0; i < size; i++) {
        if (squares[i].indexColor == index) {
            setTimeout(() => {
                squares[i].classList.add("matching");
                score++;
                scoreDisplay.textContent = score;
            }, i * 20);
        }
    }

    setTimeout(() => {
        for (let i = 0; i < size; i++) {
            if (squares[i].indexColor == index) {
                squares[i].classList.remove("matching");
                setSquareColor(squares[i], "../img/white.png", WHITE_INDEX, null);
            }
        }
        inMiddle = false;
    }, 1200);
    squares[index].removeEventListener("dblclick", squares[index].isBomb);
    delete squares[index].isBomb;
    squares[index].specialIndex = null;
}
function scanMatches(len = 3) {
    let found = false;
    const size = width * width;

    for (let i = 0; i < size; i++) {
        const baseColor = getColor(squares[i]);
        if (baseColor === "" || baseColor.includes("white.png")) continue;
        if (i % width <= width - len) {
            let ok = true;
            for (let k = 1; k < len; k++) {
                if (getColor(squares[i + k]) !== baseColor) {
                    ok = false;
                    break;
                }
            }
            if (ok) {
                const row = [];
                for (let k = 0; k < len; k++) row.push(i + k);
                markMatch(row);
                found = true;
            }
        }

        if (i < width * (width - (len - 1))) {
            let ok = true;
            for (let k = 1; k < len; k++) {
                if (getColor(squares[i + k * width]) !== baseColor) {
                    ok = false;
                    break;
                }
            }
            if (ok) {
                const col = [];
                for (let k = 0; k < len; k++) col.push(i + k * width);
                markMatch(col);
                found = true;
            }
        }
    }

    return found;
}
function checkMatches() {

    if (scanMatches(5)) return true;
    if (scanMatches(4)) return true;
    if (scanMatches(3)) return true;
    return false;
}

function dropCandies(callback) {
    let bombCounter = 0;
    let flag = false;

    //הפור הראשון מוריד ללמטה
    for (let i = width * (width - 1) - 1; i >= 0; i--) {
        const index = i + width;
        if (sameImage(getColor(squares[index]), "white.png")) {
            setSquareColor(squares[index], getColor(squares[i]), squares[i].indexColor, squares[i].specialIndex);
            setSquareColor(squares[i], "../img/white.png", WHITE_INDEX, null);
            flag = true;
        }
    }

    //עובר על השורה הראשונה ושם צבעים אקראיים
    for (let i = 0; i < width; i++) {
        if (sameImage(getColor(squares[i]), "white.png")) {
            let x;
            if (!flagLevel) {
                x = Math.floor(Math.random() * 6);
            }
            else {
                bombCounter++;
                x = Math.floor(Math.random() * 6);

                if (bombCounter == 10) {
                    bombCounter = 0;
                    x = Math.floor(Math.random() * 6) + 6;
                }
            }
            const color = colors[x];
            setSquareColor(squares[i], color, x, squares[i].specialIndex);
            flag = true;
        }
    }
    if (flag) {
        setTimeout(() => dropCandies(callback), 100);
    } else {
        if (callback) callback();
    }
}

function resetGame() {
    document.getElementById("music").pause();
    gameActive = true;
    moves = 10;
    score = 0;
    level = 1;
    targetScore = 100;
    arrCnt = [0, 0, 0, 0, 0, 0];

    scoreDisplay.textContent = score;
    moveDisplay.textContent = moves;
    levelDisplay.textContent = level;
    highScoreDisplay.textContent = getHighScore();

    board.innerHTML = "";
    squares.length = 0;
    createBoard();
    timer();
    boardCandies();
    const overlay = document.getElementById("overlay2");
    overlay.style.display = "none";
    overlay.innerHTML = "";
    if (!flagMusic) {
        document.getElementById("music").play();
    }
    flagMusic = false;
}

resetBtn.addEventListener("click", resetGame);

//timer
let timeout
function countdown(totalSeconds) {
    clearTimeout(timeout);
    let seconds = totalSeconds;

    function tick() {
        if (gameActive) {
            let counter = document.getElementById("counter");
            counter.style.color = "white";
            let minutes = Math.floor(seconds / 60);
            let secs = seconds % 60;

            counter.innerHTML =
                minutes + "." + (secs < 10 ? "0" : "") + secs;
            if (seconds > 0) {
                timeout = setTimeout(tick, 1000);
            }
            if (minutes == 0) {
                if (seconds < 11) {
                    counter.style.color = '#457eff';
                }
                if (seconds == 0) {
                    counter.innerHTML = "00.00";
                    flagTimeOut = true;
                    dropWhite();
                }
            }
            seconds--;
        }
    }

    tick();
}

function timer() {
    document.getElementById("t").innerHTML = `
               <div class="btnGroup">
            <span class="Btn" id="verifiBtn">
            </span>
            <span class="timer">
                <span id="counter"></span>
            </span>
        </div>
            `;
    document.getElementById("counter").innerHTML = " ";

    countdown(120);
}

function gameOver() {
    setHighScore(score);

    const overlay = document.getElementById("overlay2");
    overlay.style.display = "block";
    overlay.innerHTML = "";

    const text = document.createElement("div");
    text.id = "text";
    text.innerHTML = "<h1>GAME OVER</h1>";

    const scoreDisplay = document.createElement("p");
    scoreDisplay.id = "finalScore";
    scoreDisplay.innerText = "הניקוד שלך: " + score;

    const reason = document.createElement("p");
    reason.id = "reason";

    if (flagTimeOut) {
        reason.innerHTML = "הזמן שלך נגמר, אולי כדאי להדליק שעון מעורר בפעם הבאה?⏰";

    } else if (flagMovesOut) {
        reason.innerHTML = " נגמרו המהלכים! אפילו הממתקים שלנו כבר מתעייפים, בוא נתחיל מחדש?🎲";
    } else if (flagBomb) {
        reason.innerHTML = " פיצצת את הלוח! זה לא ירייה באוויר, זה פיצוץ אמיתי!💣";
        reason.innerHTML = "  נפסלת כי פוצצת את הלוח! ממתקים פחות אוהבים להתפוצץ, כנראה.💣"
    } else {
        reason.innerHTML = "המשחק נגמר בלי סיבה ברורה, כנראה שהממתקים החליטו לנוח.🤷‍♂️ "
    }

    document.getElementById("totalScore").innerHTML = score;
    let resetButton = document.getElementById("resetBtn");
    if (!resetButton) {
        resetButton = document.createElement("button");
        resetButton.id = "resetBtn";
        resetButton.innerText = "resetBtn";
        resetButton.onclick = resetGame; // או מה שצריך
    }
    resetButton.style.display = "inline-block";

    text.appendChild(scoreDisplay);
    text.appendChild(reason);
    text.appendChild(resetButton);
    overlay.appendChild(text);
    overlay.removeEventListener("click", off);
    overlay.style.cursor = "default";

    flagTimeOut = false;
    flagBomb = false;
    flagMovesOut = false;
}
function BackPage() {
    gameActive = false;
    const overlay = document.getElementById("overlay2");
    overlay.style.display = "block";
    overlay.innerHTML = "";
    const text = document.createElement("div");
    text.id = "text";
    text.innerHTML = "<h2>Are you sure you want to go out?</h2>";
    yes = document.createElement("button");
    yes.id = "resetBtn";
    yes.innerText = "yes";
    yes.onclick = goOut;
    text.appendChild(yes);
    no = document.createElement("button");
    no.id = "resetBtn";
    no.innerText = "no";
    no.addEventListener("click", stay)
    text.appendChild(no);
    overlay.appendChild(text);
    overlay.removeEventListener("click", off);
    overlay.style.cursor = "default";
}
function stay() {
    document.getElementById("back").innerHTML = "";
    document.getElementById("overlay2").style.display = "none";
    gameActive = true;
}
function goOut() {
    window.location.href = "../newHtml/enter.html";
}
function stop() {
    gameActive = false;
    setTimeout(gameOver, 2000);
}
function pause() {
    let icon = document.getElementById("stopOrCon");
    if (sameImage(icon.src, "pause.png")) {
        gameActive = false;
        icon.src = "../img/icons/backR.png";
    }
    else {
        off();
        icon.src = "../img/icons/pause.png";
    }
}

//הלוח של הסוכריות בצד
function boardCandies() {
    document.getElementById("candies").innerHTML = "";
    document.getElementById("candies").appendChild(document.createElement("br"));
    document.getElementById("candies").appendChild(document.createElement("br"));

    for (let i = 0; i < 6; i++) {
        const responsive = document.createElement("div");
        responsive.setAttribute("class", "responsive");

        const gallery = document.createElement("div");
        gallery.setAttribute("class", "gallery");

        const image = document.createElement("img");
        image.setAttribute("src", colors[i]);
        image.setAttribute("class", "img");

        const desc = document.createElement("div");
        desc.setAttribute("class", "desc");

        desc.appendChild(document.createTextNode("כמות: "));
        desc.appendChild(document.createTextNode(arrCnt[i]));

        gallery.appendChild(image);
        gallery.appendChild(desc);

        responsive.appendChild(gallery);
        document.getElementById("candies").appendChild(responsive);
    }
    totalScore = document.createElement("div");
    totalScore.textContent = score;
    totalScore.id = "totalScore";
    totalScore.className = "responsive"
    document.getElementById("candies").appendChild(totalScore);

}

function toggleMenu() {
    const overlay = document.getElementById("myNav");
    overlay.classList.toggle("show");
}
function off() {
    document.getElementById("overlay2").style.display = "none";
    gameActive = true;
    let text = document.getElementById("counter").innerHTML;
    let seconds = parseInt(text.slice(-2));
    let min = parseInt(text[0]);
    let time = min * 60 + seconds;
    countdown(time);
}
function Definitions() {
    gameActive = false;
    const overlay = document.getElementById("overlay2");
    overlay.style.display = "block";
    overlay.innerHTML = "";
    const text = document.createElement("div");
    text.id = "text";
    text.innerHTML = "<h2>בחר צבע רקע כרצונך</h2>";

    function changeBackground(event) {
        const imgUrl = event.currentTarget.getAttribute('url');
        document.body.style.backgroundImage = `url(${imgUrl})`;
        overlay.style.display = "none"; // סוגר את החלון אחרי בחירה
        gameActive = true;
    }

    function createBackgroundButton(imgSrc, titleTxt) {
        let btn = document.createElement("button");
        btn.className = "btnBackground";
        btn.setAttribute('url', imgSrc);
        btn.addEventListener("click", changeBackground);

        let img = document.createElement("img");
        img.style.width = "10vw";
        img.src = imgSrc;
        btn.appendChild(img);

        let title = document.createElement("p");
        title.textContent = titleTxt;
        btn.appendChild(title);

        return btn;
    }

    // הוספת הכפתורים
    text.appendChild(createBackgroundButton("../img/background/תמונה1.jpg", "רקע שחור ומיסתורי"));
    text.appendChild(createBackgroundButton("../img/background/תמונה3.jpg", "רקע צבעוני ועליז"));
    text.appendChild(createBackgroundButton("../img/background/תמונה4.jpg", "רקע יפיפה"));

    overlay.appendChild(text);
}


function Instructions() {
    document.getElementById("overlay2").style.display = "block";
    document.getElementById("overlay2").innerHTML = "";
    const text = document.createElement("div");
    text.id = "text";
    text.innerHTML = `
  <h2>ברוכים הבאים לממלכת הממתקים של קנדי קראש! 🍭</h2>
  <p>כאן לא צריך להיות גאון, רק לגרום לממתקים מאותו צבע להתארגן בשורה – ואז הם נעלמים כאילו עשיתם קסם! ✨ ואתם? תזכו בנקודות על חשבון הסוכר שלכם. 🍬</p>
  <p>שלושה ממתקים הסתדרו בשורה? בינגו! הם נמסים להם בנימוס, מפנים מקום כאילו אמרו "הבמה שלכם, חברים", ואז ממתקים חדשים עושים כניסה חגיגית מלמעלה – צבעוניים, מבריקים, מוכנים לעשות רושם. 🍬🎈</p>
  <p>יש לכם 10 מהלכים להתחלה. אם תפספסו, אל תדאגו — כמו שאומרים, גם סוכריות נופלות לפעמים! 😅</p>
  <p>תעברו את ה-100 נקודות? כל הכבוד, אתם עוברים שלב! 🎉</p>
  <p>והזהרו מהפצצות! נגעתם – התפוצצתם. הן לא שואלות שאלות, לא מבקשות רשות, פשוט עושות "בום!" ומעיפות ממתקים לכל עבר כאילו הלוח הפך למכונת פופקורן שלא עצרו בזמן. 💥🍿</p>
  <p>ואם במקרה הצלחתם לפוצץ 4 ממתקים או יותר? ובכן, קוסם ממתקים אישי יופיע (לא באמת, אבל תרגישו שכן) וייתן לכם סוכרייה מיוחדת – כזו שבשניה אחת מעלימה את כל הממתקים בצבע שלה. כמו קסם, רק עם יותר סוכר. 🎩🍭</p>
  <p>נגמרו המהלכים? פשוט תלחצו "שחק שוב" ותנסו שוב — כי גם ממתקים צריכים הזדמנות שנייה.</p>
  <p>שברתם שיא? המחשב זוכר אתכם – גם כשאתם שוכחים איפה המפתחות. </p>
  <p><strong>בהצלחה! 🍀</strong></p>
`;
    document.getElementById("overlay2").appendChild(text);
    gameActive = false;
}
document.getElementById("overlay2").addEventListener("click", off);
resetGame();
setInterval(() => {
    if (gameActive && !inMiddle) {
        inMiddle = true;
        dropCandies(() => {
            const foundMatch = checkMatches();

            if (!foundMatch) {
                inMiddle = false;
            } else {
                setTimeout(() => {
                    inMiddle = false;
                }, 230);
            }
        });
    }
}, 210);
