'use strict';
class Vector {
  constructor (x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  plus (coordinates) {
    if (!(coordinates instanceof Vector)) {
      throw new SyntaxError("Можно прибавлять к вектору только вектор типа Vector");
    }
  return new Vector(this.x + coordinates.x, this.y + coordinates.y) ;
  }
  times (multiplier) {
    this.x = this.x * multiplier;
    this.y = this.y * multiplier;
    return this;
  }
  distance(vector) {
    return new Vector(Math.abs(this.x - vector.x), Math.abs(this.y-vector.y));
  }
}

class Actor {
  constructor(pos = new Vector(0,0), size = new Vector(1,1), speed = new Vector(0,0)) {
    if (!(pos instanceof Vector && size instanceof Vector && speed instanceof Vector)) {
      throw new SyntaxError("Можно прибавлять к вектору только вектор типа Vector");
    }
    this.pos = pos;
    this.size = size;
    this.width = this.size.x;
    this.height = this.size.y;
    this.speed = speed;
    this.type = 'actor';
    Object.defineProperty(this, "type", {
      type : 'actor',
      writable: false, 
    });
    Object.defineProperty(this, "left", {
      get: function() {
        return this.pos.x;
      }
    });
    Object.defineProperty(this, "right", {
      get: function() {
        return this.pos.x + this.size.x;
      }
    });
    Object.defineProperty(this, "top", {
      get: function() {
        return this.pos.y;
      }
    });
    Object.defineProperty(this, "bottom", {
      get: function() {
        // console.log(pos)
        return this.pos.y + this.size.y;
      }
    });
  }
  getCenter() {
    let posX = this.pos.x + this.size.x/2;
    let posY = this.pos.y + this.size.y/2;
    let result = new Vector(posX, posY);
    //console.log(`Center: ${result.x}, ${result.y}`);
    return result;
  }
  intersects(actor) {
    // console.log(actor.type);
    if (actor.type !== 'actor') {
      return undefined;
    }
    let obj = actor;
    let actorCenter = this.getCenter();
    let objCenter = obj.getCenter();
    let distance = actorCenter.distance(objCenter);
    if (distance.x < this.width/2 + obj.width/2) {
      if (distance.y < this.height/2 + obj.height/2) {
        return true;
      }
    }
    return undefined;
  }
  act() {}  
  isIntersect(actor) {
    if (!(actor instanceof Actor)) {
      throw new SyntaxError("Ожидается движущийся объект типа Actor");
    }
    if (actor === this || actor.size.x < 0) {
      return false;
    }
    // return intersects(actor);
    
    let leftThis = this.pos.x;
    let leftActor = actor.pos.x;
    let topThis = this.pos.y;
    let topActor = actor.pos.y;
    let bottomThis = this.pos.y + this.size.y;
    let bottomActor = actor.pos.y + actor.size.y;
    let rightThis = this.pos.x + this.size.x;
    let rightActor = actor.pos.x + actor.size.x;
    
    if (leftActor === rightThis || rightActor === leftThis || topActor === bottomThis || bottomActor === topThis) {      
      return false;
    }
    
    if ((leftThis <= leftActor && topThis <= topActor && bottomThis >= bottomActor && rightThis >= rightActor) || (leftThis >= leftActor && topThis >= topActor && bottomThis >= bottomActor && rightThis >= rightActor)) {
        return true;
    }
    return false;
  }
}


class Level {
  constructor(grid = [], actors = []) {
    this.height = grid.length; // высота игрового поля, координата Y 
    this.width = grid.reduce((width, line) => line.length > width ? line.length : width, 0); // X
    this.grid = grid; // сетка игрового поля
    this.actors = actors; // список объектов
    this.player = this.actors.find(actor => actor.type === 'player'); // игрок
    this.status = null; // сосотояние прохождения уровня
    this.finishDelay = 1;
  }
  isFinished() {
    if (status !== null && this.finishDelay < 0) {
      return true;
    }
    return false;
  }
  actorAt(actor) {
    if (!(actor instanceof Actor)) {
      throw new SyntaxError("нужен тип Actor");
    }

    for (let i = 0; i < this.actors.length; i++) {
      // console.log('for');
      var obj = this.actors[i];
      if (actor.intersects(obj) && actor !== obj) {
        return obj;
      }
    }
    return undefined;
  }
  obstacleAt(pos, size) {
    if (!(pos instanceof Vector) || !(size instanceof Vector)) {
      throw new SyntaxError("Можно прибавлять к вектору только вектор типа Vector");
    }
    
    var xStart = Math.floor(pos.x); // Округление вниз до ближайшего целого, горизонтальная
    var xEnd = Math.ceil(pos.x + size.x); // Округление вверх до ближайшего целого, размер горз.
    var yStart = Math.floor(pos.y); // Округление вниз до ближайшего целого, вертикальная
    var yEnd = Math.ceil(pos.y + size.y); // Округление вверх до ближайшего целого, размер верт.
    if (xStart < 0 || xEnd > this.width || yStart < 0) {
      return "wall";
    }
    if (yEnd > this.height) {
      return "lava";
    }
    
    for (var y = yStart; y < yEnd; y++) {
      for (var x = xStart; x < xEnd; x++) {
        var fieldType = this.grid[y][x];
        if (this.grid[y][x] !== undefined) {
          return this.grid[y][x];
        }
      }
    }
  }
  removeActor(actor) {
    this.actors = this.actors.filter(other => other !== actor);
  }
  noMoreActors(type) {
    if (this.actors.length === 0) {
      return true;
    }
    for (let actorIn of this.actors) {
      if (actorIn.type === type) {
        return false;
      }
    }
    return true;
  }
  playerTouched(touch, actor) {
    if (touch === 'lava' || touch === 'fireball') {
      this.status = 'lost';
    }
    if (touch === 'coin' && actor.type === 'coin') {
      for (let actorIn of this.actors) {
        if (actorIn.title === actor.title) {
          this.actors.splice((this.actors.indexOf(actor)),1);
          let filterCoin = this.actors.filter(function(actor) {
            return actor.type === 'coin';
          });
          if (filterCoin.length === 0) {
            this.status = 'won';
          }
        }
      }
    }
  }
}


class LevelParser {
  constructor(dictionaryActors = []) {
    this.dictionaryActors = dictionaryActors;
  }
  actorFromSymbol(symbol) {
    if (symbol == Object.keys(this.dictionaryActors)) {
      return this.dictionaryActors[symbol];
    }
    return undefined;
  }
  obstacleFromSymbol(symbol) {
  if (symbol === 'x') {
    return 'wall';
  }
  if (symbol === '!') {
    return 'lava';
  }
    console.log(symbol, 'obstacleFromSymbol');
    return undefined;    
  }
  createGrid(array) {
    let grid = [];
    array.forEach(row => {
    let line = row.split('');
    for (let cell of line) {
      if (cell === 'x') {
        line[line.indexOf(cell)] = 'wall';
      } else if (cell === '!') {
        line[line.indexOf(cell)] = 'lava';
      } else {
        line[line.indexOf(cell)] = undefined;
      }
    }
    grid.push(line);
    });
    return grid;
  }
  
  createActors (array) {
    if (array.length === 0) {
      console.log(array, 'вернуть пустой массив, если план пуст');
      return [];
    }
    let grid = [];
    let indexY = 0;
    array.forEach(row => {
      let line = row.split('');
      let y = indexY++;
      // for (let cell of line) {
      line.forEach(cell => {  
        if (cell === line[line.indexOf(cell)] && this.dictionaryActors[line[line.indexOf(cell)]] !== undefined) {
          grid.push(new this.dictionaryActors[line[line.indexOf(cell)]]((new Vector (line.indexOf(cell), y))));
          line[line.indexOf(cell)] = this.dictionaryActors.o;
        }
      });
    });
    return grid;
  }
  
  parse (array) {
    let grid = [];
    let actors = [];
    let indexY = 0;    
    array.forEach(row => {
      let line = row.split('');
      let y = indexY++;
      line.forEach(cell => {
         if (cell === line[line.indexOf(cell)] && this.dictionaryActors[line[line.indexOf(cell)]] !== undefined) {
          actors.push(new this.dictionaryActors[line[line.indexOf(cell)]]((new Vector (line.indexOf(cell), y))));
          }
          if (cell === 'x') {
            line[line.indexOf(cell)] = 'wall';
          } else if (cell === '!') {
            line[line.indexOf(cell)] = 'lava';
          } else {
            line[line.indexOf(cell)] = undefined;
          }
      });
      grid.push(line);
    });
    return new Level(grid, actors);
  }
}

const plan = [
  ' @ ',
  'x!x'
];

const actorsDict = Object.create(null);
actorsDict['@'] = Actor;

const parser = new LevelParser(actorsDict);
const level = parser.parse(plan);

level.grid.forEach((line, y) => {
  line.forEach((cell, x) => console.log(`(${x}:${y}) ${cell}`));
});

level.actors.forEach(actor => console.log(`(${actor.pos.x}:${actor.pos.y}) ${actor.type}`));



