'use strict';
var canvas, ctx;
var stageWidth, stageHeight, offSetL, offSetT;
var player;
var score = 0;

const PLAYER = "player", ALIEN = "alien", MISSILE = "missile";

var sceneList = [], keys = [];
var loadCount = 0, minLoad = 3;
var gameOVer = false;

var stopHor = false, stopVert = false;

window.onload = function () 
{
  initGame();
}

function initGame() 
{
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');
  stageWidth = canvas.width;
  stageHeight = canvas.height;
  offSetL = canvas.offsetLeft;
  offSetT = canvas.offsetTop;

  //id, x, y, speed, drag, acc, maxSpeed, angle
  player = makeObj(PLAYER, stageWidth/2, stageHeight/2, 0, 0.98, 0.3, 8, 0);
  sceneList.push(player);
  
  player.image.addEventListener('load', loadHandler, false);
  player.image.src = "images/ship.png";

  //id, x, y, speed, drag, acc, maxSpeed, angle
  var missile = makeObj(MISSILE, player.x, player.y, 0, 1, 0, 20, player.angle);
  sceneList.push(missile);

  missile.image.addEventListener('load', loadHandler, false);
  missile.image.src = "images/missile.png";

  spawnAlien(10, 10);
  spawnAlien(500, 200);
}

function loadHandler(e)
{
  for(var i = 0; i < sceneList.length; i++)
  {
    if(e.target === sceneList[i].image)
    {
      sceneList[i].width = e.target.width;
      sceneList[i].height = e.target.height;
      break;
    }
  }

  if(++loadCount == minLoad)
  {
    window.addEventListener('keydown', keyDownHandler, false);
    window.addEventListener('keyup', keyUpHandler, false);

    render();
  }
}

function render()
{
  if(!gameOVer){
  // Input
  manageInput();
  manageProjectiles();
  // Move
  
  manageMovement();
  
  // Collision
  manageCollision();
  
  // Draw
  draw();

  requestAnimationFrame(render);
  }
  else
  {
    ctx.fillStyle = "#c46d68";
    ctx.fillRect(0,0, stageWidth, stageHeight);
    draw();
  }
}

function draw()
{
  ctx.globalAlpha = 0.3;
  ctx.fillRect(0, 0, stageWidth, stageHeight)
  ctx.globalAlpha = 1;

  var obj;

  for(var i = 0; i < sceneList.length; i++)
  {
    obj = sceneList[i];
    ctx.save();
    ctx.translate(obj.x, obj.y);
    ctx.rotate(deg2Rads(obj.angle));
    ctx.drawImage(obj.image, -(obj.width/2), -(obj.height/2));
    ctx.restore();
  }

}

function keyDownHandler(e)
{
  keys[e.keyCode] = true;
}

function keyUpHandler(e)
{
  keys[e.keyCode] = false;
}

function manageInput()
{
  //forward
  if(keys[87])
  {
    if(player.speed < player.maxSpeed)
    {
      player.speed += player.acc;
    }
  }

  //reverse
  if(keys[83])
  {
    if(player.speed > -player.maxSpeed / 2.5)
    {
      player.speed -= player.acc;
    }
  }

  // leftKey - a
  if(keys[65])
  {
    player.angle -= 6;
  }

  // rightKey - d
  if(keys[68])
  {
    player.angle += 6;
  }

  if(keys[32])
  {
    player.shoot = true;
  }
}

function manageProjectiles()
{
  if(player.shoot)
  {
    player.shoot = false;
    var missile;

    //player will always be 0 position
    for(var i = 1; i < sceneList.length; i++)
    {
      var obj = sceneList[i];

      if(obj.id == MISSILE && !obj.inFlight)
      {
        missile = obj;
        missile.inFlight = true;
        missile.speed = 9;
        break;
      }
    }
    
  }
}

function manageMovement()
{
  var obj, rads;

  for(var i = 0; i < sceneList.length; i++)
  {
    obj = sceneList[i];
    rads = deg2Rads(obj.angle);

    if(obj.id == MISSILE &&  !obj.inFlight)
    {
      obj.x = player.x;
      obj.y = player.y;
      obj.angle = player.angle;
    }

    if(obj.id == ALIEN)
    {
      pointToTarget(obj, player);
    }
    obj.speed *= obj.drag;
    
    obj.x += obj.speed * Math.cos(rads);
    obj.y += obj.speed * Math.sin(rads);
  }
}

function manageCollision()
{
  var obj;
  for(var i = 0; i < sceneList.length; i++)
  {
    obj = sceneList[i];
    if(obj.id === MISSILE)
    {
      if (checkOutOfBounds(obj)) 
      {
        restoreMissile(obj);
      }
      
      for(var h = 1; h < sceneList.length; h++)
      {
        var tempObj = sceneList[h];

        if(tempObj.id == ALIEN)
        {
          if(checkOverlap(tempObj, obj))
          {
            sceneList.splice(h, 1);
            restoreMissile(obj);
            spawnAlien(Math.random() * stageWidth, Math.random() * stageHeight);
            score++;
            document.getElementById("score").innerHTML = "Score: " + score;
          }
        }
      }

    }
    else if(checkOutOfBounds(obj) && obj.id === PLAYER)
    {
      obj.speed = 0;
    }

    if(obj.id === ALIEN && checkOverlap(obj, player))
    {
      gameOVer = true;
    }
  }
}

function restoreMissile(obj)
{
  obj.x = player.x;
  obj.y = player.y;
  obj.angle = player.angle;
  obj.speed = 0;
  obj.inFlight = false;
}

function checkOutOfBounds(obj)
{
  var out = false;

  if(obj.x + obj.getRotatedWidth() / 2 >= stageWidth)
  {
    //too far right
    out = true;
    obj.x = stageWidth - obj.getRotatedWidth()/2;
  }
  else if(obj.x - obj.getRotatedWidth()/2 <= 0)
  {
    //too far left
    out = true;
    obj.x = obj.getRotatedWidth()/2;
  }

  if(obj.y - obj.getRotatedHeight() / 2 <= 0)
  {
    //too far up
    out = true;
    obj.y = 0 + obj.getRotatedWidth()/2;
  }
  else if(obj.y + obj.getRotatedHeight() / 2 >= stageHeight)
  {
    //too far down
    out = true;
    obj.y = stageHeight - obj.getRotatedWidth()/2;
  }
  return out;
}

function pointToTarget(object, target)
{
  var dx  = target.x - object.x;
  var dy  = target.y - object.y;

  object.angle = rads2Degs(Math.atan2(dy, dx)); 
}

function spawnAlien(x, y)
{
  //id, x, y, speed, drag, acc, maxSpeed, angle
  var alien = makeObj(ALIEN, x, y, 3, 1, 0, 0, 0);
  sceneList.splice(1, 0, alien);

  alien.image.addEventListener('load', loadHandler, false);
  alien.image.src = "images/alien.png";

}

function checkOverlap(object, target)
{
  var hit = false;
  var dx = target.x - object.x;
  var dy = target.y - object.y;

  var radii = object.width / 2 + target.width / 2;

  if(Math.abs(dx) < radii)
  {
    if(Math.abs(dy) < radii)
    {
      hit = true;
    }
  }

  return hit;
}

function deg2Rads(deg) 
{
  return Math.PI / 180 * deg
}

function rads2Degs(rads) 
{
  return rads * (180 / Math.PI);
}

function getRandomInt(min, max) 
{
  return Math.floor(Math.random() * (max - min)) + min;
}

function makeObj(id, x, y, speed, drag, acc, maxSpeed, angle)
{ 
  var obj = {};

  obj.id = id;
  obj.x = x;
  obj.y = y;
  obj.angle = angle;
  obj.speed = speed;
  obj.drag = drag;
  obj.acc = acc;
  obj.maxSpeed = maxSpeed;
  obj.image = new Image();

  obj.getRotatedWidth = function()
  {
    var rads = deg2Rads(this.angle);
    var a = Math.abs(this.width * Math.cos(rads));
    var b = Math.abs(this.height * Math.sin(rads));
    return a + b;
  }

  obj.getRotatedHeight = function()
  {
    var rads = deg2Rads(this.angle);
    var c = Math.abs(this.height * Math.cos(rads));
    var d = Math.abs(this.width * Math.sin(rads));
    return c + d;
  }

  return obj;
}