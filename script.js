window.addEventListener('load', function(){
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 720;
    let enemies = [];
    let score = 0;
    let gameOver = false;
    const fullScreenButton = document.getElementById('fullScreenButton');

    class InputHandler {
        constructor(){
            this.keys = [];

            this.touchY = '';
            this.touchThreshold = 30; // 이 값이 커지면 스와이프를 많이 해야 인식함

            // scope 문제로 이런 형태로 작성하면 문제가 생김 arrow function으로 구현해야 함
            // arrow function과의 차이가 단순 표기만 있는게 아니었구나!
            /*
            window.addEventListener('keydown', function(e){
                //console.log(e)
                //console.log(e.key)
                if (e.key === 'ArrowDown') {
                    this.keys.push(e.key);
                }
                console.log(e.key, this.keys);
            });
            */
           // don't build their own 'this', but they inherit the one
           // from their parent scope, this is called lexical scoping
            window.addEventListener('keydown', e => {
                if ((
                    e.key === 'ArrowDown' ||
                    e.key === 'ArrowUp' ||
                    e.key === 'ArrowLeft' ||
                    e.key === 'ArrowRight'
                    )
                    && this.keys.indexOf(e.key) === -1) {
                        // 중복 입력 없게
                    this.keys.push(e.key);
                } else if (e.key === 'Enter' && gameOver) restartGame();
                //console.log(e.key, this.keys);
                //무슨 키를 입력받고 있니?
            });

            window.addEventListener('keyup', e => {
                if (
                    e.key === 'ArrowDown' ||
                    e.key === 'ArrowUp' ||
                    e.key === 'ArrowLeft' ||
                    e.key === 'ArrowRight'
                    ) {
                    this.keys.splice(this.keys.indexOf(e.key), 1);
                    //눌려서 keys에 들어있던 키를 삭제
                }
                //console.log(e.key, this.keys);
            });

            // control logic for mobile environment

            // window.addEventListener('touchstart', e => {
            //     console.log('start');
            // });
            // window.addEventListener('touchmove', e => {
            //     console.log('move');
            //     console.log(e.changedTouches[0].pageY);
            // });
            // window.addEventListener('touchend', e => {
            //     console.log('end');
            // });

            window.addEventListener('touchstart', e => {
                this.touchY = e.changedTouches[0].pageY
            });
            window.addEventListener('touchmove', e => {
                const swipeDistance = e.changedTouches[0].pageY - this.touchY;
                if (swipeDistance < -this.touchThreshold //Distance 값을 비교
                    && this.keys.indexOf('swipe up') === -1){ //swipe up 중복 입력을 피하기 위해
                        this.keys.push('swipe up');
                } else if (swipeDistance > this.touchThreshold
                    && this.keys.indexOf('swipe down') === -1){ 
                        this.keys.push('swipe down');
                    //이걸 왜 여기에 하는지 모르겠지만
                    if (gameOver) restartGame();
                }
            });
            window.addEventListener('touchend', e => {
                console.log(this.keys);
                //한번 입력했던 값을 삭제
                this.keys.splice(this.keys.indexOf('swipe up'), 1);
                this.keys.splice(this.keys.indexOf('swipe down'), 1);
            });
        }
    }

    class Player {
        constructor(gameWidth, gameHeight){
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.width = 200;
            this.height = 200;
            this.x = 0;
            this.y = this.gameHeight - this.height;
            this.image = document.getElementById('playerImage')
            this.frameX = 0;
            this.maxFrame = 8;
            this.frameY = 0;
            this.fps = 20;
            this.frameTimer = 0;
            this.frameInterval = 1000/this.fps;
            this.speed = 0;
            this.vy = 0;
            this.weight = 1;
        }
        restart(){
            this.x = 100;
            this.y = this.gameHeight - this.height;
            this.maxFrame = 8;
            this.frameY = 0;
        }
        draw(context){
            
            /*
            //collision detection circle
            context.beginPath(); //근데 이건 뭐냐?
            //context.arc(this.x, this.y, this.width/2, 0, Math.PI * 2);
            context.arc(this.x + this.width / 2, this.y + this.height / 2, this.width/2, 0, Math.PI * 2);
            context.stroke();

            // 이게 실제 충돌 감지에 쓰이는 circle이라는데....
            // 왜 그런지는 정확히 모르겠음.
            context.strokeStyle = 'blue';
            context.beginPath();
            context.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
            context.stroke();
            */

            // collsion detection circle 크기를 좀 줄였음.
            context.lineWidth = 5;
            context.strokeStyle = 'white';
            context.beginPath();
            context.arc(this.x + this.width / 2, this.y + this.height / 2 + 20, this.width/3, 0, Math.PI * 2);
            context.stroke();

            context.drawImage(this.image, this.frameX * this.width, this.frameY * this.height, this.width, this.height, this.x, this.y, this.width, this.height);
        }
        update(input, deltaTime, enemies){
            //collision detection
            enemies.forEach(enemy => {
                //const dx = enemy.x - this.x;
                //const dy = enemy.y - this.y;

                /* circle이 너무 커서 정확한 충돌감지가 안 되네...
                // 정확히는 모르겠는데 어쨌든 이게 진짜 충돌 감지에 쓰이는 값?
                // x 좌표와 y 좌표를 중점으로 옮겼음.
                const dx = (enemy.x + enemy.width / 2) - (this.x + this.width / 2);
                const dy = (enemy.y + enemy.height / 2) - (this.y + this.height / 2);
                
                //피타고라스의 정리로 거리 측정
                const distance = Math.sqrt(dx*dx + dy*dy);
                if (distance < enemy.width / 2 + this.width / 2) {
                    gameOver = true;
                }
                */

                /* 원을 작게하고 충돌할때 거리를 조정해보자.
                const dx = (enemy.x + enemy.width / 2) - (this.x + this.width / 2);
                const dy = (enemy.y + enemy.height / 2) - (this.y + this.height / 2 + 20);
                const distance = Math.sqrt(dx*dx + dy*dy);
                if (distance < enemy.width / 2 + this.width / 3) {
                    gameOver = true;
                }
                */

                //enemy의 충돌 감지 구역이 바뀌었으니 이것도 적용해보자.
                //context.arc(this.x + this.width / 2 - 20, this.y + this.height / 2, this.width/3, 0, Math.PI * 2);
                const dx = (enemy.x + enemy.width / 2 - 20) - (this.x + this.width / 2);
                const dy = (enemy.y + enemy.height / 2) - (this.y + this.height / 2 + 20);
                const distance = Math.sqrt(dx*dx + dy*dy);
                if (distance < enemy.width / 3 + this.width / 3) {
                    gameOver = true;
                }
            });

            //sprite animation
            if (this.frameTimer > this.frameInterval) {
                if (this.frameX >= this.maxFrame) this.frameX = 0;
                else this.frameX++;
                this.frameTimer = 0;
            } else {
                this.frameTimer += deltaTime;
            }

            //controls
            if (input.keys.indexOf('ArrowRight') > -1){
                this.speed = 5;
            } else if (input.keys.indexOf('ArrowLeft') > -1) {
                this.speed = -5;
            } else if ((input.keys.indexOf('ArrowUp') > -1 || input.keys.indexOf('swipe up') > -1) 
                    && this.onGround()) {
                this.vy = -32;
            } else {
                this.speed = 0;
            }

            //horizontal movement
            this.x += this.speed;
            if (this.x < 0) this.x = 0;
            else if (this.x > this.gameWidth - this.width) this.x = this.gameWidth - this.width;

            //vertical movement
            this.y += this.vy;
            if (!this.onGround()) {
                this.vy += this.weight;
                //weight가 중력 역할을 해서
                //점프가 눌려지면 +1씩 하면서 vy의 값이 -32에서 점점 0으로 되어간다.
                //0에서부터 다시 떨어지기 시작
                this.maxFrame = 5;
                //점프시 프레임은 다섯개
                this.frameY = 1;
            } else {
                this.vy = 0;
                this.maxFrame = 8;
                //달릴때 프레임은 여덟개
                this.frameY = 0;
            }
            if (this.y > this.gameHeight - this.height) this.y = this.gameHeight - this.height;
        }
        onGround(){
            return this.y >= this.gameHeight - this.height;
        }
    }

    class Background {
        constructor(gameWidth, gameHeight){
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.image = document.getElementById('backgroundImage');
            this.x = 0;
            this.y = 0;
            this.width = 2400;
            this.height = 720;
            this.speed = 7;
        }
        restart(){
            this.x = 0;
        }
        draw(context){
            context.drawImage(this.image, this.x, this.y, this.width, this.height);
            //한 장을 더 이어서 붙여서 배경이 끊임 없이 이어지게...
            //context.drawImage(this.image, this.x + this.width , this.y, this.width, this.height);
            //이어 붙인 미세한 절단 면을 없애기 위해
            context.drawImage(this.image, this.x + this.width - this.speed, this.y, this.width, this.height);
        }
        update(){
            this.x -= this.speed;
            if (this.x < - this.width) this.x = 0;
        }
    }

    class Enemy {
        constructor(gameWidth, gameHeight){
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.width = 160;
            this.height = 119;
            this.image = document.getElementById('enemyImage');
            this.x = this.gameWidth;
            this.y = this.gameHeight - this.height;
            this.frameX = 0;
            this.maxFrame = 5;
            this.fps = 20;
            this.frameTimer = 0;
            this.frameInterval = 1000/this.fps;
            this.speed = 5;
            this.markedForDeletion = false;
        }
        draw(context){
            // context.strokeStyle = 'white';
            // context.strokeRect(this.x, this.y, this.width, this.height);

            /*
            //collision detection circle for enemy
            context.beginPath(); //근데 이건 뭐냐?
            //context.arc(this.x, this.y, this.width/2, 0, Math.PI * 2);
            context.arc(this.x + this.width / 2, this.y + this.height / 2, this.width/2, 0, Math.PI * 2);
            context.stroke();

            // 이게 실제 충돌 감지에 쓰이는 circle이라는데....
            // 왜 그런지는 정확히 모르겠음.
            context.strokeStyle = 'blue';
            context.beginPath();
            context.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
            context.stroke();
            */

            // collsion detection circle 크기를 좀 줄였음.
            context.lineWidth = 5;
            context.strokeStyle = 'white';
            context.beginPath();
            context.arc(this.x + this.width / 2 - 20, this.y + this.height / 2, this.width/3, 0, Math.PI * 2);
            context.stroke();
            
            context.drawImage(this.image, this.frameX * this.width, 0, this.width, this.height, this.x, this.y, this.width, this.height);
        }
        update(deltaTime){
            if (this.frameTimer > this.frameInterval){
                if (this.frameX >= this.maxFrame) this.frameX = 0;
                else this.frameX++;
                this.frameTimer = 0;        
            } else {
                this.frameTimer += deltaTime;
            }
            this.x -= this.speed;
            if (this.x < 0 - this.width) {
                this.markedForDeletion = true;
                score++;
                // 아... 이걸로 점수를 측정하기로
            }
        }
    }

    function handleEnemies(deltaTime){
        //enemies.push(new Enemy());

        if (enemyTimer > enemyInterval + randomEnemyInterval){
            enemies.push(new Enemy(canvas.width, canvas.height));
            //console.log(enemies);
            //enemies가 무한대로 늘어나니?
            randomEnemyInterval = Math.random() * 1000 + 500;
            enemyTimer = 0;
        } else {
            enemyTimer += deltaTime;
        }
        enemies.forEach(enemy => {
            enemy.draw(ctx);
            enemy.update(deltaTime);
        });
        enemies = enemies.filter(enemy => !enemy.markedForDeletion);
    }

    function displayStatusText(context){
        context.textAlign = 'left';
        context.font = '40px Helvetica';
        context.fillStyle = 'black';
        context.fillText('Score : '+ score, 20, 50);
        context.fillStyle = 'white';
        context.fillText('Score : '+ score, 22, 52);
        //원래 css에 입체 효과가 있는데 이걸 사용하니 파폭에서 프레임 드랍이 발생하는 문제가 있어서 이런 식으로 회피

        if (gameOver) {
            context.textAlign = 'center';
            context.fillStyle = 'black';
            context.fillText('Game Over, press Enter or swipe down to restart!', canvas.width / 2, 200);
            context.fillStyle = 'white';
            context.fillText('Game Over, press Enter or swipe down to restart!', canvas.width / 2 + 2, 202);
                
        }
    }

    function restartGame(){
        player.restart();
        background.restart();

        enemies = [];
        score = 0;
        gameOver = false;

        animate(0);
    }

    function toggleFullScreen(){
        if (!document.fullscreenElement) {
            canvas.requestFullscreen().catch(err => {
                //promise
                alert(`Error, can't enable full-screen mode: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }

    //Failed to execute 'requestFullscreen' on 'Element': API can only be initiated by a user gesture.
    //이렇게 하면 안 되고 반드시 직접적인 사용자 입력이 있어야 함
    //toggleFullScreen();

    fullScreenButton.addEventListener('click', toggleFullScreen);

    const input = new InputHandler();
    const player = new Player(canvas.width, canvas.height);
    const background = new Background(canvas.width, canvas.height);
    //const enemy1 = new Enemy(canvas.width, canvas.height);

    let lastTime = 0;
    let enemyTimer = 0;
    let enemyInterval = 1000;
    let randomEnemyInterval = Math.random() * 1000 + 500;

    function animate(timeStamp){
        const deltaTime = timeStamp - lastTime;
        lastTime = timeStamp;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        background.draw(ctx);
        //background.update();

        player.draw(ctx);
        player.update(input, deltaTime, enemies);
        
        //enemy1.draw(ctx);
        //enemy1.update();
        handleEnemies(deltaTime);
        displayStatusText(ctx)
        if (!gameOver) requestAnimationFrame(animate);
    }
    animate(0);
});