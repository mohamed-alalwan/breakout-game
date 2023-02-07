window.onload = () => {
    //speeds
    const userSpeed = 8;
    const ballSpeed = 5;
    const gameSpeed = 20;
    const rotateSpeed = 1.5;
    const randomSpeed = 10000;

    //random grid
    let gridCount = 30;
    const grid = document.querySelector('.grid');
    const gridItems = /**@type {HTMLDivElement}*/[];
    const randomDefaults = {
        // maxPos: {x: }
    };

    for(i=0; i < gridCount; i++){
        let item = document.createElement('div');
        item.classList.add('grid-item');
        grid.appendChild(item);
        gridItems.push(item);
    }

    //show random perk
    function showRandomPerk(){
        if(gamePaused) return;
        const i = Math.floor(Math.random() * gridCount);
        removeElementsByClass('random');
        const randomPerk = document.createElement('div');
        randomPerk.classList.add('random');
        randomPerk.textContent = '?';
        gridItems[i].appendChild(randomPerk);
    }

    //lives
    let lives = 3;
    const livesDisplay = document.querySelector('#lives');

    //start button
    const startBtn = document.querySelector('.start');
    startBtn.addEventListener('click', start);

    //controls button
    const controlsBtn = document.querySelector('.controls');
    controlsBtn.addEventListener('click', controls);
    
    //sounds
    const bounce = /**@type {HTMLAudioElement} */ document.querySelector('#bounce');
    const paddle = /**@type {HTMLAudioElement} */ document.querySelector('#paddle');
    const lose = /**@type {HTMLAudioElement} */ document.querySelector('#lose');
    const win = /**@type {HTMLAudioElement} */ document.querySelector('#win');

    //game paused
    let gamePaused = false;

    //game started 
    let gameStarted = false;

    //game over
    let gameOver = false;

    //game won
    let gameWon = false;
    
    //-----------Keys---------------- 
    const leftArrow = {key : 'ArrowLeft', pressed: false}
    const rightArrow = {key : 'ArrowRight', pressed: false}
    const pauseKey = {key: 'q', pressed: false}
    const restartKey = {key: 'r', pressed: false}
    
    //-----------Score---------------- 
    const scoreDisplay = document.querySelector('#score');
    let score = 0;

    //-----------Timers---------------- 
    let updateTimer;
    let delayTimer;
    let randomTimer;

    //-----------Board---------------- 
    const board = {
        element: document.querySelector('.board'),
        width: 560,
        height: 300,
    }

    //-----------Rotating Board---------------- 
    let degrees = 0;
    function rotateBoard(){
        board.element.style.transform = `rotate(${degrees}deg)`;
        degrees += rotateSpeed;
    }

    //-----------Blocks---------------- 
    const blockDefaults = {
        width: 100,
        height: 20,
    }

    class Block{
        constructor(x, y){
            this.bottomLeft = {
                x : x, 
                y : y,
            };
            this.bottomRight = {
                x : x + blockDefaults.width, 
                y: y,
            };
            this.topLeft = {
                x : x, 
                y : y + blockDefaults.height,
            };
            this.topRight = {
                x : x + blockDefaults.width,
                y : y + blockDefaults.height,
            };
            this.element = document.querySelector('.block');
        }
    }

    const blocksMain = [
        new Block(10, 270),
        new Block(120, 270),
        new Block(230, 270),
        new Block(340, 270),
        new Block(450, 270),
        new Block(10, 240),
        new Block(120, 240),
        new Block(230, 240),
        new Block(340, 240),
        new Block(450, 240),
        new Block(10, 210),
        new Block(120, 210),
        new Block(230, 210),
        new Block(340, 210),
        new Block(450, 210),
    ];

    let blocks;
   
    //add blocks in board
    function createBlocks(){
        blocks = [...blocksMain];
        blocks.forEach(block => {
            const div = document.createElement('div');
            div.classList.add('block');
            div.style.left = block.bottomLeft.x + 'px';
            div.style.bottom = block.bottomLeft.y + 'px';
            block.element = div;
            board.element.appendChild(div);
        });
    }

    //-----------User----------------
    const userDefaults = {
        width: 100,
        height: 20,
        marginBottom: 10,
    }

    const user = {
        element: document.querySelector('.user'),
        startPos: {
            x: board.width/2 - userDefaults.width/2,
            y: userDefaults.marginBottom
        },
        currentPos: {
            x: board.width/2 - userDefaults.width/2,
            y: userDefaults.marginBottom,
        },
        speed: userSpeed,
        createElement: function() {
            const div = document.createElement('div');
            div.classList.add('user');
            board.element.append(div);
            this.element = div;
        },
        draw: function() {
            this.element.style.left = this.currentPos.x + 'px';
            this.element.style.bottom = this.currentPos.y + 'px';
        },
        moveLeft: function(){
            if(this.currentPos.x <= 0) return;
            this.currentPos.x -= this.speed;
            this.draw();
        },
        moveRight: function(){
            if(this.currentPos.x >= (board.width - blockDefaults.width)) return;
            this.currentPos.x += this.speed;
            this.draw();
        }
    }

    //handle user movement
    function moveUser(/**@type {KeyboardEvent}*/e){
        switch(e.key){
            case leftArrow.key:
                leftArrow.pressed = true;
                break;
            case rightArrow.key:
                rightArrow.pressed = true;
                break;
        }
    }

    function stopUser(/**@type {KeyboardEvent}*/e){
        switch(e.key){
            case leftArrow.key:
                leftArrow.pressed = false;
                break;
            case rightArrow.key:
                rightArrow.pressed = false;
                break;
        }
    }

    //-----------Ball---------------- 
    const ballDefaults = {
        radius: 20
    }

    class Ball {
        constructor(element, startPos, currentPos, radius, speed, direction){
            this.element = element;
            this.startPos = startPos;
            this.currentPos = currentPos;
            this.radius = radius;
            this.speed = speed;
            this.direction = direction;
        }

        createElement(){
            const div = document.createElement('div');
            div.classList.add('ball');
            board.element.appendChild(div);
            this.element = div;
        }

        draw(){
            this.element.style.left = this.currentPos.x + 'px';
            this.element.style.bottom = this.currentPos.y + 'px';
        }

        moveBall(){
            this.currentPos.x += this.direction.x;
            this.currentPos.y += this.direction.y;
        }

        checkForCollisions(){
            //blocks collision
            blocks.forEach((block, i) => {
                if(
                    (
                        this.currentPos.x > block.bottomLeft.x &&
                        this.currentPos.x < block.bottomRight.x
                    ) 
                    &&
                    (
                        (this.currentPos.y + this.radius) > block.bottomLeft.y &&
                        this.currentPos.y < block.topLeft.y
                    )
                ){
                    block.element.classList.remove('block');
                    blocks.splice(i, 1);
                    this.changeDirection();
                    score++;
                    scoreDisplay.textContent = score;

                    //check for win
                    if (blocks.length === 0) {
                        gameWon = true;
                        gameOverToggle();
                    }

                    bounce.pause();
                    bounce.currentTime = 0;
                    bounce.play();
                }
                
            });

            //wall collision
            if(
                this.currentPos.x >= (board.width - this.radius) ||
                this.currentPos.y >= (board.height - this.radius) ||
                this.currentPos.x <= 0
            ){
                this.changeDirection();
                
            }

            //user collision
            if(
                (
                    this.currentPos.x > user.currentPos.x &&
                    this.currentPos.x < user.currentPos.x + blockDefaults.width
                )
                &&
                (
                    this.currentPos.y > user.currentPos.y &&
                    this.currentPos.y < user.currentPos.y + blockDefaults.height
                )
            ){
                this.changeDirection();
                paddle.pause();
                paddle.currentTime = 0;
                paddle.play();
            }

            //hit ground
            if(this.currentPos.y <= 0){
                if(balls.length > 1){
                    this.element.remove();
                    balls.splice(balls.indexOf(this), 1);
                    return;
                } 
                lives--;
                livesDisplay.textContent = lives;
                console.log(lives);
                if(lives > 0) {
                    clearInterval(updateTimer);
                    //reset user and ball and spawn them again
                    resetItems();
                    //delay game for 1s
                    delayTimer = setTimeout(delay, 1000);
                    return;
                }
                //game over
                gameOverToggle();
            }
        }

        changeDirection(){
            if(
                this.direction.x === this.speed &&
                this.direction.y === this.speed
            ){
                this.direction.y = -this.speed;
                return;
            }
            if(
                this.direction.x === this.speed && 
                this.direction.y === -this.speed
            ){
                this.direction.x = -this.speed;
                return;
            }
            if(
                this.direction.x === -this.speed && 
                this.direction.y === -this.speed
            ){
                this.direction.y = this.speed;
                return;
            }
            if(
                this.direction.x === -this.speed &&
                this.direction.y === this.speed
            ){
                this.direction.x = this.speed;
                return;
            }
        
        }
    }

    const balls = [
        new Ball(
            document.querySelector('.ball'),
            {
                x: board.width/2 - ballDefaults.radius/2,
                y: user.currentPos.y + ballDefaults.radius,
            },
            {
                x: board.width/2 - ballDefaults.radius/2,
                y: user.currentPos.y + ballDefaults.radius,
            },
            ballDefaults.radius,
            ballSpeed, 
            {x: ballSpeed, y : ballSpeed}
        ), 
        // new Ball(
        //     document.querySelector('.ball'),
        //     {
        //         x: board.width/2 - ballDefaults.radius/2,
        //         y: user.currentPos.y + ballDefaults.radius,
        //     },
        //     {
        //         x: board.width/2 - ballDefaults.radius/2,
        //         y: user.currentPos.y + ballDefaults.radius,
        //     },
        //     ballDefaults.radius,
        //     -ballSpeed, 
        //     {x: -ballSpeed, y : -ballSpeed}
        // ),
    ];

    //key press check
    function keypressCheck(/**@type {KeyboardEvent}*/e){
        switch (e.key){
            case pauseKey.key:
                pauseMenuToggle();
                break;
            case restartKey.key:
                restart();
                break;
        }
    }

    //pause menu toggle
    function pauseMenuToggle(){
        const pauseMenuScreen = document.querySelector('.pause-menu');
        pauseKey.pressed = !pauseKey.pressed;
        if(pauseKey.pressed){
            pauseMenuScreen.style.display = 'flex';
            gamePaused = true;
        }
        else{
            pauseMenuScreen.style.display = 'none';
            gamePaused = false;
        }
        
    }

    //game over toggle
    function gameOverToggle(){
        const gameOverScreen = document.querySelector('.game-over');
        const scoreMessage = document.querySelector('.score-message');
        const scoreText = document.querySelector('.score-text');

        clearInterval(updateTimer);
        clearInterval(randomTimer);
        clearInterval(delayTimer);
        document.removeEventListener('keydown', moveUser);

        gameOver = !gameOver;

        if(gameOver){
            gameOverScreen.style.display = 'flex';
            scoreText.textContent = `Score: ${score}`;
            if(gameWon){
                scoreDisplay.textContent ='YOU WIN';
                scoreMessage.textContent = 'You win :)';
                win.play();
            }
            else{
                scoreDisplay.textContent = 'YOU LOSE';
                scoreMessage.textContent = 'You lose :(';
                lose.play();
            }
        }
        else{
            gameWon = false;
            gameOverScreen.style.display = 'none';
            scoreMessage.textContent = '';
            scoreText.textContent = ``;

            lose.pause();
            lose.currentTime = 0;

            win.pause();
            win.currentTime = 0;
        }
        
    }

    //remove by class name
    function removeElementsByClass(className){
        const elements = document.getElementsByClassName(className);
        while(elements.length > 0){
            elements[0].parentNode.removeChild(elements[0]);
        }
    }

    function resetItems(){
        //ball
        removeElementsByClass('ball');
        balls.forEach(ball => {
            ball.currentPos.x = ball.startPos.x;
            ball.currentPos.y = ball.startPos.y;
            ball.direction.x = ball.speed;
            ball.direction.y = ball.speed;
        });
        //user
        removeElementsByClass('user');
        user.currentPos.x = user.startPos.x;
        user.currentPos.y = user.startPos.y;
        //create and draw user
        user.createElement();
        user.draw();
        //create and draw ball
        balls.forEach(ball => {
            ball.createElement();
            ball.draw();
        });
    }
        
    function delay(){
        updateTimer = setInterval(update, gameSpeed);
    }

    //-----------Controls----------------
    function controls(){
        const container = document.querySelector('.controls-container');
        if(container.style.display == 'flex'){
            container.style.display = 'none';
            return;
        }
        container.style.display = 'flex';
    }

    //-----------Restart----------------
    function restart(){
        //set start to false
        gameStarted = false;

        //clear timers
        clearInterval(updateTimer);
        clearInterval(delayTimer);
        clearInterval(randomTimer);

        //reset lives
        lives = 3;
        livesDisplay.textContent = lives;

        //reset score
        score = 0;
        scoreDisplay.textContent = score;

        //block
        removeElementsByClass('block');

        //ball
        removeElementsByClass('ball');
        balls.forEach(ball => {
            ball.currentPos.x = ball.startPos.x;
            ball.currentPos.y = ball.startPos.y;
            ball.direction.x = ball.speed;
            ball.direction.y = ball.speed;
        });
        
        //user
        removeElementsByClass('user');
        user.currentPos.x = user.startPos.x;
        user.currentPos.y = user.startPos.y;

        //remove random
        removeElementsByClass('random');

        //make sure pause screen off
        if(gamePaused) pauseMenuToggle();

        //make sure game over screen off
        if(gameOver) gameOverToggle();

        //reset rotate
        degrees = 0;
        board.element.style.transform = `rotate(${degrees}deg)`;

        //start game again
        delayTimer = setTimeout(start, 200);
    }

    //-----------Update---------------- 
    function update(){
        if(!gamePaused){

            balls.forEach(ball => {
                ball.moveBall();
                ball.draw();
                ball.checkForCollisions();
            });

            if(leftArrow.pressed)
                user.moveLeft();
            if(rightArrow.pressed)
                user.moveRight();

            // rotateBoard();
        }
    }

    //-----------Start---------------- 
    function start(){
        if (gameStarted){ 
            restart();
            return;
        }

        //create blocks
        createBlocks();
        
        //create and draw user
        user.createElement();
        user.draw();

        //add event to user for pressing keys
        document.addEventListener('keydown', moveUser);
        document.addEventListener('keyup', stopUser);

        //resume button
        document.querySelector('.resume').addEventListener('click', pauseMenuToggle);

        //restart button
        document.querySelectorAll('.restart').forEach(e => e.addEventListener('click', restart));

        //key press events
        document.addEventListener('keypress', keypressCheck);

        //create and draw ball
        balls.forEach(ball => {
            ball.createElement();
            ball.draw();
        });

        //update timer
        updateTimer = setInterval(update, gameSpeed);

        //random timer
        randomTimer = setInterval(showRandomPerk, randomSpeed);

        //scroll to center of board
        board.element.scrollIntoView({
            behavior: 'smooth',
            block: 'center', 
            inline: 'center', 
        });

        //show random
        showRandomPerk();

        //game started!
        gameStarted = true;
    }
    
}