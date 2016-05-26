;(function () {

  var Game = function (canvasId, fireId, lstrafeId, rstrafeId, spriteSrc, keyCodes) {
    var canvas = document.getElementById(canvasId);

    this.controls = {
      FIRE: fireId,
      LEFT: lstrafeId,
      RIGHT: rstrafeId,
      keyCodes: keyCodes,
      speed: 2
    }

    this.ctx = canvas.getContext('2d');
    this.ctx.fillStyle = "#fff";

    this.sprite = new Image();
    this.sprite.src = spriteSrc;

    this.gameSize = {
      WIDTH: 400,
      HEIGHT: 420,
      paddings: {
        TOP: 40,
        RIGHT: 20,
        BOTTOM: 0,
        LEFT: 20
      }
    }

    this.spriteMap = {
      alien: {
        thin: {
          HEIGHT: 16,
          sy: 0,
          sx1: 0,
          sx2: 16,
          WIDTH: 16
        },
        mid: {
          HEIGHT: 16,
          sy: 0,
          sx1: 32,
          sx2: 54,
          WIDTH: 22
        },
        fat: {
          HEIGHT: 16,
          sy: 0,
          sx1: 76,
          sx2: 100,
          WIDTH: 24
        },
      },
      player: {
        sx: 124,
        sy: 0,
        HEIGHT: 16,
        WIDTH: 26
      },
      fort: {
        sy: 0,
        sxTL: 150,
        sxTR: 161,
        sxBL: 172,
        sxBR: 183,
        sxMID: 194,
        HEIGHT: 16,
        WIDTH: 11
      }
    }

    this.gameState = {
      score: 0,
      startGame: true,
      lose: false,
      win: false,
      pause: false,
      textMark: 0
    }

    this.objects = {
      player: new Player(this.controls, this.gameSize, this.sprite, this.spriteMap.player),
      alienPool: {},
      bulletPool: {},
      fortPool: {}
    }

    var self = this;
    var tick = function () {
      self.update(self.gameState, self.objects);
      self.render(self.ctx, self.gameSize, self.gameState, self.objects);
      requestAnimationFrame(tick);
    }

    setTimeout(tick, 500);
  }
  Game.prototype = {
    update: function (state, objects) {
      objects.player.update(state, objects.bulletPool, this);
      if (!state.pause && !state.startGame && !state.lose && !state.win) {
        objects.alienPool.update(this, objects.bulletPool, this.spriteMap.player);
        objects.bulletPool.update();
        objects.fortPool.update();
      }
    },
    render: function (ctx, gameSize, state, objects) {
      ctx.clearRect(0, 0, gameSize.WIDTH, gameSize.HEIGHT);
      if (state.startGame) {
        ctx.font = "30pt Impact";
        ctx.fillText("Space Invaders", 60, 150);
        if (state.textMark >= 10 && state.textMark < 80) {
          ctx.font = "12pt Arial";
          ctx.fillText("Press \"Fire\" to start new game", 60, 190);
        } else if (state.textMark >= 80) {
          state.textMark = 0;
        }
        state.textMark++;
      } else if (state.pause) {
        if (state.textMark >= 10 && state.textMark < 80) {
          ctx.font = "12pt Arial";
          ctx.fillText("PAUSE", 100, 190);
        } else if (state.textMark >= 80) {
          state.textMark = 0;
        }
        state.textMark++;
      } else if (state.gameover) {
        ctx.font = "30pt Impact";
        ctx.fillText("GAME OVER", 60, 150);
        if (state.textMark >= 10 && state.textMark < 80) {
          ctx.font = "12pt Arial";
          ctx.fillText("Press \"Fire\" to start new game", 60, 190);
        } else if (state.textMark >= 80) {
          state.textMark = 0;
        }
        state.textMark++;
      } else if (state.win) {
        ctx.font = "30pt Impact";
        ctx.fillText("YOU WIN", 60, 150);
        if (state.textMark >= 10 && state.textMark < 80) {
          ctx.font = "12pt Arial";
          ctx.fillText("Press \"Fire\" to start new game", 60, 190);
        } else if (state.textMark >= 80) {
          state.textMark = 0;
        }
        state.textMark++;
      } else {
        objects.alienPool.render(ctx);
        objects.bulletPool.render(ctx);
        objects.fortPool.render(ctx);
      }
      objects.player.render(ctx);
    },
    crash: function () {
      this.gameState.gameover = true;
    },
    win: function () {
      this.gameState.win = true;
    },
    newGame: function () {
      this.gameState.startGame = false;
      this.gameState.gameover = false;
      this.gameState.win = false;
      this.objects.alienPool = new AlienPool(this, this.gameSize, this.sprite, this.spriteMap.alien);
      this.objects.bulletPool = new BulletPool(this.gameSize);
      this.objects.fortPool = new FortPool(this.gameSize);
    },
    togglePause: function () {
      this.pause = !this.pause;
    }
  }

  var Player = function (controls, gameSize, sprite, spriteMap) {
    this.sprite = sprite;
    this.map = spriteMap;
    this.gameSize = gameSize;
    this.position = {x: gameSize.WIDTH/2 - spriteMap.WIDTH/2, y: gameSize.HEIGHT - spriteMap.HEIGHT};
    this.controls = controls;
    this.keyControl = new KeyControl(this.controls);
  }

  Player.prototype = {
    update: function (state, bulletPool, game) {
      if (( this.keyControl.isDown(this.controls.keyCodes.LEFT) ||
            this.keyControl.isButtonDown(this.controls.LEFT) ) &&
            this.position.x > this.gameSize.paddings.LEFT )
      {
        this.position.x -= this.controls.speed;
      }

      if (( this.keyControl.isDown(this.controls.keyCodes.RIGHT) ||
            this.keyControl.isButtonDown(this.controls.RIGHT) ) &&
            this.position.x < (this.gameSize.WIDTH - this.gameSize.paddings.RIGHT - this.map.WIDTH) )
      {
        this.position.x += this.controls.speed;
      }

      if ( this.keyControl.isDown(this.controls.keyCodes.FIRE) || this.keyControl.isButtonDown(this.controls.FIRE) )
      {
        if (state.gameover || state.startGame || state.win) {
          game.newGame();
        } else if (bulletPool) {
          bulletPool.playerShoot(this.position.x + this.map.WIDTH / 2, this.position.y);
        }
      }
      if (bulletPool.aliensBullets) {
        var tgtX = this.position.x;
        var tgtY = this.position.y;
        var tgtMap = this.map;
        var blast = bulletPool.aliensBullets;
        for (var i = 0; i < blast.length; i++) {
          if (
            (blast[i].x > tgtX) &&
            (blast[i].x < tgtX + tgtMap.WIDTH) &&
            (blast[i].y > tgtY) &&
            (blast[i].y < tgtY + tgtMap.HEIGHT)
          ) {
            game.crash();
          }
        }
      }

    },
    render: function (ctx) {
      ctx.drawImage(
        this.sprite,
        this.map.sx,
        this.map.sy,
        this.map.WIDTH,
        this.map.HEIGHT,
        this.position.x,
        this.position.y,
        this.map.WIDTH,
        this.map.HEIGHT
      );
    }
  }

  var AlienPool = function (game, gameSize, sprite, spriteMap) {
    this.game = game;
    this.sprite = sprite;
    this.map = spriteMap;
    this.gameSize = gameSize;
    this.position = {
      x: this.gameSize.paddings.LEFT,
      y: this.gameSize.paddings.TOP,
      bx1: this.gameSize.paddings.LEFT,
      bx2: gameSize.WIDTH - this.gameSize.paddings.RIGHT
    }
    this.speedX = 5;
    this.speedY = 8;
    this.timer = 0;
    this.timerEnd = 30;
    this.aliens = [];
    for (var i = 0; i < 55; i++) {
      if (i % 5 === 0) {
        this.aliens.push(new Alien({
          x: (this.map.fat.WIDTH + 6) * (Math.floor(i / 5)),
          y: 0
        }, this.map.thin));
      } else if (i % 5 === 1) {
        this.aliens.push(new Alien({
          x: (this.map.fat.WIDTH + 6) * (Math.floor(i / 5)),
          y: 32
        }, this.map.mid));
      } else if (i % 5 === 2) {
        this.aliens.push(new Alien({
          x: (this.map.fat.WIDTH + 6) * (Math.floor(i / 5)),
          y: 64
        }, this.map.mid));
      } else if (i % 5 === 3) {
        this.aliens.push(new Alien({
          x: (this.map.fat.WIDTH + 6) * (Math.floor(i / 5)),
          y: 96
        }, this.map.fat));
      } else if (i % 5 === 4) {
        this.aliens.push(new Alien({
          x: (this.map.fat.WIDTH + 6) * (Math.floor(i / 5)),
          y: 128
        }, this.map.fat));
      }
    }
  }

  AlienPool.prototype = {
    update: function (game, bulletPool, playerMap) {
      if (this.timer >= this.timerEnd) {
        this.timer = 0;
        this.alienFlg = !this.alienFlg;
        if ((this.aliens.length) &&
            (this.aliens[0].position.x + this.position.x >= this.position.bx1) &&
            (this.aliens[this.aliens.length - 1].position.x + this.position.x + this.map.fat.WIDTH < this.position.bx2)) {
          this.position.x = this.position.x + this.speedX;
          this.timerEnd = Math.floor(this.aliens.length / 2);
        } else {
          this.speedX = -this.speedX;
          this.position.x = this.position.x + this.speedX;
          this.position.y = this.position.y + this.speedY;
        }
      } else {
        this.timer++;
      }

      var blast = bulletPool.playerBullets;
      var target = 0;
      if (this.aliens.length) {
        for (var i = 0; i < this.aliens.length; i++) {
          if (getRandom()) {
            bulletPool.alienShoot(
              this.aliens[i].position.x + this.position.x + this.aliens[i].map.WIDTH / 2,
              this.aliens[i].position.y + this.position.y + this.aliens[i].map.HEIGHT
            );
          }
          if ( this.aliens[i].position.y + this.position.y + this.aliens[i].map.HEIGHT > this.gameSize.HEIGHT - playerMap.HEIGHT ) {
            game.crash();
          }
          tgtX = this.aliens[i].position.x + this.position.x;
          tgtY = this.aliens[i].position.y + this.position.y;
          tgtMap = this.aliens[i].map;
          for (var j = 0; j < blast.length; j++) {
            blast[j]
            if (
              (blast[j].x > tgtX) &&
              (blast[j].x < tgtX + tgtMap.WIDTH) &&
              (blast[j].y > tgtY) &&
              (blast[j].y < tgtY + tgtMap.HEIGHT)
            ) {
              this.aliens.splice(i, 1);
              bulletPool.playerBullets.splice(j, 1);
            }
          }
        }
      } else {
        game.win();
      }

    },
    render: function (ctx) {
      if (this.alienFlg === false) {
        for (var i = 0; i < this.aliens.length; i++) {
          ctx.drawImage(
            this.sprite,
            this.aliens[i].map.sx1,
            this.aliens[i].map.sy,
            this.aliens[i].map.WIDTH,
            this.aliens[i].map.HEIGHT,
            this.aliens[i].position.x + this.position.x,
            this.aliens[i].position.y + this.position.y,
            this.aliens[i].map.WIDTH,
            this.aliens[i].map.HEIGHT
          );
        }
      } else {
        for (var i = 0; i < this.aliens.length; i++) {
          ctx.drawImage(
            this.sprite,
            this.aliens[i].map.sx2,
            this.aliens[i].map.sy,
            this.aliens[i].map.WIDTH,
            this.aliens[i].map.HEIGHT,
            this.aliens[i].position.x + this.position.x,
            this.aliens[i].position.y + this.position.y,
            this.aliens[i].map.WIDTH,
            this.aliens[i].map.HEIGHT
          );
        }
      }
    }
  }

  var Alien = function (position, spriteMap) {
    this.map = spriteMap;
    this.position = position;
  }

  var BulletPool = function (gameSize) {
    this.gameSize = gameSize;
    this.playerBullets = [];
    this.aliensBullets = [];
  }

  BulletPool.prototype = {
    update: function () {
      if (this.playerBullets[0] && this.playerBullets[0].y > 0) {
        this.playerBullets[0].y = this.playerBullets[0].y - 6;
      } else {
        this.playerBullets = [];
      }

      for (var i = 0; i < this.aliensBullets.length; i++) {
        if (this.aliensBullets[i].y > this.gameSize.HEIGHT && this.aliensBullets.length >= 5) {
          this.aliensBullets.splice(i, 1);
        }
        this.aliensBullets[i].y = this.aliensBullets[i].y + 3;
      }
    },
    render: function (ctx) {
      for (var i = 0; i < this.playerBullets.length; i++) {
        ctx.fillRect(this.playerBullets[i].x-1, this.playerBullets[i].y-1, 2, 2);
      }
      for (var i = 0; i < this.aliensBullets.length; i++) {
        ctx.fillRect(this.aliensBullets[i].x-1, this.aliensBullets[i].y-1, 2, 2);
      }
    },
    playerShoot: function (x, y) {
      if (!this.playerBullets[0]) {
        this.playerBullets.push(new Bullet(x, y));
      }
    },
    alienShoot: function (x, y) {
      if (this.aliensBullets.length <= 5) {
        this.aliensBullets.push(new Bullet(x, y));
      }
    }
  }

  var Bullet = function (x, y) {
    this.x = x;
    this.y = y;
  }

  var FortPool = function (gameSize, sprite, spriteMap) {

  }

  FortPool.prototype = {
    update: function () {

    },
    render: function (ctx) {

    }
  }



  var FortPart = function () {

  }

  FortPart.prototype = {
    update: function () {

    },
    render: function () {

    }
  }

  var KeyControl = function (controls) {
    var keyState = {};
    this.buttons = {
      fire: document.getElementById(controls.FIRE),
      left: document.getElementById(controls.LEFT),
      right: document.getElementById(controls.RIGHT)
    }

    window.onkeydown = function (e) {
      keyState[e.keyCode] = true;
    }
    window.onkeyup = function (e) {
      keyState[e.keyCode] = false;
    }

    this.buttons.fire.onmousedown = function () {
      keyState[controls.FIRE] = true;
    }
    this.buttons.fire.onmouseup = function () {
      keyState[controls.FIRE] = false;
    }

    this.buttons.left.onmousedown = function () {
      keyState[controls.LEFT] = true;
    }
    this.buttons.left.onmouseup = function () {
      keyState[controls.LEFT] = false;
    }

    this.buttons.right.onmousedown = function () {
      keyState[controls.RIGHT] = true;
    }
    this.buttons.right.onmouseup = function () {
      keyState[controls.RIGHT] = false;
    }

    this.buttons.fire.ontouchstart = function (e) {
      e.preventDefault();
      keyState[controls.FIRE] = true;
    }
    this.buttons.fire.ontouchend = function (e) {
      e.preventDefault();
      keyState[controls.FIRE] = false;
    }

    this.buttons.left.ontouchstart = function (e) {
      e.preventDefault();
      keyState[controls.LEFT] = true;
    }
    this.buttons.left.ontouchend = function (e) {
      e.preventDefault();
      keyState[controls.LEFT] = false;
    }

    this.buttons.right.ontouchstart = function (e) {
      e.preventDefault();
      keyState[controls.RIGHT] = true;
    }
    this.buttons.right.ontouchend = function (e) {
      e.preventDefault();
      keyState[controls.RIGHT] = false;
    }

    this.isDown = function (keyCode) {
      return keyState[keyCode] === true;
    }

    this.isButtonDown = function (btn) {
      return keyState[btn] === true;
    }
  }

function getRandom() {
  return Math.floor(Math.random() + 0.001);
}
  window.onload = function () {
    game = new Game("gamebox", "fire", "lstrafe", "rstrafe", "img/sprite.png", {LEFT: 37, RIGHT: 39, FIRE: 32});
  }
})();
